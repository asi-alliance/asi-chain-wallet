import { useCallback, useEffect, useState } from "react";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import type { OfflineSigner } from "@cosmjs/proto-signing";
import {
    bridgeChainForKey,
    BridgeChainKey,
    BridgeChainConfig,
} from "constants/bridgeChains";
import { formatToken } from "utils/tokenFormat";
import { CosmosWalletSession } from "types/bridgeWalletSession";

type WalletProvider = "asi-wallet" | "keplr";

type KeplrLike = {
    enable?: (chainId: string) => Promise<void>;
    experimentalSuggestChain?: (chainInfo: unknown) => Promise<void>;
};

type FetchWalletLike = {
    switchToNetwork?: (networkConfig: unknown) => Promise<void>;
    networks?: {
        switchToNetwork?: (chainId: string) => Promise<void>;
    };
    signing?: {
        getOfflineSigner?: (chainId: string) => Promise<OfflineSigner>;
        getOfflineDirectSigner?: (chainId: string) => Promise<OfflineSigner>;
    };
};

declare global {
    interface Window {
        fetchBrowserWallet?: {
            wallet?: FetchWalletLike;
            keplr?: KeplrLike;
        };
        fetchWallet?: FetchWalletLike;
        keplr?: KeplrLike;
        getOfflineSigner?: (chainId: string) => OfflineSigner;
        getOfflineSignerAuto?: (chainId: string) => Promise<OfflineSigner>;
    }
}

export interface CosmosLockResult {
    transactionHash: string;
    height: number;
}

export interface CosmosWalletApi {
    address: string | null;
    balanceRaw: string;
    connected: boolean;
    loading: boolean;
    error: string;
    provider: WalletProvider | null;
    connect: () => Promise<void>;
    refreshBalance: () => Promise<void>;
    disconnect: () => void;
    lock: (
        amountRaw: bigint,
        recipient: string,
        destChainId: number,
    ) => Promise<CosmosLockResult>;
    session: CosmosWalletSession;
}

interface ConnectedCosmosWallet {
    signer: OfflineSigner;
    address: string;
}

const required = (value: string | undefined, name: string): string => {
    if (!value) throw new Error(`${name} is not configured`);
    return value;
};

const chainIdOf = (chain: BridgeChainConfig): string =>
    required(chain.cosmosChainId, "Cosmos chain id");

const denomOf = (chain: BridgeChainConfig): string =>
    required(chain.denom, "Cosmos denom");

const rpcOf = (chain: BridgeChainConfig): string =>
    required(chain.rpcUrl, "Cosmos RPC URL");

const restOf = (chain: BridgeChainConfig): string =>
    required(chain.restUrl, "Cosmos REST URL");

const bridgeOf = (chain: BridgeChainConfig): string =>
    required(chain.bridgeAddress, "Cosmos bridge address");

const getFetchWallet = (): FetchWalletLike | null => {
    if (typeof window === "undefined") return null;
    return window.fetchBrowserWallet?.wallet ?? window.fetchWallet ?? null;
};

const getKeplr = (): KeplrLike | null => {
    if (typeof window === "undefined") return null;
    return window.fetchBrowserWallet?.keplr ?? window.keplr ?? null;
};

const keplrChainInfo = (chain: BridgeChainConfig) => {
    const chainId = chainIdOf(chain);
    const denom = denomOf(chain);
    const rpc = rpcOf(chain);
    const rest = restOf(chain);
    const prefix = chain.addressPrefix ?? "fetch";
    const displayDenom = chain.displayDenom ?? denom.toUpperCase();

    return {
        chainId,
        chainName: chain.label,
        rpc,
        rest,
        bip44: { coinType: 118 },
        bech32Config: {
            bech32PrefixAccAddr: prefix,
            bech32PrefixAccPub: `${prefix}pub`,
            bech32PrefixValAddr: `${prefix}valoper`,
            bech32PrefixValPub: `${prefix}valoperpub`,
            bech32PrefixConsAddr: `${prefix}valcons`,
            bech32PrefixConsPub: `${prefix}valconspub`,
        },
        currencies: [
            {
                coinDenom: displayDenom,
                coinMinimalDenom: denom,
                coinDecimals: 18,
            },
        ],
        feeCurrencies: [
            {
                coinDenom: displayDenom,
                coinMinimalDenom: denom,
                coinDecimals: 18,
                gasPriceStep: {
                    low: 1000000000,
                    average: 1000000000,
                    high: 2000000000,
                },
            },
        ],
        stakeCurrency: {
            coinDenom: displayDenom,
            coinMinimalDenom: denom,
            coinDecimals: 18,
        },
        features: ["cosmwasm"],
    };
};

