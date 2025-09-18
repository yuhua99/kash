<script setup lang="ts">
import { SkeletonText } from '@/components/ui/skeleton'

interface Props {
  title?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Categories',
  loading: false,
})
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="space-y-1">
      <SkeletonText v-if="props.loading" class="w-48" size="xl" />
      <h1 v-else class="text-2xl font-bold tracking-tight">{{ props.title }}</h1>
    </div>
  </div>
</template>
