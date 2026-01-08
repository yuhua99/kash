<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref } from "vue";
import { X } from "lucide-vue-next";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  maxWidth?: string; // e.g. 'max-w-md', 'max-w-lg', 'max-w-xl'
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  maxWidth: "max-w-lg",
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
}>();

const close = () => {
  emit("update:open", false);
  emit("close");
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (props.open && e.key === "Escape") {
    close();
  }
};

// Lock body scroll when open
watch(
  () => props.open,
  (isOpen) => {
    if (typeof document !== "undefined") {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  },
);

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50" aria-hidden="true" />

        <!-- Dialog Content -->
        <div
          class="relative w-full bg-[var(--bg-base)] border border-[var(--text-base)] p-6 shadow-lg"
          :class="maxWidth"
          role="dialog"
          aria-modal="true"
        >
          <div class="mb-6 flex items-start justify-between">
            <div>
              <h2
                v-if="title"
                class="text-lg font-semibold uppercase tracking-widest text-[var(--text-base)]"
              >
                {{ title }}
              </h2>
              <p v-if="description" class="mt-2 text-sm text-[var(--text-muted)]">
                {{ description }}
              </p>
            </div>
            <button
              type="button"
              class="ml-4 text-[var(--text-muted)] hover:text-[var(--text-base)] transition-colors focus:outline-none"
              @click="close"
              aria-label="Close"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div>
            <slot />
          </div>

          <div v-if="$slots.footer" class="mt-6 flex justify-end gap-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
