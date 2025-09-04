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

const handleSubmit = async (e: Event) => {
  e.preventDefault()

  if (!username.value || !password.value) {
    return
  }

  const success = await authStore.login({
    username: username.value,
    password: password.value,
  })

  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-xl"> Welcome back </CardTitle>
        <CardDescription> Enter your username and password to login </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit="handleSubmit">
          <div class="grid gap-6">
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
                <div class="flex items-center">
                  <Label for="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  v-model="password"
                  required
                />
              </div>
              <Button type="submit" class="w-full" :disabled="authStore.isLoading">
                <span v-if="authStore.isLoading">Logging in...</span>
                <span v-else>Login</span>
              </Button>
            </div>
            <div class="text-center text-sm">
              Don't have an account?
              <router-link to="/register" class="underline underline-offset-4">
                Sign up
              </router-link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
    <div
      class="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4"
    >
      By clicking continue, you agree to our <a href="#">Terms of Service</a> and
      <a href="#">Privacy Policy</a>.
    </div>
  </div>
</template>
