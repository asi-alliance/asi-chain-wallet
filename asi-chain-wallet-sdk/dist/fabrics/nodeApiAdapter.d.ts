import NodeApiAdapter from "@domains/NodeApiAdapter";
import type { IApiClients } from "@domains/ApiClientManager";
import { NodeApiProfile } from "@domains/NodeApiProfile";
export declare const createNodeApiAdapter: (profile: NodeApiProfile, clients: IApiClients) => NodeApiAdapter;
