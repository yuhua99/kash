<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();

const navigation = [
  {
    name: "Transactions",
    href: "/transactions",
  },
  {
    name: "Analytics",
    href: "/analytics",
  },
];

const isActive = (href: string) => {
  if (href === "/transactions") {
    return route.path === "/" || route.path.startsWith("/transactions");
  }
  return route.path.startsWith(href);
};
</script>

<template>
  <nav class="flex items-center gap-6 text-sm">
    <RouterLink
      v-for="item in navigation"
      :key="item.name"
      :to="item.href"
      class="border-b-2 border-transparent pb-1 uppercase tracking-widest"
      :class="
        isActive(item.href) ? 'border-[var(--text-base)] font-semibold' : 'text-[var(--text-muted)]'
      "
    >
      {{ item.name }}
    </RouterLink>
  </nav>
</template>
