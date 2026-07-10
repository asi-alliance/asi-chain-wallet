import { AccountBalance } from "components/AccountBalance";
import { AccountSwitcher } from "components/AccountSwitcher";
import { ASIAccountBalance } from "components/ASIAccountBalance";
import { ASIAccountSwitcher } from "components/ASIAccountSwitcher";
import { Button } from "components/Button";
import styled from "styled-components";
import { Account } from "types/wallet";

interface IWalletAccount {
    id: string;
    name: string;
    address: string;
    balance: string;
}

export interface IWalletSessionContext {
    asi: {
        account?: Account | null;
    };

    cardano: {
        connected: boolean;
        loading: boolean;
        error?: string;

        connect: () => Promise<void>;
        disconnect: () => Promise<void>;

        account?: IWalletAccount;

        balance: string;
        balanceLoading: boolean;
        refreshBalance: () => Promise<void>;
    };

    evm: {
        connected: boolean;
        loading: boolean;
        error?: string;

        connect: () => void;

        account?: IWalletAccount;

        balance: string;
        refreshBalance: () => Promise<void>;

        wrongNetwork: boolean;
        switchNetwork: () => Promise<void>;
    };

    cosmos: {
        connected: boolean;
        loading: boolean;
        error?: string;

        connect: () => Promise<void>;
        disconnect: () => Promise<void>;

        account?: IWalletAccount;

        balance: string;
        balanceLoading: boolean;
        refreshBalance: () => Promise<void>;
    };
}

const ConnectWalletRow = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 36px;
`;

const ErrorMessage = styled.div`
    background: ${({ theme }) => theme.danger};
    color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    word-break: break-all;
`;

const AccountSectionWrapper = styled.div`
    margin-bottom: 24px;
`;

const BalanceInfo = styled.div`
    margin-bottom: 36px;
    display: flex;
    justify-content: center;

    @media (max-width: 768px) {
        margin-bottom: 49px;
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
                    <h3>Connect Cardano Wallet</h3>
                </Button>

                {error && <ErrorMessage>{error}</ErrorMessage>}
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
                    <h3>Connect EVM Wallet</h3>
                </Button>

                {error && <ErrorMessage>{error}</ErrorMessage>}
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
                        <h3>Switch Network</h3>
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
                    <h3>Connect Fetch Wallet</h3>
                </Button>

                {error && <ErrorMessage>{error}</ErrorMessage>}
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

export type WalletKind = keyof IWalletSessionContext;

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
