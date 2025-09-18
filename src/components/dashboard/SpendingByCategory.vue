<script setup lang="ts">
import { computed, toRef } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DonutChart } from '@/components/ui/chart-donut'
import { useCategories } from '@/composables/useCategories'
import { useChartData } from '@/composables/useChartData'
import type { Transaction } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { SkeletonCircle, SkeletonText } from '@/components/ui/skeleton'

interface Props {
  transactions: Transaction[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})
const { getCategoryColor, getCategoryId } = useCategories()
const { categorySpending, donutChartData } = useChartData(toRef(props, 'transactions'))

const chartColors = computed(() => {
  return donutChartData.value.map((item) => {
    const id = getCategoryId(item.name)
    return id ? getCategoryColor(id) : 'var(--muted)'
  })
})

// Value formatter resilient to Unovis tooltip passing label strings
// When the tooltip sends the category name (string) instead of the numeric value,
// map back to our donutChartData to get the amount.
const donutValueFormatter = (tick: number) => {
  const v = tick as unknown as string | number
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return formatCurrency(tick)
  }
  if (typeof v === 'string') {
    const found = donutChartData.value.find((d) => d.name === v)
    if (found) return formatCurrency(found.value)
  }
  return formatCurrency(0)
}
</script>

<template>
  <Card>
    <CardHeader>
      <template v-if="props.loading">
        <SkeletonText class="w-48" size="lg" />
      </template>
      <CardTitle v-else>Spending by Category</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid gap-6">
        <!-- Donut Chart -->
        <div class="flex items-center justify-center">
          <template v-if="props.loading">
            <SkeletonCircle size="xl" class="h-64 w-64" />
          </template>
          <template v-else>
            <DonutChart
              v-if="donutChartData.length > 0"
              :data="donutChartData"
              index="name"
              category="value"
              :colors="chartColors"
              :value-formatter="donutValueFormatter"
              class="h-64 w-64"
            />
            <div
              v-else
              class="text-center text-muted-foreground h-64 flex items-center justify-center"
            >
              No expenses found
            </div>
          </template>
        </div>

        <!-- Category Legend -->
        <div class="space-y-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead class="text-right">Amount</TableHead>
                <TableHead class="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="props.loading">
                <TableRow v-for="index in 5" :key="index">
                  <TableCell>
                    <div class="flex items-center space-x-3">
                      <SkeletonCircle size="sm" />
                      <SkeletonText class="w-32" size="md" />
                    </div>
                  </TableCell>
                  <TableCell class="text-right">
                    <SkeletonText class="ml-auto w-20" size="md" />
                  </TableCell>
                  <TableCell class="text-right">
                    <SkeletonText class="ml-auto w-12" size="md" />
                  </TableCell>
                </TableRow>
              </template>
              <template v-else>
                <TableRow
                  v-for="item in categorySpending"
                  :key="item.category"
                  class="hover:bg-muted/50"
                >
                  <TableCell>
                    <div class="flex items-center space-x-3">
                      <div
                        class="w-3 h-3 rounded-full flex-shrink-0"
                        :style="{
                          backgroundColor: (getCategoryId(item.category)
                            ? getCategoryColor(getCategoryId(item.category)!)
                            : 'var(--muted)') as string,
                        }"
                      ></div>
                      <span class="font-medium">{{ item.category }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right font-medium">{{
                    formatCurrency(item.amount)
                  }}</TableCell>
                  <TableCell class="text-right text-muted-foreground">{{
                    formatPercent(item.percentage)
                  }}</TableCell>
                </TableRow>
                <TableRow v-if="categorySpending.length === 0">
                  <TableCell colspan="3" class="text-center text-muted-foreground py-6">
                    No expenses found
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
