<script setup lang="ts">
import { computed } from 'vue'
import { CalendarIcon } from 'lucide-vue-next'
import type { DateValue } from 'reka-ui'
import { CalendarDate } from '@internationalized/date'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props {
  modelValue?: Date
  placeholder?: string
  disabled?: boolean
  class?: string
  minValue?: Date
  maxValue?: Date
}

interface Emits {
  (e: 'update:modelValue', value: Date | undefined): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Pick a date',
})

const emit = defineEmits<Emits>()

// Convert Date to CalendarDate
const dateToCalendarDate = (date: Date): CalendarDate => {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

// Convert DateValue to Date
const dateValueToDate = (dateValue: DateValue): Date => {
  return new Date(dateValue.year, dateValue.month - 1, dateValue.day)
}

const calendarValue = computed(() => {
  return props.modelValue ? dateToCalendarDate(props.modelValue) : undefined
})

const minCalendarValue = computed(() => {
  return props.minValue ? dateToCalendarDate(props.minValue) : undefined
})

const maxCalendarValue = computed(() => {
  return props.maxValue ? dateToCalendarDate(props.maxValue) : undefined
})

const displayValue = computed(() => {
  if (props.modelValue) {
    return props.modelValue.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  return props.placeholder
})

const handleSelect = (date: DateValue | undefined) => {
  emit('update:modelValue', date ? dateValueToDate(date) : undefined)
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !modelValue && 'text-muted-foreground',
            props.class,
          )
        "
        :disabled="disabled"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ displayValue }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        :model-value="calendarValue"
        :min-value="minCalendarValue"
        :max-value="maxCalendarValue"
        @update:model-value="handleSelect"
        initial-focus
      />
    </PopoverContent>
  </Popover>
</template>
