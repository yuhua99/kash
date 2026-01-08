<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

export interface DropdownMenuItem {
  id: string;
  label: string;
  value?: any;
  disabled?: boolean;
}

interface Props {
  items: DropdownMenuItem[];
  align?: "left" | "center" | "right";
  openOn?: "click" | "hover";
  closeOnSelect?: boolean;
  closeOnOutsideClick?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  align: "left",
  openOn: "click",
  closeOnSelect: true,
  closeOnOutsideClick: true,
  disabled: false,
});

const emit = defineEmits<{
  select: [item: DropdownMenuItem];
  open: [];
  close: [];
}>();

const isOpen = ref(false);
const focusedIndex = ref(-1);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);

const alignmentClass = computed(() => {
  switch (props.align) {
    case "right":
      return "right-0";
    case "center":
      return "left-1/2 -translate-x-1/2";
    case "left":
    default:
      return "left-0";
  }
});

const enabledItems = computed(() => props.items.filter((item) => !item.disabled));

function toggle() {
  if (props.disabled) return;

  if (isOpen.value) {
    close();
  } else {
    open();
  }
}

function open() {
  if (props.disabled) return;
  isOpen.value = true;
  focusedIndex.value = -1;
  emit("open");
}

function close() {
  isOpen.value = false;
  focusedIndex.value = -1;
  emit("close");
  triggerRef.value?.focus();
}

function selectItem(item: DropdownMenuItem) {
  if (item.disabled) return;

  emit("select", item);

  if (props.closeOnSelect) {
    close();
  }
}

function handleTriggerClick() {
  if (props.openOn === "click") {
    toggle();
  }
}

function handleTriggerMouseEnter() {
  if (props.openOn === "hover") {
    open();
  }
}

function handleTriggerMouseLeave() {
  if (props.openOn === "hover") {
    // Delay close to allow moving to menu
    setTimeout(() => {
      if (!menuRef.value?.matches(":hover")) {
        close();
      }
    }, 100);
  }
}

function handleMenuMouseLeave() {
  if (props.openOn === "hover") {
    close();
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isOpen.value) return;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      focusNext();
      break;
    case "ArrowUp":
      event.preventDefault();
      focusPrevious();
      break;
    case "Enter":
    case " ":
      event.preventDefault();
      if (focusedIndex.value >= 0 && focusedIndex.value < enabledItems.value.length) {
        selectItem(enabledItems.value[focusedIndex.value]);
      }
      break;
    case "Escape":
      event.preventDefault();
      close();
      break;
    case "Tab":
      close();
      break;
    case "Home":
      event.preventDefault();
      focusedIndex.value = 0;
      break;
    case "End":
      event.preventDefault();
      focusedIndex.value = enabledItems.value.length - 1;
      break;
  }
}

function focusNext() {
  if (enabledItems.value.length === 0) return;
  focusedIndex.value = (focusedIndex.value + 1) % enabledItems.value.length;
}

function focusPrevious() {
  if (enabledItems.value.length === 0) return;
  focusedIndex.value =
    focusedIndex.value <= 0 ? enabledItems.value.length - 1 : focusedIndex.value - 1;
}

function handleClickOutside(event: MouseEvent) {
  if (!props.closeOnOutsideClick || !isOpen.value) return;

  const target = event.target as Node;
  if (triggerRef.value?.contains(target) || menuRef.value?.contains(target)) {
    return;
  }

  close();
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeyDown);
});

defineExpose({
  open,
  close,
  toggle,
  isOpen,
});
</script>

<template>
  <div class="relative inline-block">
    <!-- Trigger slot -->
    <div
      ref="triggerRef"
      @click="handleTriggerClick"
      @mouseenter="handleTriggerMouseEnter"
      @mouseleave="handleTriggerMouseLeave"
      :aria-haspopup="true"
      :aria-expanded="isOpen"
    >
      <slot name="trigger" :toggle="toggle" :isOpen="isOpen" :open="open" :close="close" />
    </div>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        ref="menuRef"
        @mouseleave="handleMenuMouseLeave"
        class="absolute z-50 mt-2 min-w-[12rem] bg-[var(--bg-base)] border border-[var(--text-base)] shadow-lg"
        :class="alignmentClass"
        role="menu"
        :aria-orientation="'vertical'"
      >
        <div class="py-1">
          <slot
            name="item"
            v-for="(item, index) in items"
            :item="item"
            :index="index"
            :select="() => selectItem(item)"
          >
            <button
              :key="item.id"
              @click="() => selectItem(item)"
              @mouseenter="() => (focusedIndex = enabledItems.findIndex((i) => i.id === item.id))"
              :disabled="item.disabled"
              :class="[
                'w-full text-left px-4 py-2 text-sm transition-colors',
                item.disabled
                  ? 'text-[var(--text-muted)] cursor-not-allowed bg-[var(--bg-contrast)]'
                  : focusedIndex === enabledItems.findIndex((i) => i.id === item.id)
                    ? 'bg-[var(--bg-interactive)] text-[var(--text-hover)]'
                    : 'text-[var(--text-base)] hover:bg-[var(--bg-interactive)] hover:text-[var(--text-hover)]',
              ]"
              role="menuitem"
              :tabindex="item.disabled ? -1 : 0"
            >
              {{ item.label }}
            </button>
          </slot>
        </div>
      </div>
    </Transition>
  </div>
</template>
