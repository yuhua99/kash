<script lang="ts">
  export let type: 'income' | 'expense' | undefined = undefined
</script>

<article class="list-row" data-type={type}>
  {#if $$slots.main || $$slots.end}
    <div class="list-row-main">
      <slot name="main" />
      {#if $$slots.end}
        <div class="list-row-end">
          <slot name="end" />
        </div>
      {/if}
    </div>
  {/if}
  {#if $$slots.sub}
    <div class="list-row-sub">
      <slot name="sub" />
    </div>
  {/if}
  <slot />
</article>
