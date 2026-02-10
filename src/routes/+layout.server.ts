import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = function load({ locals, depends }) {
	depends('app:auth');

	return {
		user: locals.user
	};
};
