<script setup lang="ts" generic="T extends any">
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-vue-next";

export interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

interface Props<T> {
  columns: Column[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  sortColumn?: string;
  sortDirection?: "asc" | "desc" | null;
}

const props = withDefaults(defineProps<Props<T>>(), {
  loading: false,
  emptyMessage: "No data available.",
  sortDirection: null,
});

const emit = defineEmits<{
  sort: [column: string];
}>();

const handleSort = (column: Column) => {
  if (column.sortable) {
    emit("sort", column.key);
  }
};
</script>

<template>
  <div class="w-full border border-[var(--text-base)]">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-[var(--text-base)] bg-[var(--bg-base)]">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-xs uppercase tracking-widest text-[var(--text-base)]"
              :class="[
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                    ? 'text-center'
                    : 'text-left',
                col.sortable ? 'cursor-pointer select-none hover:bg-[var(--bg-contrast)]' : '',
              ]"
              @click="handleSort(col)"
            >
              <div
                class="flex items-center gap-2"
                :class="{
                  'justify-end': col.align === 'right',
                  'justify-center': col.align === 'center',
                }"
              >
                {{ col.label }}
                <span v-if="col.sortable" class="flex flex-col">
                  <ArrowUp
                    v-if="sortColumn === col.key && sortDirection === 'asc'"
                    class="h-3 w-3"
                  />
                  <ArrowDown
                    v-else-if="sortColumn === col.key && sortDirection === 'desc'"
                    class="h-3 w-3"
                  />
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--text-base)]">
          <tr v-if="loading" class="bg-[var(--bg-base)]">
            <td
              :colspan="columns.length"
              class="px-4 py-8 text-center text-xs uppercase tracking-widest"
            >
              Loading...
            </td>
          </tr>
          <tr v-else-if="data.length === 0" class="bg-[var(--bg-base)]">
            <td
              :colspan="columns.length"
              class="px-4 py-8 text-center text-xs uppercase tracking-widest"
            >
              {{ emptyMessage }}
            </td>
          </tr>
          <tr
            v-for="(row, index) in data"
            :key="index"
            class="bg-[var(--bg-base)] transition-colors hover:bg-[var(--bg-contrast)]/50"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-sm text-[var(--text-base)]"
              :class="[
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                    ? 'text-center'
                    : 'text-left',
              ]"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="(row as any)[col.key]">
                {{ (row as any)[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
