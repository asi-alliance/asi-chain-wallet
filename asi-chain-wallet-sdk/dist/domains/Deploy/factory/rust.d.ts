import { Address } from "@domains/Wallet";
export declare const createRustCheckBalanceDeploy: (address: Address) => string;
export declare const createRustTransferDeploy: (fromAddress: Address, toAddress: Address, amount: bigint) => string;
