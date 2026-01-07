<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isOpen = ref(false)

const username = computed(() => authStore.user?.username || 'User')

const handleLogout = async () => {
  isOpen.value = false
  await authStore.logout()
  router.push('/login')
}

const openCategories = () => {
  router.push({ path: '/transactions', query: { manageCategories: '1' } })
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="flex items-center gap-3 border border-black px-3 py-2 text-xs uppercase tracking-widest"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span>{{ username }}</span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-20 mt-2 w-56 border border-black bg-white p-3 text-xs"
    >
      <div class="border-b border-black pb-2">
        <div class="text-[10px] uppercase tracking-widest">Signed in</div>
        <div class="mt-1 font-semibold">{{ username }}</div>
      </div>
      <div class="mt-2 flex flex-col gap-2">
        <button type="button" class="text-left uppercase tracking-widest" @click="openCategories">
          Manage categories
        </button>
        <button type="button" class="text-left uppercase tracking-widest" @click="handleLogout">
          Log out
        </button>
      </div>
    </div>
  </div>
</template>
