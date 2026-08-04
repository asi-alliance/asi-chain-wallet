import NetworkConfigProvider from "@domains/NetworkConfigProvider";
export interface IApiClientManagerContext {
    isReady(): boolean;
}
export interface IApiClientManagerConfigContext {
    networkConfigProvider: NetworkConfigProvider;
}
export declare function EnsureApiClientManagerInitialized<This extends IApiClientManagerContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export declare function EnsureApiClientManagerConfigured<This extends IApiClientManagerConfigContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
