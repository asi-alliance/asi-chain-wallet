import { FC } from "react";
import styled, { DefaultTheme } from "styled-components";
import { TransactionStatus, TransactionType } from "@asichain/asi-wallet-sdk";
import {
    CheckIcon,
    ContractIcon,
    ErrorIcon,
    PendingIcon,
    ReceiveIcon,
    SendIcon,
} from "components/Icons";
import { describeStatusFilter, describeTypeFilter } from "utils/historyFilters";

const ICON_SIZE = 16;

const IconWrapper = styled.span<{ $color: (theme: DefaultTheme) => string }>`
    display: inline-flex;
    align-items: center;
    color: ${({ $color, theme }) => $color(theme)};
`;

const TYPE_ICONS: Record<TransactionType, FC<{ size?: number; color?: string }>> = {
    send: SendIcon,
    receive: ReceiveIcon,
    deploy: ContractIcon,
};

const TYPE_COLORS: Record<TransactionType, (theme: DefaultTheme) => string> = {
    send: (theme) => theme.actionText,
    receive: (theme) => theme.actionText,
    deploy: (theme) => theme.infoText,
};

const STATUS_ICONS: Record<
    TransactionStatus,
    FC<{ size?: number; color?: string }>
> = {
    pending: PendingIcon,
    completed: CheckIcon,
    failed: ErrorIcon,
};

const STATUS_COLORS: Record<
    TransactionStatus,
    (theme: DefaultTheme) => string
> = {
    pending: (theme) => theme.warningText,
    completed: (theme) => theme.actionText,
    failed: (theme) => theme.dangerText,
};

export const TransactionTypeIcon: FC<{ type: TransactionType }> = ({ type }) => {
    const Icon = TYPE_ICONS[type];
    const label = describeTypeFilter(type);

    return (
        <IconWrapper
            $color={TYPE_COLORS[type]}
            role="img"
            aria-label={label}
            title={label}
        >
            <Icon size={ICON_SIZE} color="currentColor" />
        </IconWrapper>
    );
};

export const TransactionStatusIcon: FC<{ status: TransactionStatus }> = ({
    status,
}) => {
    const Icon = STATUS_ICONS[status];
    const label = describeStatusFilter(status);

    return (
        <IconWrapper
            $color={STATUS_COLORS[status]}
            role="img"
            aria-label={label}
            title={label}
        >
            <Icon size={ICON_SIZE} color="currentColor" />
        </IconWrapper>
    );
};
