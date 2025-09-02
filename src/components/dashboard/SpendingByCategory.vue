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
import CategoryTooltip from './CategoryTooltip.vue'
import { useCategories } from '@/composables/useCategories'
import { useChartData } from '@/composables/useChartData'
import { useTheme } from '@/composables/useTheme'
import type { Transaction } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/formatters'

interface Props {
  transactions: Transaction[]
}

const props = defineProps<Props>()
const { getCategoryColorByName } = useCategories()
const { categorySpending, donutChartData, currencyFormatter } = useChartData(
  toRef(props, 'transactions'),
)

const { isDark: isDarkMode } = useTheme()

const chartColors = computed(() => {
  return donutChartData.value.map((item) => getCategoryColorByName(item.name, isDarkMode.value))
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Spending by Category</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid gap-6">
        <!-- Donut Chart -->
        <div class="flex items-center justify-center">
          <DonutChart
            v-if="donutChartData.length > 0"
            :data="donutChartData"
            index="name"
            category="value"
            :colors="chartColors"
            :value-formatter="currencyFormatter"
            :custom-tooltip="CategoryTooltip"
            class="h-64 w-64"
          />
          <div
            v-else
            class="text-center text-muted-foreground h-64 flex items-center justify-center"
          >
            No expenses found
          </div>
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
                        backgroundColor: getCategoryColorByName(item.category, isDarkMode),
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
            </TableBody>
          </Table>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
