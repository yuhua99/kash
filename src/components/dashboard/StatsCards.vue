<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from 'lucide-vue-next'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { SkeletonCircle, SkeletonText } from '@/components/ui/skeleton'

interface Props {
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
    <!-- Income (period-aware) -->
    <Card class="py-4">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
        <div class="flex flex-col space-y-1">
          <SkeletonText v-if="props.loading" class="w-20" size="sm" />
          <CardTitle v-else class="text-xs md:text-sm font-medium">Income</CardTitle>
        </div>
        <SkeletonCircle v-if="props.loading" size="sm" />
        <DollarSign v-else class="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent class="px-4 md:px-6">
        <SkeletonText v-if="props.loading" class="w-24" size="lg" />
        <div v-else class="text-lg md:text-2xl font-bold">
          {{ formatCurrency(props.monthlyIncome) }}
        </div>
      </CardContent>
    </Card>

    <!-- Expenses (period-aware) -->
    <Card class="py-4">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
        <div class="flex flex-col space-y-1">
          <SkeletonText v-if="props.loading" class="w-24" size="sm" />
          <CardTitle v-else class="text-xs md:text-sm font-medium">Expenses</CardTitle>
        </div>
        <SkeletonCircle v-if="props.loading" size="sm" />
        <TrendingDown v-else class="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent class="px-4 md:px-6">
        <SkeletonText v-if="props.loading" class="w-24" size="lg" />
        <div v-else class="text-lg md:text-2xl font-bold">
          {{ formatCurrency(props.monthlyExpenses) }}
        </div>
      </CardContent>
    </Card>

    <!-- Net (this period) -->
    <Card class="py-4">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
        <div class="flex flex-col space-y-1">
          <SkeletonText v-if="props.loading" class="w-28" size="sm" />
          <CardTitle v-else class="text-xs md:text-sm font-medium">Net This Period</CardTitle>
        </div>
        <SkeletonCircle v-if="props.loading" size="sm" />
        <TrendingUp v-else class="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent class="px-4 md:px-6">
        <SkeletonText v-if="props.loading" class="w-28" size="lg" />
        <div v-else class="text-lg md:text-2xl font-bold">
          {{ formatCurrency(props.monthlyIncome - props.monthlyExpenses) }}
        </div>
      </CardContent>
    </Card>

    <!-- Savings Rate -->
    <Card class="py-4">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
        <div class="flex flex-col space-y-1">
          <SkeletonText v-if="props.loading" class="w-28" size="sm" />
          <CardTitle v-else class="text-xs md:text-sm font-medium">Savings Rate</CardTitle>
        </div>
        <SkeletonCircle v-if="props.loading" size="sm" />
        <PiggyBank v-else class="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent class="px-4 md:px-6">
        <SkeletonText v-if="props.loading" class="w-24" size="lg" />
        <template v-else>
          <div class="text-lg md:text-2xl font-bold">{{ formatPercent(props.savingsRate) }}</div>
          <p class="text-[10px] md:text-xs text-muted-foreground">Income left after expenses</p>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
