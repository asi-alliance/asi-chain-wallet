import Wallet from "@domains/Wallet";
import SecretsProvider from "@domains/SecretsProvider";
import Signer, { ISignerRecord, WalletTypes } from "@domains/Signer";
import Account, { IAccountRecord } from "@domains/Account";
import { ISignerStorageRecord } from "@domains/SignersStorageRepository/index";
import { IAccountStorageRecord } from "@domains/AccountsStorageRepository";
import { INetworkRecord, IPersistedNetworkRecord, NetworkId } from "@domains/Network";
import { EncryptedData } from "@services/Crypto";
import { ITransactionReservationsStorageRecord } from "@domains/TransactionReservationsStorageRepository";
import { IStorageFabricOptions } from "@fabrics/storage";
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
    signer: ISignerStorageRecord;
    accounts: IAccountRecord[];
}
export interface ISaveTransactionReservationsOptions {
    id: string;
    networkId: NetworkId;
    signerId: string;
    encryptedData: EncryptedData;
}
declare class StorageManager {
    static init: (options?: IStorageFabricOptions) => Promise<void>;
    static saveSigner: ({ id, type, signer, }: ISaveSignerToStorageOptions) => Promise<void>;
    static saveSigners: (signersOptions: ISaveSignerToStorageOptions[]) => Promise<void[]>;
    static getSigner: (id: string) => Promise<ISignerRecord>;
    static getSigners: () => Promise<ISignerStorageRecord[]>;
    static findSignerByFingerprint: (fingerprint: string) => Promise<ISignerStorageRecord | null>;
    static updateSigner: (id: string, updates: Partial<ISignerStorageRecord>) => Promise<void>;
    static deleteSigner: (id: string) => Promise<void>;
    static deleteMultipleSigners: (ids: string[]) => Promise<void>;
    static saveAccount: ({ id, account, signerId, }: ISaveAccountToStorageOptions) => Promise<void>;
    static saveAccounts: (accountsOptions: ISaveAccountToStorageOptions[]) => Promise<void>;
    static getAccount: (id: string) => Promise<IAccountRecord>;
    static getAccounts: () => Promise<IAccountStorageRecord[]>;
    static getAccountsBySignerId: (signerId: string) => Promise<IAccountStorageRecord[]>;
    static findAccountByFingerprint: (fingerprint: string) => Promise<IAccountStorageRecord | null>;
    static updateAccount: (id: string, updates: Partial<IAccountRecord>) => Promise<void>;
    static deleteAccount: (id: string) => Promise<void>;
    static deleteMultipleAccounts: (ids: string[]) => Promise<void>;
    static saveWallet: ({ signerId, wallet, }: ISaveWalletToStorageOptions) => Promise<void>;
    static saveWallets: (walletsOptions: ISaveWalletToStorageOptions[]) => Promise<void[]>;
    static getWallet: ({ signerId, passwordProvider, }: IGetWalletFromStorageOptions) => Promise<Wallet>;
    static getWallets: () => Promise<IWalletStorageData[]>;
    static saveTransactionReservation: ({ id, networkId, signerId, encryptedData, }: ISaveTransactionReservationsOptions) => Promise<void>;
    static getTransactionReservationsBySignerId: (signerId: string) => Promise<ITransactionReservationsStorageRecord[]>;
    static updateTransactionReservation: (id: string, updates: Partial<ITransactionReservationsStorageRecord>) => Promise<void>;
    static deleteTransactionReservation: (id: string) => Promise<void>;
    static deleteMultipleTransactionReservations: (ids: string[]) => Promise<void>;
    static getCustomNetworks: () => Promise<IPersistedNetworkRecord[]>;
    static saveCustomNetwork: (network: INetworkRecord) => Promise<void>;
    static updateCustomNetwork: (network: INetworkRecord) => Promise<void>;
    static deleteCustomNetwork: (id: NetworkId) => Promise<void>;
    static clear: () => Promise<void>;
    static close: () => void;
}
export default StorageManager;
