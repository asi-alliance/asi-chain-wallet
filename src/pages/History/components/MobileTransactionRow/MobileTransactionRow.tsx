import { FC } from "react";
import styled from "styled-components";
import CopyButton from "components/CopyButton";
import { ClipboardIcon, ExternalIcon } from "components/Icons";
import { Transaction } from "types/transactions";
import { formatDateParts } from "utils/formatDateParts";
import { truncateText } from "utils/textUtils";
import { formatTransactionAmount } from "utils/transactionUtils";
import {
    TransactionStatusIcon,
    TransactionTypeIcon,
} from "../TransactionIcons";

const ADDRESS_VISIBLE_LENGTH = 23;

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
    vertical-align: middle;
    white-space: nowrap;
`;

const DateValue = styled.time`
    display: block;
    color: ${({ theme }) => theme.text.secondary};
`;

const AddressValue = styled.span`
    color: ${({ theme }) => theme.actionText};
`;

const DeployIdValue = styled.span`
    display: block;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const RowActions = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing["3xl"]};
`;

const DetailsButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.focusRing};
        outline-offset: 4px;
        border-radius: ${({ theme }) => theme.radii.xs};
    }
`;

const CopyAction = styled.span`
    display: inline-flex;

    .copy-container {
        display: inline-flex;
    }

    .copy-button,
    .copy-button:hover {
        position: static;
        transform: none;
    }
`;

interface IMobileTransactionRowProps {
    transaction: Transaction;
    onViewDetails: (transactionId: string) => void;
}

export const MobileTransactionRow: FC<IMobileTransactionRowProps> = ({
    transaction,
    onViewDetails,
}) => {
    const { dateTime, date, time } = formatDateParts(transaction.timestamp);

    return (
        <TableRow id={`history-transaction-row-${transaction.id}`}>
            <TableCell>
                <DateValue dateTime={dateTime}>{date},</DateValue>
                <DateValue dateTime={dateTime}>{time}</DateValue>
            </TableCell>
            <TableCell>
                <TransactionTypeIcon type={transaction.type} />
            </TableCell>
            <TableCell>
                <TransactionStatusIcon status={transaction.status} />
            </TableCell>
            <TableCell>
                <AddressValue title={transaction.from}>
                    {truncateText(transaction.from, ADDRESS_VISIBLE_LENGTH) ||
                        "—"}
                </AddressValue>
            </TableCell>
            <TableCell>
                <AddressValue title={transaction.to}>
                    {truncateText(transaction.to, ADDRESS_VISIBLE_LENGTH) ||
                        "—"}
                </AddressValue>
            </TableCell>
            <TableCell>{formatTransactionAmount(transaction.amount)}</TableCell>
            <TableCell>
                <DeployIdValue title={transaction.deployId}>
                    {transaction.deployId || "—"}
                </DeployIdValue>
            </TableCell>
            <TableCell>
                <RowActions>
                    {transaction.deployId && (
                        <CopyAction style={{ height: "16px" }}>
                            <CopyButton
                                title="Copy Deploy ID"
                                dataToCopy={transaction.deployId}
                                size={16}
                                CustomCopyIcon={ClipboardIcon}
                            />
                        </CopyAction>
                    )}
                    <DetailsButton
                        id={`history-transaction-details-${transaction.id}`}
                        type="button"
                        title="View details"
                        aria-label={`View details for ${transaction.type} transaction`}
                        onClick={() => onViewDetails(transaction.id)}
                    >
                        <ExternalIcon size={12} />
                    </DetailsButton>
                </RowActions>
            </TableCell>
        </TableRow>
    );
};
