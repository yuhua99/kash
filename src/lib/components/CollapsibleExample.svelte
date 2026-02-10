<script lang="ts">
  import { Collapsible } from 'bits-ui'

  let demoOpen = false

  function handleOpenChange(nextOpen: boolean): void {
    demoOpen = nextOpen
  }
</script>

<section>
  <Collapsible.Root bind:open={demoOpen} onOpenChange={handleOpenChange}>
    <Collapsible.Trigger aria-label="Toggle weekly tip">
      <span>Weekly tip</span>
      <span aria-hidden="true">
        {demoOpen ? '▴' : '▾'}
      </span>
    </Collapsible.Trigger>

    <Collapsible.Content forceMount hiddenUntilFound>
      <p>
        Use the collapsible to surface secondary actions without adding layout weight. The trigger
        flips the chevron by reacting to the `data-state` attribute that Bits UI exposes on each
        primitive.
      </p>
      <p>
        The `onOpenChange` callback is useful for syncing the open state with Svelte stores or other
        UI.
      </p>
    </Collapsible.Content>
  </Collapsible.Root>
</section>
