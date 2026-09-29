import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
    normalizeAddress,
    TRANSACTION_STATUSES,
    TRANSACTION_TYPES,
    TransactionStatus,
    TransactionType,
} from "@asichain/asi-wallet-sdk";
import { RootState } from "store";
import {
    selectIsAccountUnlocked,
    selectSelectedAccount,
    selectSelectedNetworkId,
} from "store/WalletsStore/";
import {
    IHistoryQueryArgs,
    useGetTransactionHistoryQuery,
} from "store/WalletsStore/api";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    ModalWindow,
    VisuallyHidden,
} from "components";
import { Transaction } from "types/transactions";
import { DownloadIcon } from "components/Icons";
import CopyButton from "components/CopyButton";
import { AdaptivePanel } from "components/Panel";
import { Search } from "components/Search";
import { AccountSelector } from "components/AccountSelector";
import {
    ACCOUNT_DATA_POLLING_INTERVAL_MS,
    ACCOUNT_DATA_POLLING_INTERVAL_SECONDS,
} from "constants/polling";
import { getTokenDisplayName } from "constants/token";
import { useScreen } from "hooks";
import { formatTransactionAmount } from "utils/transactionUtils";

const HistoryContainer = styled.div`
    max-width: ${({ theme }) => theme.layout.contentWide};
    margin: 0 auto;
`;

const AccountBar = styled.div`
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.xl};
    margin-bottom: ${({ theme }) => theme.spacing["3xl"]};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
        align-items: stretch;
        gap: ${({ theme }) => theme.spacing.lg};
    }
`;

const AccountBarActions = styled.div`
    display: flex;
    align-items: flex-end;
    padding-bottom: 1px;
`;

const MobileFilterBar = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.lg};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const DetailField = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.xxs};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    min-width: 0;
`;

const DetailFieldLabel = styled.span`
    color: ${({ theme }) => theme.text.secondary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
`;

const RowActionButton = styled(Button)`
    min-width: 0;
    padding-inline: ${({ theme }) => theme.spacing.md};
`;

const FilterPanelTitle = styled.span`
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.text.secondary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
`;

const PresetGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${({ theme }) => theme.spacing.md};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const PresetButton = styled(Button)`
    min-width: 0;
`;

const OptionList = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
`;

const PanelActions = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing.lg};
    margin-top: ${({ theme }) => theme.spacing.xl};

    > * {
        flex: 1;
    }
`;

const TransactionTable = styled.div`
    overflow-x: auto;
    margin-bottom: ${({ theme }) => theme.spacing["3xl"]};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: ${({ theme }) => theme.radii.md};

    @media (min-width: 1025px) {
        overflow-x: hidden;
    }
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;

    @media (max-width: ${({ theme }) => theme.breakpoints.laptop}) {
        table-layout: auto;
    }
`;

const TableHeader = styled.thead`
    border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
    border-bottom: 1px solid ${({ theme }) => theme.border};

    &:last-child {
        border-bottom: 0;
    }

    &:hover {
        background: ${({ theme }) => theme.hoverSurface};
    }
`;

const TableCell = styled.td`
    padding: ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.text.primary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    font-weight: ${({ theme }) => theme.typography.weight.regular};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
    vertical-align: top;
`;

const TableHeaderCell = styled.th`
    padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
    color: ${({ theme }) => theme.text.secondary};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.sm};
    font-weight: ${({ theme }) => theme.typography.weight.medium};
    line-height: ${({ theme }) => theme.typography.lineHeight.sm};
    text-align: left;
    vertical-align: bottom;
`;

const DateValue = styled.time`
    color: ${({ theme }) => theme.text.secondary};
`;

const TimeValue = styled.time`
    display: block;
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
`;

const StatusBadge = styled.span<{ $status: TransactionStatus }>`
    display: inline-block;
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
    border-radius: ${({ theme }) => theme.radii.xs};
    background: ${({ $status, theme }) =>
        $status === "completed"
            ? theme.primarySubtle
            : $status === "failed"
              ? `${theme.danger}1F`
              : `${theme.warning}1F`};
    color: ${({ $status, theme }) =>
        $status === "completed"
            ? theme.actionText
            : $status === "failed"
              ? theme.dangerText
              : theme.warningText};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
    text-transform: capitalize;
