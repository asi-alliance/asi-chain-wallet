import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
    DeployStatus,
    getErrorMessage,
    isIntegerInRange,
    DEFAULT_PHLO_PRICE,
    getNativeTokenDecimals,
} from "@asichain/asi-wallet-sdk";
import { INativeOperationContext, SdkWalletService } from "sdk";
import { RootState } from "store";
import { useAppDispatch } from "store/hooks";
import {
    deployWatchCleared,
    selectAccountById,
    selectDeployWatch,
    selectSelectedAccountId,
    selectSelectedNetworkId,
    selectSelectedNetworkKey,
    selectSelectedNetwork,
    selectWalletByAccountId,
} from "store/WalletsStore";
import { useGetBalanceQuery } from "store/WalletsStore/api";
import { deployContract, exploreDeploy } from "store/WalletsStore/thunks";
import {
    networkOperationFinished,
    networkOperationStarted,
    selectIsNetworkOperationPending,
} from "store/NetworkActivity";
import { IUnlockedAccountMeta } from "types/wallet";
import { canCoverDeployCost, getDeployCostAtomic } from "utils/deployFees";
import {
    IPasswordPromptProps,
    useWalletSessionAction,
} from "./useWalletSessionAction";

const MIN_PHLO_LIMIT = 1;
const MAX_PHLO_LIMIT = Number.MAX_SAFE_INTEGER;

export enum DeployEventTypes {
    DEPLOY_STARTED = "deploy-started",
    DEPLOY_SUBMITTED = "deploy-submitted",
    DEPLOY_STATUS = "deploy-status",
    DEPLOY_CONFIRMED = "deploy-confirmed",
    DEPLOY_FAILED = "deploy-failed",
    DEPLOY_UNRESOLVED = "deploy-unresolved",
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
    | { type: DeployEventTypes.DEPLOY_UNRESOLVED; message: string }
    | { type: DeployEventTypes.EXPLORE_STARTED; fileName?: string }
    | { type: DeployEventTypes.EXPLORE_COMPLETED; result: unknown }
    | { type: DeployEventTypes.EXPLORE_FAILED; message: string };

enum DeployConfirmationMods {
    DEPLOY = "deploy",
    EXPLORE = "explore",
}

interface IPendingDeployRequest {
    mode: DeployConfirmationMods.DEPLOY;
    term: string;
    fileName?: string;
    phloLimit: number;
    context: INativeOperationContext;
    walletId: string;
    account: IUnlockedAccountMeta;
    networkName: string;
    phloPrice: string;
}

interface IPendingExploreRequest {
    mode: DeployConfirmationMods.EXPLORE;
    term: string;
    fileName?: string;
}

type TPendingRequest = IPendingDeployRequest | IPendingExploreRequest;

export interface IUseDeployContractOptions {
    phloLimit: string;
    phloPrice: string;
    onEvent: (event: TDeployEvent) => void;
}

export interface IUseDeployContractResponse {
    account: IUnlockedAccountMeta | null;
    networkName: string;
    nativeTokenDecimals: number;
    pendingPhloLimit: string;
    pendingPhloPrice: string;
    isBalanceReady: boolean;
    isPhloLimitValid: boolean;
    isBlockedByAnotherChainOperation: boolean;
    submittedDeployId: string;
    submittedDeployStatus: string;
    unresolvedReason: string;
    pendingTerm: string;
    pendingFileName?: string;
    isProcessing: boolean;
    isWaitingForConfirmation: boolean;
    isDeployConfirmed: boolean;
    isDeployConfirmationOpen: boolean;
    isExploreConfirmationOpen: boolean;
    passwordPrompt: IPasswordPromptProps;
    requestDeploy: (term: string, fileName?: string) => void;
    requestExplore: (term: string, fileName?: string) => void;
    confirmDeploy: () => void;
    confirmExplore: () => void;
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
    const networkKey = useSelector(selectSelectedNetworkKey);
    const network = useSelector(selectSelectedNetwork);
    const networkName = network.name;
    const nativeTokenDecimals = getNativeTokenDecimals(network);
    const isChainOperationPending = useSelector(selectIsNetworkOperationPending);
    const { currentData: balance, isError: isBalanceError } =
        useGetBalanceQuery(
            selectedAccountId
                ? { accountId: selectedAccountId, networkId, networkKey }
                : skipToken,
        );

