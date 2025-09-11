<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useDialog } from '@/composables/useDialog'
import { useSettingsStore } from '@/stores/settings'

interface Props {
  open?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const settings = useSettingsStore()

const { isOpen, setupExternalControl } = useDialog()

setupExternalControl(
  () => props.open,
  () => undefined,
  (event, value) => emit(event, value),
)
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-md" @open-auto-focus="$event.preventDefault()">
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>Manage your preferences and account.</DialogDescription>
      </DialogHeader>

      <div class="py-4 space-y-6">
        <!-- Appearance -->
        <section class="flex items-center justify-between">
          <div class="space-y-1">
            <Label for="theme-toggle">Dark mode</Label>
            <p class="text-sm text-muted-foreground">Switch between light and dark theme.</p>
          </div>
          <Switch
            id="theme-toggle"
            :model-value="settings.isDark"
            @update:model-value="settings.toggleTheme"
          />
        </section>

        <!-- Amounts -->
        <section class="flex items-center justify-between">
          <div class="space-y-1">
            <Label for="cents-toggle">Show cents</Label>
            <p class="text-sm text-muted-foreground">Toggle decimal cents in amounts.</p>
          </div>
          <Switch
            id="cents-toggle"
            :model-value="settings.showCents"
            @update:model-value="settings.setShowCents"
          />
        </section>
      </div>
    </DialogContent>
  </Dialog>
</template>
