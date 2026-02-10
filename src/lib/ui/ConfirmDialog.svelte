<script lang="ts">
  import { Dialog } from 'bits-ui'
  import Button from '$lib/ui/Button.svelte'
  import ButtonRow from '$lib/ui/ButtonRow.svelte'
  import './Dialog.css'

  export let open = false
  export let title = 'Confirm action'
  export let description = ''
  export let confirmLabel = 'Confirm'
  export let confirmBusyLabel = ''
  export let cancelLabel = 'Cancel'
  export let busy = false
  export let onOpenChange: (nextOpen: boolean) => void = () => {}
  export let onConfirm: () => void | Promise<void> = () => {}

  $: resolvedConfirmLabel = busy && confirmBusyLabel ? confirmBusyLabel : confirmLabel
</script>

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />
    <Dialog.Content class="dialog-content">
      <Dialog.Title>{title}</Dialog.Title>
      {#if description}
        <Dialog.Description>{description}</Dialog.Description>
      {/if}

      <ButtonRow>
        <Button
          variant="secondary"
          type="button"
          onclick={() => onOpenChange(false)}
          disabled={busy}
        >
          {cancelLabel}
        </Button>
        <Button variant="primary" type="button" onclick={() => void onConfirm()} disabled={busy}>
          {resolvedConfirmLabel}
        </Button>
      </ButtonRow>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
