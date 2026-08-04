import Bip44Path from "@domains/Bip44Path";
export interface IPasswordCredentials {
    password: string;
}
export interface IPrivateKeyCredentials {
    privateKey: Uint8Array;
}
export interface ISeedCredentials {
    seed: string;
}
export interface IPrivateKeyWithCredentials extends IPasswordCredentials {
    privateKey: Uint8Array;
}
export interface IHDSecret extends ISeedCredentials {
    rootHDPath: Bip44Path;
}
export interface IHDSecretRecord extends ISeedCredentials {
    rootHDPath: string;
}
export interface IAccountHDData extends ISeedCredentials {
    path: string;
}
export type TSecretsProviderInterface = () => any;
export default class SecretsProvider {
    #private;
    constructor(providerInterface: TSecretsProviderInterface);
    getSecret(): any;
}
