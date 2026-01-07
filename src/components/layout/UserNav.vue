<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui";

const router = useRouter();
const authStore = useAuthStore();
const isOpen = ref(false);

const username = computed(() => authStore.user?.username || "User");

const handleLogout = async () => {
  isOpen.value = false;
  await authStore.logout();
  router.push("/login");
};

const openCategories = () => {
  router.push({ path: "/transactions", query: { manageCategories: "1" } });
  isOpen.value = false;
};
</script>

<template>
  <div class="relative">
    <Button
      type="button"
      :text="username"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
      class="flex items-center gap-3"
    />

    <div
      v-if="isOpen"
      class="absolute right-0 top-full z-20 mt-2 w-56 border border-black bg-white p-3 text-xs"
    >
      <div class="border-b border-black pb-2">
        <div class="text-[10px] uppercase tracking-widest">Signed in</div>
        <div class="mt-1 font-semibold">{{ username }}</div>
      </div>
      <div class="mt-2 flex flex-col gap-2">
        <Button type="button" text="Manage categories" @click="openCategories" class="text-left" />
        <Button type="button" text="Log out" @click="handleLogout" class="text-left" />
      </div>
    </div>
  </div>
</template>
