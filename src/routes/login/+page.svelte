<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from 'bits-ui';
	import { login } from '$lib/api';
	import { validatePassword, validateUsername } from '$lib/validation';

	let username = '';
	let password = '';
	let usernameError = '';
	let passwordError = '';
	let formError = '';
	let pending = false;

	async function onSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		usernameError = '';
		passwordError = '';
		formError = '';

		const normalizedUsername = username.trim();
		const usernameValidation = validateUsername(normalizedUsername);
		const passwordValidation = validatePassword(password);

		if (usernameValidation) {
			usernameError = usernameValidation;
		}

		if (passwordValidation) {
			passwordError = passwordValidation;
		}

		if (usernameError || passwordError) {
			return;
		}

		pending = true;
		try {
			await login(normalizedUsername, password);
			await goto('/home');
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Unable to login.';
		} finally {
			pending = false;
		}
	}
</script>

<main class="page-card">
	<header class="stack">
		<p class="meta-text">Welcome back</p>
	</header>

	{#if formError}
		<p class="error-banner" role="alert">{formError}</p>
	{/if}

	<form class="stack" on:submit={onSubmit} novalidate>
		<div class="field">
			<label class="field-label" for="login-username">Username</label>
			<input
				id="login-username"
				name="username"
				type="text"
				autocomplete="username"
				class="text-input"
				bind:value={username}
				required
			/>
			{#if usernameError}
				<p class="field-error" role="alert">{usernameError}</p>
			{/if}
		</div>

		<div class="field">
			<label class="field-label" for="login-password">Password</label>
			<input
				id="login-password"
				name="password"
				type="password"
				autocomplete="current-password"
				class="text-input"
				bind:value={password}
				required
			/>
			{#if passwordError}
				<p class="field-error" role="alert">{passwordError}</p>
			{/if}
		</div>

		<Button.Root class="button primary" type="submit" disabled={pending}>
			{pending ? 'Signing in...' : 'Sign in'}
		</Button.Root>
	</form>

	<p>
		No account yet?
		<a href="/register" class="inline-link">Create one</a>
	</p>
</main>
