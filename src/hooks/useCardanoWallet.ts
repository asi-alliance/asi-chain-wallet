import { useCallback, useEffect, useState } from "react";
import type { UTxO } from "@meshsdk/core";
import { bridgeChainForKey } from "constants/bridgeChains";
import { sumCardanoAsset, sumCardanoLovelace } from "utils/cardanoTx";
import { formatToken } from "utils/tokenFormat";
import { CardanoWalletSession } from "types/bridgeWalletSession";

export type CardanoWalletApi = {
    getUsedAddresses: () => Promise<string[]>;
    getChangeAddress: () => Promise<string>;
    getUtxos: () => Promise<UTxO[]>;
    signTx: (txCborHex: string, partialSign?: boolean) => Promise<string>;
    submitTx: (txCborHex: string) => Promise<string>;
};

type CardanoWalletProvider = {
    name?: string;
    enable?: () => Promise<unknown>;
};

export type CardanoWalletConnection = {
    api: CardanoWalletApi;
    address: string;
    walletName: string;
};

export type CardanoWalletState = {
    api: CardanoWalletApi | null;
    address: string;
    walletName: string;
    connected: boolean;
    loading: boolean;
    balanceLoading: boolean;
    error: string;
    balanceRaw: string;
    lovelaceRaw: string;
    connect: () => Promise<CardanoWalletConnection>;
    refreshBalance: () => Promise<void>;
    disconnect: () => void;
    session: CardanoWalletSession;
};

const hexToBytes = (hex: string): Uint8Array => {
    const clean = hex.replace(/^0x/, "");
    if (clean.length % 2 !== 0) throw new Error("invalid hex length");
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i += 1)
        bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return bytes;
};

const cardanoProvider = (): {
    key: string;
    provider: CardanoWalletProvider;
} | null => {
    if (typeof window === "undefined") {
        return null;
    }

    const cardano = (
        window as Window & {
            cardano?: Record<string, CardanoWalletProvider | undefined>;
        }
    ).cardano;

    if (!cardano) {
        return null;
    }

    const keys = ["yoroi", "yoroi_nightly", "lace", "eternl", "nami"];

    for (const key of keys) {
        const provider = cardano[key];
        const hasEnable = typeof provider?.enable === "function";

        if (hasEnable) {
            return { key, provider };
        }
    }

    return null;
};

const normalizeCardanoAddress = async (address: string): Promise<string> => {
    if (address.startsWith("addr")) return address;
    const CSL = await import("@emurgo/cardano-serialization-lib-browser");
    return CSL.Address.from_bytes(hexToBytes(address)).to_bech32();
};

export const useCardanoWallet = (): CardanoWalletState => {
    const [api, setApi] = useState<CardanoWalletApi | null>(null);
    const [address, setAddress] = useState("");
    const [walletName, setWalletName] = useState("");
    const [loading, setLoading] = useState(false);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [error, setError] = useState("");
    const [balanceRaw, setBalanceRaw] = useState("0");
    const [lovelaceRaw, setLovelaceRaw] = useState("0");
    const chain = bridgeChainForKey("cardanoPreprod");

    const refreshBalanceFor = useCallback(
        async (walletApi: CardanoWalletApi) => {
            const utxos = await walletApi.getUtxos();
            setBalanceRaw(sumCardanoAsset(utxos, chain).toString());
            setLovelaceRaw(sumCardanoLovelace(utxos).toString());
        },
        [chain],
    );

    const refreshBalance = useCallback(async () => {
        if (!api) return;
        setBalanceLoading(true);
        setError("");
        try {
            await refreshBalanceFor(api);
        } catch (err: any) {
            const message = err.message || String(err);
            setError(message);
            throw new Error(message);
        } finally {
            setBalanceLoading(false);
        }
    }, [api, refreshBalanceFor]);

    const connect = useCallback(async (): Promise<CardanoWalletConnection> => {
        setLoading(true);
        setError("");
        try {
            const found = cardanoProvider();

            if (!found) {
                throw new Error(
                    "Yoroi, Lace, Eternl, or Nami web wallet is not available",
                );
            }

            const { BrowserWallet } = await import("@meshsdk/core");

            const wallet = await BrowserWallet.enable(found.key);

            const used = await wallet.getUsedAddresses().catch((err) => {
                console.warn("[Cardano] getUsedAddresses() failed:", err);
                return [] as string[];
            });

            const rawAddress = used[0] || (await wallet.getChangeAddress());

            const bech32 = await normalizeCardanoAddress(rawAddress);

            if (!bech32.startsWith("addr_test1")) {
                throw new Error("Select a Cardano Preprod/Testnet wallet");
            }

            const nextWalletName = found.provider.name || found.key;

            setApi(wallet);
            setAddress(bech32);
            setWalletName(nextWalletName);
            setBalanceLoading(true);
            try {
                await refreshBalanceFor(wallet);
            } catch (balanceErr: any) {
                setError(balanceErr.message || String(balanceErr));
            } finally {
                setBalanceLoading(false);
            }
            return {
                api: wallet,
                address: bech32,
                walletName: nextWalletName,
            };
        } catch (err: any) {
            const message = err.message || String(err);
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    }, [refreshBalanceFor]);

    useEffect(() => {
        if (!api) return;
        const interval = window.setInterval(() => {
            refreshBalanceFor(api).catch((err: any) => {
                setError(err.message || String(err));
            });
        }, 30000);
        return () => window.clearInterval(interval);
    }, [api, refreshBalanceFor]);

    const disconnect = useCallback(() => {
        setApi(null);
        setAddress("");
        setWalletName("");
        setBalanceRaw("0");
        setLovelaceRaw("0");
        setError("");
        setLoading(false);
        setBalanceLoading(false);
    }, []);

    const balanceDisplay = formatToken(
        BigInt(balanceRaw || "0"),
        chain.nativeDecimals,
    );

    const session: CardanoWalletSession = {
        connected: !!api && !!address,
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
            id: "cardano-wallet",
            name: walletName || chain.shortLabel,
            address: address || "",
            balance: balanceDisplay,
        },

        balance: balanceDisplay,

        balanceLoading,
        refreshBalance,
    };

    return {
        api,
        address,
        walletName,
        connected: !!api && !!address,
        loading,
        balanceLoading,
        error,
        balanceRaw,
        lovelaceRaw,
        connect,
        refreshBalance,
        disconnect,
        session,
    };
};
