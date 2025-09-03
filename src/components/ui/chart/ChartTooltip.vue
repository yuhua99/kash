<script setup lang="ts">
defineProps<{
  title?: string
  data: {
    name: string
    color: string
    value: any
  }[]
}>()
</script>

<template>
  <div
    class="bg-popover text-popover-foreground border rounded-md shadow-sm text-sm p-3 min-w-[180px]"
  >
    <div v-if="title" class="text-muted-foreground mb-1 font-medium">
      {{ title }}
    </div>

    <div class="flex flex-col gap-1">
      <div v-for="(item, key) in data" :key="key" class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 min-w-0">
          <span
            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            :style="{ backgroundColor: item.color }"
          />
          <span class="truncate capitalize">{{ item.name }}</span>
        </div>
        <span class="font-medium tabular-nums whitespace-nowrap ml-4">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>
