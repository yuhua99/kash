<script lang="ts">
  import { goto, invalidate } from '$app/navigation'
  import AuthForm from '$lib/components/AuthForm.svelte'
  import { handleAuthSubmit } from '$lib/auth-form'
  import { login, register } from '$lib/api'
  import { invalidateCategoriesCache } from '$lib/category-cache'

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
        await register(normalizedUsername, validPassword)
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
      fallbackErrorMessage: 'Unable to register.',
    })
  }
</script>

<AuthForm
  title="Create account"
  {formError}
  bind:username
  {usernameError}
  usernameId="register-username"
  bind:password
  {passwordError}
  passwordId="register-password"
  passwordAutocomplete="new-password"
  {pending}
  submitText="Create account"
  pendingText="Creating account..."
  footerText="Already have an account?"
  footerLinkText="Sign in"
  footerHref="/login"
  {onSubmit}
/>
