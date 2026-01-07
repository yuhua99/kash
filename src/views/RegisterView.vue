<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui";

const router = useRouter();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const localError = ref("");

const submitButtonText = computed(() => (authStore.isLoading ? "Creating..." : "Register"));

const handleSubmit = async () => {
  localError.value = "";
  if (!username.value || !password.value) return;

  if (password.value !== confirmPassword.value) {
    localError.value = "Passwords do not match.";
    return;
  }

  const success = await authStore.register({
    username: username.value,
    password: password.value,
  });

  if (success) {
    router.push("/login");
  }
};
</script>

<template>
  <div class="min-h-screen bg-white text-black">
    <div class="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
      <div class="border border-black p-8">
        <div class="text-xs uppercase tracking-widest">Create account</div>
        <h1 class="mt-2 text-2xl font-semibold uppercase tracking-widest">Register</h1>
        <p class="mt-2 text-sm text-black/70">Set up your ledger access.</p>

        <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <label for="username" class="text-xs uppercase tracking-widest">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="w-full border border-black px-3 py-2"
              placeholder="Choose username"
            />
          </div>
          <div class="space-y-2">
            <label for="password" class="text-xs uppercase tracking-widest">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full border border-black px-3 py-2"
              placeholder="Create password"
            />
          </div>
          <div class="space-y-2">
            <label for="confirmPassword" class="text-xs uppercase tracking-widest">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="w-full border border-black px-3 py-2"
              placeholder="Repeat password"
            />
          </div>

          <div
            v-if="localError || authStore.error"
            class="border border-black bg-white px-3 py-2 text-xs"
          >
            {{ localError || authStore.error }}
          </div>

          <Button
            type="submit"
            :text="submitButtonText"
            :disabled="authStore.isLoading"
            class="w-full"
          />
        </form>

        <div class="mt-6 text-xs uppercase tracking-widest">
          Already have an account?
          <router-link to="/login" class="underline">Login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>
