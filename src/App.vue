<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainNav from '@/components/layout/MainNav.vue'
import UserNav from '@/components/layout/UserNav.vue'

const authStore = useAuthStore()
</script>

<template>
  <!-- Authenticated Layout -->
  <div v-if="authStore.isAuthenticated" class="hidden flex-col md:flex">
    <div class="border-b">
      <div class="flex h-16 items-center px-4">
        <MainNav class="mx-6" />
        <div class="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </div>
    <div class="flex-1 space-y-4 p-8 pt-6">
      <RouterView />
    </div>
  </div>

  <!-- Unauthenticated Layout -->
  <div v-else class="min-h-screen bg-background">
    <RouterView />
  </div>
</template>
