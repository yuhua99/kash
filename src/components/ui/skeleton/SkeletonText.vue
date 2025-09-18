<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import Skeleton from './Skeleton.vue'

interface SkeletonTextProps {
  class?: HTMLAttributes['class']
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<SkeletonTextProps>(), {
  size: 'md',
})
</script>

<template>
  <Skeleton variant="text" :size="props.size" :class="props.class" />
</template>
