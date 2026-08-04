import type { INetworkRecord, NetworkId } from "@domains/Network";
interface INetworkConfigProviderContext {
    isReady(): boolean;
    networksRecords: Map<NetworkId, INetworkRecord> | null;
}
export declare function EnsureNetworkConfigProviderReady<This extends INetworkConfigProviderContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export declare function EnsureNetworkExist<This extends INetworkConfigProviderContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export declare function EnsureNetworkNotDefault<This extends INetworkConfigProviderContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export {};
