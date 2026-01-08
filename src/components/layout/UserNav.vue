<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Button, DropdownMenu } from "@/components/ui";
import type { DropdownMenuItem } from "@/components/ui/DropdownMenu.vue";

const router = useRouter();
const authStore = useAuthStore();

const username = computed(() => authStore.user?.username || "User");

const menuItems = computed<DropdownMenuItem[]>(() => [
  { id: "categories", label: "Manage categories", value: "categories" },
  { id: "logout", label: "Log out", value: "logout" },
]);

const handleSelect = async (item: DropdownMenuItem) => {
  if (item.value === "logout") {
    await authStore.logout();
    router.push("/login");
  } else if (item.value === "categories") {
    router.push({ path: "/transactions", query: { manageCategories: "1" } });
  }
};
</script>

<template>
  <DropdownMenu :items="menuItems" align="right" @select="handleSelect">
    <template #trigger>
      <Button type="button" :text="username" class="flex items-center gap-3" />
    </template>
    <template #item="{ item }">
      <div v-if="item.id === 'categories'" class="w-full">
        {{ item.label }}
      </div>
      <div v-else-if="item.id === 'logout'" class="w-full border-t border-black pt-2 mt-2">
        <div class="text-[10px] uppercase tracking-widest mb-1">Signed in as</div>
        <div class="font-semibold mb-2">{{ username }}</div>
        {{ item.label }}
      </div>
    </template>
  </DropdownMenu>
</template>
