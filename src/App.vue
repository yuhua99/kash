<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainNav from '@/components/layout/MainNav.vue'
import UserNav from '@/components/layout/UserNav.vue'
import MobileNav from '@/components/layout/MobileNav.vue'

const authStore = useAuthStore()
</script>

<template>
  <!-- Authenticated Layout -->
  <!-- Authenticated: render mobile and desktop wrappers side-by-side, hidden by breakpoints -->
  <template v-if="authStore.isAuthenticated">
    <!-- Mobile (below md) -->
    <div class="flex md:hidden min-h-screen flex-col">
      <MobileNav>
        <template #actions>
          <UserNav />
        </template>
      </MobileNav>
      <div class="flex-1 p-4 pt-4">
        <RouterView />
      </div>
    </div>

    <!-- Desktop / Tablet (md and up) -->
    <div class="hidden flex-col md:flex">
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
  </template>

  <!-- Unauthenticated Layout -->
  <div v-else class="min-h-screen bg-background">
    <RouterView />
  </div>
</template>
