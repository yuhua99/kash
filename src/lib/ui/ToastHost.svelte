<script lang="ts">
  import { toasts } from '$lib/ui/toast'
  import './ToastHost.css'
</script>

<div class="toast-host" aria-label="Notifications" aria-live="polite" aria-relevant="additions">
  {#each $toasts as item (item.id)}
    <div
      class={`toast toast--${item.variant}`}
      role={item.variant === 'error' ? 'alert' : 'status'}
    >
      {item.message}
    </div>
  {/each}
</div>
