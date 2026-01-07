<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')

const handleSubmit = async () => {
  if (!username.value || !password.value) return

  const success = await authStore.login({
    username: username.value,
    password: password.value,
  })

  if (success) {
    router.push('/transactions')
  }
}
</script>

<template>
  <div class="min-h-screen bg-white text-black">
    <div class="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
      <div class="border border-black p-8">
        <div class="text-xs uppercase tracking-widest">Access</div>
        <h1 class="mt-2 text-2xl font-semibold uppercase tracking-widest">Login</h1>
        <p class="mt-2 text-sm text-black/70">
          Use your account credentials to access the ledger.
        </p>

        <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <label for="username" class="text-xs uppercase tracking-widest">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="w-full border border-black px-3 py-2"
              placeholder="Enter username"
            />
          </div>
          <div class="space-y-2">
            <label for="password" class="text-xs uppercase tracking-widest">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full border border-black px-3 py-2"
              placeholder="Enter password"
            />
          </div>

          <div
            v-if="authStore.error"
            class="border border-black bg-white px-3 py-2 text-xs"
          >
            {{ authStore.error }}
          </div>

          <button
            type="submit"
            class="w-full border border-black px-4 py-3 text-xs uppercase tracking-widest"
            :disabled="authStore.isLoading"
          >
            <span v-if="authStore.isLoading">Signing in...</span>
            <span v-else>Enter</span>
          </button>
        </form>

        <div class="mt-6 text-xs uppercase tracking-widest">
          New here?
          <router-link to="/register" class="underline">Register</router-link>
        </div>
      </div>
    </div>
  </div>
</template>
