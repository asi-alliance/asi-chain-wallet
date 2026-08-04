import ApiClientManager from "@domains/ApiClientManager";
import { SignedResult } from "@services/Signer";
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
export default class DeployService {
    private readonly apiClientManager;
    constructor(apiClientManager?: ApiClientManager);
    private extractDeployId;
    submitSignedDeploy(deploy: SignedResult): Promise<string | undefined>;
    exploreDeployData(rholangCode: string): Promise<any>;
    getDeploy(deployHash: string): Promise<any>;
    isDeployFinalized(deploy: any): Promise<boolean>;
    getDeployStatus(deployHash: string): Promise<IDeployStatusResult>;
}
