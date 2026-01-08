<script setup lang="ts">
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [event: Event];
}>();
</script>

<template>
  <form @submit.prevent="emit('submit', $event)" :class="cn('space-y-6', props.class)">
    <slot />
  </form>
</template>
