import { useCallback, useEffect, useState } from "react";
import type { UTxO } from "@meshsdk/core";
import { bridgeChainForKey } from "constants/bridgeChains";
import { sumCardanoAsset, sumCardanoLovelace } from "utils/cardanoTx";

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
    if (typeof window === "undefined") return null;
    const cardano = (
        window as Window & {
            cardano?: Record<string, CardanoWalletProvider | undefined>;
        }
    ).cardano;
    console.log(
        "[Cardano] window.cardano keys:",
        cardano ? Object.keys(cardano) : "undefined (no wallet injected)",
    );
    if (!cardano) return null;
    const keys = ["yoroi", "yoroi_nightly", "lace", "eternl", "nami"];
    for (const key of keys) {
        const provider = cardano[key];
        const hasEnable = typeof provider?.enable === "function";
        console.log(
            `[Cardano] provider "${key}":`,
            provider
                ? hasEnable
                    ? "available"
                    : "present but no enable()"
                : "not found",
        );
        if (hasEnable) {
            console.log("[Cardano] auto-selected provider:", key);
            return { key, provider };
        }
    }
    console.warn(
        "[Cardano] no supported wallet with enable() found among",
        keys,
    );
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

    const connect =
        useCallback(async (): Promise<CardanoWalletConnection> => {
            setLoading(true);
            setError("");
            try {
                console.log("[Cardano] connect() called");
                const found = cardanoProvider();
                if (!found) {
                    console.error(
                        "[Cardano] no supported wallet available — install/enable Yoroi Nightly, Lace, Eternl or Nami, and open the app over http://localhost or https",
                    );
                    throw new Error(
                        "Yoroi, Lace, Eternl, or Nami web wallet is not available",
                    );
                }
                const { BrowserWallet } = await import("@meshsdk/core");
                console.log(
                    "[Cardano] calling enable() on:",
                    found.key,
                    "(no popup here means the site is already authorized)",
                );
                const wallet = await BrowserWallet.enable(found.key);
                console.log("[Cardano] enable() resolved for:", found.key);
                const used = await wallet.getUsedAddresses().catch((err) => {
                    console.warn("[Cardano] getUsedAddresses() failed:", err);
                    return [] as string[];
                });
                console.log("[Cardano] used addresses:", used);
                const rawAddress =
                    used[0] || (await wallet.getChangeAddress());
                console.log(
                    "[Cardano] raw address (used[0] or change):",
                    rawAddress,
                );
                const bech32 = await normalizeCardanoAddress(rawAddress);
                console.log("[Cardano] normalized bech32 address:", bech32);
                if (!bech32.startsWith("addr_test1")) {
                    console.error(
                        "[Cardano] wallet is NOT on Preprod/Testnet — expected addr_test1..., got:",
                        bech32,
                        "→ switch the selected wallet to Preprod network",
                    );
                    throw new Error("Select a Cardano Preprod/Testnet wallet");
                }
                const nextWalletName = found.provider.name || found.key;
                console.log(
                    "[Cardano] connected:",
                    nextWalletName,
                    "address:",
                    bech32,
                );
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
    };
};
