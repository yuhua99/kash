<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <!-- Category Management Skeleton -->
    <Card>
      <CardHeader>
        <Skeleton class="h-6 w-40 mb-2" />
        <Skeleton class="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <!-- Search bar skeleton -->
        <Skeleton class="h-10 w-full mb-4" />
        <!-- Category list skeleton -->
        <div class="space-y-3">
          <div v-for="i in 6" :key="i" class="flex items-center space-x-3">
            <Skeleton class="h-4 w-4 rounded-full" />
            <Skeleton class="h-4 w-28" />
            <Skeleton class="h-8 w-8 ml-auto" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Category Statistics Skeleton (table-like) -->
    <Card>
      <CardHeader>
        <Skeleton class="h-6 w-48 mb-2" />
        <Skeleton class="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <!-- Table header -->
        <div class="grid grid-cols-3 gap-2 mb-3">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-4 w-12 justify-self-end" />
          <Skeleton class="h-4 w-16 justify-self-end" />
        </div>
        <!-- Table rows -->
        <div class="space-y-2">
          <div v-for="i in 7" :key="i" class="grid grid-cols-3 gap-2 items-center">
            <div class="flex items-center gap-2">
              <Skeleton class="h-3 w-3 rounded-full" />
              <Skeleton class="h-3 w-28" />
            </div>
            <Skeleton class="h-3 w-8 justify-self-end" />
            <Skeleton class="h-3 w-16 justify-self-end" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
