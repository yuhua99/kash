import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'
import { useGlobalStore } from './stores/global'
import { registerSW } from './sw-register'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize UI preferences (theme, cents) before UI renders
useSettingsStore().initialize()
useGlobalStore().initialize()

// Initialize auth status before mounting the app
async function initializeApp() {
  const authStore = useAuthStore()
  // Check for existing session BEFORE setting up router
  await authStore.checkAuthStatus()

  app.use(router)
  app.mount('#app')

  // Register service worker in production to ensure updates on iOS PWA
  registerSW()
}

initializeApp()
