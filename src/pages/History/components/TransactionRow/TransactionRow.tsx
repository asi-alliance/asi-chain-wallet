import { FC } from "react";
import styled from "styled-components";
import { Button } from "components";
import { Transaction } from "types/transactions";
import { formatTransactionAmount } from "utils/transactionUtils";
import { formatDateParts } from "utils/formatDateParts";
import { StatusBadge, TypeBadge } from "../TransactionBadges";
import { TransactionField } from "../TransactionField";

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

const DateValue = styled.time`
    color: ${({ theme }) => theme.text.secondary};
`;

const TimeValue = styled.time`
    display: block;
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
`;

const RowActionButton = styled(Button)`
    min-width: 0;
    padding-inline: ${({ theme }) => theme.spacing.md};
`;

interface ITransactionRowProps {
    transaction: Transaction;
    isMobile: boolean;
    onViewDetails: (transactionId: string) => void;
}

export const TransactionRow: FC<ITransactionRowProps> = ({
    transaction,
    isMobile,
    onViewDetails,
}) => {
    const { dateTime, date, time } = formatDateParts(transaction.timestamp);

    return (
        <TableRow id={`history-transaction-row-${transaction.id}`}>
            <TableCell>
                <DateValue dateTime={dateTime}>{date}</DateValue>
                <TimeValue dateTime={dateTime}>{time}</TimeValue>
            </TableCell>
            <TableCell>
                <TypeBadge $type={transaction.type}>{transaction.type}</TypeBadge>
            </TableCell>
            <TableCell>
                <StatusBadge $status={transaction.status}>
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
                        onClick={() => onViewDetails(transaction.id)}
                    >
                        View
                    </RowActionButton>
                </TableCell>
            ) : (
                <>
                    <TableCell>
                        <TransactionField
                            value={transaction.from}
                            copyTitle="Copy sender address"
                        />
                    </TableCell>
                    <TableCell>
                        <TransactionField
                            value={transaction.to}
                            copyTitle="Copy recipient address"
                        />
                    </TableCell>
                    <TableCell>
                        {formatTransactionAmount(transaction.amount)}
                    </TableCell>
                    <TableCell>
                        {transaction.deployId ? (
                            <TransactionField
                                value={transaction.deployId}
                                copyTitle="Copy Deploy ID"
                            />
                        ) : (
                            "—"
                        )}
                    </TableCell>
                </>
            )}
        </TableRow>
    );
};
