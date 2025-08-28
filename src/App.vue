<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-vue-next'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <!-- Authenticated Layout -->
  <SidebarProvider v-if="authStore.isAuthenticated">
    <AppSidebar />
    <SidebarInset>
      <!-- Header with Sidebar Trigger and Logout -->
      <header class="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger class="-ml-1" />
        <div class="ml-auto">
          <Button variant="ghost" size="sm" @click="handleLogout">
            <LogOut class="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>

  <!-- Unauthenticated Layout -->
  <div v-else class="min-h-screen bg-background">
    <RouterView />
  </div>
</template>
