import type { UTxO } from "@meshsdk/core";
import { BridgeChainConfig } from "constants/bridgeChains";
import type { CardanoWalletApi } from "hooks/useCardanoWallet";

export type CardanoLockBuild = {
    txHash: string;
    unsignedTxCbor: string;
    nonce: string;
    amount: string;
    lockOutputLovelace: string;
};

type BuildCardanoLockTxInput = {
    wallet: CardanoWalletApi;
    chain: BridgeChainConfig;
    senderAddress: string;
    recipient: string;
    amount: bigint;
    destChainId: number;
    nonce?: string;
};

const MIN_BROWSER_LOCK_LOVELACE = BigInt(3000000);

const cardanoProviderUrl = (): string =>
    process.env.REACT_APP_CARDANO_PREPROD_KOIOS_URL ?? "";

const formatAda = (lovelace: bigint): string => {
    const sign = lovelace < BigInt(0) ? "-" : "";
    const abs = lovelace < BigInt(0) ? -lovelace : lovelace;
    const whole = abs / BigInt(1000000);
    const frac = (abs % BigInt(1000000))
        .toString()
        .padStart(6, "0")
        .replace(/0+$/, "");
    return `${sign}${whole.toString()}${frac ? `.${frac}` : ""}`;
};

const assetUnit = (chain: BridgeChainConfig): string => {
    if (!chain.assetPolicyId || !chain.assetName)
        throw new Error("Cardano asset policy is not configured");
    return `${chain.assetPolicyId}${chain.assetName}`;
};

const hexToBytes = (hex: string): Uint8Array => {
    const clean = hex.replace(/^0x/, "");
    if (clean.length % 2 !== 0) throw new Error("invalid hex length");
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i += 1)
        bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return bytes;
};

const utf8ToHex = (value: string): string =>
    Array.from(new TextEncoder().encode(value))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

type PlutusJson =
    | { bytes: string }
    | { int: string | number | bigint }
    | { map: { k: PlutusJson; v: PlutusJson }[] };

const plutusText = (value: string): PlutusJson => ({ bytes: utf8ToHex(value) });

const plutusInt = (value: string | number | bigint): PlutusJson => ({
    int: value,
});

const lockDatumJson = ({
    senderAddress,
    recipient,
    amount,
    nonce,
    destChainId,
    chain,
}: {
    senderAddress: string;
    recipient: string;
    amount: bigint;
    nonce: string;
    destChainId: number;
    chain: BridgeChainConfig;
}): PlutusJson => ({
    map: [
        { k: plutusText("sender"), v: plutusText(senderAddress) },
        { k: plutusText("recipient"), v: plutusText(recipient) },
        { k: plutusText("amount"), v: plutusText(amount.toString()) },
        { k: plutusText("nonce"), v: plutusText(nonce) },
        { k: plutusText("destChainId"), v: plutusInt(destChainId) },
        { k: plutusText("policy_id"), v: plutusText(chain.assetPolicyId || "") },
        { k: plutusText("asset_name"), v: plutusText(chain.assetName || "") },
    ],
});

const sumAsset = (utxos: UTxO[], unit: string): bigint =>
    utxos.reduce((acc, utxo) => {
        const found = utxo.output.amount.find((asset) => asset.unit === unit);
        return acc + BigInt(found?.quantity || "0");
    }, BigInt(0));

export const sumCardanoAsset = (
    utxos: UTxO[],
    chain: BridgeChainConfig,
): bigint => sumAsset(utxos, assetUnit(chain));

export const sumCardanoLovelace = (utxos: UTxO[]): bigint =>
    sumAsset(utxos, "lovelace");

