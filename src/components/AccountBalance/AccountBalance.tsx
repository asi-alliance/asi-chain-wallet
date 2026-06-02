import { ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { fetchBalance } from "store/walletSlice";
import styled from "styled-components";
import { Button } from "components/Button";
import { ReloadIcon } from "components/Icons";
import { formatBalanceCard } from "utils/balanceUtils";
import { Account } from "types/wallet";

interface IAccountBalanceProps {
    account: Account;
    isSelected?: boolean;
    onBalanceUpdate?: () => void;
}

const AmountBalanceWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const AccountBalanceBlock = styled.span<{ isSelected: boolean }>`
    font-size: 3rem;
    font-weight: 700;
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.colors.primary : theme.colors.background.secondary};
    margin-right: 4px;
`;

const AccountCurrency = styled.span<{ isSelected: boolean }>`
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.colors.primary : theme.colors.background.secondary};
`;

const LabelFirst = styled.div<{ isSelected: boolean }>`
    font-weight: 400;
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

const CustomReloadIcon = styled(ReloadIcon)<{ isSelected: boolean }>`
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

export const AccountBalance = ({
    account,
    isSelected = false,
    onBalanceUpdate,
}: IAccountBalanceProps): ReactElement => {
    const dispatch = useDispatch();
    const { selectedNetwork, isLoading } = useSelector(
        (state: RootState) => state.wallet,
    );

    const { amount, currency } = formatBalanceCard(account.balance);

    const handleRefreshBalance = () => {
        dispatch(
            fetchBalance({
                account,
                network: selectedNetwork,
                forceRefresh: true,
            }) as any,
        );
        onBalanceUpdate?.();
    };

    return (
        <div className="account-balance-card">
            <AmountBalanceWrapper className="amount-balance-wrapper">
                <div className="amount-balance-info-wrapper">
                    <AccountBalanceBlock isSelected={isSelected}>
                        {amount}
                    </AccountBalanceBlock>
                    <AccountCurrency isSelected={isSelected}>
                        {currency}
                    </AccountCurrency>
                </div>
                <Button
                    id={`refresh-balance-account-${account.id}`}
                    variant="icon-button-ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRefreshBalance();
                    }}
                    loading={isLoading}
                >
                    <CustomReloadIcon
                        isSelected={isSelected}
                        color="currentColor"
                    />
                </Button>
            </AmountBalanceWrapper>

            <LabelFirst
                style={{ marginBottom: "24px" }}
                isSelected={isSelected}
            >
                Balance
            </LabelFirst>
        </div>
    );
};
