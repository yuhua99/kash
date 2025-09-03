<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, Home, List, Folder, Info } from 'lucide-vue-next'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: List },
  { name: 'Categories', href: '/categories', icon: Folder },
  { name: 'About', href: '/about', icon: Info },
]
</script>

<template>
  <div class="flex h-14 items-center px-4 border-b bg-background">
    <Sheet>
      <SheetTrigger as-child>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu class="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" class="p-0">
        <div class="p-4 border-b">
          <SheetHeader>
            <SheetTitle class="text-lg">My Budget</SheetTitle>
          </SheetHeader>
        </div>
        <nav class="p-2">
          <RouterLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            class="flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <component :is="item.icon" class="h-4 w-4" />
            <span>{{ item.name }}</span>
          </RouterLink>
        </nav>
      </SheetContent>
    </Sheet>

    <div class="mx-2 text-base font-semibold select-none">My Budget</div>

    <div class="ml-auto">
      <!-- Placeholder slot for actions (e.g., user avatar) -->
      <slot name="actions" />
    </div>
  </div>
</template>

