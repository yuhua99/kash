<script lang="ts">
	import { Button, Dialog } from 'bits-ui';

	export let open = false;
	export let title = 'Confirm action';
	export let description = '';
	export let confirmLabel = 'Confirm';
	export let confirmBusyLabel = '';
	export let cancelLabel = 'Cancel';
	export let busy = false;
	export let onOpenChange: (nextOpen: boolean) => void = () => {};
	export let onConfirm: () => void | Promise<void> = () => {};

	$: resolvedConfirmLabel = busy && confirmBusyLabel ? confirmBusyLabel : confirmLabel;
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="dialog-content">
			<Dialog.Title>{title}</Dialog.Title>
			{#if description}
				<Dialog.Description>{description}</Dialog.Description>
			{/if}

			<div class="button-row">
				<Button.Root class="btn btn--secondary" type="button" onclick={() => onOpenChange(false)} disabled={busy}>
					{cancelLabel}
				</Button.Root>
				<Button.Root class="btn btn--primary" type="button" onclick={() => void onConfirm()} disabled={busy}>
					{resolvedConfirmLabel}
				</Button.Root>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
