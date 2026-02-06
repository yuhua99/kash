import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
import type { User } from '$lib/types';

const API_BASE_URL = env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const PROTECTED_ROUTES = ['/home', '/records', '/categories', '/stats', '/settings'];
const AUTH_ROUTES = ['/login', '/register'];
const PUBLIC_ASSET_PATHS = new Set(['/favicon.ico', '/robots.txt']);

function matchesRoute(pathname: string, routes: string[]): boolean {
	return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isPublicAssetPath(pathname: string): boolean {
	return pathname.startsWith('/_app') || PUBLIC_ASSET_PATHS.has(pathname);
}

async function fetchSessionUser(cookieHeader: string): Promise<User | null> {
	if (!cookieHeader) {
		return null;
	}

	try {
		const response = await fetch(`${API_BASE_URL}/auth/me`, {
			headers: {
				cookie: cookieHeader,
				accept: 'application/json'
			}
		});

		if (!response.ok) {
			return null;
		}

		return (await response.json()) as User;
	} catch {
		return null;
	}
}

export const handle: Handle = async function handle({ event, resolve }): Promise<Response> {
	const { pathname } = event.url;

	if (isPublicAssetPath(pathname)) {
		return resolve(event);
	}

	event.locals.user = await fetchSessionUser(event.request.headers.get('cookie') ?? '');

	if (pathname === '/') {
		throw redirect(302, event.locals.user ? '/home' : '/login');
	}

	if (matchesRoute(pathname, PROTECTED_ROUTES) && !event.locals.user) {
		throw redirect(302, '/login');
	}

	if (matchesRoute(pathname, AUTH_ROUTES) && event.locals.user) {
		throw redirect(302, '/home');
	}

	return resolve(event);
};
