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
    class="ui-base px-4 py-2 text-xs uppercase tracking-widest transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
    :disabled="disabled"
  >
    {{ text }}
  </button>
</template>
