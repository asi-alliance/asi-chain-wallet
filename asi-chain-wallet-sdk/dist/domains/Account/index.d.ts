import Asset, { Assets } from "@domains/Asset";
import SecretsProvider from "@domains/SecretsProvider";
import type { Address } from "@domains/Wallet";
import { Transaction } from "@domains/Transaction";
import { NetworkId } from "@domains/Network";
import { Pagination } from "@services/GraphqlParser/queryOptions";
export interface IPortfolioOptions {
    assets?: Assets;
    primaryAsset?: Asset;
}
export interface IAccountOptions {
    id?: string;
    name: string;
    index: number | null;
    address: Address;
    publicKey: Uint8Array;
    portfolioOptions?: IPortfolioOptions;
}
export type TEditableAccountOptions = Partial<Pick<IAccountOptions, "name">>;
export type TCreateAccountPayload = Omit<IAccountOptions, "address" | "index" | "publicKey"> & {
    index?: number;
};
export interface IAccountRecord {
    id: string;
    signerId: string;
    name: string;
    index: number | null;
}
declare class Account {
    private readonly id;
    private readonly index;
    private readonly address;
    private readonly publicKey;
    private name;
    private assets;
    private primaryAsset;
    constructor({ id, name, index, portfolioOptions, address, publicKey, }: IAccountOptions);
    getId(): string;
    getName(): string;
    getIndex(): number | null;
    listAssets(): Asset[];
    getAddress(): Address;
    getPublicKey(): Uint8Array;
    getAsset(id: Asset["id"]): Asset | null;
    registerAsset(asset: Asset): void;
    setPrimaryAsset(id: Asset["id"]): void;
    static create(accountOptions: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<Account>;
    update(options: TEditableAccountOptions): void;
    getBalance(): Promise<import("../..").IBalanceData>;
    getTransactionsHistory(networkId?: NetworkId, pagination?: Pagination): Promise<Transaction[]>;
}
export default Account;
