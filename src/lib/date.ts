export type PeriodPreset = 'month' | 'year' | 'custom';

type PeriodOptions = {
	year?: number;
	month?: number;
	start?: string;
	end?: string;
};

type PeriodRange = {
	start: string;
	end: string;
};

function toIsoDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function capAtTodayIso(value: string): string {
	if (!value) {
		return '';
	}

	const today = todayIso();
	return value > today ? today : value;
}

export function todayIso(): string {
	return toIsoDateLocal(new Date());
}

export function periodFromPreset(preset: PeriodPreset, options: PeriodOptions = {}): PeriodRange {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth();

	switch (preset) {
		case 'month': {
			const year = options.year ?? currentYear;
			const selectedMonth = options.month ?? currentMonth + 1;
			const monthIndex = selectedMonth - 1;
			const start = toIsoDateLocal(new Date(year, monthIndex, 1));
			const end = capAtTodayIso(toIsoDateLocal(new Date(year, monthIndex + 1, 0)));
			return { start, end };
		}

		case 'year': {
			const year = options.year ?? currentYear;
			const start = toIsoDateLocal(new Date(year, 0, 1));
			const end = capAtTodayIso(toIsoDateLocal(new Date(year, 11, 31)));
			return { start, end };
		}

		default:
			return {
				start: options.start ?? '',
				end: capAtTodayIso(options.end ?? '')
			};
	}
}
