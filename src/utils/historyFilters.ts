import {
    normalizeAddress,
    TRANSACTION_STATUSES,
    TRANSACTION_TYPES,
    TransactionStatus,
    TransactionType,
} from "@asichain/asi-wallet-sdk";
import { Transaction } from "types/transactions";
import { getTokenDisplayName } from "constants/token";

interface IDurationPreset {
    id: string;
    label: string;
    durationMs: number;
}

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

export const DURATION_PRESETS: IDurationPreset[] = [
    { id: "1h", label: "Last 1H", durationMs: HOUR_IN_MS },
    { id: "24h", label: "Last 24H", durationMs: DAY_IN_MS },
    { id: "7d", label: "Last 7D", durationMs: 7 * DAY_IN_MS },
    { id: "30d", label: "Last 30D", durationMs: 30 * DAY_IN_MS },
    { id: "90d", label: "Last 90D", durationMs: 90 * DAY_IN_MS },
    { id: "180d", label: "Last 180D", durationMs: 180 * DAY_IN_MS },
];

interface IAmountPreset {
    id: string;
    label: string;
    min: number;
    max?: number;
    exclusiveMin?: boolean;
}

export const AMOUNT_PRESETS: IAmountPreset[] = [
    { id: "gt-min", label: ">0.00001", min: 0.00001, exclusiveMin: true },
    { id: "0-1", label: "0-1", min: 0, max: 1 },
    { id: "1-10", label: "1-10", min: 1, max: 10 },
    { id: "1-100", label: "1-100", min: 1, max: 100 },
    { id: "1-1k", label: "1-1K", min: 1, max: 1_000 },
    { id: "1-10k", label: "1-10K", min: 1, max: 10_000 },
    { id: "1-100k", label: "1-100K", min: 1, max: 100_000 },
    { id: "1-1m", label: "1-1M", min: 1, max: 1_000_000 },
];

