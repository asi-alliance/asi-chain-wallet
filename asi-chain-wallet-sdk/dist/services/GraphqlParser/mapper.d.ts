/**
 * Anti-Corruption Layer (ACL)
 */
import { NetworkId } from "@domains/Network";
import { RawDeployment, RawTransfer } from ".";
import { Transaction } from "@domains/Transaction";
type RawTransferMappingContext = {
    accountAddress: string;
    networkId: NetworkId;
};
type RawDeploymentMappingContext = {
    networkId: NetworkId;
};
export declare function mapRawTransferToTransaction(transfer: RawTransfer, context: RawTransferMappingContext): Transaction | undefined;
export declare function mapRawDeploymentToTransaction(deployment: RawDeployment, context: RawDeploymentMappingContext): Transaction | undefined;
export {};
