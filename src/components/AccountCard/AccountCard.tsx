import styled from "styled-components";
import CopyButton from "components/CopyButton";
import { AccountNameEditor } from "components/AccountNameEditor/AccountNameEditor";
import {
    IDeleteAccountRequest,
    RemoveAccountButton,
} from "components/RemoveAccountButton";
import { ASIAccountBalance } from "components/ASIAccountBalance";
import { useSelector } from "react-redux";
import {
    selectIsAccountUnlocked,
    selectSelectedAccountId,
    selectWalletByAccountId,
} from "store/WalletsStore";
import { Card } from "components/Card";
import { Button } from "components/Button";
import { IUnlockedAccountMeta } from "types/wallet";
import { WalletTypes } from "@asichain/asi-wallet-sdk";
import { KeyboardEvent, MouseEvent, ReactElement } from "react";
import { RootState } from "store";
import { selectAccount } from "store/WalletsStore/thunks";
import { useAppDispatch } from "store/hooks";
import { DownloadIcon, FileCopyIcon } from "components/Icons";

interface IAccountCardProps {
    account: IUnlockedAccountMeta;
    fullMode?: boolean;
    className?: string;
    onRequestDeleteWallet?: (message: string) => void;
    onRequestDeleteAccount?: (request: IDeleteAccountRequest) => void;
    onRequestExportWallet?: () => void;
}

export const ACCOUNT_CARD_WIDTH_PX = 462;

const AccountCardWrapper = styled(Card)<{ $isSelected: boolean }>`
    border: ${({ $isSelected, theme }) =>
        !$isSelected
            ? `1px solid ${theme.border}`
            : `1px solid ${theme.primary}`};
    cursor: pointer;
    transition:
        border-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing},
        background-color ${({ theme }) => theme.motion.normal}
            ${({ theme }) => theme.motion.easing};
    padding: ${({ theme }) => theme.spacing["3xl"]}
        ${({ theme }) => theme.spacing.xl};
    background-color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.colors.background.secondary : theme.primary};
    width: 100%;
    max-width: ${ACCOUNT_CARD_WIDTH_PX}px;
    overflow: visible;
    box-shadow: ${({ theme }) => theme.shadowDrop};

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
        !$isSelected ? theme.text.secondary : theme.colors.background.secondary};
    margin: -${({ theme }) => theme.spacing.lg} 0
        ${({ theme }) => theme.spacing.xl};
`;

const LabelSecond = styled.span<{ $isSelected: boolean }>`
    font-weight: 400;
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.primary : theme.colors.background.secondary};
`;

const LabelThird = styled.div<{ $isSelected: boolean }>`
    font-weight: 400;
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.secondary : theme.colors.background.secondary};
`;

const AccountCardFooter = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.lg};
`;

const FooterActions = styled.div`
    display: flex;
    align-items: center;
    flex-shrink: 0;
`;

const ExportActionButton = styled(Button)`
    background: ${({ theme }) => theme.card};
    color: ${({ theme }) => theme.text.primary};
    border-color: ${({ theme }) => theme.border};

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.hoverSurface};
    }
`;

const AccountAddress = styled.div<{ $isSelected: boolean }>`
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.size.xs};
    color: ${({ $isSelected, theme }) =>
        !$isSelected ? theme.text.primary : theme.colors.background.secondary};
    word-break: break-all;
    min-width: 0;

    button {
        color: ${({ $isSelected, theme }) =>
            !$isSelected
                ? theme.text.primary
                : theme.colors.background.secondary};
    }
`;

const stopCardActivation = (event: MouseEvent): void => {
    event.stopPropagation();
};

export const AccountCard = ({
    account,
    fullMode = true,
    className = "",
    onRequestDeleteWallet,
    onRequestDeleteAccount,
    onRequestExportWallet,
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
            <AccountHeader $fullMode={fullMode}>
                <AccountNameEditor
                    disabled={!isUnlocked}
                    accountId={account.id}
                />

                <HeaderActions onClick={stopCardActivation}>
                    {fullMode && isUnlocked && (
                        <RemoveAccountButton
                            accountId={account.id}
                            onRequestDeleteWallet={onRequestDeleteWallet}
                            onRequestDeleteAccount={onRequestDeleteAccount}
                        />
                    )}
                </HeaderActions>
            </AccountHeader>

            {showDerivationIndex && (
                <DerivationIndex $isSelected={isSelected}>
                    <span aria-hidden="true">
                        <FileCopyIcon size={14} color="currentColor" />
                    </span>
                    {`ID:${account.index}`}
                </DerivationIndex>
            )}

            <ASIAccountBalance account={account} isSelected={isSelected} />

            <AccountCardFooter>
                <AccountAddress $isSelected={isSelected}>
                    <LabelThird $isSelected={isSelected}>
                        ASI Address
                    </LabelThird>
                    <LabelSecond
                        style={{ marginRight: 10, lineHeight: "27px" }}
                        $isSelected={isSelected}
                    >
                        {formatAddress(account.address, {
                            isFullMode: !fullMode,
                        })}
                    </LabelSecond>
                    <span onClick={stopCardActivation}>
                        <CopyButton
                            dataToCopy={account.address}
                            size={15}
                            title={`Copy address, ${account.name}`}
                        />
                    </span>
                </AccountAddress>
                {fullMode && isUnlocked && onRequestExportWallet && (
                    <FooterActions onClick={stopCardActivation}>
                        <ExportActionButton
                            variant="icon-button"
                            title={`Export wallet keyfile, ${account.name}`}
                            aria-label={`Export wallet keyfile, ${account.name}`}
                            onClick={onRequestExportWallet}
                        >
                            <DownloadIcon />
                        </ExportActionButton>
                    </FooterActions>
                )}
            </AccountCardFooter>
        </AccountCardWrapper>
    );
};
