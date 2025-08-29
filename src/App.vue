<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

const authStore = useAuthStore()
</script>

<template>
  <!-- Authenticated Layout -->
  <SidebarProvider v-if="authStore.isAuthenticated">
    <AppSidebar />
    <!-- Page Content -->
    <div class="flex flex-1 flex-col gap-4 p-4">
      <RouterView />
    </div>
  </SidebarProvider>

  <!-- Unauthenticated Layout -->
  <div v-else class="min-h-screen bg-background">
    <RouterView />
  </div>
</template>
