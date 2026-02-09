<script lang="ts">
	import { DropdownMenu } from 'bits-ui';

	export let ariaLabel: string;
	export let onEdit: () => void;
	export let onDelete: () => void;
	export let deleting = false;
	export let editLabel = 'Edit';
	export let deleteLabel = 'Delete';
	export let deletingLabel = 'Deleting...';
	export let triggerLabel = 'Actions';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger aria-label={ariaLabel}>
		{triggerLabel}
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
		<DropdownMenu.Content sideOffset={6} align="end">
			<DropdownMenu.Item onSelect={onEdit}>
				{editLabel}
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item
			
				onSelect={onDelete}
				disabled={deleting}
			>
				{deleting ? deletingLabel : deleteLabel}
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
