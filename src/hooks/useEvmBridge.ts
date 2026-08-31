import { useCallback, useRef, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
    useAccount,
    useChainId,
    useReadContract,
    useSwitchChain,
    useWaitForTransactionReceipt,
    useWriteContract,
} from "wagmi";
import {
    BridgeABI,
    TokenABI,
    contractsForChain,
} from "contracts/bridgeContracts";
import { BridgeChainConfig } from "constants/bridgeChains";
import { formatToken } from "utils/tokenFormat";
import { EvmWalletSession } from "types/bridgeWalletSession";

const EVM_APPROVE_GAS = BigInt(100000);
const EVM_LOCK_GAS = BigInt(500000);

export type EvmWriteAction = "approve" | "lock" | null;

export interface EvmBridgeState {
    address?: `0x${string}`;
    isConnected: boolean;
    wrongNetwork: boolean;
    tokenBalance?: bigint;
    allowance?: bigint;
    totalLocked?: bigint;
    txHash?: `0x${string}`;
    isPending: boolean;
    isConfirming: boolean;
    isSuccess: boolean;
    lastAction: EvmWriteAction;
    error: Error | null;
    openConnect: () => void;
    switchToSource: () => void;
    approve: (amountRaw: bigint) => void;
    lock: (amountRaw: bigint, recipient: string, destChainId: number) => void;
    refetch: () => Promise<void>;
    reset: () => void;
    resetIfCurrent: (expectedTxHash: `0x${string}` | undefined) => void;
    session: EvmWalletSession;
}

export const useEvmBridge = (
    chain: BridgeChainConfig,
    isDestination = false,
): EvmBridgeState => {
    const evmId = chain.evmId;
    const { address, isConnected } = useAccount();
    const currentChainId = useChainId();
    const { openConnectModal } = useConnectModal();
    const { switchChain } = useSwitchChain();
    const contracts = contractsForChain(evmId);
    const [lastAction, setLastAction] = useState<EvmWriteAction>(null);

    const enabledReads = !!address && !!evmId;

    const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
        address: contracts.token,
        abi: TokenABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: evmId,
        query: { enabled: enabledReads, refetchInterval: 30000 },
    });

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: contracts.token,
        abi: TokenABI,
        functionName: "allowance",
        args: address ? [address, contracts.bridge] : undefined,
        chainId: evmId,
        query: { enabled: enabledReads, refetchInterval: 30000 },
    });

    const { data: totalLocked } = useReadContract({
        address: contracts.bridge,
        abi: BridgeABI,
        functionName: "totalLocked",
        chainId: evmId,
        query: { enabled: !!evmId, refetchInterval: 30000 },
    });

    const {
        writeContract,
        data: txHash,
        isPending,
        error,
        reset: writeReset,
    } = useWriteContract();

    const txHashRef = useRef(txHash);
    txHashRef.current = txHash;

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        { hash: txHash },
    );

    const wrongNetwork = isConnected && !!evmId && currentChainId !== evmId;

    const switchToSource = (): void => {
        if (evmId) switchChain({ chainId: evmId });
    };

    const approve = (amountRaw: bigint): void => {
        setLastAction("approve");
        writeContract({
            address: contracts.token,
            abi: TokenABI,
            functionName: "approve",
            args: [contracts.bridge, amountRaw],
            chainId: evmId,
            gas: EVM_APPROVE_GAS,
        });
    };

    const lock = (
        amountRaw: bigint,
        recipient: string,
        destChainId: number,
    ): void => {
        setLastAction("lock");
        writeContract({
            address: contracts.bridge,
            abi: BridgeABI,
            functionName: "lock",
            args: [amountRaw, recipient, BigInt(destChainId)],
            chainId: evmId,
            gas: EVM_LOCK_GAS,
        });
    };

    const refetch = useCallback(async (): Promise<void> => {
        await Promise.all([refetchBalance(), refetchAllowance()]);
    }, [refetchBalance, refetchAllowance]);

    const reset = useCallback((): void => {
        setLastAction(null);
        writeReset();
    }, [writeReset]);

    const resetIfCurrent = useCallback(
        (expectedTxHash: `0x${string}` | undefined): void => {
            if (!expectedTxHash || txHashRef.current !== expectedTxHash) {
                return;
            }
            setLastAction(null);
            writeReset();
        },
        [writeReset],
    );

    const openConnect = (): void => {
        openConnectModal?.();
    };

    const balanceDisplay = formatToken(
        tokenBalance ?? BigInt(0),
        chain.nativeDecimals,
    );

    const session: EvmWalletSession = {
        connected: isConnected,
        loading: isPending,
        error: error?.message,

        connect: openConnect,

        account: {
            id: "evm-wallet",
            name: "EVM Wallet",
            address: address || "",
            balance: balanceDisplay,
        },

        balance: balanceDisplay,

        refreshBalance: async () => {
            refetch();
        },

        wrongNetwork: isDestination ? false : wrongNetwork,
        switchNetwork: async () => {
            if (!isDestination) {
                switchToSource();
            }
        },
    };

    return {
        address,
        isConnected,
        wrongNetwork,
        tokenBalance,
        allowance,
        totalLocked,
        txHash,
        isPending,
        isConfirming,
        isSuccess,
        lastAction,
        error,
        openConnect,
        switchToSource,
        approve,
        lock,
        refetch,
        reset,
        resetIfCurrent,
        session,
    };
};
