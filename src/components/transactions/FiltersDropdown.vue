<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import PeriodRangeSelector from '@/components/transactions/PeriodRangeSelector.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-vue-next'
import { useGlobalStore } from '@/stores/global'
import type { Range } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  range: Range
  category: string
  categories: string[]
  loading?: boolean
}

interface Emits {
  (e: 'apply', payload: { range: Range; category: string }): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})
const emit = defineEmits<Emits>()

const localRange = ref<Range>({ ...props.range })
const localCategory = ref(props.category)

const global = useGlobalStore()

// Default range: current month [start, end]
const defaultRange = computed<Range>(() => {
  const now = new Date()
  const start = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)
  const end = Math.floor(new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() / 1000) - 1
  return { start, end }
})

watch(
  () => props.range,
  (r) => {
    if (!r) return
    localRange.value = { ...r }
  },
  { deep: true },
)

watch(
  () => props.category,
  (c) => {
    localCategory.value = c
  },
)

const onApply = () => {
  emit('apply', { range: { ...localRange.value }, category: localCategory.value })
}

const onClear = () => {
  localCategory.value = 'all'
  localRange.value = { ...defaultRange.value }
  emit('apply', { range: { ...defaultRange.value }, category: 'all' })
}
</script>

<template>
  <div class="w-full sm:w-auto">
    <Skeleton v-if="props.loading" variant="input" size="md" class="w-full sm:w-[180px]" />
    <DropdownMenu v-else>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="default" aria-label="Open filters">
          <Filter class="h-4 w-4 mr-2" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        :align="global.isMobile ? 'center' : 'end'"
        side="bottom"
        class="w-[calc(100vw-2rem)] sm:w-[28rem] max-h-[70vh] p-2"
      >
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="text-xs text-muted-foreground px-1">Period</div>
            <PeriodRangeSelector @range-change="(r) => (localRange = r)" />
          </div>

          <div class="space-y-2">
            <div class="text-xs text-muted-foreground px-1">Category</div>
            <Select v-model="localCategory">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem v-for="c in categories" :key="c" :value="c">{{ c }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <DropdownMenuItem as-child>
              <Button variant="outline" @click="onClear">Clear</Button>
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <Button @click="onApply">Apply</Button>
            </DropdownMenuItem>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
