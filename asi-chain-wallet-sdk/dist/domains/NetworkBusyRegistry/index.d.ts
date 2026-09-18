import { NetworkId } from "@domains/Network";
export default class NetworkBusyRegistry {
    private readonly counters;
    acquire(networkId: NetworkId): void;
    release(networkId: NetworkId): void;
    isBusy(networkId: NetworkId): boolean;
    clear(): void;
    private getCounter;
}
