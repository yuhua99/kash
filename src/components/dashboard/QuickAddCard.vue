<script setup lang="ts">
import Block from "@/components/Block.vue"
</script>

<template>
  <Block label="Quick Add" class="lg:col-start-2 lg:row-start-1">
    <div class="flex-1 flex flex-col justify-center relative overflow-hidden">
      <input
        type="text"
        placeholder="124.50 groceries"
        class="w-full bg-transparent border-b border-black font-mono text-xl py-2 focus:outline-none placeholder-gray-400"
      />
      <button class="absolute right-0 bottom-2 text-2xl hover:text-gray-500">→</button>
    </div>
    <p class="font-mono text-xs text-[var(--text-muted)] shrink-0">Format: amount category</p>
  </Block>
</template>
