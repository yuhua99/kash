import "./assets/main.css"

import { createApp } from "vue"
import { createPinia } from "pinia"

import App from "./App.vue"
import router from "./router"
import { useAuthStore } from "./stores/auth"
import { useSettingsStore } from "./stores/settings"
import { registerSW } from "./sw-register"

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize UI preferences before UI renders
useSettingsStore().initialize()

// Check for existing session BEFORE setting up router
const authStore = useAuthStore()
authStore.checkAuthStatus().finally(() => {
  app.use(router)
  app.mount("#app")
  // Register service worker in production to ensure updates on iOS PWA
  registerSW()
})