`;

const TypeBadge = styled.span<{ $type: TransactionType }>`
    display: inline-block;
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
    border-radius: ${({ theme }) => theme.radii.xs};
    background: ${({ $type, theme }) =>
        $type === "deploy" ? `${theme.info}1F` : theme.primarySubtle};
    color: ${({ $type, theme }) =>
        $type === "deploy" ? theme.infoText : theme.actionText};
    font-family: ${({ theme }) => theme.typography.controlFontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    font-weight: ${({ theme }) => theme.typography.weight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
    text-transform: capitalize;
`;

// The full value stays in the DOM so it can be selected and copied while the cell shortens it.
const MonoValue = styled.span`
    display: block;
    min-width: 0;
    overflow: hidden;
    color: ${({ theme }) => theme.text.secondary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: text;
`;

const DetailsCell = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};
    min-width: 0;

    ${MonoValue} {
        flex: 1;
    }

    .copy-container {
        display: inline-flex;
        flex: none;
    }

    .copy-button,
    .copy-button:hover {
        position: static;
        transform: none;
    }
`;

const EmptyState = styled.div`
    padding: ${({ theme }) => theme.spacing["6xl"]} ${({ theme }) => theme.spacing["3xl"]};
    color: ${({ theme }) => theme.text.secondary};
    text-align: center;
`;

const ErrorMessage = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    padding: ${({ theme }) => theme.spacing.lg};
    border: 1px solid ${({ theme }) => `${theme.danger}40`};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => `${theme.danger}1F`};
    color: ${({ theme }) => theme.dangerText};
    font-size: ${({ theme }) => theme.typography.size.sm};
    line-height: ${({ theme }) => theme.typography.lineHeight.md};
`;

const RefreshText = styled.div`
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: ${({ theme }) => theme.spacing.xs};
    color: ${({ theme }) => theme.textSecondaryAdditional};
    line-height: 1.4;
`;

const RefreshTextLine = styled.span`
    font-size: ${({ theme }) => theme.typography.size.xs};
    white-space: nowrap;
`;

const RefreshSpinner = styled.span`
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: ${({ theme }) => theme.spacing.sm};
    vertical-align: middle;
    border: 1px solid ${({ theme }) => theme.primary};
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

const ExportButtonsWrapper = styled.div`
    display: flex;
`;

const ExportButton = styled(Button)`
    padding: 10px 24px;
    width: 100%;
`;

interface IDurationPreset {
    id: string;
    label: string;
    durationMs: number;
}

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

const DURATION_PRESETS: IDurationPreset[] = [
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

const AMOUNT_PRESETS: IAmountPreset[] = [
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

const typeOptions = [
    { id: "all", value: "", label: "All types" },
    ...TRANSACTION_TYPES.map((type) => ({
        id: type,
        value: type,
        label: capitalize(type),
    })),
];

// Status options follow the SDK transaction contract, not the history source filter.
const statusOptions = [
    { id: "all", value: "", label: "All statuses" },
    ...TRANSACTION_STATUSES.map((status) => ({
        id: status,
        value: status,
        label: capitalize(status),
    })),
];

interface IRangeFilter {
    preset: string;
    from: string;
    to: string;
}

interface IPanelFilters {
    type: TransactionType | "";
    status: TransactionStatus | "";
    date: IRangeFilter;
    from: string;
    to: string;
    amount: IRangeFilter;
    details: string;
}

type TPanelFilterKey = keyof IPanelFilters;

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

const EMPTY_TRANSACTIONS: Transaction[] = [];

const HISTORY_UNAVAILABLE_ERROR =
    "Failed to load transaction history for the selected network.";

const HISTORY_REFRESH_ERROR =
    "Could not refresh. Showing the last loaded transactions.";

const formatDateParts = (
    timestamp: string,
): { dateTime?: string; date: string; time: string } => {
    const parsed = new Date(timestamp);

    return Number.isNaN(parsed.getTime())
        ? { date: "—", time: "" }
        : {
              dateTime: parsed.toISOString(),
              date: parsed.toLocaleDateString(),
              time: parsed.toLocaleTimeString(),
          };
};

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

const isDateRangeInvalid = (date: IRangeFilter): boolean => {
    if (date.preset || !date.from || !date.to) {
        return false;
    }

    return new Date(date.from).getTime() > new Date(date.to).getTime();
};

interface IAmountFieldErrors {
    from: string;
    to: string;
}

const getAmountFieldErrors = (amount: IRangeFilter): IAmountFieldErrors => {
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

const isAmountRangeInvalid = (amount: IRangeFilter): boolean => {
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

const describeDateFilter = (date: IRangeFilter): string | undefined => {
    const preset = DURATION_PRESETS.find(({ id }) => id === date.preset);

    if (preset) {
        return preset.label;
    }

    if (date.from && date.to) return `${date.from} – ${date.to}`;
    if (date.from) return `From ${date.from}`;
    if (date.to) return `To ${date.to}`;

    return undefined;
};

const describeAmountFilter = (amount: IRangeFilter): string | undefined => {
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

const describeTypeFilter = (type: TransactionType | ""): string =>
    type ? capitalize(type) : "All types";

const describeStatusFilter = (status: TransactionStatus | ""): string =>
    status ? capitalize(status) : "All statuses";

const hasRangeValue = (range: IRangeFilter): boolean =>
    Boolean(range.preset || range.from.trim() || range.to.trim());

export const History: React.FC = () => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const networkId = useSelector(selectSelectedNetworkId);
    const isAccountUnlocked = useSelector((state: RootState) =>
        selectedAccount
            ? selectIsAccountUnlocked(state, selectedAccount.id)
            : false,
    );
    const theme = useTheme();
    const { width, isTablet } = useScreen();
    const isMobile = width <= Number.parseInt(theme.breakpoints.mobile, 10);

    const [appliedFilters, setAppliedFilters] = useState<IPanelFilters>(
        createEmptyPanelFilters,
    );
    const [draftFilters, setDraftFilters] = useState<IPanelFilters>(
        createEmptyPanelFilters,
    );
    const [openFilter, setOpenFilter] = useState<TPanelFilterKey | null>(null);
    const [dateTick, setDateTick] = useState(0);
    const [selectedTransactionId, setSelectedTransactionId] = useState<
        string | null
    >(null);

    const historyArgs: IHistoryQueryArgs | typeof skipToken =
        selectedAccount && isAccountUnlocked
            ? {
                  accountId: selectedAccount.id,
                  networkId,
                  // Status is filtered on the transaction model, so every source stays loaded.
                  source: "all",
              }
            : skipToken;

    const {
        currentData: transactions = EMPTY_TRANSACTIONS,
        isFetching,
        isError,
        fulfilledTimeStamp,
    } = useGetTransactionHistoryQuery(historyArgs, {
        pollingInterval: ACCOUNT_DATA_POLLING_INTERVAL_MS,
    });

    const hasLoadedTransactions = transactions !== EMPTY_TRANSACTIONS;

    useEffect(() => {
        const preset = DURATION_PRESETS.find(
            ({ id }) => id === appliedFilters.date.preset,
        );
        if (!preset) return;

        const now = Date.now();
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

        if (!Number.isFinite(nextBoundary)) return;

        const timer = window.setTimeout(
            () => setDateTick((current) => current + 1),
            Math.max(1, Math.min(nextBoundary - now, 2_147_483_647)),
        );
        return () => window.clearTimeout(timer);
    }, [appliedFilters.date.preset, transactions, dateTick]);

    const visibleTransactions = useMemo<Transaction[]>(() => {
        const now = Date.now();
        const dateBounds = resolveDateBounds(appliedFilters.date, now);
        const fromQuery = normalizeAddress(appliedFilters.from);
        const toQuery = normalizeAddress(appliedFilters.to);
        const detailsQuery = appliedFilters.details.trim().toLowerCase();
        const hasAmountFilter = hasRangeValue(appliedFilters.amount);

        return transactions.filter((transaction) => {
            if (appliedFilters.type && transaction.type !== appliedFilters.type) {
                return false;
            }
            if (
                appliedFilters.status &&
                transaction.status !== appliedFilters.status
            ) {
                return false;
            }

            const timestamp = new Date(transaction.timestamp).getTime();

            if (dateBounds.start !== undefined || dateBounds.end !== undefined) {
                if (Number.isNaN(timestamp)) return false;
                if (
                    dateBounds.start !== undefined &&
                    timestamp < dateBounds.start
                ) {
                    return false;
                }
                if (dateBounds.end !== undefined && timestamp > dateBounds.end) {
                    return false;
                }
            }

            if (
                fromQuery &&
                !normalizeAddress(transaction.from).includes(fromQuery)
            ) {
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

            return !hasAmountFilter
                ? true
                : matchesAmount(transaction, appliedFilters.amount);
        });
    }, [transactions, appliedFilters, dateTick]);

    const hasActiveFilters =
        Boolean(appliedFilters.type) ||
        Boolean(appliedFilters.status) ||
        hasRangeValue(appliedFilters.date) ||
        hasRangeValue(appliedFilters.amount) ||
        Boolean(appliedFilters.from.trim()) ||
        Boolean(appliedFilters.to.trim()) ||
        Boolean(appliedFilters.details.trim());

    const togglePanel = useCallback(
        (key: TPanelFilterKey, expanded: boolean): void => {
            if (expanded) {
                // Seed the draft from the applied value so closing a panel discards edits.
                setDraftFilters((current) => ({
                    ...current,
                    [key]:
                        key === "date" || key === "amount"
                            ? { ...appliedFilters[key] }
                            : appliedFilters[key],
                }));
            }

            setOpenFilter(expanded ? key : null);
        },
        [appliedFilters],
    );

    const applyFilter = (key: TPanelFilterKey): void => {
        setAppliedFilters((current) => ({
            ...current,
            [key]:
                key === "date" || key === "amount"
                    ? { ...draftFilters[key] }
                    : draftFilters[key],
        }));
        setOpenFilter(null);
    };

    const clearFilter = (key: TPanelFilterKey): void => {
        setDraftFilters((current) => ({
            ...current,
            [key]: createEmptyPanelFilters()[key],
        }));
        setAppliedFilters((current) => ({
            ...current,
            [key]: createEmptyPanelFilters()[key],
        }));
    };

    const clearAllFilters = (): void => {
        setDraftFilters(createEmptyPanelFilters());
        setAppliedFilters(createEmptyPanelFilters());
        setOpenFilter(null);
    };

    const updateDateDraft = (patch: Partial<IRangeFilter>): void =>
        setDraftFilters((current) => ({
            ...current,
            date: { ...current.date, ...patch },
        }));

    const updateAmountDraft = (patch: Partial<IRangeFilter>): void =>
        setDraftFilters((current) => ({
            ...current,
            amount: { ...current.amount, ...patch },
        }));

    const dateError = isDateRangeInvalid(draftFilters.date)
        ? "The start date must be before the end date."
        : "";
    const amountFieldErrors = getAmountFieldErrors(draftFilters.amount);
    const amountError = isAmountRangeInvalid(draftFilters.amount);

    const filterActionLabels: Record<TPanelFilterKey, string> = {
        type: "type",
        status: "status",
        date: "date",
        from: "sender",
        to: "recipient",
        amount: "amount",
        details: "details",
    };

    const renderPanelActions = (
        key: TPanelFilterKey,
        applyDisabled = false,
    ): React.ReactElement => (
        <PanelActions>
            <Button
                id={`history-filter-${key}-clear`}
                type="button"
                variant="secondary"
                size="small"
                aria-label={`Clear ${filterActionLabels[key]} filter`}
                onClick={() => clearFilter(key)}
            >
                Clear
            </Button>
            <Button
                id={`history-filter-${key}-apply`}
                type="button"
                size="small"
                aria-label={`Apply ${filterActionLabels[key]} filter`}
                disabled={applyDisabled}
                onClick={() => applyFilter(key)}
            >
                Apply
            </Button>
        </PanelActions>
    );

    const columnTriggerLabel = (
        label: string,
        applied?: string,
    ): string => (applied ? `${label} ${applied}` : label);

    const renderTypeFilter = (): React.ReactElement => (
        <AdaptivePanel
            id="history-filter-type-panel"
            variant="column"
            dialogTitle="Type"
            header="Type"
            active={Boolean(appliedFilters.type)}
            aria-label={columnTriggerLabel(
                "Type",
                appliedFilters.type
                    ? describeTypeFilter(appliedFilters.type)
                    : undefined,
            )}
            expanded={openFilter === "type"}
            onToggle={(expanded) => togglePanel("type", expanded)}
        >
            <OptionList role="group" aria-label="Type">
                {typeOptions.map((option) => (
                    <PresetButton
                        key={option.id}
                        type="button"
                        size="small"
                        variant={
                            draftFilters.type === option.value
                                ? "primary"
                                : "secondary"
                        }
                        aria-pressed={draftFilters.type === option.value}
                        onClick={() => {
                            const next = option.value as TransactionType | "";
                            setDraftFilters((current) => ({
                                ...current,
                                type: next,
                            }));
                            setAppliedFilters((current) => ({
                                ...current,
                                type: next,
                            }));
                            setOpenFilter(null);
                        }}
                    >
                        {option.label}
                    </PresetButton>
                ))}
            </OptionList>
        </AdaptivePanel>
    );

    const renderStatusFilter = (): React.ReactElement => (
        <AdaptivePanel
            id="history-filter-status-panel"
            variant="column"
            dialogTitle="Status"
            header="Status"
            active={Boolean(appliedFilters.status)}
            aria-label={columnTriggerLabel(
                "Status",
                appliedFilters.status
                    ? describeStatusFilter(appliedFilters.status)
                    : undefined,
            )}
            expanded={openFilter === "status"}
            onToggle={(expanded) => togglePanel("status", expanded)}
        >
            <OptionList role="group" aria-label="Status">
                {statusOptions.map((option) => (
                    <PresetButton
                        key={option.id}
                        type="button"
                        size="small"
                        variant={
                            draftFilters.status === option.value
                                ? "primary"
                                : "secondary"
                        }
                        aria-pressed={draftFilters.status === option.value}
                        onClick={() => {
                            const next = option.value as TransactionStatus | "";
                            setDraftFilters((current) => ({
                                ...current,
                                status: next,
                            }));
                            setAppliedFilters((current) => ({
                                ...current,
                                status: next,
                            }));
                            setOpenFilter(null);
                        }}
                    >
                        {option.label}
                    </PresetButton>
                ))}
            </OptionList>
        </AdaptivePanel>
    );

    const renderDateFilter = (): React.ReactElement => (
        <AdaptivePanel
            id="history-filter-date-panel"
            variant="column"
            dialogTitle="Date"
            header="Date"
            active={hasRangeValue(appliedFilters.date)}
            aria-label={columnTriggerLabel(
                "Date",
                describeDateFilter(appliedFilters.date),
            )}
            expanded={openFilter === "date"}
            onToggle={(expanded) => togglePanel("date", expanded)}
        >
            <FilterPanelTitle id="history-filter-duration-label">
                Set duration
            </FilterPanelTitle>
            <PresetGrid
                role="group"
                aria-labelledby="history-filter-duration-label"
            >
                {DURATION_PRESETS.map((preset) => (
                    <PresetButton
                        key={preset.id}
                        type="button"
                        size="small"
                        variant={
                            draftFilters.date.preset === preset.id
                                ? "primary"
                                : "secondary"
                        }
                        aria-pressed={draftFilters.date.preset === preset.id}
                        onClick={() =>
                            updateDateDraft({
                                preset:
                                    draftFilters.date.preset === preset.id
                                        ? ""
                                        : preset.id,
                                from: "",
                                to: "",
                            })
                        }
                    >
                        {preset.label}
                    </PresetButton>
                ))}
            </PresetGrid>
            <FilterPanelTitle>Custom duration</FilterPanelTitle>
            <Input
                id="history-filter-date-from"
                type="date"
                label="From"
                value={draftFilters.date.from}
                onChange={(event) =>
                    updateDateDraft({
                        from: event.target.value,
                        preset: "",
                    })
                }
                wrapperStyle={{ marginBottom: theme.spacing.lg }}
            />
            <Input
                id="history-filter-date-to"
                type="date"
                label="To"
                value={draftFilters.date.to}
                onChange={(event) =>
                    updateDateDraft({
                        to: event.target.value,
                        preset: "",
                    })
                }
                error={dateError}
                wrapperStyle={{ marginBottom: theme.spacing.xl }}
            />
            {renderPanelActions("date", Boolean(dateError))}
        </AdaptivePanel>
    );

    const renderFromFilter = (): React.ReactElement => (
        <AdaptivePanel
            id="history-filter-from-panel"
            variant="column"
            dialogTitle="From"
            header="From"
            active={Boolean(appliedFilters.from.trim())}
            aria-label={columnTriggerLabel(
                "From",
                appliedFilters.from.trim() || undefined,
            )}
            expanded={openFilter === "from"}
            onToggle={(expanded) => togglePanel("from", expanded)}
        >
            <Input
                id="history-filter-from-input"
                label="Search by sender address"
                placeholder="Search by address"
                value={draftFilters.from}
                onChange={(event) =>
                    setDraftFilters((current) => ({
                        ...current,
                        from: event.target.value,
                    }))
                }
                wrapperStyle={{ marginBottom: theme.spacing.xl }}
            />
            {renderPanelActions("from")}
        </AdaptivePanel>
    );

    const renderToFilter = (): React.ReactElement => (
        <AdaptivePanel
            id="history-filter-to-panel"
            variant="column"
            dialogTitle="To"
            header="To"
            active={Boolean(appliedFilters.to.trim())}
            aria-label={columnTriggerLabel(
                "To",
                appliedFilters.to.trim() || undefined,
            )}
            expanded={openFilter === "to"}
            onToggle={(expanded) => togglePanel("to", expanded)}
        >
            <Input
                id="history-filter-to-input"
                label="Search by recipient address"
                placeholder="Search by address"
                value={draftFilters.to}
                onChange={(event) =>
                    setDraftFilters((current) => ({
                        ...current,
                        to: event.target.value,
                    }))
                }
                wrapperStyle={{ marginBottom: theme.spacing.xl }}
            />
            {renderPanelActions("to")}
        </AdaptivePanel>
    );

    const renderAmountFilter = (): React.ReactElement => (
        <AdaptivePanel
            id="history-filter-amount-panel"
            variant="column"
            dialogTitle="Amount"
            header="Amount"
            active={hasRangeValue(appliedFilters.amount)}
            aria-label={columnTriggerLabel(
                "Amount",
                describeAmountFilter(appliedFilters.amount),
            )}
            expanded={openFilter === "amount"}
            onToggle={(expanded) => togglePanel("amount", expanded)}
        >
            <FilterPanelTitle id="history-filter-amount-preset-label">
                Set amount
            </FilterPanelTitle>
            <PresetGrid
                role="group"
                aria-labelledby="history-filter-amount-preset-label"
            >
                {AMOUNT_PRESETS.map((preset) => (
                    <PresetButton
                        key={preset.id}
                        type="button"
                        size="small"
                        variant={
                            draftFilters.amount.preset === preset.id
                                ? "primary"
                                : "secondary"
                        }
                        aria-pressed={
                            draftFilters.amount.preset === preset.id
                        }
                        onClick={() =>
                            updateAmountDraft({
                                preset:
                                    draftFilters.amount.preset === preset.id
                                        ? ""
                                        : preset.id,
                                from: "",
                                to: "",
                            })
                        }
                    >
                        {preset.label}
                    </PresetButton>
                ))}
            </PresetGrid>
            <FilterPanelTitle>Custom amount</FilterPanelTitle>
            <Input
                id="history-filter-amount-from"
                type="number"
                min="0"
                step="any"
                label={`From (${getTokenDisplayName()})`}
                value={draftFilters.amount.from}
                onChange={(event) =>
                    updateAmountDraft({
                        from: event.target.value,
                        preset: "",
                    })
                }
                error={amountFieldErrors.from}
                wrapperStyle={{ marginBottom: theme.spacing.lg }}
            />
            <Input
                id="history-filter-amount-to"
                type="number"
                min="0"
                step="any"
                label={`To (${getTokenDisplayName()})`}
                value={draftFilters.amount.to}
                onChange={(event) =>
                    updateAmountDraft({
                        to: event.target.value,
                        preset: "",
                    })
                }
                error={amountFieldErrors.to}
                wrapperStyle={{ marginBottom: theme.spacing.xl }}
            />
            {renderPanelActions("amount", amountError)}
        </AdaptivePanel>
    );

    const renderDetailsFilter = (): React.ReactElement => (
        <AdaptivePanel
            id="history-filter-details-panel"
            variant="column"
            dialogTitle="Details"
            header="Details"
            active={Boolean(appliedFilters.details.trim())}
            aria-label={columnTriggerLabel(
                "Details",
                appliedFilters.details.trim() || undefined,
            )}
            expanded={openFilter === "details"}
            onToggle={(expanded) => togglePanel("details", expanded)}
        >
            <Search
                id="history-filter-details-input"
                label="Search by details"
                placeholder="Search by deploy ID"
                value={draftFilters.details}
                onChange={(value) =>
                    setDraftFilters((current) => ({
                        ...current,
                        details: value,
                    }))
                }
                onSearch={(value) => {
                    setAppliedFilters((current) => ({
                        ...current,
                        details: value,
                    }));
                    setOpenFilter(null);
                }}
                wrapperStyle={{ marginBottom: theme.spacing.xl }}
            />
            {renderPanelActions("details")}
        </AdaptivePanel>
    );

    const hasVisibleTransactions = visibleTransactions.length > 0;
    const hasLoadError = isError && !hasLoadedTransactions;
    const hasRefreshError = isError && hasLoadedTransactions;
    // Keep column filters mounted while any history is loaded so an empty
    // filtered result does not remove the controls needed to clear it.
    const showTransactionTable =
        hasLoadedTransactions && transactions.length > 0;
    const selectedTransaction =
        visibleTransactions.find(
            (transaction) => transaction.id === selectedTransactionId,
        ) ?? null;

    const renderPlainHeader = (label: string): React.ReactElement => (
        <span>{label}</span>
    );

    return (
        <HistoryContainer>
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <RefreshText>
                        <RefreshTextLine>
                            Auto-refresh: every{" "}
                            {ACCOUNT_DATA_POLLING_INTERVAL_SECONDS}s
                        </RefreshTextLine>
                        <RefreshTextLine>
                            {isFetching && <RefreshSpinner aria-hidden="true" />}
                            Last:{" "}
                            {fulfilledTimeStamp
                                ? new Date(
                                      fulfilledTimeStamp,
                                  ).toLocaleTimeString()
                                : "—"}
                        </RefreshTextLine>
                    </RefreshText>
                </CardHeader>
                <CardContent>
                    <AccountBar>
                        <AccountSelector fullWidth={isTablet || isMobile} />
                        <AccountBarActions>
                            <Button
                                id="history-clear-filters-button"
                                type="button"
                                size="small"
                                variant="secondary"
                                disabled={!hasActiveFilters}
                                onClick={clearAllFilters}
                            >
                                Clear Filter
                            </Button>
                        </AccountBarActions>
                    </AccountBar>

                    {isMobile && showTransactionTable && (
                        <MobileFilterBar aria-label="Transaction filters">
                            {renderDateFilter()}
                            {renderTypeFilter()}
                            {renderStatusFilter()}
                            {renderFromFilter()}
                            {renderToFilter()}
                            {renderAmountFilter()}
                            {renderDetailsFilter()}
                        </MobileFilterBar>
                    )}

                    {hasLoadError && (
                        <ErrorMessage id="history-load-error" role="alert">
                            {HISTORY_UNAVAILABLE_ERROR}
                        </ErrorMessage>
                    )}

                    {hasRefreshError && (
                        <ErrorMessage id="history-refresh-error" role="alert">
                            {HISTORY_REFRESH_ERROR}
                        </ErrorMessage>
                    )}

                    {showTransactionTable && (
                        <TransactionTable data-testid="history-transaction-table">
                            <Table>
                                <VisuallyHidden as="caption">
                                    Transactions
                                </VisuallyHidden>
                                <TableHeader>
                                    <tr>
                                        <TableHeaderCell
                                            scope="col"
                                            style={{
                                                width: isMobile ? "34%" : "11%",
                                            }}
                                        >
                                            {isMobile
                                                ? renderPlainHeader("Date")
                                                : renderDateFilter()}
                                        </TableHeaderCell>
                                        <TableHeaderCell
                                            scope="col"
                                            style={{
                                                width: isMobile ? "22%" : "8%",
                                            }}
                                        >
                                            {isMobile
                                                ? renderPlainHeader("Type")
                                                : renderTypeFilter()}
                                        </TableHeaderCell>
                                        <TableHeaderCell
                                            scope="col"
                                            style={{
                                                width: isMobile ? "22%" : "10%",
                                            }}
                                        >
                                            {isMobile
                                                ? renderPlainHeader("Status")
                                                : renderStatusFilter()}
                                        </TableHeaderCell>
                                        {isMobile ? (
                                            <TableHeaderCell
                                                scope="col"
                                                style={{ width: "22%" }}
                                            >
                                                {renderPlainHeader("Details")}
                                            </TableHeaderCell>
                                        ) : (
                                            <>
                                                <TableHeaderCell
                                                    scope="col"
                                                    style={{ width: "18%" }}
                                                >
                                                    {renderFromFilter()}
                                                </TableHeaderCell>
                                                <TableHeaderCell
                                                    scope="col"
                                                    style={{ width: "18%" }}
                                                >
                                                    {renderToFilter()}
                                                </TableHeaderCell>
                                                <TableHeaderCell
                                                    scope="col"
                                                    style={{ width: "20%" }}
                                                >
                                                    {renderAmountFilter()}
                                                </TableHeaderCell>
                                                <TableHeaderCell
                                                    scope="col"
                                                    style={{ width: "15%" }}
                                                >
                                                    {renderDetailsFilter()}
                                                </TableHeaderCell>
                                            </>
                                        )}
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {visibleTransactions.map((transaction) => {
                                        const { dateTime, date, time } =
                                            formatDateParts(
                                                transaction.timestamp,
                                            );

                                        return (
                                            <TableRow
                                                key={transaction.id}
                                                id={`history-transaction-row-${transaction.id}`}
                                            >
                                                <TableCell>
                                                    <DateValue dateTime={dateTime}>
                                                        {date}
                                                    </DateValue>
                                                    <TimeValue
                                                        dateTime={dateTime}
                                                    >
                                                        {time}
                                                    </TimeValue>
                                                </TableCell>
                                                <TableCell>
                                                    <TypeBadge
                                                        $type={transaction.type}
                                                    >
                                                        {transaction.type}
                                                    </TypeBadge>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        $status={
                                                            transaction.status
                                                        }
                                                    >
                                                        {transaction.status}
                                                    </StatusBadge>
                                                </TableCell>
                                                {isMobile ? (
                                                    <TableCell>
                                                        <RowActionButton
                                                            id={`history-transaction-details-${transaction.id}`}
                                                            type="button"
                                                            size="small"
                                                            variant="ghost"
                                                            aria-label={`View details for ${transaction.type} transaction`}
                                                            onClick={() =>
                                                                setSelectedTransactionId(
                                                                    transaction.id,
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </RowActionButton>
                                                    </TableCell>
                                                ) : (
                                                    <>
                                                        <TableCell>
                                                            <DetailsCell>
                                                                <MonoValue
                                                                    title={
                                                                        transaction.from
                                                                    }
                                                                >
                                                                    {transaction.from ||
                                                                        "—"}
                                                                </MonoValue>
                                                                {transaction.from && (
                                                                    <CopyButton
                                                                        title="Copy sender address"
                                                                        dataToCopy={
                                                                            transaction.from
                                                                        }
                                                                        size={16}
                                                                    />
                                                                )}
                                                            </DetailsCell>
                                                        </TableCell>
                                                        <TableCell>
                                                            <DetailsCell>
                                                                <MonoValue
                                                                    title={
                                                                        transaction.to
                                                                    }
                                                                >
                                                                    {transaction.to ||
                                                                        "—"}
                                                                </MonoValue>
                                                                {transaction.to && (
                                                                    <CopyButton
                                                                        title="Copy recipient address"
                                                                        dataToCopy={
                                                                            transaction.to
                                                                        }
                                                                        size={16}
                                                                    />
                                                                )}
                                                            </DetailsCell>
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatTransactionAmount(
                                                                transaction.amount,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {transaction.deployId ? (
                                                                <DetailsCell>
                                                                    <MonoValue
                                                                        title={
                                                                            transaction.deployId
                                                                        }
                                                                    >
                                                                        {
                                                                            transaction.deployId
                                                                        }
                                                                    </MonoValue>
                                                                    <CopyButton
                                                                        title="Copy Deploy ID"
                                                                        dataToCopy={
                                                                            transaction.deployId
                                                                        }
                                                                        size={16}
                                                                    />
                                                                </DetailsCell>
                                                            ) : (
                                                                "—"
                                                            )}
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TransactionTable>
                    )}

                    {hasVisibleTransactions && (
                        // TODO: Restore transaction export once the SDK exposes a history download flow
                        <ExportButtonsWrapper>
                            <ExportButton
                                id="history-export-button"
                                variant="secondary"
                                disabled
                            >
                                <h3>Export</h3>
                                <DownloadIcon size={24} />
                            </ExportButton>
                        </ExportButtonsWrapper>
                    )}

                    {!hasVisibleTransactions && !hasLoadError && (
                        <EmptyState>
                            {!selectedAccount && (
                                <p>
                                    Please select an account to view transaction
                                    history.
                                </p>
                            )}
                            {selectedAccount &&
                                !hasLoadedTransactions &&
                                isFetching && (
                                    <p role="status">
                                        Loading transaction history for{" "}
                                        {selectedAccount.name}…
                                    </p>
                                )}
                            {selectedAccount &&
                                (hasLoadedTransactions || !isFetching) &&
                                transactions.length === 0 && (
                                    <>
                                        <p>
                                            No transactions found for{" "}
                                            {selectedAccount.name}.
                                        </p>
                                        <p>
                                            Your transaction history will appear
                                            here once you send, receive, or
                                            deploy contracts.
                                        </p>
                                    </>
                                )}
                            {selectedAccount && transactions.length > 0 && (
                                <p>
                                    No transactions match the selected filters.
                                </p>
                            )}
                        </EmptyState>
                    )}
                </CardContent>
            </Card>

            <ModalWindow
                isOpen={Boolean(selectedTransaction)}
                onClose={() => setSelectedTransactionId(null)}
                title="Transaction details"
                maxWidth="480px"
            >
                {selectedTransaction && (
                    <>
                        <DetailField>
                            <DetailFieldLabel>Type</DetailFieldLabel>
                            <TypeBadge $type={selectedTransaction.type}>
                                {selectedTransaction.type}
                            </TypeBadge>
                        </DetailField>
                        <DetailField>
                            <DetailFieldLabel>Status</DetailFieldLabel>
                            <StatusBadge $status={selectedTransaction.status}>
                                {selectedTransaction.status}
                            </StatusBadge>
                        </DetailField>
                        <DetailField>
                            <DetailFieldLabel>Amount</DetailFieldLabel>
                            <span>
                                {formatTransactionAmount(
                                    selectedTransaction.amount,
                                )}
                            </span>
                        </DetailField>
                        <DetailField>
                            <DetailFieldLabel>From</DetailFieldLabel>
                            <DetailsCell>
                                <MonoValue title={selectedTransaction.from}>
                                    {selectedTransaction.from || "—"}
                                </MonoValue>
                                {selectedTransaction.from && (
                                    <CopyButton
                                        title="Copy sender address"
                                        dataToCopy={selectedTransaction.from}
                                        size={16}
                                    />
                                )}
                            </DetailsCell>
                        </DetailField>
                        <DetailField>
                            <DetailFieldLabel>To</DetailFieldLabel>
                            <DetailsCell>
                                <MonoValue title={selectedTransaction.to}>
                                    {selectedTransaction.to || "—"}
                                </MonoValue>
                                {selectedTransaction.to && (
                                    <CopyButton
                                        title="Copy recipient address"
                                        dataToCopy={selectedTransaction.to}
                                        size={16}
                                    />
                                )}
                            </DetailsCell>
                        </DetailField>
                        <DetailField>
                            <DetailFieldLabel>Deploy ID</DetailFieldLabel>
                            {selectedTransaction.deployId ? (
                                <DetailsCell>
                                    <MonoValue
                                        title={selectedTransaction.deployId}
                                    >
                                        {selectedTransaction.deployId}
                                    </MonoValue>
                                    <CopyButton
                                        title="Copy Deploy ID"
                                        dataToCopy={selectedTransaction.deployId}
                                        size={16}
                                    />
                                </DetailsCell>
                            ) : (
                                <span>—</span>
                            )}
                        </DetailField>
                    </>
                )}
            </ModalWindow>
        </HistoryContainer>
    );
};
