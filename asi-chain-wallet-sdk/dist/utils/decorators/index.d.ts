import { ICreateClientFlags } from "@domains/Client";
import { WalletTypes } from "@domains/Signer";
import { ITableRecord, ITableService } from "@domains/TableService";
import LifecycleGuard from "@domains/LifecycleGuard";
import ConcurrentOperationGuardService from "@services/ConcurrentOperationGuard";
export declare function EnsureDatabaseInitialized<This extends ITableService<ITableRecord>, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Awaited<Return>>;
export declare function EnsureTableExists<This extends ITableService<ITableRecord>, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Awaited<Return>>;
export declare function SkipIfDatabaseNotInitialized<This extends ITableService<ITableRecord>, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Awaited<Return> | undefined>;
export declare function SkipIfTableExists<This extends ITableService<ITableRecord>, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Awaited<Return> | undefined>;
interface IWalletContext {
    getType(): WalletTypes;
}
export declare function OnlyHDWallet<This extends IWalletContext, Args extends any[], Return>(target: (...args: Args) => Return, context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
interface IAccountOperationsContext {
    getId(): string;
    accountOperationsGuard: ConcurrentOperationGuardService<string>;
}
export declare function EnsureAccountIsIdle<This extends IAccountOperationsContext, Args extends [string, ...any[]], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export interface IClosableContext {
    isActive(): boolean;
}
export declare function EnsureActive<This extends IClosableContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export interface ITrackedOperationContext {
    lifecycleGuard: LifecycleGuard;
}
export declare function TrackOperation<This extends ITrackedOperationContext, Args extends any[], Return>(target: (...args: Args) => Promise<Return>, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Return>;
export interface IClientContext {
    flags?: ICreateClientFlags;
}
export declare function EnsureWithInsensitiveCacheStorage<This extends IClientContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export {};
