<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Button, Input, Form } from "@/components/ui";

const router = useRouter();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");

const submitButtonText = computed(() => (authStore.isLoading ? "Signing in..." : "Enter"));

const handleSubmit = async () => {
  if (!username.value || !password.value) return;

  const success = await authStore.login({
    username: username.value,
    password: password.value,
  });

  if (success) {
    router.push("/transactions");
  }
};
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-base)] text-[var(--text-base)]">
    <div class="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
      <div class="border border-[var(--text-base)] p-8">
        <div class="text-xs uppercase tracking-widest">Access</div>
        <h1 class="mt-2 text-2xl font-semibold uppercase tracking-widest">Login</h1>
        <p class="mt-2 text-sm text-[var(--text-muted)]">
          Use your account credentials to access the ledger.
        </p>

        <Form class="mt-6 space-y-4" @submit="handleSubmit">
          <Input
            id="username"
            v-model="username"
            label="Username"
            type="text"
            required
            placeholder="Enter username"
          />

          <Input
            id="password"
            v-model="password"
            label="Password"
            type="password"
            required
            placeholder="Enter password"
          />

          <div
            v-if="authStore.error"
            class="border border-[var(--text-base)] bg-[var(--bg-base)] px-3 py-2 text-xs"
          >
            {{ authStore.error }}
          </div>

          <Button
            type="submit"
            :text="submitButtonText"
            :disabled="authStore.isLoading"
            class="w-full"
          />
        </Form>

        <div class="mt-6 text-xs uppercase tracking-widest">
          New here?
          <router-link to="/register" class="underline">Register</router-link>
        </div>
      </div>
    </div>
  </div>
</template>
