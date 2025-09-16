<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarDays } from 'lucide-vue-next'
import { PeriodUnit } from '@/types'

interface Props {
  title?: string
}

interface Emits {
  periodChange: [period: PeriodUnit]
}

withDefaults(defineProps<Props>(), {
  title: 'Dashboard',
})

const emit = defineEmits<Emits>()

const selectedPeriod = ref<PeriodUnit>(PeriodUnit.MONTH)

// Watch for period changes and emit to parent
watch(
  selectedPeriod,
  (newPeriod) => {
    emit('periodChange', newPeriod)
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col space-y-6">
    <!-- Page Header -->
    <div
      class="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0"
    >
      <div>
        <h2 class="text-2xl font-bold tracking-tight">{{ title }}</h2>
      </div>
      <div class="flex items-center space-x-2">
        <Select v-model="selectedPeriod">
          <SelectTrigger class="w-48">
            <CalendarDays class="mr-2 h-4 w-4" />
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="PeriodUnit.MONTH">This Month</SelectItem>
            <SelectItem :value="PeriodUnit.HALF_YEAR">This Half Year</SelectItem>
            <SelectItem :value="PeriodUnit.YEAR">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
