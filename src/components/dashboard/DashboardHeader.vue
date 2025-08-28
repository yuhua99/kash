<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-vue-next'

interface Props {
  title?: string
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Dashboard',
  subtitle: 'Welcome to your personal budget tracker'
})
</script>

<template>
  <div class="flex flex-col space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{{ title }}</h2>
        <p class="text-muted-foreground">{{ subtitle }}</p>
      </div>
      <div class="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          <CalendarDays class="mr-2 h-4 w-4" />
          This Month
        </Button>
      </div>
    </div>
  </div>
</template>
