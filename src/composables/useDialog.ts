import { ref, watch, computed } from 'vue'

export interface DialogOptions<T = unknown> {
  onOpen?: (editItem?: T) => void
  onClose?: () => void
}

/**
 * Composable for standardized dialog state management with external prop synchronization
 */
export function useDialog<T = unknown>(options: DialogOptions<T> = {}) {
  const isOpen = ref(false)
  const editItem = ref<T | null>(null)

  const isEditMode = computed(() => editItem.value !== null && editItem.value !== undefined)

  const open = (item?: T | null) => {
    editItem.value = item || null
    isOpen.value = true
    options.onOpen?.(item || undefined)
  }

  const close = () => {
    isOpen.value = false
    editItem.value = null
    options.onClose?.()
  }

  /**
   * Setup external prop synchronization for controlled dialog usage
   */
  const setupExternalControl = (
    externalOpen: () => boolean | undefined,
    externalEditItem: () => T | null | undefined,
    emit: (event: 'update:open', value: boolean) => void,
  ) => {
    // Watch for external open prop changes
    watch(
      externalOpen,
      (newValue) => {
        if (newValue !== undefined && newValue !== isOpen.value) {
          if (newValue) {
            open(externalEditItem())
          } else {
            close()
          }
        }
      },
      { immediate: true },
    )

    // Watch for external edit item changes
    watch(
      externalEditItem,
      (newItem) => {
        if (newItem !== editItem.value) {
          editItem.value = newItem || null
          if (newItem && !isOpen.value) {
            isOpen.value = true
          }
        }
      },
      { immediate: true },
    )

    // Emit open state changes to parent
    watch(isOpen, (newValue) => {
      emit('update:open', newValue)
    })
  }

  return {
    isOpen,
    editItem,
    isEditMode,
    open,
    close,
    setupExternalControl,
  }
}
