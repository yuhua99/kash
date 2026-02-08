<script lang="ts">
  import { Collapsible } from 'bits-ui';

  let demoOpen = false;

  function handleOpenChange(nextOpen: boolean): void {
    demoOpen = nextOpen;
  }
</script>

<section class="collapsible-root">
  <Collapsible.Root
    bind:open={demoOpen}
    onOpenChange={handleOpenChange}
    class="collapsible"
  >
    <Collapsible.Trigger class="collapsible-trigger" aria-label="Toggle weekly tip">
      <span>Weekly tip</span>
      <span class={`collapsible-icon ${demoOpen ? 'open' : ''}`} aria-hidden="true">
        {demoOpen ? '▴' : '▾'}
      </span>
    </Collapsible.Trigger>

    <Collapsible.Content
      class="collapsible-content"
      forceMount
      hiddenUntilFound
    >
      <p>
        Use the collapsible to surface secondary actions without adding layout weight. The
        trigger flips the chevron by reacting to the `data-state` attribute that Bits UI exposes on
        each primitive.
      </p>
      <p>The `onOpenChange` callback is useful for syncing the open state with Svelte stores or other UI.</p>
    </Collapsible.Content>
  </Collapsible.Root>
</section>

<style>
  .collapsible-root {
    width: min(420px, 100%);
    margin: 0 auto;
    border: 1px solid var(--border, #cfcfcf);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    padding: 0.5rem;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  }

  .collapsible-trigger {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    background: transparent;
    border: 0;
    padding: 0.75rem 1rem;
    font-weight: 700;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    color: var(--ink, #0a0a0a);
    border-radius: 10px;
    border: 2px solid transparent;
  }

  :global(.collapsible-trigger[data-state='open']) {
    background: var(--panel-strong, #ededed);
    border-color: var(--accent-ink, #000);
  }

  .collapsible-icon {
    font-size: 1.25rem;
    transition: transform 120ms ease;
  }

  .collapsible-icon.open {
    transform: rotate(180deg);
  }

  .collapsible-content {
    padding: 0 1rem 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--ink-muted, #575757);
    background: rgba(255, 255, 255, 0.92);
    border-radius: 0 0 10px 10px;
  }

  :global(.collapsible-content p + p) {
    margin-top: 0.5rem;
  }
</style>
