<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useRecordsStore } from "@/stores/records";
import { useCategoriesStore } from "@/stores/categories";
import { formatSignedCurrency } from "@/lib/formatters";
import { getRangeForPeriod } from "@/lib/timeRange";
import type { Transaction } from "@/types";
import { PeriodUnit, TransactionType } from "@/types";
import { Button, DropdownMenu } from "@/components/ui";
import type { DropdownMenuItem } from "@/components/ui/DropdownMenu.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const recordsStore = useRecordsStore();
const categoriesStore = useCategoriesStore();

const PAGE_SIZE = 100;

const searchQuery = ref("");
const selectedCategoryId = ref("all");
const selectedPeriod = ref<PeriodUnit>(PeriodUnit.MONTH);
const currentPage = ref(1);

const showForm = ref(false);
const formMode = ref<"add" | "edit">("add");
const editingId = ref<string | null>(null);

const formName = ref("");
const formAmount = ref("");
const formCategoryId = ref("");
const formType = ref<TransactionType>(TransactionType.EXPENSE);
const formDate = ref(new Date().toISOString().slice(0, 10));

const categoryDrawerOpen = ref(false);
const categoryName = ref("");
const categoryIsIncome = ref(false);
const editingCategoryId = ref<string | null>(null);

const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
);

const periodOptions = [
  { label: "Month", value: PeriodUnit.MONTH },
  { label: "Half year", value: PeriodUnit.HALF_YEAR },
  { label: "Year", value: PeriodUnit.YEAR },
];

const selectedRange = computed(() => getRangeForPeriod(selectedPeriod.value));

const availableCategories = computed(() => categoriesStore.categories);

const filteredTransactions = computed(() => {
  let list = [...recordsStore.viewTransactions];

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    list = list.filter((transaction) => transaction.name.toLowerCase().includes(query));
  }

  if (selectedCategoryId.value !== "all") {
    list = list.filter((transaction) => transaction.category_id === selectedCategoryId.value);
  }

  return list;
});

const totalPages = computed(() => {
  const total = recordsStore.viewTotalRecords ?? 0;
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
});

const transactionsSubtitle = computed(() => {
  const total = recordsStore.viewTotalRecords ?? 0;
  const filtered = filteredTransactions.value.length;
  const range = selectedRange.value;
  const start = new Date(range.start * 1000).toLocaleDateString();
  const end = new Date(range.end * 1000).toLocaleDateString();
  return `${start} → ${end} · ${filtered} of ${total}`;
});

const saveButtonText = computed(() =>
  formMode.value === "add" ? "Save transaction" : "Update transaction",
);

const categoryButtonText = computed(() =>
  editingCategoryId.value ? "Update category" : "Add category",
);

const overflowMenuItems: DropdownMenuItem[] = [
  { id: "manage-categories", label: "Manage categories", value: "manage-categories" },
];

const handleOverflowMenuSelect = (item: DropdownMenuItem) => {
  if (item.value === "manage-categories") {
    openCategoryDrawer();
  }
};

const fetchTransactionsForRange = async () => {
  const { start, end } = selectedRange.value;
  await recordsStore.fetchRecordsForPeriod({
    start_time: start,
    end_time: end,
    limit: PAGE_SIZE,
    offset: (currentPage.value - 1) * PAGE_SIZE,
  });
};

const loadData = async () => {
  await categoriesStore.fetchCategories();
  await fetchTransactionsForRange();
};

const resetForm = () => {
  formName.value = "";
  formAmount.value = "";
  formCategoryId.value = "";
  formType.value = TransactionType.EXPENSE;
  formDate.value = new Date().toISOString().slice(0, 10);
  editingId.value = null;
  formMode.value = "add";
};

const openAddForm = () => {
  resetForm();
  if (categoriesStore.categories.length) {
    formCategoryId.value = categoriesStore.categories[0].id;
  }
  showForm.value = true;
};

