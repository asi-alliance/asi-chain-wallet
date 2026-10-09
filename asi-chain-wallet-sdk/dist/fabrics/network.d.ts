import { INetworkConfig, INetworkRecord, INetworkUpdate, NetworkName } from "@domains/Network";
export interface ICreateNetworkRecordPayload {
    name: NetworkName;
    config: INetworkConfig;
}
export interface IUpdateNetworkRecordPayload {
    record: INetworkRecord;
    update: INetworkUpdate;
}
export declare const createNetworkRecord: ({ name, config, }: ICreateNetworkRecordPayload) => INetworkRecord;
export declare const createUpdatedNetworkRecord: ({ record, update, }: IUpdateNetworkRecordPayload) => INetworkRecord;
