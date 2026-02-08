<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from 'bits-ui';
	import { login, register } from '$lib/api';
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
			await register(normalizedUsername, password);
			await login(normalizedUsername, password);
			await goto('/home');
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Unable to register.';
		} finally {
			pending = false;
		}
	}
</script>

<main class="page-card">
	<header class="stack">
		<p class="meta-text">Create account</p>
	</header>

	{#if formError}
		<p class="error-banner" role="alert">{formError}</p>
	{/if}

	<form class="stack" on:submit={onSubmit} novalidate>
		<div class="field">
			<label class="field-label" for="register-username">Username</label>
			<input
				id="register-username"
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
			<label class="field-label" for="register-password">Password</label>
			<input
				id="register-password"
				name="password"
				type="password"
				autocomplete="new-password"
				class="text-input"
				bind:value={password}
				required
			/>
			{#if passwordError}
				<p class="field-error" role="alert">{passwordError}</p>
			{/if}
		</div>

		<Button.Root class="button primary" type="submit" disabled={pending}>
			{pending ? 'Creating account...' : 'Create account'}
		</Button.Root>
	</form>

	<p>
		Already have an account?
		<a href="/login" class="inline-link">Sign in</a>
	</p>
</main>
