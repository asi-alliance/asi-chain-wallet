import styled, { css } from "styled-components";
import CopyButton from "components/CopyButton";
import { AccountNameEditor } from "components/AccountNameEditor/AccountNameEditor";
import {
    RemoveAccountButton,
    TRemoveAccountRequest,
} from "components/RemoveAccountButton";
import { ASIAccountBalance } from "components/ASIAccountBalance";
import { useSelector } from "react-redux";
import {
    selectIsAccountUnlocked,
    selectSelectedAccountId,
    selectWalletByAccountId,
} from "store/WalletsStore";
import { Card } from "components/Card";
import { IUnlockedAccountMeta } from "types/wallet";
import { WalletTypes } from "@asichain/asi-wallet-sdk";
import { KeyboardEvent, MouseEvent, ReactElement } from "react";
import { RootState } from "store";
import { selectAccount } from "store/WalletsStore/thunks";
import { useAppDispatch } from "store/hooks";
import { AccountCardBackground, FileCopyIcon } from "components/Icons";

interface IAccountCardProps {
    account: IUnlockedAccountMeta;
    fullMode?: boolean;
    className?: string;
    onRequestDelete?: (request: TRemoveAccountRequest) => void;
}

export const ACCOUNT_CARD_WIDTH_PX = 462;

const AccountCardWrapper = styled(Card)<{ $isSelected: boolean }>`
    border: ${({ $isSelected }) => ($isSelected ? "3px" : "1px")} solid
        ${({ theme }) => theme.primary};
    cursor: pointer;
    transition:
        border-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        background-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing};
    padding: ${({ theme }) => theme.spacing["3xl"]}
        ${({ theme }) => theme.spacing.xl};
    width: 100%;
    max-width: ${ACCOUNT_CARD_WIDTH_PX}px;
    overflow: visible;
    box-shadow: ${({ theme }) => theme.shadowDrop};
    background-color: ${({ theme }) => theme.card};
    isolation: isolate;

    &:hover {
        border-color: ${({ theme }) => theme.primary};
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        max-width: none;

        .amount-balance-info-wrapper > span:first-child {
            font-size: ${({ theme }) => theme.typography.size.display};
        }
    }
`;

const CardBackground = styled(AccountCardBackground)<{ $isSelected: boolean }>`
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    color: ${({ $isSelected, theme }) =>
        $isSelected ? theme.primaryMuted : theme.primarySubtle};
    transition: color ${({ theme }) => theme.motion.normal}
        ${({ theme }) => theme.motion.easing};
    pointer-events: none;
`;

const AccountHeader = styled.div<{ $fullMode: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${({ theme }) => theme.spacing["2xl"]};
    gap: ${({ theme }) => theme.spacing.xl};

    ${({ $fullMode }) =>
        $fullMode &&
        `
        & > :first-child {
            flex: 1;
            min-width: 0;
        }
    `}
`;

const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};
    flex-shrink: 0;
`;

const DerivationIndex = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
    color: ${({ theme }) => theme.control.neutralText};
    margin: -${({ theme }) => theme.spacing.lg} 0
        ${({ theme }) => theme.spacing.xl};
`;

const LabelSecond = styled.span<{ $compact?: boolean }>`
    font-weight: 400;
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ theme }) => theme.text.primary};
    ${({ $compact }) =>
        $compact &&
        css`
            flex: 0 1 auto;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `}
`;

const LabelThird = styled.div`
    font-weight: 400;
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ theme }) => theme.control.neutralText};
`;

const AccountCardFooter = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.lg};
`;

const AccountAddress = styled.div<{ $compact: boolean }>`
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ theme }) => theme.text.primary};
    min-width: 0;
    flex: 1;

    ${({ $compact }) =>
        $compact
            ? css`
                  word-break: normal;
              `
            : css`
                  word-break: break-all;
              `}

    button {
        color: ${({ theme }) => theme.text.primary};
        flex-shrink: 0;
    }
`;

const AddressValueRow = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    min-width: 0;
`;

const AddressCopyAction = styled.span`
    display: inline-flex;
    flex-shrink: 0;

    .copy-container {
        display: inline-flex;
    }

    .copy-button {
        position: static;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 4px;
        transform: none;
    }

    .copy-button:hover {
        transform: none;
    }
`;

const stopCardActivation = (event: MouseEvent): void => {
    event.stopPropagation();
};

export const AccountCard = ({
    account,
    fullMode = true,
    className = "",
    onRequestDelete,
}: IAccountCardProps): ReactElement => {
    const dispatch = useAppDispatch();

    const selectedAccountId = useSelector(selectSelectedAccountId);
    const isUnlocked = useSelector((state: RootState) =>
        selectIsAccountUnlocked(state, account.id),
    );
    const ownerWallet = useSelector((state: RootState) =>
        selectWalletByAccountId(state, account.id),
    );

    const handleSelectAccount = (accountId: string) => {
        dispatch(selectAccount(accountId));
    };

    const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        // Only when the card itself is focused — nested inputs/buttons keep their keys.
        if (event.target !== event.currentTarget) {
            return;
        }

        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        event.preventDefault();
        handleSelectAccount(account.id);
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
    const showDerivationIndex =
        fullMode &&
        ownerWallet?.type === WalletTypes.HD &&
        account.index !== null &&
        account.index !== undefined;

    return (
        <AccountCardWrapper
            key={account.id}
            id={`account-card-${account.id}`}
            data-testid={`account-card-${account.id}`}
            $isSelected={isSelected}
            className={className}
            role="group"
            tabIndex={0}
            aria-label={
                isSelected
                    ? `${account.name}, active account`
                    : `${account.name}, account`
            }
            onClick={() => handleSelectAccount(account.id)}
            onKeyDown={handleCardKeyDown}
            aria-current={isSelected ? "true" : undefined}
        >
            <CardBackground $isSelected={isSelected} />
            <AccountHeader $fullMode={fullMode}>
                <AccountNameEditor
                    disabled={!isUnlocked}
                    accountId={account.id}
                    isSelected={false}
                />

                <HeaderActions onClick={stopCardActivation}>
                    {fullMode && isUnlocked && onRequestDelete && (
                        <RemoveAccountButton
                            accountId={account.id}
                            onRequestDelete={onRequestDelete}
                        />
                    )}
                </HeaderActions>
            </AccountHeader>

            {showDerivationIndex && (
                <DerivationIndex>
                    <span aria-hidden="true">
                        <FileCopyIcon size={14} color="currentColor" />
                    </span>
                    {`ID:${account.index}`}
                </DerivationIndex>
            )}

            <ASIAccountBalance account={account} neutralAmount />

            <AccountCardFooter>
                <AccountAddress $compact={!fullMode}>
                    <LabelThird>ASI Address</LabelThird>
                    <AddressValueRow>
                        <LabelSecond
                            style={{ marginRight: 0, lineHeight: "27px" }}
                            $compact={!fullMode}
                            title={account.address}
                        >
                            {formatAddress(account.address, {
                                // Compact Wallet: full string + CSS ellipsis (Current p26/p27).
                                // Accounts: truncated middle form.
                                isFullMode: !fullMode,
                            })}
                        </LabelSecond>
                        <AddressCopyAction onClick={stopCardActivation}>
                            <CopyButton
                                dataToCopy={account.address}
                                size={15}
                                title={`Copy address, ${account.name}`}
                            />
                        </AddressCopyAction>
                    </AddressValueRow>
                </AccountAddress>
            </AccountCardFooter>
        </AccountCardWrapper>
    );
};
