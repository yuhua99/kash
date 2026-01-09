import { ref, onMounted, onBeforeUnmount } from "vue"
import { defineStore } from "pinia"

export const useGlobalStore = defineStore("global", () => {
  const isMobile = ref(false)

  const update = () => {
    if (typeof window === "undefined") return
    isMobile.value = window.innerWidth < 768 // Tailwind md breakpoint
  }

  const initialize = () => {
    if (typeof window === "undefined") return
    update()
    window.addEventListener("resize", update, { passive: true })
  }

  const teardown = () => {
    if (typeof window === "undefined") return
    window.removeEventListener("resize", update)
  }

  // For components using setup() lifecycle helpers
  onMounted(() => update())
  onBeforeUnmount(() => teardown())

  return {
    isMobile,
    initialize,
    teardown,
  }
})