const openEditForm = (transaction: Transaction) => {
  formMode.value = "edit";
  editingId.value = transaction.id;
  formName.value = transaction.name;
  formAmount.value = Math.abs(transaction.amount).toString();
  formCategoryId.value = transaction.category_id;
  formType.value = transaction.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
  formDate.value = new Date(transaction.timestamp * 1000).toISOString().slice(0, 10);
  showForm.value = true;
};

const saveTransaction = async () => {
  if (!formName.value || !formAmount.value || !formCategoryId.value) return;

  const amountValue = Math.abs(Number(formAmount.value));
  if (!Number.isFinite(amountValue)) return;

  const timestamp = Math.floor(new Date(formDate.value).getTime() / 1000);
  if (!Number.isFinite(timestamp)) return;
  const amount = formType.value === TransactionType.INCOME ? amountValue : -amountValue;

  if (formMode.value === "add") {
    await recordsStore.createRecord({
      name: formName.value,
      amount,
      category_id: formCategoryId.value,
      timestamp,
    });
  } else if (editingId.value) {
    await recordsStore.updateRecord(editingId.value, {
      name: formName.value,
      amount,
      category_id: formCategoryId.value,
      timestamp,
    });
  }

  await fetchTransactionsForRange();
  showForm.value = false;
  resetForm();
};

const deleteTransaction = async (id: string) => {
  const confirmed = window.confirm("Delete this transaction?");
  if (!confirmed) return;
  await recordsStore.deleteRecord(id);
  const total = recordsStore.viewTotalRecords ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage;
    return;
  }
  await fetchTransactionsForRange();
};

const openCategoryDrawer = () => {
  categoryDrawerOpen.value = true;
};

const closeCategoryDrawer = () => {
  categoryDrawerOpen.value = false;
  router.replace({ query: { ...route.query, manageCategories: undefined } });
};

const startEditCategory = (categoryId: string) => {
  const target = categoriesStore.categories.find((cat) => cat.id === categoryId);
  if (!target) return;
  editingCategoryId.value = target.id;
  categoryName.value = target.name;
  categoryIsIncome.value = target.is_income;
};

const resetCategoryForm = () => {
  categoryName.value = "";
  categoryIsIncome.value = false;
  editingCategoryId.value = null;
};

const saveCategory = async () => {
  if (!categoryName.value.trim()) return;

  if (editingCategoryId.value) {
    await categoriesStore.updateCategory(editingCategoryId.value, {
      name: categoryName.value.trim(),
      is_income: categoryIsIncome.value,
    });
  } else {
    await categoriesStore.createCategory({
      name: categoryName.value.trim(),
      is_income: categoryIsIncome.value,
    });
  }

  resetCategoryForm();
};

const deleteCategory = async (categoryId: string) => {
  const confirmed = window.confirm("Delete this category?");
  if (!confirmed) return;
  await categoriesStore.deleteCategory(categoryId);
};

watch(
  () => route.query.manageCategories,
  (value) => {
    if (value) {
      categoryDrawerOpen.value = true;
    }
  },
  { immediate: true },
);

watch(selectedPeriod, async () => {
  currentPage.value = 1;
  await fetchTransactionsForRange();
});

watch(currentPage, fetchTransactionsForRange);

onMounted(() => {
  loadData();
});
</script>

