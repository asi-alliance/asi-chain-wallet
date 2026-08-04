import { Address } from "@domains/Wallet";
export declare const escapeRholangString: (value: string) => string;
export declare const createCheckBalanceDeploy: (address: Address) => string;
export declare const createTransferDeploy: (fromAddress: Address, toAddress: Address, amount: bigint) => string;
