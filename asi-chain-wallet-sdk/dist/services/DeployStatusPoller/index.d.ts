import ApiWorker from "@domains/ApiWorker";
import { IDeployStatusResult } from "@domains/Deploy";
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
export default class DeployStatusPoller extends ApiWorker {
    watch(deployId: string, callbacks?: IDeployWatchCallbacks, { intervalMs, timeoutMs, }?: IDeployWatchOptions): IDeployWatchHandle;
    waitFor(deployId: string, options?: IDeployWatchOptions): Promise<IDeployConfirmedResult>;
}
