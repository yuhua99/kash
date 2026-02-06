const USERNAME_RE = /^[A-Za-z0-9_-]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateUsername(value: string): string | null {
	if (value.length < 4 || value.length > 50) {
		return 'Username must be 4-50 characters.';
	}
	if (!USERNAME_RE.test(value)) {
		return 'Username allows letters, numbers, _ and - only.';
	}
	return null;
}

export function validatePassword(value: string): string | null {
	if (value.length < 6) {
		return 'Password must be at least 6 characters.';
	}
	return null;
}

export function validateCategoryName(value: string): string | null {
	if (value.length < 1 || value.length > 100) {
		return 'Category name must be 1-100 characters.';
	}
	return null;
}

export function validateRecordName(value: string): string | null {
	if (value.length < 1 || value.length > 255) {
		return 'Record name must be 1-255 characters.';
	}
	return null;
}

export function validateSearchTerm(value: string): string | null {
	if (value.length === 0) {
		return null;
	}

	if (value.length > 100) {
		return 'Search term must be 1-100 characters.';
	}

	return null;
}

export function validateDate(value: string): string | null {
	if (!ISO_DATE_RE.test(value)) {
		return 'Date must use YYYY-MM-DD.';
	}

	return null;
}

export function validateAmount(value: number): string | null {
	if (!Number.isFinite(value)) {
		return 'Amount must be a number.';
	}
	if (value === 0) {
		return 'Amount cannot be 0.';
	}
	return null;
}
