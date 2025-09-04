<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Trash2, Calendar } from 'lucide-vue-next'
import { useCategoriesStore } from '@/stores/categories'
import { formatDate, formatSignedCurrency } from '@/lib/formatters'
import type { Transaction } from '@/types'

interface Props {
  transactions: Transaction[]
}

interface Emits {
  (e: 'deleteTransaction', id: string): void
  (e: 'openEdit', transaction: Transaction): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
const categoriesStore = useCategoriesStore()

// Mobile swipe-to-delete state
const REVEAL_WIDTH = 86 // px
const ACTIVATION_PX = 24 // require a deliberate left swipe
const MIN_VISUAL_PX = 12 // ignore tiny offsets to avoid flash
const swipeOffsets = reactive<Record<string, number>>({})
const openId = ref<string | null>(null)
const activeId = ref<string | null>(null)
const startX = ref(0)
const startY = ref(0)
const dragging = ref(false)
// Track scroll position at the moment a card is opened,
// so we only auto-close after a significant (50% viewport) scroll.
const scrollBaseline = ref<number | null>(null)

const closeAll = () => {
  if (openId.value) {
    swipeOffsets[openId.value] = 0
  }
  openId.value = null
  scrollBaseline.value = null
}

const onTouchStart = (id: string, e: TouchEvent) => {
  const t = e.touches[0]
  startX.value = t.clientX
  startY.value = t.clientY
  activeId.value = id
  dragging.value = false

  // If another card is open, start by closing it visually
  if (openId.value && openId.value !== id) {
    swipeOffsets[openId.value] = 0
    openId.value = null
  }
}

const onTouchMove = (id: string, e: TouchEvent) => {
  if (activeId.value !== id) return
  const t = e.touches[0]
  const dx = t.clientX - startX.value
  const dy = t.clientY - startY.value
  if (!dragging.value) {
    // Only start dragging on a deliberate left swipe beyond threshold
    if (dx < -ACTIVATION_PX && Math.abs(dx) > Math.abs(dy)) {
      dragging.value = true
    } else {
      return
    }
  }
  // Only allow swiping left, and suppress tiny visual shifts
  let offset = Math.max(-REVEAL_WIDTH, Math.min(0, dx))
  if (offset > -MIN_VISUAL_PX) offset = 0
  swipeOffsets[id] = offset
}

const onTouchEnd = (id: string) => {
  if (activeId.value !== id) return
  const offset = swipeOffsets[id] || 0
  const shouldOpen = offset <= -REVEAL_WIDTH / 2
  if (shouldOpen) {
    swipeOffsets[id] = -REVEAL_WIDTH
    openId.value = id
    // Set scroll baseline when opening so we can require 50% viewport scroll to close
    scrollBaseline.value = window.scrollY
  } else {
    swipeOffsets[id] = 0
    if (openId.value === id) openId.value = null
  }
  activeId.value = null
  dragging.value = false
}

const onCardClick = (transaction: Transaction) => {
  // If menu is open for this card, close it instead of editing
  if (openId.value === transaction.id) {
    closeAll()
    return
  }
  // If user was dragging, ignore click
  if (dragging.value) return
  emit('openEdit', transaction)
}

// Opacity curve for delete button: stay transparent until late in the reveal
const getRevealOpacity = (id: string) => {
  if (openId.value === id) return 1
  if (activeId.value === id) {
    const progress = Math.min(1, Math.abs(swipeOffsets[id] || 0) / REVEAL_WIDTH)
    const t = Math.max(0, progress / 1)
    return t * t * t // cubic ease-in
  }
  return 0
}

// Close any open swipe when clicking outside the mobile list
const mobileListRef = ref<HTMLElement | null>(null)
const onGlobalPointerDown = (e: Event) => {
  if (!openId.value) return
  const root = mobileListRef.value
  if (!root) return
  if (!root.contains(e.target as Node)) {
    closeAll()
  }
}

const onGlobalScroll = () => {
  if (!openId.value) return
  // Avoid fighting the swipe interaction itself
  if (dragging.value) return
  const currentY = window.scrollY
  if (scrollBaseline.value === null) {
    // First scroll after opening sets the baseline
    scrollBaseline.value = currentY
    return
  }
  const delta = Math.abs(currentY - scrollBaseline.value)
  const threshold = window.innerHeight * 0.5 // 50% of viewport height
  if (delta >= threshold) {
    closeAll()
  }
}

onMounted(() => {
  window.addEventListener('pointerdown', onGlobalPointerDown, { passive: true })
  // Close any open swipe on scroll anywhere in the page (capture to catch nested scrollers)
  window.addEventListener('scroll', onGlobalScroll, { passive: true, capture: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onGlobalPointerDown)
  window.removeEventListener('scroll', onGlobalScroll, { capture: true } as any)
})
</script>

<template>
  <!-- Mobile: Card list -->
  <div class="md:hidden space-y-2" ref="mobileListRef" @click.self="closeAll">
    <div v-for="transaction in transactions" :key="transaction.id" class="relative">
      <!-- Hidden Delete Action (revealed on swipe) -->
      <div
        class="absolute inset-y-0 right-0 flex items-stretch transition-opacity"
        :style="{ opacity: getRevealOpacity(transaction.id) }"
        :class="
          openId === transaction.id || activeId === transaction.id
            ? 'pointer-events-auto'
            : 'pointer-events-none'
        "
      >
        <button
          class="h-full w-20 rounded-md bg-destructive text-destructive-foreground flex items-center justify-center text-sm font-medium shadow-sm active:scale-[.98]"
          @click="emit('deleteTransaction', transaction.id)"
        >
          <Trash2 class="h-4 w-4" />
          <span class="sr-only">Delete</span>
        </button>
      </div>

      <!-- Swipeable Card -->
      <div
        class="rounded-lg border p-3 bg-background border-l-4 cursor-pointer hover:bg-muted active:bg-muted transition-colors"
        :style="{
          borderLeftColor: (categoriesStore.getCategoryId(transaction.category)
            ? categoriesStore.getCategoryColor(
                categoriesStore.getCategoryId(transaction.category) as string,
              )
            : 'var(--border)') as string,
          width: `calc(100% + ${swipeOffsets[transaction.id] || 0}px)`,
          transition: activeId === transaction.id ? 'none' : 'width 200ms ease',
          willChange: 'width',
        }"
        @touchstart.passive="onTouchStart(transaction.id, $event)"
        @touchmove.passive="onTouchMove(transaction.id, $event)"
        @touchend="onTouchEnd(transaction.id)"
        @touchcancel="onTouchEnd(transaction.id)"
        @click="onCardClick(transaction)"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium break-words leading-tight">{{ transaction.name }}</div>
              <div class="text-right font-mono whitespace-nowrap leading-tight">
                <span
                  :class="[
                    'font-semibold text-base',
                    transaction.amount > 0
                      ? 'text-[hsl(var(--vis-secondary-color))]'
                      : 'text-[hsl(var(--vis-primary-color))]',
                  ]"
                >
                  {{ formatSignedCurrency(transaction.amount) }}
                </span>
              </div>
            </div>
            <div
              class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
            >
              <div class="flex items-center gap-1">
                <Calendar class="h-3 w-3" />
                <span class="font-mono">{{ formatDate(transaction.timestamp) }}</span>
              </div>
              <div class="flex items-center min-w-0">
                <div class="flex items-center min-w-0">
                  <Badge variant="secondary" class="max-w-full truncate">
                    {{ transaction.category }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
