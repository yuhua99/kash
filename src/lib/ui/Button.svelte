<script lang="ts">
  import { Button as BitsButton } from 'bits-ui'
  import './Button.css'

  export let variant: 'default' | 'primary' | 'secondary' | 'destructive' = 'default'
  export let size: 'default' | 'compact' = 'default'
  export let type: 'button' | 'submit' = 'button'
  export let disabled = false
  export let className = ''

  $: variantClass = variant === 'default' ? '' : `btn--${variant}`
  $: sizeClass = size === 'compact' ? 'btn--compact' : ''
  $: resolvedClass = `btn ${variantClass} ${sizeClass} ${className}`.trim()
</script>

<BitsButton.Root {type} {disabled} class={resolvedClass} {...$$restProps}>
  <slot />
</BitsButton.Root>
