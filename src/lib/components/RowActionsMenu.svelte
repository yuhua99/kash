<script lang="ts">
  import { DropdownMenu } from 'bits-ui'

  export let ariaLabel: string
  export let onEdit: () => void
  export let onDelete: () => void
  export let deleting = false
  export let editLabel = 'Edit'
  export let deleteLabel = 'Delete'
  export let deletingLabel = 'Deleting...'
  export let triggerLabel = 'Actions'
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="menu-trigger" aria-label={ariaLabel}>
    {triggerLabel}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="popover" sideOffset={6} align="end">
      <DropdownMenu.Item class="menu-item" onSelect={onEdit}>
        {editLabel}
      </DropdownMenu.Item>
      <DropdownMenu.Separator class="menu-separator" />
      <DropdownMenu.Item
        class="menu-item menu-item--danger"
        onSelect={onDelete}
        disabled={deleting}
      >
        {deleting ? deletingLabel : deleteLabel}
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
