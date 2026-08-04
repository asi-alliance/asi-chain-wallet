import Asset from "@domains/Asset";
import SecretsProvider from "@domains/SecretsProvider";
import { Address } from "@domains/Wallet";
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
export default class TransactionService {
    private readonly deployService;
    private readonly blockService;
    constructor(deployService: DeployService, blockService: BlockService);
    private signDeploy;
    transfer({ walletType, account, signer, details, passwordProvider, }: ITransferPayload): Promise<string>;
    deploy({ walletType, account, signer, term, phloLimit, phloPrice, shardId, passwordProvider, }: IDeployPayload): Promise<string>;
    private signAndSubmit;
}
