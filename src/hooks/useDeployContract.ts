import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
    DeployStatus,
    getErrorMessage,
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
import {
    networkOperationFinished,
    networkOperationStarted,
} from "store/networkOperationSlice";
import { SdkWalletService } from "sdk";
import { IUnlockedAccountMeta } from "types/wallet";
import {
    IPasswordPromptProps,
    useWalletSessionAction,
} from "./useWalletSessionAction";

const ATOMIC_UNITS_PER_ASI = 10 ** NATIVE_TOKEN_DECIMALS_AMOUNT;

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
    isBalanceReady: boolean;
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
    const { currentData: balance, isError: isBalanceError } =
        useGetBalanceQuery(
            selectedAccountId
                ? { accountId: selectedAccountId, networkId }
                : skipToken,
        );

    const isBalanceReady = balance !== undefined && !isBalanceError;

    const [pendingRequest, setPendingRequest] =
        useState<TPendingRequest | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isExploring, setIsExploring] = useState(false);
    const [submittedDeployId, setSubmittedDeployId] = useState("");

    const isDeployPending =
        pendingRequest?.mode === DeployConfirmationMods.DEPLOY;

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
        if (!isDeployPending) {
            return;
        }

        dispatch(networkOperationStarted());

        return () => {
            dispatch(networkOperationFinished());
        };
    }, [dispatch, isDeployPending]);

    const walletId = wallet?.id;

    const clearDeployWatch = (): void => {
        if (!submittedDeployId) {
            return;
        }

        dispatch(deployWatchCleared(submittedDeployId));
        setSubmittedDeployId("");
    };

    const deployAction = useWalletSessionAction({
        walletId,
        action: (password?: string) => {
            if (
                pendingRequest?.mode !== DeployConfirmationMods.DEPLOY ||
                !walletId ||
                !selectedAccountId
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
                    walletId,
                    accountId: selectedAccountId,
                    term: pendingRequest.term,
                    phloLimit: pendingRequest.phloLimit,
                    password,
                }),
            ).unwrap();
        },
        onSuccess: ({ deployId }) => {
            setPendingRequest(null);
            setSubmittedDeployId(deployId);
            emit({ type: DeployEventTypes.DEPLOY_SUBMITTED, deployId });
        },
        onError: (message: string) => {
            setPendingRequest(null);
            emit({ type: DeployEventTypes.DEPLOY_FAILED, message });
        },
        errorFallback: "Deploy failed",
    });

    const cancel = (): void => {
        setIsConfirmationOpen(false);
        deployAction.passwordPrompt.onClose();
        setPendingRequest(null);
    };

    const requestDeploy = (term: string, fileName?: string): void => {
        if (!walletId || !selectedAccountId) {
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

        const minGasCost =
            (phloLimitValue * Number(phloPrice)) / ATOMIC_UNITS_PER_ASI;
        const availableBalance = Number(balance);

        if (availableBalance <= 0 || availableBalance < minGasCost) {
            emit({
                type: DeployEventTypes.DEPLOY_FAILED,
                message: "Deploy aborted: insufficient balance",
            });

            return;
        }

        setPendingRequest({
            mode: DeployConfirmationMods.DEPLOY,
            term,
            fileName,
            phloLimit: phloLimitValue,
        });
        setIsConfirmationOpen(true);
    };

    const requestExplore = (term: string, fileName?: string): void => {
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
            const result: unknown = await SdkWalletService.exploreDeploy(term);

            emit({ type: DeployEventTypes.EXPLORE_COMPLETED, result });
        } catch (exploreError: unknown) {
            emit({
                type: DeployEventTypes.EXPLORE_FAILED,
                message: getErrorMessage(exploreError, "Explore failed"),
            });
        } finally {
            setIsExploring(false);
        }
    };

    const confirmDeploy = (): void => {
        setIsConfirmationOpen(false);

        void deployAction.run();
    };

    const confirmExplore = (): void => {
        setIsConfirmationOpen(false);

        void executeExplore();
    };

    return {
        account,
        isBalanceReady,
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
