import Asset from "@domains/Asset";
import NodeApiProvider from "@domains/NodeApiProvider";
import SecretsProvider from "@domains/SecretsProvider";
import { Address } from "@domains/Wallet";
import { SignedResult } from "@services/Signer";
import Account from "@domains/Account";
import Signer, { WalletTypes } from "@domains/Signer";
import DeployService from "@services/DeployService";
import BlockService from "@services/BlockService";
export interface ITransferDetails {
    to: Address;
    amount: bigint;
    asset: Asset;
    phloLimit?: number;
    phloPrice?: number;
    shardId?: string;
}
export interface ITransferPayload {
    walletType: WalletTypes;
    account: Account;
    signer: Signer;
    details: ITransferDetails;
    passwordProvider?: SecretsProvider;
}
export interface IDeployPayload {
    walletType: WalletTypes;
    account: Account;
    signer: Signer;
    term: string;
    phloLimit?: number;
    phloPrice?: number;
    shardId?: string;
    passwordProvider?: SecretsProvider;
}
export type TDeployDetails = Omit<IDeployPayload, "walletType" | "account" | "signer" | "passwordProvider">;
export default class TransactionService {
    private readonly deployService;
    private readonly blockService;
    private readonly nodeApiProvider;
    constructor(deployService: DeployService, blockService: BlockService, nodeApiProvider?: NodeApiProvider);
    private get terms();
    signDeploy({ walletType, account, signer, term, phloLimit, phloPrice, shardId, passwordProvider, }: IDeployPayload): Promise<SignedResult>;
    private submitSignedDeploy;
    private signAndSubmit;
    transfer({ walletType, account, signer, details, passwordProvider, }: ITransferPayload): Promise<string>;
    deploy(payload: IDeployPayload): Promise<string>;
}
