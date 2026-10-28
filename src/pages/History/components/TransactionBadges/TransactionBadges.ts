import styled from "styled-components";
import { TransactionStatus, TransactionType } from "@asichain/asi-wallet-sdk";

export const StatusBadge = styled.span<{ $status: TransactionStatus }>`
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

export const TypeBadge = styled.span<{ $type: TransactionType }>`
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
