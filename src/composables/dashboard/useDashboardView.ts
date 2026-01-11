import { ref } from "vue"

export type ViewMode = "overview" | "transactions"

export function useDashboardView() {
  const activeView = ref<ViewMode>("overview")

  function expandTransactions() {
    activeView.value = "transactions"
  }

  function backToOverview() {
    activeView.value = "overview"
  }

  return {
    activeView,
    expandTransactions,
    backToOverview,
  }
}
