export enum OperationKind {
    TRANSFER = "transfer",
    DEPLOY = "deploy",
    BRIDGE_ASI_LOCK = "bridge-asi-lock",
    BRIDGE_EVM_APPROVE = "bridge-evm-approve",
    BRIDGE_EVM_LOCK = "bridge-evm-lock",
}

export enum OperationStage {
    SIGNING = "signing",
    SUBMITTING = "submitting",
    AWAITING_CONFIRMATION = "awaiting-confirmation",
}

interface IOperationBase {
    id: string;
    kind: OperationKind;
    networkId: string;
    accountId: string;
    startedAt: number;
}

export interface IPendingOperation extends IOperationBase {
    stage: OperationStage.SIGNING | OperationStage.SUBMITTING;
}

export interface ISubmittedOperation extends IOperationBase {
    stage: OperationStage.AWAITING_CONFIRMATION;
    transactionId: string;
}

export type TOperation = IPendingOperation | ISubmittedOperation;

export type TOperationStart = Pick<
    IPendingOperation,
    "kind" | "networkId" | "accountId" | "stage"
>;

export type TOperationStageChange =
    | Pick<IPendingOperation, "id" | "stage">
    | Pick<ISubmittedOperation, "id" | "stage" | "transactionId">;

export type TOperationLookup = Pick<
    TOperation,
    "kind" | "networkId" | "accountId"
>;
