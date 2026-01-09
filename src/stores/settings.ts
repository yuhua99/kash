import { ref } from "vue"
import { defineStore } from "pinia"

type Theme = "light" | "dark"

export const useSettingsStore = defineStore("settings", () => {
  const theme = ref<Theme>("light")
  const isDark = ref(false)
  const showCents = ref(true)

  // Minimal localStorage helpers to avoid scattered try/catch
  const ls = {
    get(key: string): string | null {
      try {
        return localStorage.getItem(key)
      } catch (err) {
        console.warn(`Failed to read ${key} from localStorage:`, err)
        return null
      }
    },
    set(key: string, value: string): void {
      try {
        localStorage.setItem(key, value)
      } catch (err) {
        console.warn(`Failed to persist ${key} to localStorage:`, err)
      }
    },
    remove(key: string): void {
      try {
        localStorage.removeItem(key)
      } catch (err) {
        console.warn(`Failed to remove ${key} from localStorage:`, err)
      }
    },
  }

  const applyThemeClass = () => {
    if (isDark.value) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    isDark.value = newTheme === "dark"
    applyThemeClass()
    ls.set("theme", theme.value)
  }

  const toggleTheme = () => {
    setTheme(isDark.value ? "light" : "dark")
  }

  const setShowCents = (value: boolean) => {
    showCents.value = value
    ls.set("showCents", JSON.stringify(value))
  }

  const initialize = () => {
    const savedTheme = (ls.get("theme") as Theme | null) || null
    const savedShowCents = ls.get("showCents")

    if (savedTheme) {
      setTheme(savedTheme)
    } else if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark")
    } else {
      setTheme("light")
    }

    if (savedShowCents !== null) {
      showCents.value = savedShowCents === "true"
    } else {
      showCents.value = true
    }
  }

  const reset = () => {
    ls.remove("theme")
    ls.remove("showCents")
    initialize()
  }

  return {
    theme,
    isDark,
    showCents,
    setTheme,
    toggleTheme,
    setShowCents,
    initialize,
    reset,
  }
})
