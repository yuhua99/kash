<script lang="ts">
  import type { DateValue } from '@internationalized/date'
  import { DatePicker, Dialog } from 'bits-ui'
  import Button from '$lib/ui/Button.svelte'
  import ButtonRow from '$lib/ui/ButtonRow.svelte'
  import SelectField from '$lib/ui/SelectField.svelte'
  import '$lib/ui/Control.css'
  import '$lib/ui/DatePicker.css'
  import '$lib/ui/Dialog.css'

  type SelectOption = {
    value: string
    label: string
  }

  export let editDialogOpen = false
  export let onEditDialogOpenChange: (nextOpen: boolean) => void
  export let editRecordName = ''
  export let editName = ''
  export let editNameError = ''
  export let editAmountInput = ''
  export let editAmountError = ''
  export let editCategoryId = ''
  export let editCategoryLabel = ''
  export let editCategoryItems: SelectOption[] = []
  export let editCategoryError = ''
  export let editDateValue: DateValue | undefined
  export let editDate = ''
  export let editDateError = ''
  export let onEditCategoryChange: (value: string) => void
  export let onEditDateChange: (value: DateValue | undefined) => void
  export let saveEdit: () => void | Promise<void>
  export let cancelEdit: () => void
  export let savingEdit = false
</script>

<Dialog.Root open={editDialogOpen} onOpenChange={onEditDialogOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="dialog-overlay" />
    <Dialog.Content class="dialog-content">
      <Dialog.Title>Edit record</Dialog.Title>
      <Dialog.Description>
        {editRecordName ? `Update "${editRecordName}".` : 'Update selected record.'}
      </Dialog.Description>

      <div>
        <label for="edit-record-name">Name</label>
        <input id="edit-record-name" type="text" bind:value={editName} />
        {#if editNameError}
          <p role="alert">{editNameError}</p>
        {/if}
      </div>

      <div>
        <label for="edit-record-amount">Amount</label>
        <input id="edit-record-amount" type="number" step="0.01" bind:value={editAmountInput} />
        {#if editAmountError}
          <p role="alert">{editAmountError}</p>
        {/if}
      </div>

      <div>
        <label for="edit-record-category">Category</label>
        <SelectField
          id="edit-record-category"
          value={editCategoryId}
          label={editCategoryLabel}
          items={editCategoryItems}
          onValueChange={onEditCategoryChange}
        />
        {#if editCategoryError}
          <p role="alert">{editCategoryError}</p>
        {/if}
      </div>

      <div>
        <label for="edit-record-date">Date</label>
        <DatePicker.Root value={editDateValue} onValueChange={onEditDateChange}>
          <DatePicker.Trigger class="control" id="edit-record-date" type="button">
            {editDate || 'Pick a date'}
          </DatePicker.Trigger>
          <DatePicker.Portal>
            <DatePicker.Content class="date-popover" sideOffset={6} align="start">
              <DatePicker.Calendar class="date-calendar">
                {#snippet children({ months, weekdays })}
                  <DatePicker.Header>
                    <DatePicker.PrevButton aria-label="Previous month">Prev</DatePicker.PrevButton>
                    <DatePicker.Heading />
                    <DatePicker.NextButton aria-label="Next month">Next</DatePicker.NextButton>
                  </DatePicker.Header>
                  <div>
                    {#each months as month (month.value.toString())}
                      <DatePicker.Grid>
                        <DatePicker.GridHead>
                          <DatePicker.GridRow>
                            {#each weekdays as day}
                              <DatePicker.HeadCell>{day}</DatePicker.HeadCell>
                            {/each}
                          </DatePicker.GridRow>
                        </DatePicker.GridHead>
                        <DatePicker.GridBody>
                          {#each month.weeks as weekDates}
                            <DatePicker.GridRow>
                              {#each weekDates as calendarDate}
                                <DatePicker.Cell date={calendarDate} month={month.value}>
                                  <DatePicker.Day>{calendarDate.day}</DatePicker.Day>
                                </DatePicker.Cell>
                              {/each}
                            </DatePicker.GridRow>
                          {/each}
                        </DatePicker.GridBody>
                      </DatePicker.Grid>
                    {/each}
                  </div>
                {/snippet}
              </DatePicker.Calendar>
            </DatePicker.Content>
          </DatePicker.Portal>
        </DatePicker.Root>
        {#if editDateError}
          <p role="alert">{editDateError}</p>
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
