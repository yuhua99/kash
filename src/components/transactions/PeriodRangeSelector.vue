<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PeriodUnit } from '@/types'
import type { Range } from '@/types'

const props = defineProps<{ range: Range }>()
const emit = defineEmits<{ (e: 'rangeChange', range: Range): void }>()

const unit = ref<PeriodUnit>(PeriodUnit.MONTH)

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1 // 1-12

// Selections
const selectedYearForMonth = ref<string>(String(currentYear))
const selectedMonth = ref<string>(String(currentMonth))
const selectedYearForYear = ref<string>(String(currentYear))

// Options
const years = computed(() => {
  const list: string[] = []
  for (let y = currentYear; y >= 2000; y--) list.push(String(y))
  return list
})

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const months = Array.from({ length: 12 }, (_, i) => String(i + 1)) // '1'..'12'

const toEpochSeconds = (date: Date) => Math.floor(date.getTime() / 1000)

const computeRange = (): Range => {
  if (unit.value === PeriodUnit.YEAR) {
    const y = parseInt(selectedYearForYear.value, 10) || currentYear
    const start = Math.floor(new Date(y, 0, 1, 0, 0, 0, 0).getTime() / 1000)
    const end = Math.floor(new Date(y + 1, 0, 1, 0, 0, 0, 0).getTime() / 1000) - 1
    return { start, end }
  }

  const y = parseInt(selectedYearForMonth.value, 10) || currentYear
  const mIndex = (parseInt(selectedMonth.value, 10) || currentMonth) - 1 // 0-11
  const start = Math.floor(new Date(y, mIndex, 1, 0, 0, 0, 0).getTime() / 1000)
  const end = Math.floor(new Date(y, mIndex + 1, 1, 0, 0, 0, 0).getTime() / 1000) - 1
  return { start, end }
}

let suppressEmit = false

const syncFromRange = async (range: Range) => {
  if (!range) return

  const startDate = new Date(range.start * 1000)
  if (Number.isNaN(startDate.getTime())) return

  const yearStart = new Date(startDate.getFullYear(), 0, 1)
  const yearEnd = new Date(startDate.getFullYear() + 1, 0, 1)

  suppressEmit = true

  if (range.start === toEpochSeconds(yearStart) && range.end === toEpochSeconds(yearEnd) - 1) {
    const year = String(startDate.getFullYear())
    unit.value = PeriodUnit.YEAR
    selectedYearForYear.value = year
    selectedYearForMonth.value = year
  } else {
    const year = String(startDate.getFullYear())
    unit.value = PeriodUnit.MONTH
    selectedYearForMonth.value = year
    selectedYearForYear.value = year
    selectedMonth.value = String(startDate.getMonth() + 1)
  }

  await nextTick()
  suppressEmit = false
}

watch(
  () => props.range,
  (range) => {
    if (!range) return
    void syncFromRange(range)
  },
  { immediate: true, deep: true },
)

watch([unit, selectedYearForYear, selectedYearForMonth, selectedMonth], () => {
  if (suppressEmit) return
  emit('rangeChange', computeRange())
})
</script>

<template>
  <div class="flex items-center gap-2 justify-between w-full">
    <div v-if="unit === PeriodUnit.YEAR" class="flex items-center gap-2">
      <Select v-model="selectedYearForYear">
        <SelectTrigger class="w-[120px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="y in years" :key="y" :value="y">{{ y }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div v-else class="flex items-center gap-2">
      <Select v-model="selectedYearForMonth">
        <SelectTrigger class="w-[120px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="y in years" :key="y" :value="y">{{ y }}</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="selectedMonth">
        <SelectTrigger class="w-[140px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="m in months" :key="m" :value="m">{{ monthNames[+m - 1] }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Tabs v-model="unit" class="w-auto">
      <TabsList class="grid grid-cols-2">
        <TabsTrigger :value="PeriodUnit.MONTH">Month</TabsTrigger>
        <TabsTrigger :value="PeriodUnit.YEAR">Year</TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
</template>
