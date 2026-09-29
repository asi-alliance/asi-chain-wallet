import { CSSProperties, ReactElement } from "react";
import styled from "styled-components";
import { Button } from "components/Button";
import { ReloadIcon } from "components/Icons";
import { BALANCE_PLACEHOLDER, formatBalanceCard } from "utils/balanceUtils";

interface IAccountBalanceProps {
    balance?: string;
    loading?: boolean;
    onRefresh?: () => void;
    isSelected?: boolean;
    /** Dark amount text for surface cards (Wallet Current); default is brand green. */
    neutralAmount?: boolean;
    style?: CSSProperties;
    refreshButtonId?: string;
    refreshAriaLabel?: string;
}

const AmountBalanceCard = styled.div`
    margin-bottom: 24px;
`;

const AmountBalanceWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const amountColor = ({
    $isSelected,
    $neutralAmount,
    theme,
}: {
    $isSelected: boolean;
    $neutralAmount: boolean;
    theme: {
        colors: { primary: string; background: { secondary: string } };
        text: { primary: string };
    };
}): string => {
    if ($isSelected) {
        return theme.colors.background.secondary;
    }

    return $neutralAmount ? theme.text.primary : theme.colors.primary;
};

const AccountBalanceBlock = styled.span<{
    $isSelected: boolean;
    $neutralAmount: boolean;
}>`
    font-size: 3rem;
    font-weight: 700;
    color: ${amountColor};
    margin-right: 4px;
`;

const AccountCurrency = styled.span<{
    $isSelected: boolean;
    $neutralAmount: boolean;
}>`
    font-size: 1.5rem;
    font-weight: 700;
    color: ${amountColor};
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
    neutralAmount = false,
    style,
    refreshButtonId,
    refreshAriaLabel = "Refresh Balance",
}: IAccountBalanceProps): ReactElement => {
    const { amount, currency } = formatBalanceCard(balance ?? "0");

    return (
        <AmountBalanceCard className="account-balance-card" style={style}>
            <AmountBalanceWrapper className="amount-balance-wrapper">
                <div className="amount-balance-info-wrapper">
                    <AccountBalanceBlock
                        $isSelected={isSelected}
                        $neutralAmount={neutralAmount}
                    >
                        {balance === undefined ? BALANCE_PLACEHOLDER : amount}
                    </AccountBalanceBlock>
                    <AccountCurrency
                        $isSelected={isSelected}
                        $neutralAmount={neutralAmount}
                    >
                        {currency}
                    </AccountCurrency>
                </div>
                <Button
                    id={refreshButtonId}
                    title={refreshAriaLabel}
                    aria-label={refreshAriaLabel}
                    variant="icon-button-ghost"
                    disabled={!onRefresh}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRefresh?.();
                    }}
                    loading={loading}
                    spinIconOnLoading
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
