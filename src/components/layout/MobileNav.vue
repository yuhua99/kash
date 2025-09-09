<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, Home, List, Folder } from 'lucide-vue-next'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: List },
  { name: 'Categories', href: '/categories', icon: Folder },
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
      <SheetContent side="top" class="p-0">
        <div class="border-b">
          <SheetHeader class="h-14 px-4 pl-6 items-center flex-row gap-0">
            <SheetTitle class="text-base font-semibold">Kash!</SheetTitle>
            <SheetDescription class="sr-only" />
          </SheetHeader>
        </div>
        <nav class="p-2">
          <template v-for="item in navigation" :key="item.name">
            <SheetClose as-child>
              <RouterLink
                :to="item.href"
                class="flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                <component :is="item.icon" class="h-4 w-4" />
                <span>{{ item.name }}</span>
              </RouterLink>
            </SheetClose>
          </template>
        </nav>
      </SheetContent>
    </Sheet>

    <div class="mx-2 text-base font-semibold select-none">Kash!</div>

    <div class="ml-auto">
      <!-- Placeholder slot for actions (e.g., user avatar) -->
      <slot name="actions" />
    </div>
  </div>
</template>
