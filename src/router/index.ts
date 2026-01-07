import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AnalyticsView from "../views/DashboardView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/transactions",
    },
    {
      path: "/transactions",
      name: "transactions",
      component: () => import("../views/TransactionsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/analytics",
      name: "analytics",
      component: AnalyticsView,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: { requiresGuest: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth) {
    // If not marked authenticated, verify with server
    if (!authStore.isAuthenticated) {
      const ok = await authStore.checkAuthStatus();
      if (!ok) return { path: "/login" };
    }
  }

  if (to.meta.requiresGuest) {
    // If not sure, verify; redirect authenticated users away from guest routes
    if (!authStore.isAuthenticated) {
      const ok = await authStore.checkAuthStatus();
      if (ok) return { path: "/transactions" };
    } else {
      return { path: "/transactions" };
    }
  }

  return true;
});

export default router;
