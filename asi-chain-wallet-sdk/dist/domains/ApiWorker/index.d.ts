import { INetworkContext, NetworkId } from "@domains/Network";
import NodeApiAdapter from "@domains/NodeApiAdapter";
import { NodeApiProfile } from "@domains/NodeApiProfile";
export default abstract class ApiWorker {
    protected readonly networkContext: INetworkContext;
    constructor(networkContext: INetworkContext);
    getApi(): NodeApiAdapter;
    getNetworkId(): NetworkId;
    getNodeApiProfile(): NodeApiProfile;
}
