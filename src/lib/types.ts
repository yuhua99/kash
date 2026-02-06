export type User = {
	id: string;
	username: string;
};

export type Category = {
	id: string;
	name: string;
	is_income: boolean;
};

export type RecordItem = {
	id: string;
	name: string;
	amount: number;
	category_id: string;
	date: string;
};

export type RecordsResponse = {
	records: RecordItem[];
	total_count: number;
};

export type CategoriesResponse = {
	categories: Category[];
	total_count: number;
	limit: number;
	offset: number;
};
