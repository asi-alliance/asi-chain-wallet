import ItemManager from "@services/ItemManager";
export declare enum OperationScopeMode {
    SHARED = "SHARED",
    EXCLUSIVE = "EXCLUSIVE"
}
export interface IOperationScope<TOwner> {
    key: string;
    mode: OperationScopeMode;
    owner: TOwner;
}
export default class ConcurrentOperationGuardService<TOwner = string> extends ItemManager<TOwner> {
    private readonly sharedScopeHolders;
    private readonly exclusiveScopeHolders;
    private findConflictOwner;
    hasExclusiveScope(key: string): boolean;
    hasScopeHolders(key: string): boolean;
    private findScopeConflictOwner;
    private acquireScope;
    private releaseScope;
    run<T>(reservations: Map<string, TOwner>, createConflictError: (conflictOwner: TOwner) => Error, operation: () => Promise<T>, scope?: IOperationScope<TOwner>): Promise<T>;
}
