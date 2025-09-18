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
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { PeriodUnit } from '@/types'

interface Props {
  title?: string
  loading?: boolean
}

interface Emits {
  periodChange: [period: PeriodUnit]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Dashboard',
  loading: false,
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
        <SkeletonText v-if="props.loading" class="w-40" size="xl" />
        <h2 v-else class="text-2xl font-bold tracking-tight">{{ props.title }}</h2>
      </div>
      <div class="flex items-center space-x-2">
        <Skeleton v-if="props.loading" variant="input" size="md" class="w-48" />
        <Select v-else v-model="selectedPeriod">
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
