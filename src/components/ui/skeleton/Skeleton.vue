<script setup lang="ts">
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import {
  defaultSize,
  defaultVariant,
  skeletonBaseClass,
  skeletonVariantConfig,
  type SkeletonSize,
  type SkeletonVariant,
} from '@/lib/skeletonTheme'

interface SkeletonProps {
  class?: HTMLAttributes['class']
  variant?: SkeletonVariant
  size?: SkeletonSize
}

const props = withDefaults(defineProps<SkeletonProps>(), {
  variant: defaultVariant,
  size: defaultSize,
})

const resolvedConfig = computed(() => {
  const config = skeletonVariantConfig[props.variant]
  if (!config && import.meta.env.DEV) {
    // eslint-disable-next-line no-console -- visible warning for developer mistake
    console.warn(
      `[Skeleton] Unknown variant "${props.variant}". Falling back to "${defaultVariant}".`,
    )
  }
  return config ?? skeletonVariantConfig[defaultVariant]
})

const sizeClass = computed(() => resolvedConfig.value.sizes[props.size] ?? '')

const baseClasses = computed(() =>
  cn(skeletonBaseClass, resolvedConfig.value.base, sizeClass.value),
)
</script>

<template>
  <div
    data-slot="skeleton"
    :class="cn(baseClasses.value, props.class)"
    role="presentation"
    aria-hidden="true"
  />
</template>
