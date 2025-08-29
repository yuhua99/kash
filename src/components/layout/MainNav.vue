<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
  },
  {
    name: 'Transactions',
    href: '/transactions',
  },
]
</script>

<template>
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem v-for="item in navigation" :key="item.name">
        <NavigationMenuLink as-child>
          <RouterLink :to="item.href" :class="navigationMenuTriggerStyle()">
            {{ item.name }}
          </RouterLink>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
