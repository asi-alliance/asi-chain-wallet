import DeployService, { IDeployStatusResult } from "@services/DeployService";
export interface IDeployConfirmedResult {
    deployId: string;
    blockHash?: string;
}
export interface IDeployWatchCallbacks {
    onConfirmed?: (result: IDeployConfirmedResult) => void;
    onError?: (error: Error) => void;
    onStatus?: (status: IDeployStatusResult, deployId: string) => void;
}
export interface IDeployWatchOptions {
    intervalMs?: number;
    timeoutMs?: number;
}
export interface IDeployWatchHandle {
    cancel: () => void;
    done: Promise<IDeployConfirmedResult>;
}
export default class DeployStatusPoller {
    private readonly deployService;
    constructor(deployService: DeployService);
    watch(deployId: string, callbacks?: IDeployWatchCallbacks, { intervalMs, timeoutMs, }?: IDeployWatchOptions): IDeployWatchHandle;
    waitFor(deployId: string, options?: IDeployWatchOptions): Promise<IDeployConfirmedResult>;
}
