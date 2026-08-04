import Wallet from "@domains/Wallet";
import { DeployData } from "@domains/Deploy";
export interface SigningRequest {
    wallet: Wallet;
    data: any;
}
export interface SignedResult {
    data: any;
    deployer: string;
    signature: string;
    sigAlgorithm: string;
}
export default class SignerService {
    static readonly deployDataProtobufSerialize: (deployData: DeployData) => Uint8Array;
}
