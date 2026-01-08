<script setup lang="ts">
interface Props {
  text: string;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});
</script>

<template>
  <button
    class="bg-[var(--bg-base)] text-[var(--text-base)] px-4 py-2 text-sm uppercase tracking-widest transition-colors hover:bg-[var(--bg-interactive)] hover:text-[var(--text-hover)] disabled:cursor-not-allowed disabled:bg-[var(--bg-contrast)] disabled:hover:bg-[var(--bg-contrast)] disabled:hover:text-[var(--text-base)]"
    :disabled="disabled"
  >
    {{ text }}
  </button>
</template>
