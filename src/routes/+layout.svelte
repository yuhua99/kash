<script lang="ts">
	import { goto } from '$app/navigation';
	import '../app.css';
	import { page } from '$app/stores';
	import { Menubar } from 'bits-ui';

	export let data: App.PageData;

	const navItems = [
		{ href: '/home', label: 'Home' },
		{ href: '/records', label: 'Records' },
		{ href: '/categories', label: 'Categories' },
		{ href: '/stats', label: 'Stats' },
		{ href: '/settings', label: 'Settings' }
	];

	const authRoutes = new Set(['/login', '/register']);

	function isActive(pathname: string, href: string): boolean {
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	function createNavClickHandler(href: string): () => void {
		return function handleNavClick(): void {
			void goto(href);
		};
	}
</script>

<svelte:head>
	<title>Kash</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
</svelte:head>

<div>
	{#if data.user && !authRoutes.has($page.url.pathname)}
		<Menubar.Root aria-label="Primary">
			<div aria-label="Brand">kash!</div>
			{#each navItems as item}
				<Menubar.Menu value={item.href}>
				<Menubar.Trigger
				
					onclick={createNavClickHandler(item.href)}
				>
					{item.label}
				</Menubar.Trigger>
				</Menubar.Menu>
			{/each}
		</Menubar.Root>
	{/if}

	<slot />
</div>