    const isBalanceReady = balance !== undefined && !isBalanceError;

    const [pendingRequest, setPendingRequest] =
        useState<TPendingRequest | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isExploring, setIsExploring] = useState(false);
    const [submittedDeployId, setSubmittedDeployId] = useState("");
    const confirmationSubmittedRef = useRef(false);
    const ownsPendingOperationRef = useRef(false);

    const isDeployPending =
        pendingRequest?.mode === DeployConfirmationMods.DEPLOY;
    const isOperationActive = pendingRequest !== null || isExploring;

    const deployWatch = useSelector((state: RootState) =>
        submittedDeployId ? selectDeployWatch(state, submittedDeployId) : null,
    );

    const isDeployConfirmed = deployWatch?.status === DeployStatus.FINALIZED;
    const isWaitingForConfirmation =
        !!deployWatch && !isDeployConfirmed && !deployWatch.unresolvedReason;

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

        if (deployWatch.unresolvedReason) {
            emit({
                type: DeployEventTypes.DEPLOY_UNRESOLVED,
                message: deployWatch.unresolvedReason,
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

    useEffect(() => {
        if (!isOperationActive) {
            return;
        }

        ownsPendingOperationRef.current = true;

        dispatch(networkOperationStarted());

        return () => {
            dispatch(networkOperationFinished());
        };
    }, [dispatch, isOperationActive]);

    useEffect(() => {
        if (!isChainOperationPending && !isOperationActive) {
            ownsPendingOperationRef.current = false;
        }
    }, [isChainOperationPending, isOperationActive]);

    const walletId = wallet?.id;

    const clearDeployWatch = (): void => {
        if (!submittedDeployId) {
            return;
        }

        dispatch(deployWatchCleared(submittedDeployId));
        setSubmittedDeployId("");
    };

    const deployAction = useWalletSessionAction({
        walletId: pendingRequest?.mode === DeployConfirmationMods.DEPLOY ? pendingRequest.walletId : walletId,
        action: (password?: string) => {
            if (
                pendingRequest?.mode !== DeployConfirmationMods.DEPLOY ||
                !pendingRequest.walletId
            ) {
                throw new Error("Deploy details are missing. Please retry.");
            }

            clearDeployWatch();
            emit({
                type: DeployEventTypes.DEPLOY_STARTED,
                fileName: pendingRequest.fileName,
            });

            return dispatch(
                deployContract({
                    walletId: pendingRequest.walletId,
                    accountId: pendingRequest.account.id,
                    term: pendingRequest.term,
                    phloLimit: pendingRequest.phloLimit,
                    context: pendingRequest.context,
                    password,
                }),
            ).unwrap();
        },
        onSuccess: ({ deployId }) => {
            confirmationSubmittedRef.current = false;
            setPendingRequest(null);
            setSubmittedDeployId(deployId);
            emit({ type: DeployEventTypes.DEPLOY_SUBMITTED, deployId });
        },
        onError: (message: string) => {
            confirmationSubmittedRef.current = false;
            setPendingRequest(null);
            emit({ type: DeployEventTypes.DEPLOY_FAILED, message });
        },
        errorFallback: "Deploy failed",
    });

    const cancel = (): void => {
        confirmationSubmittedRef.current = false;
        setIsConfirmationOpen(false);
        deployAction.passwordPrompt.onClose();
        setPendingRequest(null);
    };

    const requestDeploy = (term: string, fileName?: string): void => {
        if (isChainOperationPending || confirmationSubmittedRef.current || isConfirmationOpen || deployAction.isRunning || isExploring) {
            return;
        }
        if (!walletId || !selectedAccountId || !account) {
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Session expired. Please login again.",
            });

            return;
        }

        if (!isBalanceReady) {
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Deploy aborted: account balance is unavailable",
            });

            return;
        }

        const phloLimitValue = parsePhloLimit(phloLimit);

