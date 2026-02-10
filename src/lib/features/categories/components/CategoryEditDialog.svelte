<script lang="ts">
  import { Dialog } from 'bits-ui'
  import Button from '$lib/ui/Button.svelte'
  import ButtonRow from '$lib/ui/ButtonRow.svelte'
  import '$lib/ui/Dialog.css'

  export let editDialogOpen = false
  export let onEditDialogOpenChange: (nextOpen: boolean) => void
  export let editingCategoryName = ''
  export let editName = ''
  export let editNameError = ''
  export let saveEdit: () => void
  export let cancelEdit: () => void
  export let savingEdit = false
</script>

<Dialog.Root open={editDialogOpen} onOpenChange={onEditDialogOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />
    <Dialog.Content class="dialog-content">
      <Dialog.Title>Edit category</Dialog.Title>
      <Dialog.Description>
        {editingCategoryName ? `Update "${editingCategoryName}".` : 'Update selected category.'}
      </Dialog.Description>

      <div>
        <label for="edit-category-name">Category name</label>
        <input id="edit-category-name" type="text" bind:value={editName} />
        {#if editNameError}
          <p role="alert">{editNameError}</p>
        {/if}
      </div>

      <ButtonRow>
        <Button variant="primary" type="button" onclick={saveEdit} disabled={savingEdit}>
          {savingEdit ? 'Saving...' : 'Save changes'}
        </Button>
        <Button variant="secondary" type="button" onclick={cancelEdit}>Cancel</Button>
      </ButtonRow>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
