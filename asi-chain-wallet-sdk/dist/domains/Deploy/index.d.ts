export interface DeployData {
    term: string;
    phloLimit: number;
    phloPrice: number;
    validAfterBlockNumber: number;
    timestamp: number;
    shardId?: string;
}
export interface IDeployInfo {
    blockHash?: string;
    faultTolerance?: number;
}
export declare enum DeployStatus {
    DEPLOYING = "Deploying",
    INCLUDED_IN_BLOCK = "IncludedInBlock",
    FINALIZED = "Finalized",
    CHECK_ERROR = "CheckingError"
}
export type IDeployStatusResult = {
    status: DeployStatus.DEPLOYING | DeployStatus.INCLUDED_IN_BLOCK | DeployStatus.FINALIZED;
} | {
    status: DeployStatus.CHECK_ERROR;
    errorMessage: string;
};
