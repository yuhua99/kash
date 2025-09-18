<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import Skeleton from './Skeleton.vue'

interface SkeletonCircleProps {
  class?: HTMLAttributes['class']
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<SkeletonCircleProps>(), {
  size: 'md',
})
</script>

<template>
  <Skeleton variant="circle" :size="props.size" :class="props.class" />
</template>
