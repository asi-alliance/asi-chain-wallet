import { CSSProperties, ReactElement } from "react";
import styled from "styled-components";
import { Button } from "components/Button";
import { ReloadIcon } from "components/Icons";
import { formatBalanceCard } from "utils/balanceUtils";

interface IAccountBalanceProps {
    balance: string;
    loading?: boolean;
    onRefresh?: () => void;
    isSelected?: boolean;
    style?: CSSProperties;
    refreshButtonId?: string;
}

const AmountBalanceCard = styled.div`
    margin-bottom: 24px;
`;

const AmountBalanceWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const AccountBalanceBlock = styled.span<{ $isSelected: boolean }>`
    font-size: 3rem;
    font-weight: 700;
    color: ${({ $isSelected, theme }) =>
        !$isSelected
            ? theme.colors.primary
            : theme.colors.background.secondary};
    margin-right: 4px;
`;

const AccountCurrency = styled.span<{ $isSelected: boolean }>`
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ $isSelected, theme }) =>
        !$isSelected
            ? theme.colors.primary
            : theme.colors.background.secondary};
`;

const LabelFirst = styled.div<{ $isSelected: boolean }>`
    font-weight: 400;
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

const CustomReloadIcon = styled(ReloadIcon)<{ $isSelected: boolean }>`
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

export const AccountBalance = ({
    balance,
    loading = false,
    onRefresh,
    isSelected = false,
    style,
    refreshButtonId,
}: IAccountBalanceProps): ReactElement => {
    const { amount, currency } = formatBalanceCard(balance);

    return (
        <AmountBalanceCard className="account-balance-card" style={style}>
            <AmountBalanceWrapper className="amount-balance-wrapper">
                <div className="amount-balance-info-wrapper">
                    <AccountBalanceBlock $isSelected={isSelected}>
                        {amount}
                    </AccountBalanceBlock>
                    <AccountCurrency $isSelected={isSelected}>
                        {currency}
                    </AccountCurrency>
                </div>
                <Button
                    id={refreshButtonId}
                    title="Refresh Balance"
                    variant="icon-button-ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRefresh?.();
                    }}
                    loading={loading}
                    withFadeHover
                >
                    <CustomReloadIcon
                        $isSelected={isSelected}
                        color="currentColor"
                    />
                </Button>
            </AmountBalanceWrapper>

            <LabelFirst $isSelected={isSelected}>Balance</LabelFirst>
        </AmountBalanceCard>
    );
};
