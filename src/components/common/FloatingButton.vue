<script setup lang="ts">
import { Button } from '@/components/ui/button'

interface Props {
  bottomClass?: string
  rightClass?: string
  sizeClass?: string
}

withDefaults(defineProps<Props>(), {
  bottomClass: 'bottom-6',
  rightClass: 'right-6',
  sizeClass: 'h-14 w-14',
})

defineEmits<{ (e: 'click', ev: MouseEvent): void }>()
</script>

<template>
  <Button
    size="icon"
    type="button"
    class="fixed rounded-full shadow-lg hover:shadow-xl transition-shadow"
    :class="[bottomClass, rightClass, sizeClass]"
    @click="$emit('click', $event)"
  >
    <slot />
  </Button>
</template>
