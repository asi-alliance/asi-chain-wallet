import styled from "styled-components";
import CopyButton from "components/CopyButton";
import { AccountNameEditor } from "components/AccountNameEditor/AccountNameEditor";
import { RemoveAccountButton } from "components/RemoveAccountButton";
import { ASIAccountBalance } from "components/ASIAccountBalance";
import { useDispatch, useSelector } from "react-redux";
import {
    selectAccount,
    selectIsAccountUnlocked,
    selectSelectedAccountId,
    selectWalletByAccountId,
} from "store/WalletsStore";
import { Card } from "components/Card";
import { IUnlockedAccountMeta } from "types/wallet";
import { WalletTypes } from "@asichain/asi-wallet-sdk";
import { ReactElement } from "react";
import { RootState } from "store";

interface IAccountCardProps {
    account: IUnlockedAccountMeta;
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

const AccountHeader = styled.div<{ $fullMode: boolean; $isActions: boolean }>`
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
        `}

    ${({ $isActions }) =>
        $isActions &&
        `
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

export const AccountCard = ({
    account,
    fullMode = true,
    className = "",
}: IAccountCardProps): ReactElement => {
    const dispatch = useDispatch();

    const selectedAccountId = useSelector(selectSelectedAccountId);
    const isUnlocked = useSelector((state: RootState) =>
        selectIsAccountUnlocked(state, account.id),
    );
    const ownerWallet = useSelector((state: RootState) =>
        selectWalletByAccountId(state, account.id),
    );

    const canRemoveAccount = ownerWallet?.type !== WalletTypes.PRIVATE_KEY;

    const handleSelectAccount = (accountId: string) => {
        dispatch(selectAccount(accountId));
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

    const isSelected = selectedAccountId === account.id;

    return (
        <AccountCardWrapper
            key={account.id}
            id={`account-$card-${account.id}`}
            $isSelected={isSelected}
            className={className}
            onClick={() => handleSelectAccount(account.id)}
        >
            <AccountHeader
                $fullMode={fullMode}
                $isActions={fullMode && canRemoveAccount}
            >
                <AccountNameEditor
                    disabled={!isUnlocked}
                    accountId={account.id}
                />

                {fullMode && canRemoveAccount && (
                    <RemoveAccountButton accountId={account.id} />
                )}
            </AccountHeader>

            <ASIAccountBalance account={account} isSelected={isSelected} />

            <AccountCardFooter>
                <AccountAddress $isSelected={isSelected}>
                    <LabelThird
                        $isSelected={isSelected}
                    >{`ASI Address`}</LabelThird>
                    <LabelSecond
                        style={{ marginRight: 10, lineHeight: "27px" }}
                        $isSelected={isSelected}
                    >
                        {formatAddress(account.address, {
                            isFullMode: !fullMode,
                        })}
                    </LabelSecond>
                    <CopyButton
                        dataToCopy={account.address}
                        size={15}
                        title="Copy Address"
                    />
                </AccountAddress>
            </AccountCardFooter>
        </AccountCardWrapper>
    );
};
