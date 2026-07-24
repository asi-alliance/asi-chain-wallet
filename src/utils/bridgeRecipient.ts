import { BridgeChainConfig } from "constants/bridgeChains";

const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const BASE58_BODY = /^[1-9A-HJ-NP-Za-km-z]+$/;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

const bech32Polymod = (values: number[]): number => {
    const generators = [
        0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3,
    ];
    let chk = 1;
    for (const value of values) {
        const top = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ value;
        for (let i = 0; i < generators.length; i += 1) {
            if ((top >> i) & 1) chk ^= generators[i];
        }
    }
    return chk;
};

const bech32HrpExpand = (hrp: string): number[] => {
    const values: number[] = [];
    for (let i = 0; i < hrp.length; i += 1) values.push(hrp.charCodeAt(i) >> 5);
    values.push(0);
    for (let i = 0; i < hrp.length; i += 1)
        values.push(hrp.charCodeAt(i) & 31);
    return values;
};

const isBech32WithHrp = (value: string, hrp: string): boolean => {
    const lower = value.toLowerCase();
    if (value !== lower) return false;
    const separator = lower.lastIndexOf("1");
    if (separator <= 0 || separator + 7 > lower.length) return false;
    const actualHrp = lower.slice(0, separator);
    if (actualHrp !== hrp.toLowerCase()) return false;
    const data = lower.slice(separator + 1);
    const words: number[] = [];
    for (const char of data) {
        const index = BECH32_CHARSET.indexOf(char);
        if (index === -1) return false;
        words.push(index);
    }
    return (
        words.length > 6 &&
        bech32Polymod([...bech32HrpExpand(actualHrp), ...words]) === 1
    );
};

const isCardanoPaymentAddress = (
    value: string,
    chain: BridgeChainConfig,
): boolean => {
    const hrp = chain.cardanoNetworkId === "mainnet" ? "addr" : "addr_test";
    return isBech32WithHrp(value, hrp);
};

const isAsiRevAddress = (value: string): boolean =>
    value.startsWith("1111") &&
    value.length >= 40 &&
    value.length <= 80 &&
    BASE58_BODY.test(value);

export const recipientErrorFor = (
    chain: BridgeChainConfig,
    value: string,
): string | null => {
    const recipient = value.trim();
    if (!recipient) return null;

    if (chain.kind === "evm") {
        return EVM_ADDRESS.test(recipient)
            ? null
            : `${chain.label} recipient must be an EVM 0x address.`;
    }
    if (chain.kind === "asi") {
        return isAsiRevAddress(recipient)
            ? null
            : `${chain.label} recipient must be an ASI REV address starting with 1111.`;
    }
    if (chain.kind === "cosmos") {
        const prefix = chain.addressPrefix ?? "fetch";
        return isBech32WithHrp(recipient, prefix)
            ? null
            : `${chain.label} recipient must be a bech32 address starting with ${prefix}1.`;
    }
    if (chain.kind === "cardano") {
        const prefix =
            chain.cardanoNetworkId === "mainnet" ? "addr1" : "addr_test1";
        return isCardanoPaymentAddress(recipient, chain)
            ? null
            : `${chain.label} recipient must be a Cardano payment address starting with ${prefix}.`;
    }

    return null;
};

export const recipientLabelFor = (chain: BridgeChainConfig): string => {
    if (chain.kind === "asi") return "ASI Chain recipient (REV addr)";
    if (chain.kind === "cosmos")
        return `${chain.label} recipient (${
            chain.addressPrefix ?? "fetch"
        }1...)`;
    if (chain.kind === "cardano")
        return `${chain.label} recipient (addr_test1...)`;
    return "ETH recipient (0x...)";
};

export const recipientPlaceholderFor = (chain: BridgeChainConfig): string => {
    if (chain.kind === "asi") return "1111...";
    if (chain.kind === "cosmos") return `${chain.addressPrefix ?? "fetch"}1...`;
    if (chain.kind === "cardano") return "addr_test1...";
    return "0x...";
};
