import NetworkConfigProvider from "@domains/NetworkConfigProvider";
import NetworkBusyRegistry from "@domains/NetworkBusyRegistry";
import { NetworkId } from "@domains/Network";
export interface IApiClientManagerContext {
    isReady(): boolean;
}
export interface IApiClientManagerConfigContext {
    networkConfigProvider: NetworkConfigProvider;
}
export interface IApiClientManagerBusyContext extends IApiClientManagerContext {
    networkBusyRegistry: NetworkBusyRegistry;
    getCurrentNetworkId(): NetworkId;
}
export declare function EnsureApiClientManagerInitialized<This extends IApiClientManagerContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export declare function EnsureApiClientManagerConfigured<This extends IApiClientManagerConfigContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export declare function EnsureCurrentNetworkNotBusy<This extends IApiClientManagerBusyContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export declare function EnsureTargetNetworkNotBusy<This extends IApiClientManagerBusyContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
