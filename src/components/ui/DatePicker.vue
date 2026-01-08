<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-vue-next";

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

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<template>
  <div class="space-y-2">
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
      <input
        :id="id"
        v-model="value"
        type="date"
        :min="min"
        :max="max"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="
          cn(
            'w-full border px-4 py-2 bg-[var(--bg-base)] text-sm text-[var(--text-base)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--text-base)] disabled:cursor-not-allowed disabled:bg-[var(--bg-contrast)] appearance-none',
            error ? 'border-red-500' : 'border-[var(--text-base)]',
          )
        "
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />
      <!-- Calendar icon pointer-events-none to let click pass through to input (which opens picker) -->
      <Calendar
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        :size="16"
      />
    </div>

    <div v-if="error" class="text-xs text-red-500 font-medium">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
/* Custom styling to ensure consistent look across browsers */
input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  cursor: pointer;
}
</style>
