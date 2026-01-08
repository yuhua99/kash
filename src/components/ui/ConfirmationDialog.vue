<script setup lang="ts">
import Dialog from "./Dialog.vue";
import Button from "./Button.vue";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "default",
  loading: false,
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  emit("update:open", false);
  emit("cancel");
};
</script>

<template>
  <Dialog
    :open="open"
    :title="title"
    :description="description"
    max-width="max-w-md"
    @update:open="emit('update:open', $event)"
  >
    <div class="flex justify-end gap-3 mt-6">
      <Button
        type="button"
        :text="cancelText"
        class="border border-[var(--text-base)]"
        @click="handleCancel"
        :disabled="loading"
      />
      <Button
        type="button"
        :text="confirmText"
        :class="
          variant === 'destructive'
            ? 'bg-red-600 text-white hover:bg-red-700 hover:text-white'
            : 'border border-[var(--text-base)] bg-[var(--text-base)] text-[var(--bg-base)] hover:bg-[var(--text-base)]/90 hover:text-[var(--bg-base)]'
        "
        @click="handleConfirm"
        :disabled="loading"
      />
    </div>
  </Dialog>
</template>
