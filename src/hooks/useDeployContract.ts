import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
    DeployStatus,
    isIntegerInRange,
    NATIVE_TOKEN_DECIMALS_AMOUNT,
} from "@asichain/asi-wallet-sdk";
import { RootState } from "store";
import { useAppDispatch } from "store/hooks";
import {
    deployWatchCleared,
    selectAccountById,
    selectDeployWatch,
    selectSelectedAccountId,
    selectSelectedNetworkId,
    selectWalletByAccountId,
} from "store/WalletsStore";
import { useGetBalanceQuery } from "store/WalletsStore/api";
import { deployContract } from "store/WalletsStore/thunks";
import { isWalletLockedError, SdkWalletService } from "sdk";
import { IUnlockedAccountMeta } from "types/wallet";

const ATOMIC_UNITS_PER_ASI = 10 ** NATIVE_TOKEN_DECIMALS_AMOUNT;

const MIN_PHLO_LIMIT = 1;
const MAX_PHLO_LIMIT = Number.MAX_SAFE_INTEGER;

export enum DeployEventTypes {
    DEPLOY_STARTED = "deploy-started",
    DEPLOY_SUBMITTED = "deploy-submitted",
    DEPLOY_STATUS = "deploy-status",
    DEPLOY_CONFIRMED = "deploy-confirmed",
    DEPLOY_FAILED = "deploy-failed",
    EXPLORE_STARTED = "explore-started",
    EXPLORE_COMPLETED = "explore-completed",
    EXPLORE_FAILED = "explore-failed",
}

export type TDeployEvent =
    | { type: DeployEventTypes.DEPLOY_STARTED; fileName?: string }
    | { type: DeployEventTypes.DEPLOY_SUBMITTED; deployId: string }
    | { type: DeployEventTypes.DEPLOY_STATUS; status: DeployStatus }
    | { type: DeployEventTypes.DEPLOY_CONFIRMED }
    | { type: DeployEventTypes.DEPLOY_FAILED; message: string }
    | { type: DeployEventTypes.EXPLORE_STARTED; fileName?: string }
    | { type: DeployEventTypes.EXPLORE_COMPLETED; result: unknown }
    | { type: DeployEventTypes.EXPLORE_FAILED; message: string };

enum DeployConfirmationMods {
    DEPLOY = "deploy",
    EXPLORE = "explore",
}

interface IPendingDeployRequest {
    term: string;
    fileName?: string;
}

export interface IUseDeployContractOptions {
    phloLimit: string;
    phloPrice: string;
    onEvent: (event: TDeployEvent) => void;
}

export interface IUseDeployContractResponse {
    account: IUnlockedAccountMeta | null;
    isBalanceReady: boolean;
    pendingTerm: string;
    pendingFileName?: string;
    isProcessing: boolean;
    isWaitingForConfirmation: boolean;
    isDeployConfirmed: boolean;
    isDeployConfirmationOpen: boolean;
    isExploreConfirmationOpen: boolean;
    isPasswordModalOpen: boolean;
    passwordError: string;
    requestDeploy: (term: string, fileName?: string) => void;
    requestExplore: (term: string, fileName?: string) => void;
    confirmDeploy: () => void;
    confirmExplore: () => void;
    submitPassword: (password: string) => void;
    cancel: () => void;
}

const parsePhloLimit = (value: string): number | null => {
    const parsed = Number(value.trim());

    return isIntegerInRange(parsed, MIN_PHLO_LIMIT, MAX_PHLO_LIMIT)
        ? parsed
        : null;
};

