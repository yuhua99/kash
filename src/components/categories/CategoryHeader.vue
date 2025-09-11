<script setup lang="ts">
interface Props {
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Categories',
})
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
    </div>
  </div>
</template>
