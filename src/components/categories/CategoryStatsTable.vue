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

interface StatItem {
  id: string
  name: string
  is_income: boolean
  transactionCount: number
  totalSpent: number
  totalIncome: number
}

const props = defineProps<{
  stats: StatItem[]
}>()

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
      <TableRow v-if="props.stats.length === 0">
        <TableCell colspan="3" class="text-center text-muted-foreground py-6 text-sm">
          No categories found
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
