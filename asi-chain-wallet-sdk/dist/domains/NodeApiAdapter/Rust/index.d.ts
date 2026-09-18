import NodeApiAdapter from "@domains/NodeApiAdapter";
import { NodeApiProfile } from "@domains/NodeApiProfile";
import { IDeployInfo } from "@domains/Deploy";
interface ISimpleExploreDeployRequest {
    term: string;
}
export default class RustNodeApiAdapter extends NodeApiAdapter {
    getProfile(): NodeApiProfile;
    protected buildExploreDeployBody(term: string): ISimpleExploreDeployRequest;
    isDeployFinalized(deploy: IDeployInfo): boolean;
}
export {};
