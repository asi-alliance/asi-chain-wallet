import ApiClientManager from "@domains/ApiClientManager";
import NodeApiAdapter from "@domains/NodeApiAdapter";
export default class NodeApiProvider {
    private static instance;
    private readonly apiClientManager;
    private constructor();
    static getInstance(apiClientManager?: ApiClientManager): NodeApiProvider;
    getApi(): NodeApiAdapter;
}
