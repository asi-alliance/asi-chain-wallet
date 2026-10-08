import { FC } from "react";
import styled from "styled-components";
import CopyButton from "components/CopyButton";

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

interface ITransactionFieldProps {
    value: string;
    copyTitle: string;
}

export const TransactionField: FC<ITransactionFieldProps> = ({
    value,
    copyTitle,
}) => (
    <DetailsCell>
        <MonoValue title={value}>{value || "—"}</MonoValue>
        {value && <CopyButton title={copyTitle} dataToCopy={value} size={16} />}
    </DetailsCell>
);
