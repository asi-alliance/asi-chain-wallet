import { ICreateClientFlags } from "@domains/Client";
import { WalletTypes } from "@domains/Signer";
import { ITableRecord, ITableService } from "@domains/TableService";
import AccountManager from "@services/AccountManager";
export declare function EnsureDatabaseInitialized<This extends ITableService<ITableRecord>, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Awaited<Return>>;
export declare function EnsureTableExists<This extends ITableService<ITableRecord>, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Awaited<Return>>;
export declare function SkipIfDatabaseNotInitialized<This extends ITableService<ITableRecord>, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Awaited<Return> | undefined>;
export declare function SkipIfTableExists<This extends ITableService<ITableRecord>, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Awaited<Return> | undefined>;
interface IWalletContext {
    accountManager: AccountManager;
    getType(): WalletTypes;
}
export declare function OnlyHDWallet<This extends IWalletContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Promise<Awaited<Return>>;
export declare function EnsureActiveAccountExist<This extends IWalletContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export interface IClientContext {
    flags?: ICreateClientFlags;
}
export declare function EnsureWithInsensitiveCacheStorage<This extends IClientContext, Args extends any[], Return>(target: (...args: Args) => Return, _context: ClassMethodDecoratorContext): (this: This, ...args: Args) => Return;
export {};
