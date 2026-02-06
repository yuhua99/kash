<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from 'bits-ui';
	import { logout } from '$lib/api';

	export let data: App.PageData;

	let pending = false;
	let formError = '';

	async function onLogout(): Promise<void> {
		pending = true;
		formError = '';

		try {
			await logout();
			await goto('/login');
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Unable to logout.';
		} finally {
			pending = false;
		}
	}
</script>

<main class="page-card" aria-labelledby="settings-title">
	<header class="stack">
		<p class="meta-text">Settings</p>
		<h1 id="settings-title">Account and session</h1>
		<p>Keep things simple: review account identity and end your current session securely.</p>
	</header>

	<div class="record-row">
		<div class="record-main">
			<strong>Username</strong>
			<span class="meta-text">{data.user?.username ?? 'Unknown'}</span>
		</div>
	</div>

	{#if formError}
		<p class="error-banner" role="alert">{formError}</p>
	{/if}

	<Button.Root class="button danger" type="button" onclick={onLogout} disabled={pending}>
		{pending ? 'Signing out...' : 'Log out'}
	</Button.Root>
</main>
