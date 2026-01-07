<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainNav from '@/components/layout/MainNav.vue'
import UserNav from '@/components/layout/UserNav.vue'

const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-white text-black">
    <header v-if="authStore.isAuthenticated" class="border-b border-black">
      <div class="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
        <div class="font-bold tracking-tight">Kash</div>
        <MainNav class="flex-1" />
        <UserNav />
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl px-6 py-8">
      <RouterView />
    </main>
  </div>
</template>
