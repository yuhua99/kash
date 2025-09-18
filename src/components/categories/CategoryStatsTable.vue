<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatSignedCurrency } from '@/lib/formatters'
import { useCategoriesStore } from '@/stores/categories'
import { SkeletonCircle, SkeletonText } from '@/components/ui/skeleton'

interface StatItem {
  id: string
  name: string
  is_income: boolean
  transactionCount: number
  totalSpent: number
  totalIncome: number
}

const props = withDefaults(
  defineProps<{
    stats: StatItem[]
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const categoriesStore = useCategoriesStore()
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Category</TableHead>
        <TableHead class="text-right">Count</TableHead>
        <TableHead class="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <template v-if="props.loading">
        <TableRow v-for="index in 6" :key="`category-stat-skeleton-${index}`">
          <TableCell>
            <div class="flex items-center space-x-2">
              <SkeletonCircle size="sm" />
              <SkeletonText class="w-32" size="md" />
            </div>
          </TableCell>
          <TableCell class="text-right"><SkeletonText class="w-12 ml-auto" size="md" /></TableCell>
          <TableCell class="text-right"><SkeletonText class="w-20 ml-auto" size="md" /></TableCell>
        </TableRow>
      </template>
      <template v-else>
        <TableRow v-for="stat in props.stats" :key="stat.id" class="hover:bg-muted/50">
          <TableCell>
            <div class="flex items-center space-x-2">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: categoriesStore.getCategoryColor(stat.id) }"
              ></div>
              <span class="font-medium text-sm">{{ stat.name }}</span>
            </div>
          </TableCell>
          <TableCell class="text-right text-sm">{{ stat.transactionCount }}</TableCell>
          <TableCell
            class="text-right font-medium text-sm"
            :class="
              stat.is_income
                ? 'text-[hsl(var(--vis-secondary-color))]'
                : 'text-[hsl(var(--vis-primary-color))]'
            "
          >
            {{
              stat.is_income
                ? stat.totalIncome > 0
                  ? formatSignedCurrency(stat.totalIncome)
                  : formatCurrency(0)
                : stat.totalSpent > 0
                  ? formatSignedCurrency(-stat.totalSpent)
                  : formatCurrency(0)
            }}
          </TableCell>
        </TableRow>
        <TableRow v-if="!props.loading && props.stats.length === 0">
          <TableCell colspan="3" class="text-center text-muted-foreground py-6 text-sm">
            No categories found
          </TableCell>
        </TableRow>
      </template>
    </TableBody>
  </Table>
</template>
