import { ReactElement } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import {
    BALANCE_PLACEHOLDER,
    formatBalanceCompact,
    formatBalanceExact,
} from "utils/balanceUtils";
import { selectSelectedNetworkId, selectSelectedNetworkKey } from "store/WalletsStore";
import { useGetBalanceQuery } from "store/WalletsStore/api";

const LoadingSpinner = styled.span`
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 6px;
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
`;

interface IAccountBalanceValueProps {
    accountId: string;
}

export const AccountBalanceValue = ({
    accountId,
}: IAccountBalanceValueProps): ReactElement => {
    const networkId = useSelector(selectSelectedNetworkId);
    const networkKey = useSelector(selectSelectedNetworkKey);
    const { currentData: balance, isFetching } = useGetBalanceQuery({
        accountId,
        networkId,
        networkKey,
    });

    return (
        <>
            {isFetching && <LoadingSpinner />}
            <span title={balance === undefined ? undefined : formatBalanceExact(balance)}>
                {balance === undefined
                    ? BALANCE_PLACEHOLDER
                    : formatBalanceCompact(balance)}
            </span>
        </>
    );
};
