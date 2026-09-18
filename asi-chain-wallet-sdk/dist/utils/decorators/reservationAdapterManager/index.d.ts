import { NetworkId } from "@domains/Network";
export interface IExclusiveNetworkContext {
    isExclusiveNetwork(networkId: NetworkId): boolean;
}
export declare function EnsureExclusiveNetwork<This extends IExclusiveNetworkContext, Args extends [NetworkId, ...any[]], Return>(target: (...args: Args) => Promise<Return>, context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Return>;
