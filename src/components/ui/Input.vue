<script setup lang="ts">
import { computed } from "vue"
import { cn } from "@/lib/utils"

interface Props {
  modelValue: string | number
  label?: string
  type?: "text" | "number" | "password" | "email" | "tel" | "search"
  placeholder?: string
  error?: string
  helpText?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  disabled: false,
  required: false,
  id: () => `input-${Math.random().toString(36).substring(2, 9)}`,
})

const emit = defineEmits<{
  "update:modelValue": [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
})
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

    <input
      :id="id"
      v-model="value"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="
        cn(
          'w-full border px-4 py-2 bg-[var(--bg-base)] text-sm text-[var(--text-base)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--text-base)] disabled:cursor-not-allowed disabled:bg-[var(--bg-contrast)]',
          error ? 'border-red-500' : 'border-[var(--text-base)]',
        )
      "
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
    />

    <div v-if="error" class="text-xs text-red-500 font-medium">
      {{ error }}
    </div>
    <div v-else-if="helpText" class="text-xs text-[var(--text-muted)]">
      {{ helpText }}
    </div>
  </div>
</template>
