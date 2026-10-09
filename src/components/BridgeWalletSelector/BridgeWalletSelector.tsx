import { AccountBalance } from "components/AccountBalance";
import { AccountSwitcher } from "components/AccountSwitcher";
import { ASIAccountBalance } from "components/ASIAccountBalance";
import { ASIAccountSwitcher } from "components/ASIAccountSwitcher";
import { Button } from "components/Button";
import styled from "styled-components";
import {
    IWalletSessionContext,
    WalletKind,
} from "types/bridgeWalletSession";

export type { IWalletSessionContext, WalletKind };

const ConnectWalletRow = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.md};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const ErrorMessage = styled.div`
    padding: ${({ theme }) => theme.spacing.lg};
    border: 1px solid ${({ theme }) => theme.danger};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.background.tertiary};
    color: ${({ theme }) => theme.dangerText};
    overflow-wrap: anywhere;
`;

const AccountSectionWrapper = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.xl};

    button:focus-visible {
        outline: 2px solid ${({ theme }) => theme.focusRing};
        outline-offset: 2px;
    }
`;

const BalanceInfo = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 0;

    .account-balance-card {
        margin-bottom: 0;
    }

    .amount-balance-wrapper {
        flex-wrap: wrap;
    }

    .amount-balance-info-wrapper {
        overflow-wrap: anywhere;
    }
`;

export function ASIWalletSection({ account }: IWalletSessionContext["asi"]) {
    if (!account) {
        return null;
    }

    return (
        <>
            <AccountSectionWrapper>
                <ASIAccountSwitcher fullWidth />
            </AccountSectionWrapper>

            <BalanceInfo>
                <ASIAccountBalance account={account} />
            </BalanceInfo>
        </>
    );
}

export function CardanoWalletSection({
    connected,
    loading,
    error,
    connect,
    account,
    balance,
    refreshBalance,
}: IWalletSessionContext["cardano"]) {
    if (!connected) {
        return (
            <ConnectWalletRow>
                <Button onClick={connect} loading={loading}>
                    Connect Cardano Wallet
                </Button>

                {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
            </ConnectWalletRow>
        );
    }

    return (
        <>
            <AccountSectionWrapper>
                <AccountSwitcher
                    fullWidth
                    disabled
                    accounts={[account!]}
                    selectedId={account!.id}
                    onSelect={() => {}}
                />
            </AccountSectionWrapper>

            <BalanceInfo>
                <AccountBalance balance={balance} onRefresh={refreshBalance} />
            </BalanceInfo>
        </>
    );
}

export function EvmWalletSection({
    connected,
    loading,
    error,
    connect,
    account,
    balance,
    refreshBalance,
    wrongNetwork,
    switchNetwork,
}: IWalletSessionContext["evm"]) {
    if (!connected) {
        return (
            <ConnectWalletRow>
                <Button onClick={connect} loading={loading}>
                    Connect EVM Wallet
                </Button>

                {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
            </ConnectWalletRow>
        );
    }

    if (!account) {
        return null;
    }

    return (
        <>
            <AccountSectionWrapper>
                <AccountSwitcher
                    fullWidth
                    disabled
                    accounts={[account]}
                    selectedId={account.id}
                    onSelect={() => undefined}
                />
            </AccountSectionWrapper>

            <BalanceInfo>
                <AccountBalance balance={balance} onRefresh={refreshBalance} />
            </BalanceInfo>

            {wrongNetwork && (
                <ConnectWalletRow>
                    <Button onClick={switchNetwork}>
                        Switch Network
                    </Button>
                </ConnectWalletRow>
            )}
        </>
    );
}

export function CosmosWalletSection({
    connected,
    loading,
    error,
    connect,
    account,
    balance,
    balanceLoading,
    refreshBalance,
}: IWalletSessionContext["cosmos"]) {
    if (!connected) {
        return (
            <ConnectWalletRow>
                <Button onClick={connect} loading={loading}>
                    Connect Fetch Wallet
                </Button>

                {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
            </ConnectWalletRow>
        );
    }

    if (!account) {
        return null;
    }

    return (
        <>
            <AccountSectionWrapper>
                <AccountSwitcher
                    fullWidth
                    disabled
                    accounts={[account]}
                    selectedId={account.id}
                    onSelect={() => undefined}
                />
            </AccountSectionWrapper>

            <BalanceInfo>
                <AccountBalance
                    balance={balance}
                    loading={balanceLoading}
                    onRefresh={refreshBalance}
                />
            </BalanceInfo>
        </>
    );
}

interface BridgeWalletSelectorProps {
    chainKind: WalletKind;
    wallet: IWalletSessionContext[WalletKind];
}

export const BridgeWalletSelector = ({
    chainKind,
    wallet,
}: BridgeWalletSelectorProps) => {
    switch (chainKind) {
        case "asi":
            return (
                <ASIWalletSection
                    {...(wallet as IWalletSessionContext[typeof chainKind])}
                />
            );

        case "cardano":
            return (
                <CardanoWalletSection
                    {...(wallet as IWalletSessionContext[typeof chainKind])}
                />
            );

        case "evm":
            return (
                <EvmWalletSection
                    {...(wallet as IWalletSessionContext[typeof chainKind])}
                />
            );

        case "cosmos":
            return (
                <CosmosWalletSection
                    {...(wallet as IWalletSessionContext[typeof chainKind])}
                />
            );

        default:
            return null;
    }
};
