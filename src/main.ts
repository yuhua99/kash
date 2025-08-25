import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Check for existing session BEFORE setting up router
const authStore = useAuthStore()
authStore.checkAuthStatus().finally(() => {
  app.use(router)
  app.mount('#app')
})
