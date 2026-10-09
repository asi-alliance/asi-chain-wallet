import { FC } from "react";
import styled from "styled-components";
import { Button } from "components";
import { TPanelFilterKey } from "utils/historyFilters";

const PanelActions = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.spacing.lg};
    margin-top: ${({ theme }) => theme.spacing.xl};

    > * {
        flex: 1;
    }
`;

interface IFilterPanelActionsProps {
    filterKey: TPanelFilterKey;
    actionLabel: string;
    applyDisabled?: boolean;
    onClear: () => void;
    onApply: () => void;
}

export const FilterPanelActions: FC<IFilterPanelActionsProps> = ({
    filterKey,
    actionLabel,
    applyDisabled = false,
    onClear,
    onApply,
}) => (
    <PanelActions>
        <Button
            id={`history-filter-${filterKey}-clear`}
            type="button"
            variant="secondary"
            size="small"
            aria-label={`Clear ${actionLabel} filter`}
            onClick={onClear}
        >
            Clear
        </Button>
        <Button
            id={`history-filter-${filterKey}-apply`}
            type="button"
            size="small"
            aria-label={`Apply ${actionLabel} filter`}
            disabled={applyDisabled}
            onClick={onApply}
        >
            Apply
        </Button>
    </PanelActions>
);
