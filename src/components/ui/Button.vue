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
    class="bg-white text-black h-10 px-4 py-2 text-xs uppercase tracking-widest transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:hover:bg-gray-200 disabled:hover:text-black"
    :disabled="disabled"
  >
    {{ text }}
  </button>
</template>
