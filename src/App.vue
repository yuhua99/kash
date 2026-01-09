<script setup lang="ts">
import { RouterView } from "vue-router"
import { useAuthStore } from "@/stores/auth"

const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-base)] text-[var(--text-base)]">
    <main class="mx-auto w-full max-w-6xl px-6 py-8">
      <RouterView />
    </main>
  </div>
</template>
