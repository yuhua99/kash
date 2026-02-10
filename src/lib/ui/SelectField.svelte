<script lang="ts">
  import { Select } from 'bits-ui'
  import './SelectField.css'

  type SelectFieldItem = {
    value: string
    label: string
    disabled?: boolean
  }

  export let id: string
  export let value: string
  export let label: string
  export let items: SelectFieldItem[] = []
  export let disabled = false
  export let align: 'start' | 'center' | 'end' = 'start'
  export let sideOffset = 6
  export let onValueChange: (value: string) => void = () => {}
</script>

<Select.Root type="single" {value} {disabled} {onValueChange}>
  <Select.Trigger class="select-trigger" {id}>
    <span class="select-trigger__label">{label}</span>
  </Select.Trigger>
  <Select.Portal>
    <Select.Content class="select-content" {sideOffset} {align}>
      <Select.Viewport class="select-viewport">
        {#each items as item (item.value)}
          <Select.Item
            class="select-item"
            value={item.value}
            label={item.label}
            disabled={item.disabled}
          >
            <span class="select-item__label">{item.label}</span>
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
