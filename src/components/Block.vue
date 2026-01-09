<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <div
    class="bg-white border border-black h-64 flex flex-col justify-between p-8 transition-colors duration-300"
  >
    <div class="flex justify-between items-start">
      <span class="font-mono text-xs uppercase tracking-widest border border-black px-2 py-1">
        {{ label }}
      </span>
      <slot name="headerRight" />
    </div>
    <slot />
  </div>
</template>
