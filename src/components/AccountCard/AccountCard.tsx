import styled from "styled-components";
import CopyButton from "components/CopyButton";
import { AccountNameEditor } from "components/AccountNameEditor/AccountNameEditor";
import { RemoveAccountButton } from "components/RemoveAccountButton";
import { DownloadIcon, LockPassIcon } from "components/Icons";
import { buildUrlWithParams } from "utils/navigationUtils";
import { AccountBalance } from "components/AccountBalance";
import { useDispatch, useSelector } from "react-redux";
import { exportAccountKeyfile } from "store/authSlice";
import { selectAccount } from "store/walletSlice";
import { useNavigate } from "react-router-dom";
import { Button } from "components/Button";
import { Card } from "components/Card";
import { Account } from "types/wallet";
import { ReactElement } from "react";
import { RootState } from "store";

interface IAccountCardProps {
    account: Account;
    fullMode?: boolean;
    className?: string;
}

const AccountCardWrapper = styled(Card)<{ $isSelected: boolean }>`
    border: ${({ $isSelected, theme }) =>
        !$isSelected
            ? `1px solid ${theme.border}`
            : `1px solid ${theme.primary}`};
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 26px 16px;
    background-color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.colors.background.secondary : theme.primary};
    min-width: 462px;
    overflow: auto;

    box-shadow: ${({ theme }) => theme.shadowDrop};

    &:hover {
        border-color: ${({ theme }) => theme.primary};
    }

    @media (max-width: 768px) {
        min-width: auto;
    }
`;

const AccountHeader = styled.div<{ $fullMode: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 26px;
    gap: 16px;

    ${({ $fullMode }) =>
        $fullMode &&
        `
             & > :first-child {
        flex: 1;
        min-width: 0;
    }

    & > :last-child {
        flex-shrink: 0;
        flex-grow: 0;
    }
        `}
`;

const LabelSecond = styled.span<{ $isSelected: boolean }>`
    font-weight: 400;
    font-size: 0.75rem;
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

const LabelThird = styled.div<{ $isSelected: boolean }>`
    font-weight: 400;
    font-size: 0.5rem;
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

const AccountCardFooter = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
`;

const AccountAddress = styled.div<{ $isSelected: boolean }>`
    font-size: 12px;
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.primary : theme.colors.background.secondary};
    word-break: break-all;

    button {
        color: ${({ $isSelected, theme }) =>
            !$isSelected
                ? theme.text.primary
                : theme.colors.background.secondary};
    }
`;

const ActionButton = styled(Button)<{ $isSelected: boolean }>`
    color: ${({ $isSelected, theme }) =>
        !$isSelected
            ? theme.colors.primary
            : theme.colors.background.secondary};
    border-width: 2px;
`;

const AccountActions = styled.div`
    display: flex;
    gap: 16px;
    justify-content: flex-end;
`;

export const AccountCard = ({
    account,
    fullMode = true,
    className = "",
}: IAccountCardProps): ReactElement => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { selectedAccount } = useSelector((state: RootState) => state.wallet);
    const { unlockedAccounts } = useSelector((state: RootState) => state.auth);

    const handleSelectAccount = (accountId: string) => {
        dispatch(selectAccount(accountId));
    };

    const handleExportKeyfile = (accountId: string) => {
        dispatch(exportAccountKeyfile({ accountId }) as any);
    };

    const formatAddress = (
        address: string,
        { visibleSymbolsCount = 16, isFullMode = false } = {},
    ) => {
        if (isFullMode) {
            return address;
        }

        return `${address.slice(0, visibleSymbolsCount)}...${address.slice(-visibleSymbolsCount)}`;
    };

    const isUnlocked = unlockedAccounts.some(
        (unlockedAccount: Account) => unlockedAccount.id === account.id,
    );
    const isSelected = selectedAccount?.id === account.id;

    return (
        <AccountCardWrapper
            key={account.id}
            id={`account-$card-${account.id}`}
            $isSelected={isSelected}
            className={className}
            onClick={() => handleSelectAccount(account.id)}
        >
            <AccountHeader $fullMode={fullMode}>
                <AccountNameEditor accountId={account.id} />

                {fullMode && <RemoveAccountButton account={account} />}
            </AccountHeader>

            <AccountBalance account={account} isSelected={isSelected} />

            <AccountCardFooter>
                <AccountAddress $isSelected={isSelected}>
                    <LabelThird
                        $isSelected={isSelected}
                    >{`ASI Address`}</LabelThird>
                    <LabelSecond
                        style={{ marginRight: 10, lineHeight: "27px" }}
                        $isSelected={isSelected}
                    >
                        {formatAddress(account.revAddress, {
                            isFullMode: !fullMode,
                        })}
                    </LabelSecond>
                    <CopyButton dataToCopy={account.revAddress} size={15} />
                </AccountAddress>

                {fullMode && (
                    <AccountActions>
                        {!isUnlocked && (
                            <ActionButton
                                $isSelected={isSelected}
                                id={`unlock-account-${account.id}`}
                                variant="icon-button"
                                withBorderColorHover={false}
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
                                withFadeHover
                            >
                                <LockPassIcon />
                            </ActionButton>
                        )}
                        <ActionButton
                            $isSelected={isSelected}
                            id={`export-account-${account.id}`}
                            variant="icon-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExportKeyfile(account.id);
                            }}
                            withBorderColorHover={false}
                            withFadeHover
                        >
                            <DownloadIcon size={24} />
                        </ActionButton>
                    </AccountActions>
                )}
            </AccountCardFooter>
        </AccountCardWrapper>
    );
};
