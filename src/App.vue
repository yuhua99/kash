<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainNav from '@/components/layout/MainNav.vue'
import UserNav from '@/components/layout/UserNav.vue'
import MobileNav from '@/components/layout/MobileNav.vue'

const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Top navigation (rendered once, not wrapping RouterView) -->
    <div v-if="authStore.isAuthenticated">
      <!-- Mobile header -->
      <div class="md:hidden">
        <MobileNav>
          <template #actions>
            <UserNav />
          </template>
        </MobileNav>
      </div>

      <!-- Desktop/Tablet header -->
      <div class="hidden md:block border-b">
        <div class="flex h-16 items-center px-4">
          <MainNav class="mx-6" />
          <div class="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
    </div>

    <!-- Single RouterView for all layouts -->
    <main class="flex-1 p-4 pt-4 md:p-8 md:pt-6">
      <RouterView />
    </main>
  </div>
</template>
