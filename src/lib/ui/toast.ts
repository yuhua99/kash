import { writable } from 'svelte/store'

export type ToastVariant = 'success' | 'error' | 'info'

export type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
}

type ShowToastOptions = {
  durationMs?: number
}

const DEFAULT_DURATION_MS = 3000
const MAX_TOASTS = 3

function createToastId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const toastsStore = writable<ToastItem[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function clearToastTimer(id: string): void {
  const timer = timers.get(id)
  if (!timer) {
    return
  }

  clearTimeout(timer)
  timers.delete(id)
}

function dismissToast(id: string): void {
  clearToastTimer(id)

  toastsStore.update((items) => items.filter((item) => item.id !== id))
}

function clearToasts(): void {
  for (const timer of timers.values()) {
    clearTimeout(timer)
  }
  timers.clear()
  toastsStore.set([])
}

function showToast(variant: ToastVariant, message: string, options: ShowToastOptions = {}): void {
  const trimmed = message.trim()
  if (!trimmed) {
    return
  }

  const id = createToastId()
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS

  toastsStore.update((items) => {
    const next = [...items, { id, message: trimmed, variant }]
    if (next.length <= MAX_TOASTS) {
      return next
    }

    const removed = next.slice(0, next.length - MAX_TOASTS)
    for (const item of removed) {
      clearToastTimer(item.id)
    }

    return next.slice(next.length - MAX_TOASTS)
  })

  const timer = setTimeout(() => {
    dismissToast(id)
  }, durationMs)
  timers.set(id, timer)
}

export const toasts = {
  subscribe: toastsStore.subscribe,
}

export const toast = {
  success: (message: string, options?: ShowToastOptions) => showToast('success', message, options),
  error: (message: string, options?: ShowToastOptions) => showToast('error', message, options),
  info: (message: string, options?: ShowToastOptions) => showToast('info', message, options),
  dismiss: dismissToast,
  clear: clearToasts,
}