export const useDeployContract = ({
    phloLimit,
    phloPrice,
    onEvent,
}: IUseDeployContractOptions): IUseDeployContractResponse => {
    const dispatch = useAppDispatch();
    const selectedAccountId = useSelector(selectSelectedAccountId);
    const account = useSelector((state: RootState) =>
        selectedAccountId ? selectAccountById(state, selectedAccountId) : null,
    );
    const wallet = useSelector((state: RootState) =>
        selectedAccountId
            ? selectWalletByAccountId(state, selectedAccountId)
            : null,
    );
    const networkId = useSelector(selectSelectedNetworkId);
    const { currentData: balance, isError: isBalanceError } =
        useGetBalanceQuery(
            selectedAccountId
                ? { accountId: selectedAccountId, networkId }
                : skipToken,
        );

    const isBalanceReady = balance !== undefined && !isBalanceError;

    const [pendingRequest, setPendingRequest] =
        useState<IPendingDeployRequest | null>(null);
    const [confirmationMode, setConfirmationMode] =
        useState<DeployConfirmationMods | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [submittedDeployId, setSubmittedDeployId] = useState("");

    const deployWatch = useSelector((state: RootState) =>
        submittedDeployId ? selectDeployWatch(state, submittedDeployId) : null,
    );

    const isDeployConfirmed = deployWatch?.status === DeployStatus.FINALIZED;
    const isWaitingForConfirmation =
        !!deployWatch && !isDeployConfirmed && !deployWatch.error;

    const onEventRef = useRef(onEvent);

    useEffect(() => {
        onEventRef.current = onEvent;
    });

    const emit = (event: TDeployEvent): void => {
        onEventRef.current(event);
    };

    useEffect(() => {
        if (!deployWatch) {
            return;
        }

        if (deployWatch.error) {
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: deployWatch.error,
            });

            return;
        }

        emit({
            type: DeployEventTypes.DEPLOY_STATUS,
            status: deployWatch.status,
        });

        if (deployWatch.status === DeployStatus.FINALIZED) {
            emit({ type: DeployEventTypes.DEPLOY_CONFIRMED });
        }
    }, [deployWatch]);

    const closeModals = (): void => {
        setConfirmationMode(null);
        setIsPasswordModalOpen(false);
        setPasswordError("");
    };

    const cancel = (): void => {
        closeModals();
        setPendingRequest(null);
    };

    const walletId = wallet?.id;

    const requestDeploy = (term: string, fileName?: string): void => {
        if (!walletId || !selectedAccountId) {
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Session expired. Please login again.",
            });

            return;
        }

        setPendingRequest({ term, fileName });

        if (SdkWalletService.isWalletUnlocked(walletId)) {
            setConfirmationMode(DeployConfirmationMods.DEPLOY);

            return;
        }

        setIsPasswordModalOpen(true);
    };

    const requestExplore = (term: string, fileName?: string): void => {
        setPendingRequest({ term, fileName });
        setConfirmationMode(DeployConfirmationMods.EXPLORE);
    };

    const clearDeployWatch = (): void => {
        if (!submittedDeployId) {
            return;
        }

        dispatch(deployWatchCleared(submittedDeployId));
        setSubmittedDeployId("");
    };

    const executeDeploy = async (password?: string): Promise<void> => {
        if (!pendingRequest || !walletId || !selectedAccountId) {
            return;
        }

        if (!isBalanceReady) {
            cancel();
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Deploy aborted: account balance is unavailable",
            });

            return;
        }

        const phloLimitValue = parsePhloLimit(phloLimit);

        if (phloLimitValue === null) {
            cancel();
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Deploy aborted: invalid phlo limit",
            });

            return;
        }

        const minGasCost =
            (phloLimitValue * Number(phloPrice)) / ATOMIC_UNITS_PER_ASI;
        const availableBalance = Number(balance);

        if (availableBalance <= 0 || availableBalance < minGasCost) {
            cancel();
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Deploy aborted: insufficient balance",
            });

            return;
        }

        clearDeployWatch();
        setPasswordError("");
        setIsProcessing(true);
        emit({
            type: DeployEventTypes.DEPLOY_STARTED,
            fileName: pendingRequest.fileName,
        });

        try {
            const resultAction = await dispatch(
                deployContract({
                    walletId,
                    accountId: selectedAccountId,
                    term: pendingRequest.term,
                    phloLimit: phloLimitValue,
                    password,
                }),
            );

            if (deployContract.fulfilled.match(resultAction)) {
                cancel();
                setSubmittedDeployId(resultAction.payload.deployId);
                emit({
                    type: DeployEventTypes.DEPLOY_SUBMITTED,
                    deployId: resultAction.payload.deployId,
                });

                return;
            }

            const deployError = resultAction.error;

            if (isWalletLockedError(deployError) && password === undefined) {
                setConfirmationMode(null);
                setIsPasswordModalOpen(true);

                return;
            }

            if (password !== undefined) {
                setPasswordError(
                    deployError.message ||
                        "Failed to deploy the contract. Check your password.",
                );

                return;
            }

            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: deployError.message || "Deploy failed",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const executeExplore = async (): Promise<void> => {
        if (!pendingRequest) {
            return;
        }

        const { term, fileName } = pendingRequest;

        cancel();
        setIsProcessing(true);
        emit({ type: DeployEventTypes.EXPLORE_STARTED, fileName });

        try {
            const result: unknown = await SdkWalletService.exploreDeploy(term);

            emit({ type: DeployEventTypes.EXPLORE_COMPLETED, result });
        } catch (exploreError: unknown) {
            emit({
                type: DeployEventTypes.EXPLORE_FAILED,
                message:
                    (exploreError as Error)?.message || "Explore failed",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmDeploy = (): void => {
        setConfirmationMode(null);
        executeDeploy();
    };

    const confirmExplore = (): void => {
        executeExplore();
    };

    const submitPassword = (password: string): void => {
        executeDeploy(password);
    };

    return {
        account,
        isBalanceReady,
        pendingTerm: pendingRequest?.term ?? "",
        pendingFileName: pendingRequest?.fileName,
        isProcessing,
        isWaitingForConfirmation,
        isDeployConfirmed,
        isDeployConfirmationOpen:
            confirmationMode === DeployConfirmationMods.DEPLOY,
        isExploreConfirmationOpen:
            confirmationMode === DeployConfirmationMods.EXPLORE,
        isPasswordModalOpen,
        passwordError,
        requestDeploy,
        requestExplore,
        confirmDeploy,
        confirmExplore,
        submitPassword,
        cancel,
    };
};