const balanceByDenom = async (
    chain: BridgeChainConfig,
    address: string,
): Promise<string> => {
    const denom = denomOf(chain);
    const url = `${restOf(
        chain,
    )}/cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${encodeURIComponent(
        denom,
    )}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`FetchHub balance query failed: ${res.status}`);
    }
    const json = await res.json();
    return String(json?.balance?.amount ?? "0");
};

export const useCosmosWallet = (
    chainKey: BridgeChainKey = "fetchhubDorado",
): CosmosWalletApi => {
    const [address, setAddress] = useState<string | null>(null);
    const [balanceRaw, setBalanceRaw] = useState("0");
    const [signer, setSigner] = useState<OfflineSigner | null>(null);
    const [provider, setProvider] = useState<WalletProvider | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const chain = bridgeChainForKey(chainKey);

    const refreshBalanceFor = useCallback(
        async (nextAddress: string) => {
            setBalanceRaw(await balanceByDenom(chain, nextAddress));
        },
        [chain],
    );

    const connectInternal =
        useCallback(async (): Promise<ConnectedCosmosWallet> => {
            setLoading(true);
            setError("");
            try {
                const chainId = chainIdOf(chain);
                const fetchWallet = getFetchWallet();
                let nextSigner: OfflineSigner | null = null;
                let nextProvider: WalletProvider | null = null;

                if (fetchWallet?.signing?.getOfflineSigner) {
                    await fetchWallet.networks
                        ?.switchToNetwork?.(chainId)
                        .catch(() => undefined);
                    await fetchWallet
                        .switchToNetwork?.(keplrChainInfo(chain))
                        .catch(() => undefined);
                    nextSigner =
                        await fetchWallet.signing.getOfflineSigner(chainId);
                    nextProvider = "asi-wallet";
                } else {
                    const keplr = getKeplr();
                    if (!keplr) {
                        throw new Error(
                            "ASI Alliance Wallet or Keplr extension not found",
                        );
                    }
                    await keplr
                        .experimentalSuggestChain?.(keplrChainInfo(chain))
                        .catch(() => undefined);
                    await keplr.enable?.(chainId);
                    nextSigner = window.getOfflineSignerAuto
                        ? await window.getOfflineSignerAuto(chainId)
                        : (window.getOfflineSigner?.(chainId) ?? null);
                    nextProvider = "keplr";
                }

                if (!nextSigner)
                    throw new Error("Cosmos signer was not available");
                const accounts = await nextSigner.getAccounts();
                const nextAddress = accounts[0]?.address;
                if (!nextAddress)
                    throw new Error("No FetchHub account returned by wallet");

                setSigner(nextSigner);
                setProvider(nextProvider);
                setAddress(nextAddress);
                await refreshBalanceFor(nextAddress);
                return { signer: nextSigner, address: nextAddress };
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : String(err);
                setError(message);
                throw err;
            } finally {
                setLoading(false);
            }
        }, [chain, refreshBalanceFor]);

    const connect = useCallback(async () => {
        await connectInternal();
    }, [connectInternal]);

    const refreshBalance = useCallback(async () => {
        if (!address) return;
        setLoading(true);
        setError("");
        try {
            await refreshBalanceFor(address);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [address, refreshBalanceFor]);

    useEffect(() => {
        if (!address) {
            return;
        }

        refreshBalanceFor(address).catch((err) => {
            setError(err instanceof Error ? err.message : String(err));
        });

        const interval = window.setInterval(() => {
            refreshBalanceFor(address).catch((err) => {
                setError(err instanceof Error ? err.message : String(err));
            });
        }, 30000);

        return () => window.clearInterval(interval);
    }, [address, refreshBalanceFor]);

    const lock = useCallback(
        async (amountRaw: bigint, recipient: string, destChainId: number) => {
            setLoading(true);
            setError("");
            try {
                let nextSigner = signer;
                let sender = address;
                if (!nextSigner || !sender) {
                    const connected = await connectInternal();
                    nextSigner = connected.signer;
                    sender = connected.address;
                    setLoading(true);
                }
                if (!nextSigner || !sender) {
                    throw new Error("FetchHub wallet is not connected");
                }

                const denom = denomOf(chain);
                const client = await SigningCosmWasmClient.connectWithSigner(
                    rpcOf(chain),
                    nextSigner,
                );
                const result = await client.execute(
                    sender,
                    bridgeOf(chain),
                    { lock: { dest_chain_id: destChainId, recipient } },
                    {
                        amount: [{ denom, amount: "800000000000000" }],
                        gas: "800000",
                    },
                    `ASI bridge lock to ${destChainId}`,
                    [{ denom, amount: amountRaw.toString() }],
                );
                await refreshBalanceFor(sender);
                return {
                    transactionHash: result.transactionHash,
                    height: result.height,
                };
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : String(err);
                setError(message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [address, chain, connectInternal, refreshBalanceFor, signer],
    );

    const disconnect = useCallback(() => {
        setAddress(null);
        setBalanceRaw("0");
        setSigner(null);
        setProvider(null);
        setError("");
        setLoading(false);
    }, []);

    const balanceDisplay = formatToken(
        BigInt(balanceRaw || "0"),
        chain.nativeDecimals,
    );

    const session: CosmosWalletSession = {
        connected: !!address && !!signer,
        loading,
        error,

        connect: async () => {
            try {
                await connect();
            } catch {}
        },
        disconnect: async () => {
            disconnect();
        },

        account: {
            id: "cosmos-wallet",
            name: provider || chain.shortLabel,
            address: address || "",
            balance: balanceDisplay,
        },

        balance: balanceDisplay,

        balanceLoading: loading,
        refreshBalance,
    };

    return {
        address,
        balanceRaw,
        connected: !!address && !!signer,
        loading,
        error,
        provider,
        connect,
        refreshBalance,
        disconnect,
        lock,
        session,
    };
};