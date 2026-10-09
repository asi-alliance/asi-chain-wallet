import { useState } from "react";
import {
    createEmptyPanelFilters,
    IPanelFilters,
    IRangeFilter,
    TPanelFilterKey,
} from "utils/historyFilters";

type TRangeFilterKey = "date" | "amount";
type TOptionFilterKey = "type" | "status";
type TTextFilterKey = "from" | "to" | "details";

export interface IUseHistoryFilters {
    appliedFilters: IPanelFilters;
    draftFilters: IPanelFilters;
    openFilter: TPanelFilterKey | null;
    toggleFilter: (key: TPanelFilterKey, expanded: boolean) => void;
    applyFilter: (key: TPanelFilterKey) => void;
    clearFilter: (key: TPanelFilterKey) => void;
    clearAllFilters: () => void;
    updateRangeDraft: (
        key: TRangeFilterKey,
        patch: Partial<IRangeFilter>,
    ) => void;
    updateTextDraft: (key: TTextFilterKey, value: string) => void;
    selectOption: <TKey extends TOptionFilterKey>(
        key: TKey,
        value: IPanelFilters[TKey],
    ) => void;
    applyTextFilter: (key: TTextFilterKey, value: string) => void;
}

const copyFilterValue = <TKey extends TPanelFilterKey>(
    filters: IPanelFilters,
    key: TKey,
): IPanelFilters[TKey] => {
    const value = filters[key];

    return typeof value === "object" ? { ...value } : value;
};

export const useHistoryFilters = (): IUseHistoryFilters => {
    const [appliedFilters, setAppliedFilters] = useState<IPanelFilters>(
        createEmptyPanelFilters,
    );
    const [draftFilters, setDraftFilters] = useState<IPanelFilters>(
        createEmptyPanelFilters,
    );
    const [openFilter, setOpenFilter] = useState<TPanelFilterKey | null>(null);

    const toggleFilter = (key: TPanelFilterKey, expanded: boolean): void => {
        if (expanded) {
            // Seed the draft from the applied value so closing a panel discards edits.
            setDraftFilters((current) => ({
                ...current,
                [key]: copyFilterValue(appliedFilters, key),
            }));
        }

        setOpenFilter(expanded ? key : null);
    };

    const applyFilter = (key: TPanelFilterKey): void => {
        setAppliedFilters((current) => ({
            ...current,
            [key]: copyFilterValue(draftFilters, key),
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

    const updateRangeDraft = (
        key: TRangeFilterKey,
        patch: Partial<IRangeFilter>,
    ): void =>
        setDraftFilters((current) => ({
            ...current,
            [key]: { ...current[key], ...patch },
        }));

    const updateTextDraft = (key: TTextFilterKey, value: string): void =>
        setDraftFilters((current) => ({ ...current, [key]: value }));

    const selectOption = <TKey extends TOptionFilterKey>(
        key: TKey,
        value: IPanelFilters[TKey],
    ): void => {
        setDraftFilters((current) => ({ ...current, [key]: value }));
        setAppliedFilters((current) => ({ ...current, [key]: value }));
        setOpenFilter(null);
    };

    const applyTextFilter = (key: TTextFilterKey, value: string): void => {
        setAppliedFilters((current) => ({ ...current, [key]: value }));
        setOpenFilter(null);
    };

    return {
        appliedFilters,
        draftFilters,
        openFilter,
        toggleFilter,
        applyFilter,
        clearFilter,
        clearAllFilters,
        updateRangeDraft,
        updateTextDraft,
        selectOption,
        applyTextFilter,
    };
};
