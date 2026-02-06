import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = function load({ locals }) {
	return {
		user: locals.user
	};
};
