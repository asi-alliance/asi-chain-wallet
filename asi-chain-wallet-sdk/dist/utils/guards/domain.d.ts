import Bip44Path from "@domains/Bip44Path";
import { IHDSecret, IPrivateKeyCredentials, TStoredSecret } from "@domains/SecretsProvider";
import { TCreateHDPathWalletOptions } from "@domains/Wallet";
import { ISerializedTransactionReservationPrivateData } from "@domains/Transaction";
import { NodeApiProfile } from "@domains/NodeApiProfile";
import type { EncryptedData } from "@services/Crypto";
import type { IKeyfileAccount, IKeyfileWalletAccount } from "@services/KeyfileSerializer";
export declare const isCustomCreateHDWalletOptions: (options: TCreateHDPathWalletOptions) => options is {
    customHDPath: Bip44Path;
};
export declare const isPrivateKeySecretData: (secretData: IPrivateKeyCredentials | IHDSecret) => secretData is IPrivateKeyCredentials;
export declare const isNodeApiProfile: (value: unknown) => value is NodeApiProfile;
export declare const isStoredSecret: (value: unknown) => value is TStoredSecret;
export declare const isSerializedReservationPrivateData: (value: unknown) => value is ISerializedTransactionReservationPrivateData;
export declare const isEncryptedData: (value: unknown) => value is EncryptedData;
export declare const isKeyfileAccount: (value: unknown) => value is IKeyfileAccount;
export declare const isKeyfileWalletAccount: (value: unknown) => value is IKeyfileWalletAccount;
