import { FC, ReactElement } from "react";
import { useTheme } from "styled-components";
import { TransactionStatus, TransactionType } from "@asichain/asi-wallet-sdk";
import { FilterPopover } from "components/FilterPopover";
import { Search } from "components/Search";
import { getTokenDisplayName } from "constants/token";
import { IUseHistoryFilters } from "hooks";
import {
    AMOUNT_PRESETS,
    describeAmountFilter,
    describeDateFilter,
    describeStatusFilter,
    describeTypeFilter,
    DURATION_PRESETS,
    getAmountFieldErrors,
    hasRangeValue,
    IPanelFilters,
    isAmountRangeInvalid,
    isDateRangeInvalid,
    statusOptions,
    TPanelFilterKey,
    typeOptions,
} from "utils/historyFilters";
import { FilterPanelActions } from "../FilterPanelActions";
import { OptionFilterPanel } from "../OptionFilterPanel";
import { RangeFilterPanel } from "../RangeFilterPanel";
import { TextFilterPanel } from "../TextFilterPanel";

const FILTER_LABELS: Record<TPanelFilterKey, string> = {
    type: "Type",
    status: "Status",
    date: "Date",
    from: "From",
    to: "To",
    amount: "Amount",
    details: "Details",
};

const FILTER_ACTION_LABELS: Record<TPanelFilterKey, string> = {
    type: "type",
    status: "status",
    date: "date",
    from: "sender",
    to: "recipient",
    amount: "amount",
    details: "details",
};

const isFilterActive = (
    key: TPanelFilterKey,
    filters: IPanelFilters,
): boolean => {
    switch (key) {
        case "date":
        case "amount":
            return hasRangeValue(filters[key]);
        case "from":
        case "to":
        case "details":
            return Boolean(filters[key].trim());
        default:
            return Boolean(filters[key]);
    }
};

const describeAppliedFilter = (
    key: TPanelFilterKey,
    filters: IPanelFilters,
): string | undefined => {
    switch (key) {
        case "type":
            return filters.type ? describeTypeFilter(filters.type) : undefined;
        case "status":
            return filters.status
                ? describeStatusFilter(filters.status)
                : undefined;
        case "date":
            return describeDateFilter(filters.date);
        case "amount":
            return describeAmountFilter(filters.amount);
        default:
            return filters[key].trim() || undefined;
    }
};

interface IHistoryFilterProps {
    filterKey: TPanelFilterKey;
    filters: IUseHistoryFilters;
}

export const HistoryFilter: FC<IHistoryFilterProps> = ({
    filterKey,
    filters,
}) => {
    const theme = useTheme();
    const { appliedFilters, draftFilters } = filters;
    const label = FILTER_LABELS[filterKey];
    const appliedDescription = describeAppliedFilter(filterKey, appliedFilters);

    const renderActions = (applyDisabled = false): ReactElement => (
        <FilterPanelActions
            filterKey={filterKey}
            actionLabel={FILTER_ACTION_LABELS[filterKey]}
            applyDisabled={applyDisabled}
            onClear={() => filters.clearFilter(filterKey)}
            onApply={() => filters.applyFilter(filterKey)}
        />
    );

    const renderContent = (): ReactElement => {
        switch (filterKey) {
            case "type":
                return (
                    <OptionFilterPanel
                        label={label}
                        options={typeOptions}
                        value={draftFilters.type}
                        onSelect={(value) =>
                            filters.selectOption(
                                "type",
                                value as TransactionType | "",
                            )
                        }
                    />
                );
            case "status":
                return (
                    <OptionFilterPanel
                        label={label}
                        options={statusOptions}
                        value={draftFilters.status}
                        onSelect={(value) =>
                            filters.selectOption(
                                "status",
                                value as TransactionStatus | "",
                            )
                        }
                    />
                );
            case "date": {
                const dateError = isDateRangeInvalid(draftFilters.date)
                    ? "The start date must be before the end date."
                    : "";

                return (
                    <RangeFilterPanel
                        presetsTitle="Set duration"
                        presetsTitleId="history-filter-duration-label"
                        presets={DURATION_PRESETS}
                        customTitle="Custom duration"
                        inputType="date"
                        fromField={{ id: "history-filter-date-from", label: "From" }}
                        toField={{
                            id: "history-filter-date-to",
                            label: "To",
                            error: dateError,
                        }}
                        value={draftFilters.date}
                        onChange={(patch) =>
                            filters.updateRangeDraft("date", patch)
                        }
                        actions={renderActions(Boolean(dateError))}
                    />
                );
            }
            case "amount": {
                const amountFieldErrors = getAmountFieldErrors(
                    draftFilters.amount,
                );

                return (
                    <RangeFilterPanel
                        presetsTitle="Set amount"
                        presetsTitleId="history-filter-amount-preset-label"
                        presets={AMOUNT_PRESETS}
                        customTitle="Custom amount"
                        inputType="number"
                        fromField={{
                            id: "history-filter-amount-from",
                            label: `From (${getTokenDisplayName()})`,
                            error: amountFieldErrors.from,
                        }}
                        toField={{
                            id: "history-filter-amount-to",
                            label: `To (${getTokenDisplayName()})`,
                            error: amountFieldErrors.to,
                        }}
                        value={draftFilters.amount}
                        onChange={(patch) =>
                            filters.updateRangeDraft("amount", patch)
                        }
                        actions={renderActions(
                            isAmountRangeInvalid(draftFilters.amount),
                        )}
                    />
                );
            }
            case "from":
                return (
                    <TextFilterPanel
                        id="history-filter-from-input"
                        label="Search by sender address"
                        placeholder="Search by address"
                        value={draftFilters.from}
                        onChange={(value) => filters.updateTextDraft("from", value)}
                        actions={renderActions()}
                    />
                );
            case "to":
                return (
                    <TextFilterPanel
                        id="history-filter-to-input"
                        label="Search by recipient address"
                        placeholder="Search by address"
                        value={draftFilters.to}
                        onChange={(value) => filters.updateTextDraft("to", value)}
                        actions={renderActions()}
                    />
                );
            case "details":
                return (
                    <>
                        <Search
                            id="history-filter-details-input"
                            label="Search by details"
                            placeholder="Search by deploy ID"
                            value={draftFilters.details}
                            onChange={(value) =>
                                filters.updateTextDraft("details", value)
                            }
                            onSearch={(value) =>
                                filters.applyTextFilter("details", value)
                            }
                            wrapperStyle={{ marginBottom: theme.spacing.xl }}
                        />
                        {renderActions()}
                    </>
                );
        }
    };

    return (
        <FilterPopover
            id={`history-filter-${filterKey}-panel`}
            dialogTitle={label}
            header={label}
            active={isFilterActive(filterKey, appliedFilters)}
            aria-label={
                appliedDescription ? `${label} ${appliedDescription}` : label
            }
            expanded={filters.openFilter === filterKey}
            onToggle={(expanded) => filters.toggleFilter(filterKey, expanded)}
        >
            {renderContent()}
        </FilterPopover>
    );
};
