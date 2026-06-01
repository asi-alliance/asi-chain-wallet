import { Button } from "components/Button";
import { Card } from "components/Card";
import { ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { exportAccountKeyfile } from "store/authSlice";
import {
    fetchBalance,
    removeAccount,
    selectAccount,
    updateAccountName,
} from "store/walletSlice";
import styled from "styled-components";
import { Account } from "types/wallet";
import CopyButton from "components/CopyButton";
import { formatBalanceCard } from "utils/balanceUtils";
import {
    DeleteIcon,
    DownloadIcon,
    LockPassIcon,
    ReloadIcon,
} from "components/Icons";
import { useNavigate } from "react-router-dom";
import { buildUrlWithParams } from "utils/navigationUtils";
import { EditableLabel } from "components/EditableLabel";

interface IAccountCardProps {
    account: Account;
}

const AccountCardWrapper = styled(Card)<{ isSelected: boolean }>`
    border: 2px solid ${({ theme }) => theme.border};
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 26px 16px;
    background-color: ${({ isSelected, theme }) =>
        !isSelected ? theme.colors.background.secondary : theme.primary};
    min-width: 462px;

    box-shadow: ${({ theme }) => theme.shadowDrop};

    &:hover {
        border-color: ${({ theme }) => theme.primary};
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        min-width: auto;
    }
`;

const AccountHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 26px;
`;

const CustomEditableLabel = styled(EditableLabel)<{ isSelected: boolean }>`
    font-size: 1.25rem !important;
    font-weight: 400 !important;
    color: ${({ isSelected, theme }) =>
        !isSelected
            ? theme.text.primary
            : theme.colors.background.secondary} !important;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 250px;
`;

const AccountBalance = styled.span<{ isSelected: boolean }>`
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

const LabelSecond = styled.span<{ isSelected: boolean }>`
    font-weight: 400;
    font-size: 0.75rem;
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

const LabelThird = styled.div<{ isSelected: boolean }>`
    font-weight: 400;
    font-size: 0.5rem;
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

const AmountBalanceWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const AccountCardFooter = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
`;

const AccountAddress = styled.div<{ isSelected: boolean }>`
    font-size: 12px;
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.text.primary : theme.colors.background.secondary};
    word-break: break-all;

    button {
        color: ${({ isSelected, theme }) =>
            !isSelected
                ? theme.text.primary
                : theme.colors.background.secondary};
    }
`;

const ActionButton = styled(Button)<{ isSelected: boolean }>`
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.colors.primary : theme.colors.background.secondary};
    border-width: 2px;
`;

const CustomReloadIcon = styled(ReloadIcon)<{ isSelected: boolean }>`
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

const AccountActions = styled.div`
    display: flex;
    gap: 16px;
    justify-content: flex-end;
`;

const RemoveButton = styled(Button)`
    background: ${({ theme }) => theme.colors.background.secondary};
`;

export const AccountCard = ({ account }: IAccountCardProps): ReactElement => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { selectedAccount, selectedNetwork, isLoading } = useSelector(
        (state: RootState) => state.wallet,
    );
    const { unlockedAccounts } = useSelector((state: RootState) => state.auth);

    const handleSelectAccount = (accountId: string) => {
        dispatch(selectAccount(accountId));
    };

    const handleRemoveAccount = (accountId: string) => {
        if (window.confirm("Are you sure you want to remove this account?")) {
            dispatch(removeAccount(accountId));
        }
    };

    const handleExportKeyfile = (accountId: string) => {
        dispatch(exportAccountKeyfile({ accountId }) as any);
    };

    const formatAddress = (address: string, visibleSymbolsCount = 16) => {
        return `${address.slice(0, visibleSymbolsCount)}...${address.slice(-visibleSymbolsCount)}`;
    };

    const isUnlocked = unlockedAccounts.some(
        (unlockedAccount: Account) => unlockedAccount.id === account.id,
    );
    const isSelected = selectedAccount?.id === account.id;

    const { amount, currency } = formatBalanceCard(account.balance);

    const handleRefreshBalance = () => {
        dispatch(
            fetchBalance({
                account,
                network: selectedNetwork,
                forceRefresh: true,
            }) as any,
        );
    };

    const handleUpdateAccountName = (newName: string) => {
        dispatch(
            updateAccountName({
                accountId: account.id,
                name: newName,
            }),
        );
    };

    return (
        <AccountCardWrapper
            key={account.id}
            id={`account-card-${account.id}`}
            isSelected={isSelected}
            onClick={() => handleSelectAccount(account.id)}
        >
            <AccountHeader>
                <CustomEditableLabel
                    label={account.name}
                    onChange={handleUpdateAccountName}
                    isSelected={isSelected}
                    title={account.name}
                />

                <RemoveButton
                    id={`remove-account-${account.id}`}
                    variant="icon-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAccount(account.id);
                    }}
                >
                    <DeleteIcon />
                </RemoveButton>
            </AccountHeader>

            <AmountBalanceWrapper className="amount-balance-wrapper">
                <div className="amount-balance-info-wrapper">
                    <AccountBalance isSelected={isSelected}>
                        {amount}
                    </AccountBalance>
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
            >{`Balance`}</LabelFirst>

            <AccountCardFooter>
                <AccountAddress isSelected={isSelected}>
                    <LabelThird
                        isSelected={isSelected}
                    >{`ASI Address`}</LabelThird>
                    <LabelSecond
                        style={{ marginRight: 10, lineHeight: "27px" }}
                        isSelected={isSelected}
                    >
                        {formatAddress(account.revAddress)}
                    </LabelSecond>
                    <CopyButton dataToCopy={account.revAddress} iconSize={15} />
                </AccountAddress>

                <AccountActions>
                    {!isUnlocked && (
                        <ActionButton
                            isSelected={isSelected}
                            id={`unlock-account-${account.id}`}
                            variant="icon-button"
                            onClick={(e) => {
                                e.stopPropagation();

                                navigate(
                                    buildUrlWithParams("/login", {
                                        queryParams: [
                                            {
                                                key: "id",
                                                value: account.id,
                                            },
                                            {
                                                key: "redirectUrl",
                                                value: "/accounts",
                                            },
                                        ],
                                    }),
                                );
                            }}
                        >
                            <LockPassIcon />
                        </ActionButton>
                    )}
                    <ActionButton
                        isSelected={isSelected}
                        id={`export-account-${account.id}`}
                        variant="icon-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleExportKeyfile(account.id);
                        }}
                    >
                        <DownloadIcon size={24} />
                    </ActionButton>
                </AccountActions>
            </AccountCardFooter>
        </AccountCardWrapper>
    );
};
