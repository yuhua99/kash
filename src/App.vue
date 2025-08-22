<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, LogOut, Home, Info } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header v-if="authStore.isAuthenticated" class="border-b bg-white">
    <div class="flex h-16 items-center justify-between px-6">
      <!-- Logo/Brand -->
      <div class="flex items-center">
        <h1 class="text-xl font-bold">My Budget</h1>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center space-x-6">
        <RouterLink to="/" class="text-sm font-medium hover:text-blue-600 transition-colors">
          Home
        </RouterLink>
        <RouterLink to="/about" class="text-sm font-medium hover:text-blue-600 transition-colors">
          About
        </RouterLink>
        <Button variant="outline" size="sm" @click="handleLogout">
          <LogOut class="h-4 w-4 mr-2" />
          Logout
        </Button>
      </nav>

      <!-- Mobile Navigation -->
      <div class="md:hidden">
        <Sheet>
          <SheetTrigger as-child>
            <Button variant="outline" size="sm">
              <Menu class="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="w-64">
            <nav class="flex flex-col space-y-4 mt-8">
              <RouterLink
                to="/"
                class="flex items-center space-x-2 text-sm font-medium hover:text-blue-600 transition-colors"
              >
                <Home class="h-4 w-4" />
                <span>Home</span>
              </RouterLink>
              <RouterLink
                to="/about"
                class="flex items-center space-x-2 text-sm font-medium hover:text-blue-600 transition-colors"
              >
                <Info class="h-4 w-4" />
                <span>About</span>
              </RouterLink>
              <hr class="my-4" />
              <Button variant="outline" @click="handleLogout" class="justify-start">
                <LogOut class="h-4 w-4 mr-2" />
                Logout
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>

  <RouterView />
</template>
