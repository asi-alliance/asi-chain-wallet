import { useCallback } from "react";
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
    error: Error | null;
    openConnect: () => void;
    switchToSource: () => void;
    approve: (amountRaw: bigint) => void;
    lock: (amountRaw: bigint, recipient: string, destChainId: number) => void;
    refetch: () => void;
    reset: () => void;
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
        reset,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        { hash: txHash },
    );

    const wrongNetwork = isConnected && !!evmId && currentChainId !== evmId;

    const switchToSource = (): void => {
        if (evmId) switchChain({ chainId: evmId });
    };

    const approve = (amountRaw: bigint): void => {
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
        writeContract({
            address: contracts.bridge,
            abi: BridgeABI,
            functionName: "lock",
            args: [amountRaw, recipient, BigInt(destChainId)],
            chainId: evmId,
            gas: EVM_LOCK_GAS,
        });
    };

    const refetch = useCallback((): void => {
        refetchBalance();
        refetchAllowance();
    }, [refetchBalance, refetchAllowance]);

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
        error,
        openConnect,
        switchToSource,
        approve,
        lock,
        refetch,
        reset,
        session,
    };
};