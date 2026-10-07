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
import { FileCopyIcon } from "components/Icons";

interface IAccountCardProps {
    account: IUnlockedAccountMeta;
    fullMode?: boolean;
    className?: string;
    onRequestDelete?: (request: TRemoveAccountRequest) => void;
}

export const ACCOUNT_CARD_WIDTH_PX = 462;

// Soft organic wash approximating Current Wallet card pattern (no separate asset in repo).
const walletSurfacePattern = css`
    background-color: ${({ theme }) => theme.card};
    background-image:
        radial-gradient(
            ellipse 42% 36% at 12% 18%,
            ${({ theme }) => theme.primarySubtle} 0%,
            transparent 70%
        ),
        radial-gradient(
            ellipse 48% 40% at 78% 22%,
            ${({ theme }) => theme.primaryMuted} 0%,
            transparent 72%
        ),
        radial-gradient(
            ellipse 55% 45% at 40% 78%,
            ${({ theme }) => theme.primarySubtle} 0%,
            transparent 75%
        ),
        radial-gradient(
            ellipse 36% 32% at 88% 72%,
            ${({ theme }) => theme.primarySubtle} 0%,
            transparent 70%
        );
`;

const AccountCardWrapper = styled(Card)<{
    $isSelected: boolean;
    $fullMode: boolean;
}>`
    border: 1px solid
        ${({ $isSelected, $fullMode, theme }) =>
            !$fullMode || $isSelected ? theme.primary : theme.border};
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

    ${({ $fullMode, $isSelected, theme }) =>
        $fullMode
            ? css`
                  background-color: ${!$isSelected
                      ? theme.colors.background.secondary
                      : theme.primary};
              `
            : walletSurfacePattern}

    &:hover {
        border-color: ${({ theme }) => theme.primary};
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        max-width: none;
    }
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

const DerivationIndex = styled.div<{ $isSelected: boolean }>`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    line-height: ${({ theme }) => theme.typography.lineHeight.xs};
    color: ${({ $isSelected, theme }) =>
        !$isSelected
            ? theme.text.secondary
            : theme.colors.background.secondary};
    margin: -${({ theme }) => theme.spacing.lg} 0
        ${({ theme }) => theme.spacing.xl};
`;

const LabelSecond = styled.span<{ $isSelected: boolean; $compact?: boolean }>`
    font-weight: 400;
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.primary : theme.colors.background.secondary};
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

const LabelThird = styled.div<{ $isSelected: boolean }>`
    font-weight: 400;
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ $isSelected, theme }) =>
        !$isSelected
            ? theme.text.secondary
            : theme.colors.background.secondary};
`;

const AccountCardFooter = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.lg};
`;

const AccountAddress = styled.div<{ $isSelected: boolean; $compact: boolean }>`
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.primary : theme.colors.background.secondary};
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
        color: ${({ $isSelected, theme }) =>
            !$isSelected
                ? theme.text.primary
                : theme.colors.background.secondary};
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
    // Filled green selection is Accounts-only; Wallet compact uses surface + border.
    const filledSelection = fullMode && isSelected;
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
            $fullMode={fullMode}
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
            <AccountHeader $fullMode={fullMode}>
                <AccountNameEditor
                    disabled={!isUnlocked}
                    accountId={account.id}
                    isSelected={filledSelection}
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
                <DerivationIndex $isSelected={filledSelection}>
                    <span aria-hidden="true">
                        <FileCopyIcon size={14} color="currentColor" />
                    </span>
                    {`ID:${account.index}`}
                </DerivationIndex>
            )}

            <ASIAccountBalance
                account={account}
                isSelected={filledSelection}
                neutralAmount={!fullMode}
            />

            <AccountCardFooter>
                <AccountAddress
                    $isSelected={filledSelection}
                    $compact={!fullMode}
                >
                    <LabelThird $isSelected={filledSelection}>
                        ASI Address
                    </LabelThird>
                    <AddressValueRow>
                        <LabelSecond
                            style={{ marginRight: 0, lineHeight: "27px" }}
                            $isSelected={filledSelection}
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
