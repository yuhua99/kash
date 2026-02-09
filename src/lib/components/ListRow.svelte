<script lang="ts">
	export let type: 'income' | 'expense' | undefined = undefined;
</script>

<article data-type={type}>
	{#if $$slots.main || $$slots.end}
		<div>
			<slot name="main" />
			{#if $$slots.end}
				<div>
					<slot name="end" />
				</div>
			{/if}
		</div>
	{/if}
	{#if $$slots.sub}
		<div>
			<slot name="sub" />
		</div>
	{/if}
	<slot />
</article>
