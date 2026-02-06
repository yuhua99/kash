import type { CategoriesResponse, Category, RecordItem, RecordsResponse, User } from '$lib/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const JSON_CONTENT_TYPE = 'application/json';

type ApiError = Error & { status?: number };
type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RecordQueryParams = {
	start_date?: string;
	end_date?: string;
	limit?: number;
	offset?: number;
};

type CategoryQueryParams = {
	limit?: number;
	offset?: number;
	search?: string;
};

type CreateRecordPayload = {
	name: string;
	amount: number;
	category_id: string;
	date: string;
};

type UpdateRecordPayload = Partial<CreateRecordPayload>;

type CreateCategoryPayload = {
	name: string;
	is_income: boolean;
};

type UpdateCategoryPayload = {
	name: string;
};

type RequestOptions = {
	method?: RequestMethod;
	body?: unknown;
};

async function getApiErrorMessage(response: Response): Promise<string | null> {
	try {
		const parsed = (await response.json()) as { message?: string; error?: string };
		return parsed.message ?? parsed.error ?? null;
	} catch {
		return null;
	}
}

function withQuery(path: string, query: URLSearchParams): string {
	const queryString = query.toString();
	if (!queryString) {
		return path;
	}

	return `${path}?${queryString}`;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: options.method ?? 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': JSON_CONTENT_TYPE
		},
		body: options.body ? JSON.stringify(options.body) : undefined
	});

	if (!response.ok) {
		const fallbackMessage = `Request failed (${response.status})`;
		const message = (await getApiErrorMessage(response)) ?? fallbackMessage;
		const error = new Error(message) as ApiError;
		error.status = response.status;
		throw error;
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

export async function getMe(fetchImpl: typeof fetch = fetch): Promise<User | null> {
	const response = await fetchImpl(`${API_BASE_URL}/auth/me`, {
		credentials: 'include'
	});
	if (response.status === 401) {
		return null;
	}
	if (!response.ok) {
		throw new Error('Unable to verify session.');
	}
	return response.json() as Promise<User>;
}

export function register(username: string, password: string): Promise<User> {
	return apiRequest<User>('/auth/register', {
		method: 'POST',
		body: { username, password }
	});
}

export function login(username: string, password: string): Promise<User> {
	return apiRequest<User>('/auth/login', {
		method: 'POST',
		body: { username, password }
	});
}

export function logout(): Promise<void> {
	return apiRequest<void>('/auth/logout', {
		method: 'POST'
	});
}

export function getRecords(params: RecordQueryParams): Promise<RecordsResponse> {
	const query = new URLSearchParams();
	if (params.start_date) query.set('start_date', params.start_date);
	if (params.end_date) query.set('end_date', params.end_date);
	if (params.limit !== undefined) query.set('limit', String(params.limit));
	if (params.offset !== undefined) query.set('offset', String(params.offset));
	return apiRequest<RecordsResponse>(withQuery('/records', query));
}

export function createRecord(body: CreateRecordPayload): Promise<RecordItem> {
	return apiRequest<RecordItem>('/records', {
		method: 'POST',
		body
	});
}

export function updateRecord(id: string, body: UpdateRecordPayload): Promise<RecordItem> {
	return apiRequest<RecordItem>(`/records/${id}`, {
		method: 'PUT',
		body
	});
}

export function deleteRecord(id: string): Promise<void> {
	return apiRequest<void>(`/records/${id}`, {
		method: 'DELETE'
	});
}

export function getCategories(params: CategoryQueryParams = {}): Promise<CategoriesResponse> {
	const query = new URLSearchParams();
	if (params.search) query.set('search', params.search);
	if (params.limit !== undefined) query.set('limit', String(params.limit));
	if (params.offset !== undefined) query.set('offset', String(params.offset));
	return apiRequest<CategoriesResponse>(withQuery('/categories', query));
}

export function createCategory(body: CreateCategoryPayload): Promise<Category> {
	return apiRequest<Category>('/categories', {
		method: 'POST',
		body
	});
}

export function updateCategory(id: string, body: UpdateCategoryPayload): Promise<Category> {
	return apiRequest<Category>(`/categories/${id}`, {
		method: 'PUT',
		body
	});
}

export function deleteCategory(id: string): Promise<void> {
	return apiRequest<void>(`/categories/${id}`, {
		method: 'DELETE'
	});
}
