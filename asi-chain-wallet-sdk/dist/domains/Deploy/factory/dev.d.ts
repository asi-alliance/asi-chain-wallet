import { Address } from "@domains/Wallet";
export declare const createDevCheckBalanceDeploy: (address: Address) => string;
export declare const createDevTransferDeploy: (fromAddress: Address, toAddress: Address, amount: bigint) => string;
