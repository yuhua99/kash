<script lang="ts">
  import { goto, invalidate } from '$app/navigation'
  import AuthForm from '$lib/features/auth/components/AuthForm.svelte'
  import { handleAuthSubmit } from '$lib/features/auth/form-submit'
  import { login } from '$lib/features/auth/api'
  import { invalidateCategoriesCache } from '$lib/features/categories/cache'

  let username = ''
  let password = ''
  let usernameError = ''
  let passwordError = ''
  let formError = ''
  let pending = false

  async function onSubmit(event: SubmitEvent): Promise<void> {
    await handleAuthSubmit({
      event,
      username,
      password,
      onValidSubmit: async (normalizedUsername, validPassword) => {
        await login(normalizedUsername, validPassword)
        invalidateCategoriesCache()
        await invalidate('app:auth')
        await goto('/home')
      },
      setUsernameError: (message) => {
        usernameError = message
      },
      setPasswordError: (message) => {
        passwordError = message
      },
      setFormError: (message) => {
        formError = message
      },
      setPending: (value) => {
        pending = value
      },
      fallbackErrorMessage: 'Unable to login.',
    })
  }
</script>

<AuthForm
  title="Welcome back"
  {formError}
  bind:username
  {usernameError}
  usernameId="login-username"
  bind:password
  {passwordError}
  passwordId="login-password"
  passwordAutocomplete="current-password"
  {pending}
  submitText="Sign in"
  pendingText="Signing in..."
  footerText="No account yet?"
  footerLinkText="Create one"
  footerHref="/register"
  {onSubmit}
/>
