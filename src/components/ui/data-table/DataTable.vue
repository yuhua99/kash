<script setup lang="ts" generic="T extends object">
import { computed, ref, watch } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'
import DataTablePagination from './DataTablePagination.vue'
import type { DataTableColumn } from './types'

interface Props {
  items: T[]
  columns: DataTableColumn<T>[]
  rowKey?: string | ((row: T) => string | number)
  page?: number
  pageSize?: number
  defaultPage?: number
  defaultPageSize?: number
  pageSizeOptions?: number[]
  showHeader?: boolean
  showPageSizeSelector?: boolean
  totalItems: number
  emptyState?: string
  disablePagination?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultPage: 1,
  defaultPageSize: 20,
  pageSizeOptions: () => [20, 50, 100],
  showHeader: true,
  showPageSizeSelector: true,
  emptyState: 'No records found',
  disablePagination: false,
})

defineSlots<
  Record<`header-${string}`, (props: { column: DataTableColumn<T> }) => unknown> &
    Record<
      `cell-${string}`,
      (props: { row: T; value: unknown; column: DataTableColumn<T>; index: number }) => unknown
    > & { empty?: () => unknown }
>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'page-change', value: number): void
}>()

const innerPage = ref(props.page ?? props.defaultPage)
const innerPageSize = ref(props.pageSize ?? props.defaultPageSize)

const resolvedPageSizeOptions = computed(() => {
  const options = (props.pageSizeOptions ?? []).filter((option) => option > 0)
  if (!options.length) return [innerPageSize.value]
  if (!options.includes(innerPageSize.value)) {
    return [...options, innerPageSize.value].sort((a, b) => a - b)
  }
  return options.slice().sort((a, b) => a - b)
})

watch(
  () => props.page,
  (value) => {
    if (value === undefined) return
    if (value === innerPage.value) return
    innerPage.value = value
  },
)

watch(
  () => props.pageSize,
  (value) => {
    if (value === undefined) {
      const fallback = props.defaultPageSize
      if (innerPageSize.value === fallback) return
      innerPageSize.value = fallback
      updatePage(1)
      return
    }
    if (value === innerPageSize.value) return
    innerPageSize.value = value
  },
)

const totalItems = computed(() => (props.totalItems >= 0 ? props.totalItems : 0))

const pageCount = computed(() => {
  if (props.disablePagination) return 1
  if (!innerPageSize.value || innerPageSize.value <= 0) return 1
  return Math.max(1, Math.ceil(totalItems.value / innerPageSize.value))
})

const updatePage = (value: number) => {
  const next = Math.min(Math.max(1, value), pageCount.value)
  if (next === innerPage.value) return
  innerPage.value = next
  emit('update:page', next)
  emit('page-change', next)
}

const updatePageSize = (value: number) => {
  const fallback = resolvedPageSizeOptions.value[0] ?? props.defaultPageSize
  const next = value > 0 ? value : fallback
  if (next === innerPageSize.value) return
  innerPageSize.value = next
  emit('update:pageSize', next)
  updatePage(1)
}

watch(
  () => innerPageSize.value,
  (value) => {
    if (value > 0) return
    updatePageSize(resolvedPageSizeOptions.value[0] ?? props.defaultPageSize)
  },
  { immediate: true },
)

watch(
  [() => totalItems.value, () => innerPageSize.value],
  () => {
    if (totalItems.value === 0) {
      updatePage(1)
      return
    }
    if (innerPage.value > pageCount.value) {
      updatePage(pageCount.value)
    }
  },
  { immediate: true },
)

const resolveRowKey = (row: T, index: number) => {
  if (typeof props.rowKey === 'function') {
    return String(props.rowKey(row))
  }
  if (typeof props.rowKey === 'string') {
    const candidate = (row as Record<string, unknown>)[props.rowKey]
    if (candidate != null) return String(candidate)
  }
  return String(index)
}

const getHeaderLabel = (column: DataTableColumn<T>) => {
  if (column.label) return column.label
  return column.key
    .replace(/[_-]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
}

const getCellValue = (column: DataTableColumn<T>, row: T): unknown => {
  if (column.accessor) return column.accessor(row)
  return (row as Record<string, unknown>)[column.key]
}

type InternalCell = { column: DataTableColumn<T>; value: unknown }
type InternalRow = { row: T; key: string; index: number; cells: InternalCell[] }

const buildRow = (row: T, index: number): InternalRow => ({
  row,
  key: resolveRowKey(row, index),
  index,
  cells: props.columns.map((column) => ({
    column,
    value: getCellValue(column, row),
  })),
})

const visibleRows = computed<InternalRow[]>(() => {
  return props.items.map((row, index) => buildRow(row, index))
})

const hasRows = computed(() => props.items.length > 0)

const shouldShowPagination = computed(() => {
  if (props.disablePagination) return false
  if (totalItems.value === 0) return false
  if (props.items.length === 0) return false
  return pageCount.value > 1 || totalItems.value > innerPageSize.value
})
</script>

<template>
  <div class="space-y-4">
    <div class="overflow-hidden rounded-md border">
      <Table>
        <TableHeader v-if="showHeader">
          <TableRow>
            <TableHead
              v-for="column in columns"
              :key="column.key"
              :class="[
                column.headerClass,
                column.width,
                column.align === 'right'
                  ? 'text-right'
                  : column.align === 'center'
                    ? 'text-center'
                    : 'text-left',
              ]"
            >
              <slot :name="`header-${column.key}`" :column="column">
                {{ getHeaderLabel(column) }}
              </slot>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody v-if="hasRows">
          <TableRow v-for="rowData in visibleRows" :key="rowData.key" class="hover:bg-muted/50">
            <TableCell
              v-for="cell in rowData.cells"
              :key="cell.column.key"
              :class="[
                'align-middle text-sm',
                cell.column.cellClass,
                cell.column.width,
                cell.column.align === 'right'
                  ? 'text-right'
                  : cell.column.align === 'center'
                    ? 'text-center'
                    : 'text-left',
              ]"
            >
              <slot
                :name="`cell-${cell.column.key}`"
                :row="rowData.row"
                :value="cell.value"
                :column="cell.column"
                :index="rowData.index"
              >
                <span v-if="cell.value !== undefined && cell.value !== null" class="block truncate">
                  {{ cell.value }}
                </span>
                <span v-else class="text-muted-foreground">—</span>
              </slot>
            </TableCell>
          </TableRow>
        </TableBody>

        <TableBody v-else>
          <TableEmpty :colspan="columns.length">
            <slot name="empty">
              <div class="py-8 text-center text-sm text-muted-foreground">
                {{ emptyState }}
              </div>
            </slot>
          </TableEmpty>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination
      v-if="shouldShowPagination"
      :page="innerPage"
      :page-count="pageCount"
      :page-size="innerPageSize"
      :page-size-options="resolvedPageSizeOptions"
      :show-page-size-selector="showPageSizeSelector"
      :total-items="totalItems"
      @update:page="updatePage"
      @update:page-size="updatePageSize"
    />
  </div>
</template>
