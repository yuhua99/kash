<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, Trash2, MoreHorizontal, Calendar, Tag as TagIcon } from 'lucide-vue-next'
import AddTransactionDialog from './AddTransactionDialog.vue'
import { useCategoriesStore } from '@/stores/categories'
import { formatDate } from '@/lib/formatters'
import type { Transaction } from '@/types'
import { formatSignedCurrency } from '@/lib/formatters'

interface Props {
  transactions: Transaction[]
}

interface Emits {
  (e: 'deleteTransaction', id: string): void
  (e: 'editTransaction', transaction: Transaction): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
const categoriesStore = useCategoriesStore()

const editDialogOpen = ref(false)
const editingTransaction = ref<Transaction | null>(null)

const openEditDialog = (transaction: Transaction) => {
  editingTransaction.value = transaction
  editDialogOpen.value = true
}

const handleEditTransaction = (transaction: Transaction) => {
  editingTransaction.value = null
  emit('editTransaction', transaction)
}

// Simplify badge styling; color dot already conveys category

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

const closeAll = () => {
  if (openId.value) {
    swipeOffsets[openId.value] = 0
  }
  openId.value = null
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
  openEditDialog(transaction)
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
  closeAll()
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
  <div>
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
            @click="$emit('deleteTransaction', transaction.id)"
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

    <!-- Desktop: Table -->
    <div class="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead class="text-right">Amount</TableHead>
            <TableHead class="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="transaction in transactions"
            :key="transaction.id"
            class="hover:bg-muted/50"
          >
            <TableCell class="font-mono text-sm">{{ formatDate(transaction.timestamp) }}</TableCell>
            <TableCell class="font-medium">
              {{ transaction.name }}
            </TableCell>
            <TableCell>
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full border border-border flex-shrink-0"
                  :style="{
                    backgroundColor: (categoriesStore.getCategoryId(transaction.category)
                      ? categoriesStore.getCategoryColor(
                          categoriesStore.getCategoryId(transaction.category) as string,
                        )
                      : 'var(--muted)') as string,
                  }"
                ></div>
                <Badge variant="secondary">
                  {{ transaction.category }}
                </Badge>
              </div>
            </TableCell>
            <TableCell class="text-right font-mono">
              <span
                :class="[
                  'font-semibold',
                  transaction.amount > 0
                    ? 'text-[hsl(var(--vis-secondary-color))]'
                    : 'text-[hsl(var(--vis-primary-color))]',
                ]"
              >
                {{ formatSignedCurrency(transaction.amount) }}
              </span>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="h-8 w-8 p-0">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="openEditDialog(transaction)">
                    <Edit class="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click="$emit('deleteTransaction', transaction.id)"
                  >
                    <Trash2 class="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Empty State -->
    <div v-if="transactions.length === 0" class="text-center py-12 border-t">
      <div class="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <MoreHorizontal class="h-8 w-8 text-muted-foreground" />
      </div>
      <p class="text-muted-foreground text-lg font-medium mb-2">No transactions found</p>
      <p class="text-sm text-muted-foreground">
        Try adjusting your search or filters, or add your first transaction
      </p>
    </div>

    <!-- Edit Transaction Dialog -->
    <AddTransactionDialog
      v-model:open="editDialogOpen"
      :edit-transaction="editingTransaction"
      @edit-transaction="handleEditTransaction"
    />
  </div>
</template>
