import Wallet from "@domains/Wallet";
import SecretsProvider from "@domains/SecretsProvider";
import Signer, { ISignerRecord, WalletTypes } from "@domains/Signer";
import Account, { IAccountRecord } from "@domains/Account";
import { ITransactionReservationPrivateData } from "@domains/Transaction";
import { INetworkRecord, NetworkId } from "@domains/Network";
import { ITransactionReservationsStorageRecord } from "@domains/TransactionReservationsStorageRepository";
import { IStorageFabricOptions } from "@fabrics/Storage";
export interface ISaveSignerToStorageOptions {
    id: string;
    type: WalletTypes;
    signer: Signer;
}
export interface ISaveAccountToStorageOptions {
    id: string;
    account: Account;
    signerId: string;
}
export interface ISaveWalletToStorageOptions {
    signerId: string;
    wallet: Wallet;
}
export interface IGetWalletFromStorageOptions {
    signerId: string;
    passwordProvider: SecretsProvider;
}
export interface IWalletStorageData {
    signer: ISignerRecord;
    accounts: IAccountRecord[];
}
export interface ISaveTransactionReservationsOptions {
    id: string;
    networkId: NetworkId;
    signerId: string;
    privateData: ITransactionReservationPrivateData;
}
declare class StorageManager {
    static init: (options?: IStorageFabricOptions) => Promise<void>;
    static saveSigner: ({ id, type, signer, }: ISaveSignerToStorageOptions) => Promise<void>;
    static saveSigners: (signersOptions: ISaveSignerToStorageOptions[]) => Promise<void[]>;
    static getSigner: (id: string) => Promise<ISignerRecord>;
    static getSigners: () => Promise<ISignerRecord[]>;
    static updateSigner: (id: string, updates: Partial<ISignerRecord>) => Promise<void>;
    static deleteSigner: (id: string) => Promise<void>;
    static deleteMultipleSigners: (ids: string[]) => Promise<void>;
    static saveAccount: ({ id, account, signerId, }: ISaveAccountToStorageOptions) => Promise<void>;
    static saveAccounts: (accountsOptions: ISaveAccountToStorageOptions[]) => Promise<void>;
    static getAccount: (id: string) => Promise<IAccountRecord>;
    static getAccounts: () => Promise<IAccountRecord[]>;
    static updateAccount: (id: string, updates: Partial<IAccountRecord>) => Promise<void>;
    static deleteAccount: (id: string) => Promise<void>;
    static deleteMultipleAccounts: (ids: string[]) => Promise<void>;
    static saveWallet: ({ signerId, wallet, }: ISaveWalletToStorageOptions) => Promise<void>;
    static saveWallets: (walletsOptions: ISaveWalletToStorageOptions[]) => Promise<void[]>;
    static getWallet: ({ signerId, passwordProvider, }: IGetWalletFromStorageOptions) => Promise<Wallet>;
    static getWallets: () => Promise<IWalletStorageData[]>;
    static saveTransactionReservation: ({ id, networkId, signerId, privateData, }: ISaveTransactionReservationsOptions) => Promise<void>;
    static getTransactionReservationsBySignerId: (signerId: string, networkId: NetworkId) => Promise<ITransactionReservationsStorageRecord[]>;
    static updateTransactionReservation: (id: string, updates: Partial<ITransactionReservationsStorageRecord>) => Promise<void>;
    static deleteTransactionReservation: (id: string) => Promise<void>;
    static deleteMultipleTransactionReservations: (ids: string[]) => Promise<void>;
    static getCustomNetworks: () => Promise<INetworkRecord[]>;
    static saveCustomNetwork: (network: INetworkRecord) => Promise<void>;
    static updateCustomNetwork: (network: INetworkRecord) => Promise<void>;
    static deleteCustomNetwork: (id: NetworkId) => Promise<void>;
    static clear: () => Promise<void>;
    static close: () => void;
}
export default StorageManager;
