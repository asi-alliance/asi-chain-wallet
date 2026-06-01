import { Button } from "components/Button";
import { Card } from "components/Card";
import { ReactElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store";
import { exportAccountKeyfile } from "store/authSlice";
import { removeAccount, selectAccount } from "store/walletSlice";
import styled from "styled-components";
import { Account } from "types/wallet";
import CopyButton from "components/CopyButton";
import { formatBalanceCard } from "utils/balanceUtils";
import { DeleteIcon } from "components/Icons";

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
`;

const AccountHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 26px;
`;

const AccountName = styled.h3<{ isSelected: boolean }>`
    font-size: 20px;
    font-weight: 400;
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.text.primary : theme.colors.background.secondary};
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 250px;
`;

const AccountBalance = styled.div<{ isSelected: boolean }>`
    font-size: 3rem;
    font-weight: 700;
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

const AccountAddress = styled.div<{ isSelected: boolean }>`
    font-size: 12px;
    color: ${({ isSelected, theme }) =>
        !isSelected ? theme.text.primary : theme.colors.background.secondary};
    margin-bottom: 16px;
    word-break: break-all;
`;

const AccountActions = styled.div`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
`;

const RemoveButton = styled(Button)`
    background: ${({ theme }) => theme.colors.background.secondary};
`;

export const AccountCard = ({ account }: IAccountCardProps): ReactElement => {
    const dispatch = useDispatch();

    const { selectedAccount } = useSelector((state: RootState) => state.wallet);
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

    const formatAddress = (address: string) => {
        return `${address.slice(0, 10)}...${address.slice(-8)}`;
    };

    const isUnlocked = unlockedAccounts.some(
        (unlockedAccount: Account) => unlockedAccount.id === account.id,
    );
    const isSelected = selectedAccount?.id === account.id;

    return (
        <AccountCardWrapper
            key={account.id}
            id={`account-card-${account.id}`}
            isSelected={isSelected}
            onClick={() => handleSelectAccount(account.id)}
        >
            <AccountHeader>
                <AccountName isSelected={isSelected} title={account.name}>
                    {account.name}
                </AccountName>

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

            <AccountBalance isSelected={isSelected}>
                {formatBalanceCard(account.balance)}
            </AccountBalance>

            <AccountAddress isSelected={isSelected}>
                {formatAddress(account.revAddress)}
                <CopyButton dataToCopy={account.revAddress} iconSize={15} />
            </AccountAddress>

            <AccountActions>
                {isSelected && (
                    <h5
                        style={{
                            // fontSize: "12px",
                            color: "#7ED321",
                            fontWeight: "600",
                        }}
                    >
                        SELECTED
                    </h5>
                )}
                {isUnlocked && (
                    <h5
                        style={{
                            // fontSize: "12px",
                            color: "#4A90E2",
                            fontWeight: "600",
                            marginLeft: "8px",
                        }}
                    >
                        UNLOCKED
                    </h5>
                )}
                <Button
                    id={`export-account-${account.id}`}
                    variant="ghost"
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleExportKeyfile(account.id);
                    }}
                >
                    <h3>Export</h3>
                </Button>
            </AccountActions>
        </AccountCardWrapper>
    );
};
