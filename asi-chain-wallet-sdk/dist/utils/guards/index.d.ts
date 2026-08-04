import Bip44Path from "@domains/Bip44Path";
import { IHDSecret, IPrivateKeyCredentials } from "@domains/SecretsProvider";
import { TCreateHDPathWalletOptions } from "@domains/Wallet";
export declare const isCustomCreateHDWalletOptions: (options: TCreateHDPathWalletOptions) => options is {
    customHDPath: Bip44Path;
};
export declare const isPrivateKeySecretData: (secretData: IPrivateKeyCredentials | IHDSecret) => secretData is IPrivateKeyCredentials;
