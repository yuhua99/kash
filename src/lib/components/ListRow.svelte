<script lang="ts">
	export let type: 'income' | 'expense' | undefined = undefined;
</script>

<article class="record-row" data-type={type}>
	{#if $$slots.main || $$slots.end}
		<div class="record-main">
			<slot name="main" />
			{#if $$slots.end}
				<div class="record-end">
					<slot name="end" />
				</div>
			{/if}
		</div>
	{/if}
	{#if $$slots.sub}
		<div class="record-sub">
			<slot name="sub" />
		</div>
	{/if}
	<slot />
</article>
