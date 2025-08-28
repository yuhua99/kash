<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleSubmit = async (e: Event) => {
  e.preventDefault()

  if (!username.value || !password.value || !confirmPassword.value) {
    return
  }

  if (password.value !== confirmPassword.value) {
    authStore.error = 'Passwords do not match'
    return
  }

  const success = await authStore.register({
    username: username.value,
    password: password.value,
  })

  if (success) {
    router.push('/login')
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-xl"> Create an account </CardTitle>
        <CardDescription> Enter your username and password to create your account </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit="handleSubmit">
          <div class="grid gap-6">
            <div
              v-if="authStore.error"
              class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded"
            >
              {{ authStore.error }}
            </div>
            <div class="grid gap-6">
              <div class="grid gap-3">
                <Label for="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  v-model="username"
                  required
                />
              </div>
              <div class="grid gap-3">
                <Label for="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  v-model="password"
                  required
                />
              </div>
              <div class="grid gap-3">
                <Label for="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  v-model="confirmPassword"
                  required
                />
              </div>
              <Button type="submit" class="w-full" :disabled="authStore.isLoading">
                <span v-if="authStore.isLoading">Creating account...</span>
                <span v-else>Create account</span>
              </Button>
            </div>
            <div class="text-center text-sm">
              Already have an account?
              <router-link to="/login" class="underline underline-offset-4"> Sign in </router-link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
    <div
      class="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4"
    >
      By clicking create account, you agree to our <a href="#">Terms of Service</a> and
      <a href="#">Privacy Policy</a>.
    </div>
  </div>
</template>
