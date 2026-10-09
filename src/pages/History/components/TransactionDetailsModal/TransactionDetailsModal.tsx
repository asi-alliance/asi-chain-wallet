import { FC } from "react";
import styled from "styled-components";
import { ModalWindow } from "components";
import { Transaction } from "types/transactions";
import { formatTransactionAmount } from "utils/transactionUtils";
import { StatusBadge, TypeBadge } from "../TransactionBadges";
import { TransactionField } from "../TransactionField";

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

interface ITransactionDetailsModalProps {
    transaction: Transaction | null;
    onClose: () => void;
}

export const TransactionDetailsModal: FC<ITransactionDetailsModalProps> = ({
    transaction,
    onClose,
}) => (
    <ModalWindow
        isOpen={Boolean(transaction)}
        onClose={onClose}
        title="Transaction details"
        maxWidth="480px"
    >
        {transaction && (
            <>
                <DetailField>
                    <DetailFieldLabel>Type</DetailFieldLabel>
                    <TypeBadge $type={transaction.type}>
                        {transaction.type}
                    </TypeBadge>
                </DetailField>
                <DetailField>
                    <DetailFieldLabel>Status</DetailFieldLabel>
                    <StatusBadge $status={transaction.status}>
                        {transaction.status}
                    </StatusBadge>
                </DetailField>
                <DetailField>
                    <DetailFieldLabel>Amount</DetailFieldLabel>
                    <span>{formatTransactionAmount(transaction.amount)}</span>
                </DetailField>
                <DetailField>
                    <DetailFieldLabel>From</DetailFieldLabel>
                    <TransactionField
                        value={transaction.from}
                        copyTitle="Copy sender address"
                    />
                </DetailField>
                <DetailField>
                    <DetailFieldLabel>To</DetailFieldLabel>
                    <TransactionField
                        value={transaction.to}
                        copyTitle="Copy recipient address"
                    />
                </DetailField>
                <DetailField>
                    <DetailFieldLabel>Deploy ID</DetailFieldLabel>
                    {transaction.deployId ? (
                        <TransactionField
                            value={transaction.deployId}
                            copyTitle="Copy Deploy ID"
                        />
                    ) : (
                        <span>—</span>
                    )}
                </DetailField>
            </>
        )}
    </ModalWindow>
);
