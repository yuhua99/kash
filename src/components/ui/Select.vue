<script setup lang="ts" generic="T extends string | number">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Search, X } from "lucide-vue-next";

export interface SelectOption<T> {
  label: string;
  value: T;
  disabled?: boolean;
}

interface Props<T> {
  modelValue: T | null;
  options: SelectOption<T>[];
  label?: string;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  id?: string;
}

const props = withDefaults(defineProps<Props<T>>(), {
  modelValue: null,
  options: () => [],
  searchable: false,
  disabled: false,
  required: false,
  placeholder: "Select option",
  id: () => `select-${Math.random().toString(36).substring(2, 9)}`,
});

const emit = defineEmits<{
  "update:modelValue": [value: T];
  change: [value: T];
}>();

const isOpen = ref(false);
const searchQuery = ref("");
const focusedIndex = ref(-1);
const triggerRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const selectedOption = computed(() => props.options.find((opt) => opt.value === props.modelValue));

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.options;
  }
  const query = searchQuery.value.toLowerCase();
  return props.options.filter((opt) => opt.label.toLowerCase().includes(query));
});

const toggle = () => {
  if (props.disabled) return;
  if (isOpen.value) {
    close();
  } else {
    open();
  }
};

const open = async () => {
  isOpen.value = true;
  focusedIndex.value = -1;
  // If searchable, focus input
  if (props.searchable) {
    await nextTick();
    searchInputRef.value?.focus();
  } else {
    // If not searchable, focus list for keyboard nav
    await nextTick();
    listRef.value?.focus();
  }
};

const close = () => {
  isOpen.value = false;
  searchQuery.value = "";
  focusedIndex.value = -1;
  // Return focus to trigger
  triggerRef.value?.focus();
};

const selectOption = (option: SelectOption<T>) => {
  if (option.disabled) return;
  emit("update:modelValue", option.value);
  emit("change", option.value);
  close();
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!isOpen.value) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      open();
    }
    return;
  }

  const options = filteredOptions.value;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      focusedIndex.value = (focusedIndex.value + 1) % options.length;
      scrollToFocused();
      break;
    case "ArrowUp":
      event.preventDefault();
      focusedIndex.value = focusedIndex.value <= 0 ? options.length - 1 : focusedIndex.value - 1;
      scrollToFocused();
      break;
    case "Enter":
      event.preventDefault();
      if (focusedIndex.value >= 0 && focusedIndex.value < options.length) {
        selectOption(options[focusedIndex.value]);
      }
      break;
    case "Escape":
      event.preventDefault();
      close();
      break;
    case "Tab":
      close();
      break;
  }
};

const scrollToFocused = () => {
  if (!listRef.value) return;
  const items = listRef.value.querySelectorAll("[role='option']");
  const item = items[focusedIndex.value] as HTMLElement;
  if (item) {
    item.scrollIntoView({ block: "nearest" });
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (!isOpen.value) return;
  const target = event.target as Node;
  if (triggerRef.value?.contains(target)) return;
  if (listRef.value?.contains(target)) return;
  // Also check if click is inside search container
  const searchContainer = document.getElementById(`${props.id}-search`);
  if (searchContainer?.contains(target)) return;

  close();
};

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});

// Watch for external model changes to update UI if needed (rare for select)
watch(
  () => props.modelValue,
  (newVal) => {
    // logic if needed
  },
);
</script>

<template>
  <div class="space-y-2 relative">
    <div v-if="label" class="flex items-center justify-between">
      <label
        :for="id"
        class="text-xs uppercase tracking-widest text-[var(--text-base)]"
        :class="{ 'opacity-50': disabled }"
      >
        {{ label }} <span v-if="required" class="text-red-500">*</span>
      </label>
    </div>

    <button
      :id="id"
      ref="triggerRef"
      type="button"
      @click="toggle"
      @keydown="handleKeyDown"
      :disabled="disabled"
      class="flex w-full items-center justify-between border px-4 py-2 bg-[var(--bg-base)] text-sm text-[var(--text-base)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--text-base)] disabled:cursor-not-allowed disabled:bg-[var(--bg-contrast)]"
      :class="[
        error ? 'border-red-500' : 'border-[var(--text-base)]',
        { 'text-[var(--text-muted)]': !selectedOption },
      ]"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
    >
      <span class="block truncate">
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <ChevronDown class="h-4 w-4 opacity-50" />
    </button>

    <div v-if="error" class="text-xs text-red-500 font-medium">
      {{ error }}
    </div>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      ref="listRef"
      class="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-[var(--text-base)] bg-[var(--bg-base)] shadow-lg"
      role="listbox"
      tabindex="-1"
    >
      <!-- Search Input -->
      <div
        v-if="searchable"
        :id="`${id}-search`"
        class="sticky top-0 z-10 border-b border-[var(--text-base)] bg-[var(--bg-base)] p-2"
      >
        <div class="relative">
          <Search class="absolute left-2 top-2.5 h-3 w-3 text-[var(--text-muted)]" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="w-full border border-[var(--text-base)] py-1 pl-7 pr-2 text-xs focus:outline-none"
            placeholder="Search..."
            @keydown="handleKeyDown"
            @click.stop
          />
        </div>
      </div>

      <!-- Options List -->
      <div class="py-1">
        <div
          v-for="(option, index) in filteredOptions"
          :key="String(option.value)"
          role="option"
          :aria-selected="option.value === modelValue"
          class="relative cursor-pointer select-none px-3 py-2 text-sm transition-colors"
          :class="[
            option.disabled
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-[var(--bg-interactive)] hover:text-[var(--text-hover)]',
            focusedIndex === index ? 'bg-[var(--bg-interactive)] text-[var(--text-hover)]' : '',
            option.value === modelValue && focusedIndex !== index ? 'font-medium' : '',
          ]"
          @click="selectOption(option)"
        >
          <span class="block truncate">{{ option.label }}</span>
          <span
            v-if="option.value === modelValue"
            class="absolute inset-y-0 right-0 flex items-center pr-3"
            :class="[
              focusedIndex === index || option.disabled
                ? 'text-[var(--text-hover)]'
                : 'text-[var(--text-base)]',
            ]"
          >
            <Check class="h-4 w-4" />
          </span>
        </div>

        <div
          v-if="filteredOptions.length === 0"
          class="px-3 py-4 text-center text-xs text-[var(--text-muted)] uppercase tracking-widest"
        >
          No results found.
        </div>
      </div>
    </div>
  </div>
</template>