<template>
  <section class="space-y-8">
    <header class="space-y-4 border-b border-[var(--text-base)] pb-6">
      <div class="flex items-start justify-between gap-6">
        <div>
          <div class="text-xs uppercase tracking-widest">Transactions</div>
          <h1 class="mt-2 text-2xl font-semibold uppercase tracking-widest">Ledger</h1>
          <p class="mt-2 text-sm text-[var(--text-muted)]">
            {{ transactionsSubtitle }}
          </p>
        </div>

        <DropdownMenu :items="overflowMenuItems" align="right" @select="handleOverflowMenuSelect">
          <template #trigger>
            <Button type="button" text="More" />
          </template>
        </DropdownMenu>
      </div>

      <div class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[220px]">
          <label class="text-xs uppercase tracking-widest">Search</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name"
            class="mt-2 w-full border border-[var(--text-base)] px-3 py-2"
          />
        </div>

        <div class="min-w-[180px]">
          <label class="text-xs uppercase tracking-widest">Category</label>
          <select
            v-model="selectedCategoryId"
            class="mt-2 w-full border border-[var(--text-base)] px-3 py-2"
          >
            <option value="all">All</option>
            <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="min-w-[180px]">
          <label class="text-xs uppercase tracking-widest">Period</label>
          <select
            v-model="selectedPeriod"
            class="mt-2 w-full border border-[var(--text-base)] px-3 py-2"
          >
            <option v-for="period in periodOptions" :key="period.value" :value="period.value">
              {{ period.label }}
            </option>
          </select>
        </div>

        <div class="flex items-end">
          <Button type="button" text="Add transaction" @click="openAddForm" />
        </div>
      </div>
    </header>

    <div v-if="authStore.error || recordsStore.error || categoriesStore.error" class="space-y-2">
      <div class="border border-[var(--text-base)] px-4 py-3 text-xs">
        <div v-if="authStore.error || recordsStore.error || categoriesStore.error">
          Auth: {{ authStore.error }}
        </div>
        <div v-if="recordsStore.error">Records: {{ recordsStore.error }}</div>
        <div v-if="categoriesStore.error">Categories: {{ categoriesStore.error }}</div>
        <Button
          type="button"
          text="Dismiss"
          @click="(authStore.clearError(), recordsStore.clearError(), categoriesStore.clearError())"
          class="mt-2 underline"
        />
      </div>
    </div>

    <div class="border border-[var(--text-base)]">
      <div class="border-b border-[var(--text-base)] px-4 py-3 text-xs uppercase tracking-widest">
        Transactions
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead
            class="border-b border-[var(--text-base)] text-xs uppercase tracking-widest text-left"
          >
            <tr>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3 text-right">Amount</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="transaction in filteredTransactions"
              :key="transaction.id"
              class="border-b border-[var(--text-base)] last:border-b-0"
            >
              <td class="px-4 py-3">{{ transaction.timeStr }}</td>
              <td class="px-4 py-3">{{ transaction.name }}</td>
              <td class="px-4 py-3">{{ transaction.category }}</td>
              <td class="px-4 py-3 text-right">
                {{ formatSignedCurrency(transaction.amount) }}
              </td>
              <td class="px-4 py-3 text-right">
                <Button
                  type="button"
                  text="Edit"
                  @click="openEditForm(transaction)"
                  class="mr-3 underline"
                />
                <Button
                  type="button"
                  text="Delete"
                  @click="deleteTransaction(transaction.id)"
                  class="underline"
                />
              </td>
            </tr>
            <tr v-if="!isLoading && filteredTransactions.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-xs uppercase tracking-widest">
                No transactions for this filter.
              </td>
            </tr>
            <tr v-if="isLoading">
              <td colspan="5" class="px-4 py-8 text-center text-xs uppercase tracking-widest">
                Loading...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex items-center justify-between text-xs uppercase tracking-widest">
      <Button
        type="button"
        text="Prev"
        :disabled="currentPage <= 1"
        @click="currentPage = Math.max(1, currentPage - 1)"
      />
      <div>Page {{ currentPage }} of {{ totalPages }}</div>
      <Button
        type="button"
        text="Next"
        :disabled="currentPage >= totalPages"
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
      />
    </div>
  </section>

  <div v-if="showForm" class="fixed inset-0 z-30">
    <div class="absolute inset-0 bg-[var(--bg-interactive)]/10" @click="showForm = false"></div>
    <div
      class="absolute right-0 top-0 h-full w-full max-w-md border-l border-[var(--text-base)] bg-[var(--bg-base)] p-6"
    >
      <div class="flex items-start justify-between border-b border-[var(--text-base)] pb-4">
        <div>
          <div class="text-xs uppercase tracking-widest">
            {{ formMode === "add" ? "Add" : "Edit" }} transaction
          </div>
          <div class="mt-2 text-lg font-semibold uppercase tracking-widest">Entry</div>
        </div>
        <Button type="button" text="Close" @click="showForm = false" />
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="saveTransaction">
        <div class="space-y-2">
          <label class="text-xs uppercase tracking-widest">Name</label>
          <input
            v-model="formName"
            type="text"
            class="w-full border border-[var(--text-base)] px-3 py-2"
          />
        </div>
        <div class="space-y-2">
          <label class="text-xs uppercase tracking-widest">Amount</label>
          <input
            v-model="formAmount"
            type="number"
            step="0.01"
            class="w-full border border-[var(--text-base)] px-3 py-2"
          />
        </div>
        <div class="space-y-2">
          <label class="text-xs uppercase tracking-widest">Type</label>
          <select v-model="formType" class="w-full border border-[var(--text-base)] px-3 py-2">
            <option :value="TransactionType.INCOME">Income</option>
            <option :value="TransactionType.EXPENSE">Expense</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="text-xs uppercase tracking-widest">Category</label>
          <select
            v-model="formCategoryId"
            class="w-full border border-[var(--text-base)] px-3 py-2"
          >
            <option value="" disabled>Select category</option>
            <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
          <Button
            type="button"
            text="Manage categories"
            @click="openCategoryDrawer"
            class="mt-2 underline"
          />
        </div>
        <div class="space-y-2">
          <label class="text-xs uppercase tracking-widest">Date</label>
          <input
            v-model="formDate"
            type="date"
            class="w-full border border-[var(--text-base)] px-3 py-2"
          />
        </div>

        <Button type="submit" :text="saveButtonText" class="w-full" />
      </form>
    </div>
  </div>

  <div v-if="categoryDrawerOpen" class="fixed inset-0 z-30">
    <div class="absolute inset-0 bg-[var(--bg-interactive)]/10" @click="closeCategoryDrawer"></div>
    <div
      class="absolute right-0 top-0 h-full w-full max-w-md border-l border-[var(--text-base)] bg-[var(--bg-base)] p-6"
    >
      <div class="flex items-start justify-between border-b border-[var(--text-base)] pb-4">
        <div>
          <div class="text-xs uppercase tracking-widest">Categories</div>
          <div class="mt-2 text-lg font-semibold uppercase tracking-widest">Management</div>
        </div>
        <Button type="button" text="Close" @click="closeCategoryDrawer" />
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="saveCategory">
        <div class="space-y-2">
          <label class="text-xs uppercase tracking-widest">Name</label>
          <input
            v-model="categoryName"
            type="text"
            class="w-full border border-[var(--text-base)] px-3 py-2"
          />
        </div>
        <div class="flex items-center gap-2">
          <input
            id="isIncome"
            v-model="categoryIsIncome"
            type="checkbox"
            class="h-4 w-4 border border-[var(--text-base)]"
          />
          <label for="isIncome" class="text-xs uppercase tracking-widest">Income category</label>
        </div>
        <Button type="submit" :text="categoryButtonText" />
        <Button
          v-if="editingCategoryId"
          type="button"
          text="Cancel edit"
          @click="resetCategoryForm"
        />
      </form>

      <div class="mt-8 border-t border-[var(--text-base)] pt-4">
        <div class="text-xs uppercase tracking-widest">Existing</div>
        <div class="mt-4 space-y-3">
          <div
            v-for="category in availableCategories"
            :key="category.id"
            class="flex items-center justify-between border border-[var(--text-base)] px-3 py-2 text-xs"
          >
            <div>
              <div class="uppercase tracking-widest">{{ category.name }}</div>
              <div class="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                {{ category.is_income ? "Income" : "Expense" }}
              </div>
            </div>
            <div class="flex items-center gap-3">
              <Button
                type="button"
                text="Edit"
                @click="startEditCategory(category.id)"
                class="underline"
              />
              <Button
                type="button"
                text="Delete"
                @click="deleteCategory(category.id)"
                class="underline"
              />
            </div>
          </div>
          <div v-if="availableCategories.length === 0" class="text-xs uppercase tracking-widest">
            No categories.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
