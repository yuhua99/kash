import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('../views/AllTransactionsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/CategoriesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { requiresGuest: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth) {
    // If not marked authenticated, verify with server
    if (!authStore.isAuthenticated) {
      const ok = await authStore.checkAuthStatus()
      if (!ok) return { path: '/login' }
    }
  }

  if (to.meta.requiresGuest) {
    // If not sure, verify; redirect authenticated users away from guest routes
    if (!authStore.isAuthenticated) {
      const ok = await authStore.checkAuthStatus()
      if (ok) return { path: '/' }
    } else {
      return { path: '/' }
    }
  }

  return true
})

export default router
