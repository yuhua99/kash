<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { Check } from "lucide-vue-next";

interface Props {
  modelValue: boolean;
  label?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  id: () => `checkbox-${Math.random().toString(36).substring(2, 9)}`,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const checked = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<template>
  <div class="flex items-start gap-3">
    <div class="relative flex items-center">
      <input
        :id="id"
        v-model="checked"
        type="checkbox"
        class="peer h-4 w-4 appearance-none border border-[var(--text-base)] bg-[var(--bg-base)] checked:bg-[var(--bg-interactive)] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-[var(--bg-contrast)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--text-base)]"
        :disabled="disabled"
      />
      <Check
        class="pointer-events-none absolute left-0 top-0 h-4 w-4 text-[var(--text-hover)] opacity-0 peer-checked:opacity-100 transition-opacity"
        :size="16"
        :stroke-width="3"
      />
    </div>
    <div class="grid gap-1.5 leading-none">
      <label
        v-if="label"
        :for="id"
        class="text-xs uppercase tracking-widest text-[var(--text-base)] cursor-pointer select-none"
        :class="{ 'opacity-50 cursor-not-allowed': disabled }"
      >
        {{ label }}
      </label>
      <div v-if="error" class="text-xs text-red-500 font-medium">
        {{ error }}
      </div>
    </div>
  </div>
</template>
