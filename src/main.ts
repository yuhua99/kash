import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize UI preferences (theme, cents) before UI renders
useSettingsStore().initialize()

// Check for existing session BEFORE setting up router
const authStore = useAuthStore()
authStore.checkAuthStatus().finally(() => {
  app.use(router)
  app.mount('#app')
})
