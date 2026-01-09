<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { Button, Input, Form } from "@/components/ui"

const router = useRouter()
const authStore = useAuthStore()

const username = ref("")
const password = ref("")
const confirmPassword = ref("")
const localError = ref("")

const submitButtonText = computed(() => (authStore.isLoading ? "Creating..." : "Register"))

const handleSubmit = async () => {
  localError.value = ""
  if (!username.value || !password.value) return

  if (password.value !== confirmPassword.value) {
    localError.value = "Passwords do not match."
    return
  }

  const success = await authStore.register({
    username: username.value,
    password: password.value,
  })

  if (success) {
    router.push("/login")
  }
}
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-base)] text-[var(--text-base)]">
    <div class="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
      <div class="border border-[var(--text-base)] p-8">
        <div class="text-xs uppercase tracking-widest">Create account</div>
        <h1 class="mt-2 text-2xl font-semibold uppercase tracking-widest">Register</h1>
        <p class="mt-2 text-sm text-[var(--text-muted)]">Set up your ledger access.</p>

        <Form class="mt-6 space-y-4" @submit="handleSubmit">
          <Input
            id="username"
            v-model="username"
            label="Username"
            type="text"
            required
            placeholder="Choose username"
          />

          <Input
            id="password"
            v-model="password"
            label="Password"
            type="password"
            required
            placeholder="Create password"
          />

          <Input
            id="confirmPassword"
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            required
            placeholder="Repeat password"
          />

          <div
            v-if="localError || authStore.error"
            class="border border-[var(--text-base)] bg-[var(--bg-base)] px-3 py-2 text-xs"
          >
            {{ localError || authStore.error }}
          </div>

          <Button
            type="submit"
            :text="submitButtonText"
            :disabled="authStore.isLoading"
            class="w-full"
          />
        </Form>

        <div class="mt-6 text-xs uppercase tracking-widest">
          Already have an account?
          <router-link to="/login" class="underline">Login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>