const lockOutputLovelaceFromTx = async (
    txCborHex: string,
    chain: BridgeChainConfig,
    amount: bigint,
): Promise<string> => {
    const CSL = await import("@emurgo/cardano-serialization-lib-browser");
    const tx = CSL.Transaction.from_bytes(hexToBytes(txCborHex));
    const outputs = tx.body().outputs();
    const policy = CSL.ScriptHash.from_bytes(
        hexToBytes(chain.assetPolicyId || ""),
    );
    const assetName = CSL.AssetName.new(hexToBytes(chain.assetName || ""));

    for (let i = 0; i < outputs.len(); i += 1) {
        const output = outputs.get(i);
        const multiasset = output.amount().multiasset();
        const assets = multiasset?.get(policy);
        const locked = assets?.get(assetName);
        if (locked && BigInt(locked.to_str()) >= amount) {
            return output.amount().coin().to_str();
        }
    }

    return "0";
};

export const fetchCardanoBridgeTotalLocked = async (
    chain: BridgeChainConfig,
): Promise<bigint> => {
    if (!chain.bridgeAddress)
        throw new Error("Cardano bridge address is not configured");
    const { KoiosProvider } = await import("@meshsdk/core");
    const provider = new KoiosProvider(cardanoProviderUrl());
    const utxos = await provider.fetchAddressUTxOs(
        chain.bridgeAddress,
        assetUnit(chain),
    );
    return sumCardanoAsset(utxos, chain);
};

export const buildCardanoLockTx = async ({
    wallet,
    chain,
    senderAddress,
    recipient,
    amount,
    destChainId,
    nonce = String(Date.now()),
}: BuildCardanoLockTxInput): Promise<CardanoLockBuild> => {
    if (!chain.bridgeAddress)
        throw new Error("Cardano bridge address is not configured");
    if (!chain.assetPolicyId || !chain.assetName)
        throw new Error("Cardano asset policy is not configured");
    if (amount <= BigInt(0))
        throw new Error("Cardano lock amount must be positive");

    const { MeshTxBuilder, KoiosProvider, resolveTxHash } = await import(
        "@meshsdk/core"
    );
    const provider = new KoiosProvider(cardanoProviderUrl());
    const utxos = await wallet.getUtxos();
    const available = sumCardanoAsset(utxos, chain);
    if (available < amount) {
        throw new Error(
            `Cardano wallet has ${available.toString()} base units, needs ${amount.toString()}`,
        );
    }
    const availableLovelace = sumCardanoLovelace(utxos);
    if (availableLovelace < MIN_BROWSER_LOCK_LOVELACE) {
        throw new Error(
            `Cardano wallet has ${formatAda(
                availableLovelace,
            )} test ADA, needs at least ${formatAda(
                MIN_BROWSER_LOCK_LOVELACE,
            )} test ADA for the lock output and network fee. Fund the wallet with test ADA or consolidate UTxOs, then retry.`,
        );
    }

    const changeAddress = await wallet.getChangeAddress();
    const datum = lockDatumJson({
        senderAddress,
        recipient,
        amount,
        nonce,
        destChainId,
        chain,
    });

    let unsignedTxCbor: string;
    try {
        unsignedTxCbor = await new MeshTxBuilder({ fetcher: provider })
            .txOut(chain.bridgeAddress, [
                { unit: assetUnit(chain), quantity: amount.toString() },
            ])
            .txOutInlineDatumValue(datum, "JSON")
            .changeAddress(changeAddress)
            .selectUtxosFrom(utxos)
            .complete();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("UTxO Balance Insufficient")) {
            throw new Error(
                `Cardano wallet UTxOs are insufficient for this lock. The wallet has ${formatAda(
                    availableLovelace,
                )} test ADA and ${available.toString()} ASI base units; the transaction also needs ADA for the script output, token change, and network fee. Add test ADA or consolidate UTxOs, then retry.`,
            );
        }
        throw err;
    }

    const [txHash, lockOutputLovelace] = await Promise.all([
        Promise.resolve(resolveTxHash(unsignedTxCbor)),
        lockOutputLovelaceFromTx(unsignedTxCbor, chain, amount),
    ]);

    return {
        txHash,
        unsignedTxCbor,
        nonce,
        amount: amount.toString(),
        lockOutputLovelace,
    };
};
