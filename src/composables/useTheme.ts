import { ref, onMounted } from 'vue'

type Theme = 'light' | 'dark'

const isDark = ref<boolean>(false)
const theme = ref<Theme>('light')

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value
    theme.value = isDark.value ? 'dark' : 'light'

    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    localStorage.setItem('theme', theme.value)
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    isDark.value = newTheme === 'dark'

    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    localStorage.setItem('theme', theme.value)
  }

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme) {
      setTheme(savedTheme)
    } else if (systemPrefersDark) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  onMounted(() => {
    initializeTheme()
  })

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    initializeTheme,
  }
}