const capitalize = (value: string): string =>
    `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const typeOptions = [
    { id: "all", value: "", label: "All types" },
    ...TRANSACTION_TYPES.map((type) => ({
        id: type,
        value: type,
        label: capitalize(type),
    })),
];

// Status options follow the SDK transaction contract, not the history source filter.
export const statusOptions = [
    { id: "all", value: "", label: "All statuses" },
    ...TRANSACTION_STATUSES.map((status) => ({
        id: status,
        value: status,
        label: capitalize(status),
    })),
];

export interface IRangeFilter {
    preset: string;
    from: string;
    to: string;
}

export interface IPanelFilters {
    type: TransactionType | "";
    status: TransactionStatus | "";
    date: IRangeFilter;
    from: string;
    to: string;
    amount: IRangeFilter;
    details: string;
}

export type TPanelFilterKey = keyof IPanelFilters;

export const HISTORY_FILTER_KEYS: TPanelFilterKey[] = [
    "date",
    "type",
    "status",
    "from",
    "to",
    "amount",
    "details",
];

export const HISTORY_FILTER_LABELS: Record<TPanelFilterKey, string> = {
    type: "Type",
    status: "Status",
    date: "Date",
    from: "From",
    to: "To",
    amount: "Amount",
    details: "Details",
};

const createEmptyRange = (): IRangeFilter => ({
    preset: "",
    from: "",
    to: "",
});

export const createEmptyPanelFilters = (): IPanelFilters => ({
    type: "",
    status: "",
    date: createEmptyRange(),
    from: "",
    to: "",
    amount: createEmptyRange(),
    details: "",
});

const parseNumericValue = (value: string): number | null => {
    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const parsed = Number(trimmed);

    return Number.isFinite(parsed) ? parsed : null;
};

interface IBounds {
    start?: number;
    end?: number;
}

const resolveDateBounds = (date: IRangeFilter, now: number): IBounds => {
    const preset = DURATION_PRESETS.find(({ id }) => id === date.preset);

    if (preset) {
        return { start: now - preset.durationMs, end: now };
    }

    const bounds: IBounds = {};
    const start = date.from ? new Date(`${date.from}T00:00:00`) : null;
    const end = date.to ? new Date(`${date.to}T23:59:59.999`) : null;

    if (start && !Number.isNaN(start.getTime())) {
        bounds.start = start.getTime();
    }

    if (end && !Number.isNaN(end.getTime())) {
        bounds.end = end.getTime();
    }

    return bounds;
};

export const isDateRangeInvalid = (date: IRangeFilter): boolean => {
    if (date.preset || !date.from || !date.to) {
        return false;
    }

    return new Date(date.from).getTime() > new Date(date.to).getTime();
};

interface IAmountFieldErrors {
    from: string;
    to: string;
}

export const getAmountFieldErrors = (amount: IRangeFilter): IAmountFieldErrors => {
    if (amount.preset) {
        return { from: "", to: "" };
    }

    const from = parseNumericValue(amount.from);
    const to = parseNumericValue(amount.to);
    let fromError = "";
    let toError = "";

    if (amount.from.trim() && from === null) {
        fromError = "Enter a valid amount.";
    } else if (from !== null && from < 0) {
        fromError = "Enter a valid amount.";
    }

    if (amount.to.trim() && to === null) {
        toError = "Enter a valid amount.";
    } else if (to !== null && to < 0) {
        toError = "Enter a valid amount.";
    }

    if (
        !fromError &&
        !toError &&
        from !== null &&
        to !== null &&
        from > to
    ) {
        toError = "The maximum must be greater than or equal to the minimum.";
    }

    return { from: fromError, to: toError };
};

export const isAmountRangeInvalid = (amount: IRangeFilter): boolean => {
    const { from, to } = getAmountFieldErrors(amount);

    return Boolean(from || to);
};

const matchesAmount = (
    transaction: Transaction,
    amount: IRangeFilter,
): boolean => {
    const value = parseNumericValue(transaction.amount ?? "");
    const preset = AMOUNT_PRESETS.find(({ id }) => id === amount.preset);

    if (preset) {
        if (value === null) return false;
        if (preset.exclusiveMin ? value <= preset.min : value < preset.min) {
            return false;
        }

        return preset.max === undefined || value <= preset.max;
    }

    const from = parseNumericValue(amount.from);
    const to = parseNumericValue(amount.to);

    if (from === null && to === null) {
        return true;
    }

    if (value === null) return false;
    if (from !== null && value < from) return false;
    return to === null || value <= to;
};

export const describeDateFilter = (date: IRangeFilter): string | undefined => {
    const preset = DURATION_PRESETS.find(({ id }) => id === date.preset);

    if (preset) {
        return preset.label;
    }

    if (date.from && date.to) return `${date.from} – ${date.to}`;
    if (date.from) return `From ${date.from}`;
    if (date.to) return `To ${date.to}`;

    return undefined;
};

export const describeAmountFilter = (amount: IRangeFilter): string | undefined => {
    const preset = AMOUNT_PRESETS.find(({ id }) => id === amount.preset);

    if (preset) {
        return `${preset.label} ${getTokenDisplayName()}`;
    }

    const from = amount.from.trim();
    const to = amount.to.trim();

    if (from && to) return `${from} – ${to} ${getTokenDisplayName()}`;
    if (from) return `From ${from} ${getTokenDisplayName()}`;
    if (to) return `To ${to} ${getTokenDisplayName()}`;

    return undefined;
};

export const describeTypeFilter = (type: TransactionType | ""): string =>
    type ? capitalize(type) : "All types";

export const describeStatusFilter = (status: TransactionStatus | ""): string =>
    status ? capitalize(status) : "All statuses";

export const hasRangeValue = (range: IRangeFilter): boolean =>
    Boolean(range.preset || range.from.trim() || range.to.trim());

export const hasActiveFilters = (filters: IPanelFilters): boolean =>
    Boolean(filters.type) ||
    Boolean(filters.status) ||
    hasRangeValue(filters.date) ||
    hasRangeValue(filters.amount) ||
    Boolean(filters.from.trim()) ||
    Boolean(filters.to.trim()) ||
    Boolean(filters.details.trim());

export const filterTransactions = (
    transactions: Transaction[],
    filters: IPanelFilters,
    now: number,
): Transaction[] => {
    const dateBounds = resolveDateBounds(filters.date, now);
    const fromQuery = normalizeAddress(filters.from);
    const toQuery = normalizeAddress(filters.to);
    const detailsQuery = filters.details.trim().toLowerCase();
    const hasAmountFilter = hasRangeValue(filters.amount);

    return transactions.filter((transaction) => {
        if (filters.type && transaction.type !== filters.type) {
            return false;
        }
        if (filters.status && transaction.status !== filters.status) {
            return false;
        }

        const timestamp = new Date(transaction.timestamp).getTime();

        if (dateBounds.start !== undefined || dateBounds.end !== undefined) {
            if (Number.isNaN(timestamp)) return false;
            if (dateBounds.start !== undefined && timestamp < dateBounds.start) {
                return false;
            }
            if (dateBounds.end !== undefined && timestamp > dateBounds.end) {
                return false;
            }
        }

        if (fromQuery && !normalizeAddress(transaction.from).includes(fromQuery)) {
            return false;
        }

        if (toQuery && !normalizeAddress(transaction.to).includes(toQuery)) {
            return false;
        }

        if (
            detailsQuery &&
            !(transaction.deployId ?? "").toLowerCase().includes(detailsQuery)
        ) {
            return false;
        }

        return !hasAmountFilter ? true : matchesAmount(transaction, filters.amount);
    });
};

export const getNextDatePresetBoundary = (
    transactions: Transaction[],
    presetId: string,
    now: number,
): number | null => {
    const preset = DURATION_PRESETS.find(({ id }) => id === presetId);

    if (!preset) {
        return null;
    }

    let nextBoundary = Number.POSITIVE_INFINITY;

    transactions.forEach(({ timestamp }) => {
        const transactionTime = new Date(timestamp).getTime();
        if (Number.isNaN(transactionTime)) return;

        const boundary =
            transactionTime > now
                ? transactionTime
                : transactionTime + preset.durationMs + 1;
        if (boundary > now && boundary < nextBoundary) {
            nextBoundary = boundary;
        }
    });

    return Number.isFinite(nextBoundary) ? nextBoundary : null;
};
