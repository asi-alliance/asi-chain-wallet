import NodeApiProvider from "@domains/NodeApiProvider";
import { IDeployInfo, IDeployStatusResult } from "@domains/Deploy";
import { SignedResult } from "@services/Signer";
export default class DeployService {
    private readonly nodeApiProvider;
    constructor(nodeApiProvider?: NodeApiProvider);
    private get api();
    private extractDeployId;
    submitSignedDeploy(deploy: SignedResult): Promise<string | undefined>;
    exploreDeployData(rholangCode: string): Promise<any>;
    getDeploy(deployHash: string): Promise<any>;
    isDeployFinalized(deploy: IDeployInfo): Promise<boolean>;
    getDeployStatus(deployHash: string): Promise<IDeployStatusResult>;
}
