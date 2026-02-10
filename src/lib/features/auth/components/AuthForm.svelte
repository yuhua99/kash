<script lang="ts">
  import Button from '$lib/ui/Button.svelte'

  export let title: string
  export let formError = ''
  export let username = ''
  export let usernameError = ''
  export let usernameId: string
  export let password = ''
  export let passwordError = ''
  export let passwordId: string
  export let passwordAutocomplete: 'current-password' | 'new-password'
  export let pending = false
  export let submitText: string
  export let pendingText: string
  export let footerText: string
  export let footerLinkText: string
  export let footerHref: string
  export let onSubmit: (event: SubmitEvent) => void | Promise<void>
</script>

<main>
  <header>
    <p>{title}</p>
  </header>

  {#if formError}
    <p role="alert">{formError}</p>
  {/if}

  <form on:submit={onSubmit} novalidate>
    <div>
      <label for={usernameId}>Username</label>
      <input
        id={usernameId}
        name="username"
        type="text"
        autocomplete="username"
        bind:value={username}
        required
      />
      {#if usernameError}
        <p role="alert">{usernameError}</p>
      {/if}
    </div>

    <div>
      <label for={passwordId}>Password</label>
      <input
        id={passwordId}
        name="password"
        type="password"
        autocomplete={passwordAutocomplete}
        bind:value={password}
        required
      />
      {#if passwordError}
        <p role="alert">{passwordError}</p>
      {/if}
    </div>

    <Button variant="primary" type="submit" disabled={pending}>
      {pending ? pendingText : submitText}
    </Button>
  </form>

  <p>
    {footerText}
    <a href={footerHref}>{footerLinkText}</a>
  </p>
</main>
