<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainNav from '@/components/layout/MainNav.vue'

const authStore = useAuthStore()
</script>

<template>
  <!-- Authenticated Layout -->
  <div v-if="authStore.isAuthenticated" class="flex flex-1 flex-col gap-4 p-4">
    <MainNav />
    <!-- Page Content -->
    <RouterView />
  </div>

  <!-- Unauthenticated Layout -->
  <div v-else class="min-h-screen bg-background">
    <RouterView />
  </div>
</template>