        if (phloLimitValue === null) {
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Deploy aborted: invalid phlo limit",
            });

            return;
        }

        const minGasCost = getDeployCostAtomic(phloLimitValue, phloPrice);
        if (minGasCost === null || phloPrice !== String(DEFAULT_PHLO_PRICE)) {
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Deploy aborted: invalid phlo price",
            });
            return;
        }

        if (!canCoverDeployCost(balance!, minGasCost, nativeTokenDecimals)) {
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Deploy aborted: insufficient balance",
            });

            return;
        }

        let context: INativeOperationContext;
        try {
            context = SdkWalletService.captureOperationContext();
            if (context.networkId !== networkId || context.nativeTokenDecimals !== nativeTokenDecimals) {
                throw new Error("Network changed. Check the details and try again.");
            }
        } catch (error) {
            emit({ type: DeployEventTypes.DEPLOY_FAILED, message: getErrorMessage(error, "Network changed. Please retry.") });
            return;
        }

        setPendingRequest({
            mode: DeployConfirmationMods.DEPLOY,
            term,
            fileName,
            phloLimit: phloLimitValue,
            phloPrice,
            context,
            walletId,
            account,
            networkName,
        });
        setIsConfirmationOpen(true);
    };

    const requestExplore = (term: string, fileName?: string): void => {
        if (isChainOperationPending || confirmationSubmittedRef.current || isConfirmationOpen || deployAction.isRunning || isExploring) {
            return;
        }
        setPendingRequest({
            mode: DeployConfirmationMods.EXPLORE,
            term,
            fileName,
        });
        setIsConfirmationOpen(true);
    };

    const executeExplore = async (): Promise<void> => {
        if (pendingRequest?.mode !== DeployConfirmationMods.EXPLORE) {
            return;
        }

        const { term, fileName } = pendingRequest;

        setPendingRequest(null);
        setIsExploring(true);
        emit({ type: DeployEventTypes.EXPLORE_STARTED, fileName });

        try {
            const result: unknown = await dispatch(exploreDeploy(term));

            emit({ type: DeployEventTypes.EXPLORE_COMPLETED, result });
        } catch (exploreError: unknown) {
            emit({
                type: DeployEventTypes.EXPLORE_FAILED,
                message: getErrorMessage(exploreError, "Explore failed"),
            });
        } finally {
            setIsExploring(false);
            confirmationSubmittedRef.current = false;
        }
    };

    const confirmDeploy = (): void => {
        if (!isConfirmationOpen || confirmationSubmittedRef.current || !isDeployPending) {
            return;
        }
        confirmationSubmittedRef.current = true;
        setIsConfirmationOpen(false);

        void deployAction.run();
    };

    const confirmExplore = (): void => {
        if (!isConfirmationOpen || confirmationSubmittedRef.current || pendingRequest?.mode !== DeployConfirmationMods.EXPLORE) {
            return;
        }
        confirmationSubmittedRef.current = true;
        setIsConfirmationOpen(false);

        void executeExplore();
    };

    return {
        account: pendingRequest?.mode === DeployConfirmationMods.DEPLOY ? pendingRequest.account : account,
        networkName: pendingRequest?.mode === DeployConfirmationMods.DEPLOY ? pendingRequest.networkName : networkName,
        nativeTokenDecimals: pendingRequest?.mode === DeployConfirmationMods.DEPLOY ? pendingRequest.context.nativeTokenDecimals : nativeTokenDecimals,
        pendingPhloLimit: pendingRequest?.mode === DeployConfirmationMods.DEPLOY ? String(pendingRequest.phloLimit) : phloLimit,
        pendingPhloPrice: pendingRequest?.mode === DeployConfirmationMods.DEPLOY ? pendingRequest.phloPrice : phloPrice,
        isBalanceReady,
        isPhloLimitValid: parsePhloLimit(phloLimit) !== null,
        isBlockedByAnotherChainOperation:
            isChainOperationPending && !ownsPendingOperationRef.current,
        submittedDeployId,
        submittedDeployStatus: deployWatch?.status ?? "",
        unresolvedReason: deployWatch?.unresolvedReason ?? "",
        pendingTerm: pendingRequest?.term ?? "",
        pendingFileName: pendingRequest?.fileName,
        isProcessing: deployAction.isRunning || isExploring,
        isWaitingForConfirmation,
        isDeployConfirmed,
        isDeployConfirmationOpen: isConfirmationOpen && isDeployPending,
        isExploreConfirmationOpen:
            isConfirmationOpen &&
            pendingRequest?.mode === DeployConfirmationMods.EXPLORE,
        passwordPrompt: deployAction.passwordPrompt,
        requestDeploy,
        requestExplore,
        confirmDeploy,
        confirmExplore,
        cancel,
    };
};
