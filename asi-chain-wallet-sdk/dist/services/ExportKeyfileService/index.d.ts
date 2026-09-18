import { ExportFormat } from "@config/index";
import Account from "@domains/Account";
import Wallet from "@domains/Wallet";
import { Transaction } from "@domains/Transaction";
import SecretsProvider from "@domains/SecretsProvider";
import { IKeyfileAccount, IKeyfileWallet } from "@services/KeyfileSerializer";
export interface IKeyfileEnvelope {
    version: number;
    type: string;
    timestamp: string;
}
export interface IAccountKeyfile extends IKeyfileEnvelope {
    account: IKeyfileAccount;
}
export interface IWalletKeyfile extends IKeyfileEnvelope, IKeyfileWallet {
}
export default class ExportKeyfileService {
    static toJSON(data: unknown): string;
    private static createKeyfileEnvelope;
    static exportAccountKeyfile(account: Account): IAccountKeyfile;
    static exportWalletKeyfile(wallet: Wallet, passwordProvider: SecretsProvider): Promise<IWalletKeyfile>;
    private static escapeCsvValue;
    static transactionsToCsv(transactions: Transaction[]): string;
    static exportTransactions(transactions: Transaction[], format?: ExportFormat): string;
}
