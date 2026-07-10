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
}

export const useEvmBridge = (srcEvmId?: number): EvmBridgeState => {
    const { address, isConnected } = useAccount();
    const currentChainId = useChainId();
    const { openConnectModal } = useConnectModal();
    const { switchChain } = useSwitchChain();
    const contracts = contractsForChain(srcEvmId);

    const enabledReads = !!address && !!srcEvmId;

    const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
        address: contracts.token,
        abi: TokenABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: srcEvmId,
        query: { enabled: enabledReads, refetchInterval: 30000 },
    });

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: contracts.token,
        abi: TokenABI,
        functionName: "allowance",
        args: address ? [address, contracts.bridge] : undefined,
        chainId: srcEvmId,
        query: { enabled: enabledReads, refetchInterval: 30000 },
    });

    const { data: totalLocked } = useReadContract({
        address: contracts.bridge,
        abi: BridgeABI,
        functionName: "totalLocked",
        chainId: srcEvmId,
        query: { enabled: !!srcEvmId, refetchInterval: 30000 },
    });

    const {
        writeContract,
        data: txHash,
        isPending,
        error,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        { hash: txHash },
    );

    // console.log("EVM src evm id: ", srcEvmId);

    // console.log("EVM Current chain id: ", currentChainId);

    const wrongNetwork =
        isConnected && !!srcEvmId && currentChainId !== srcEvmId;

    const switchToSource = (): void => {
        if (srcEvmId) switchChain({ chainId: srcEvmId });
    };

    const approve = (amountRaw: bigint): void => {
        writeContract({
            address: contracts.token,
            abi: TokenABI,
            functionName: "approve",
            args: [contracts.bridge, amountRaw],
            chainId: srcEvmId,
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
            chainId: srcEvmId,
            gas: EVM_LOCK_GAS,
        });
    };

    const refetch = useCallback((): void => {
        refetchBalance();
        refetchAllowance();
    }, [refetchBalance, refetchAllowance]);

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
        openConnect: () => openConnectModal?.(),
        switchToSource,
        approve,
        lock,
        refetch,
    };
};
