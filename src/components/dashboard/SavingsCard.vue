<script setup lang="ts">
import Block from "@/components/Block.vue"

defineProps<{
  savingsRate: number
}>()
</script>

<template>
  <Block label="Savings" class="lg:col-start-3 lg:row-start-1">
    <template #headerRight>
      <span class="font-mono text-xs">{{ Math.round(savingsRate) }}%</span>
    </template>
    <div class="flex-1 flex flex-col justify-end overflow-hidden">
      <div class="w-full bg-gray-200 h-2">
        <div
          class="bg-current h-full"
          :style="{
            width: `${Math.max(0, Math.min(100, Math.round(savingsRate)))}%`,
          }"
        ></div>
      </div>
    </div>
  </Block>
</template>
