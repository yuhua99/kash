<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-vue-next";
import { onClickOutside } from "@vueuse/core";

interface Props {
  modelValue: string;
  label?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  id: () => `date-picker-${Math.random().toString(36).substring(2, 9)}`,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const isOpen = ref(false);
const target = ref(null);

// Parse modelValue to Date object, or default to today
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  // Date constructor uses 0-indexed months
  return new Date(year, month - 1, day);
};

// Format Date object to YYYY-MM-DD string
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format Date for display (e.g., "Jan 01, 2024")
const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = parseDate(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

// Navigation state (current view)
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());

// Sync navigation with modelValue when it changes
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      const date = parseDate(newVal);
      currentMonth.value = date.getMonth();
      currentYear.value = date.getFullYear();
    }
  },
  { immediate: true },
);

const currentMonthName = computed(() => {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(currentYear.value, currentMonth.value),
  );
});

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const startDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay();
});

// Generate calendar grid
const calendarDays = computed(() => {
  const days = [];

  // Previous month padding
  for (let i = 0; i < startDayOfMonth.value; i++) {
    days.push({ day: null, date: null });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth.value; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i);
    const dateStr = formatDate(date);
    days.push({
      day: i,
      date: dateStr,
      isSelected: dateStr === props.modelValue,
      isToday: dateStr === formatDate(new Date()),
    });
  }

  return days;
});

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const selectDate = (dateStr: string) => {
  emit("update:modelValue", dateStr);
  isOpen.value = false;
};

const toggleCalendar = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
};

onClickOutside(target, () => {
  isOpen.value = false;
});

// Handle min/max constraints
const isDateDisabled = (dateStr: string | null): boolean => {
  if (!dateStr) return true;
  if (props.min && dateStr < props.min) return true;
  if (props.max && dateStr > props.max) return true;
  return false;
};
</script>

<template>
  <div class="space-y-2" ref="target">
    <div v-if="label" class="flex items-center justify-between">
      <label
        :for="id"
        class="text-xs uppercase tracking-widest text-[var(--text-base)]"
        :class="{ 'opacity-50': disabled }"
      >
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </label>
    </div>

    <div class="relative">
      <!-- Trigger -->
      <div
        :id="id"
        @click="toggleCalendar"
        :class="
          cn(
            'flex items-center justify-between w-full border px-4 py-2 bg-[var(--bg-base)] text-sm text-[var(--text-base)] transition-colors cursor-pointer hover:bg-[var(--bg-contrast)]/10',
            isOpen ? 'ring-1 ring-[var(--text-base)]' : '',
            disabled ? 'cursor-not-allowed opacity-50 bg-[var(--bg-contrast)]' : '',
            error ? 'border-red-500' : 'border-[var(--text-base)]',
          )
        "
      >
        <span v-if="modelValue">{{ formatDisplayDate(modelValue) }}</span>
        <span v-else class="text-[var(--text-muted)]">{{ placeholder || "Select date" }}</span>
        <CalendarIcon class="w-4 h-4 text-[var(--text-muted)]" />
      </div>

      <!-- Calendar Popover -->
      <div
        v-if="isOpen"
        class="absolute top-full left-0 z-50 mt-1 w-64 p-4 border border-[var(--text-base)] bg-[var(--bg-base)] shadow-lg"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <button
            @click.stop="prevMonth"
            class="p-1 hover:bg-[var(--bg-contrast)] transition-colors text-[var(--text-base)]"
            type="button"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="font-medium text-[var(--text-base)]">
            {{ currentMonthName }} {{ currentYear }}
          </span>
          <button
            @click.stop="nextMonth"
            class="p-1 hover:bg-[var(--bg-contrast)] transition-colors text-[var(--text-base)]"
            type="button"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Weekdays -->
        <div class="grid grid-cols-7 mb-2">
          <span
            v-for="day in weekdays"
            :key="day"
            class="text-center text-xs text-[var(--text-muted)] font-medium"
          >
            {{ day }}
          </span>
        </div>

        <!-- Days Grid -->
        <div class="grid grid-cols-7 gap-1">
          <template v-for="(dayObj, index) in calendarDays" :key="index">
            <div v-if="!dayObj.date" class="p-2"></div>
            <button
              v-else
              type="button"
              @click.stop="selectDate(dayObj.date)"
              :disabled="isDateDisabled(dayObj.date)"
              :class="
                cn(
                  'w-7 h-7 flex items-center justify-center text-sm transition-all duration-200',
                  dayObj.isSelected
                    ? 'bg-[var(--text-base)] text-[var(--bg-base)] font-bold'
                    : 'text-[var(--text-base)] hover:bg-[var(--bg-contrast)]',
                  dayObj.isToday && !dayObj.isSelected ? 'border border-[var(--text-base)]' : '',
                  isDateDisabled(dayObj.date)
                    ? 'opacity-30 cursor-not-allowed hover:bg-transparent'
                    : '',
                )
              "
            >
              {{ dayObj.day }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="error" class="text-xs text-red-500 font-medium">
      {{ error }}
    </div>
  </div>
</template>
