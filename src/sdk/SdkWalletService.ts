import {
    Account,
    Address,
    Client,
    IAccountMetadata,
    IWalletMetadata,
    Wallet,
} from "@asichain/asi-wallet-sdk";
import { getSdkClient, requireSdkClient } from "./client";
import { IAccountMeta, IWalletMeta } from "types/wallet";

export class SdkWalletService {
    private static readonly PRIVATE_KEY_BYTES = 32;

    private static bytesToHex(bytes: Uint8Array): string {
        return Array.from(bytes, (byte) =>
            byte.toString(16).padStart(2, "0"),
        ).join("");
    }

    private static hexToBytes(hex: string): Uint8Array {
        const clean = hex.trim().replace(/^0x/i, "");

        if (
            clean.length !== SdkWalletService.PRIVATE_KEY_BYTES * 2 ||
            /[^0-9a-fA-F]/.test(clean)
        ) {
            throw new Error(
                "Invalid private key: expected 64 hexadecimal characters",
            );
        }

        const bytes = new Uint8Array(SdkWalletService.PRIVATE_KEY_BYTES);
        for (let i = 0; i < SdkWalletService.PRIVATE_KEY_BYTES; i++) {
            bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
        }

        return bytes;
    }

    private static mapAccount(account: Account): IAccountMeta {
        return {
            id: account.getId(),
            name: account.getName(),
            index: account.getIndex(),
            address: account.getAddress(),
        };
    }

    private static mapWallet(wallet: Wallet): IWalletMeta {
        return {
            id: wallet.getId(),
            signerId: wallet.getSigner().getId(),
            isUnlocked: true,
            type: wallet.getType(),
            accounts: wallet.getAccounts().map(SdkWalletService.mapAccount),
        };
    }

    static generatePrivateKeyHex(): string {
        return SdkWalletService.bytesToHex(
            requireSdkClient().generatePrivateKey(),
        );
    }

    static async createPrivateKeyWallet({
        name,
        privateKeyHex,
        password,
    }: {
        name: string;
        privateKeyHex: string;
        password: string;
    }): Promise<IWalletMeta> {
        const wallet = await requireSdkClient().createPrivateKeyWallet(
            {
                privateKey: SdkWalletService.hexToBytes(privateKeyHex),
                accountName: name,
            },
            password,
        );

        return SdkWalletService.mapWallet(wallet);
    }

    static async unlockWalletBySigner(
        signerId: string,
        password: string,
    ): Promise<IWalletMeta> {
        const wallet: Wallet = await requireSdkClient().unlockWallet(
            signerId,
            password,
        );

        return SdkWalletService.mapWallet(wallet);
    }

    static async unlockWallet(
        signerId: string,
        password: string,
    ): Promise<IWalletMeta> {
        const client: Client = requireSdkClient();

        const wallet: Wallet = await client.unlockWallet(signerId, password);

        return SdkWalletService.mapWallet(wallet);
    }

    static async loadWallets(): Promise<IWalletMeta[]> {
        const client: Client = requireSdkClient();

        const walletManager = client.getWalletManager();

        const [publicWalletsMetadata, insensitiveRecords] = await Promise.all([
            walletManager.getPublicWalletsMetadata(),
            client.getInsensitiveAccountsData(),
        ]);

        const addressByAccountId = new Map<string, string>();

        insensitiveRecords.forEach((record) => {
            addressByAccountId.set(record.id, record.address);
        });

        const unlockedBySignerId = new Map<string, Wallet>();

        walletManager.getAll().forEach((wallet: Wallet) => {
            unlockedBySignerId.set(wallet.getSigner().getId(), wallet);
        });

        return publicWalletsMetadata.map(
            (publicWalletMeta: IWalletMetadata) => {
                const unlockedWallet: Wallet | undefined =
                    unlockedBySignerId.get(publicWalletMeta.signerId);

                if (unlockedWallet) {
                    return SdkWalletService.mapWallet(unlockedWallet);
                }

                return {
                    signerId: publicWalletMeta.signerId,
                    type: publicWalletMeta.type,
                    isUnlocked: false,
                    accounts: publicWalletMeta.accounts.map(
                        (publicAccountMetadata: IAccountMetadata) => ({
                            id: publicAccountMetadata.id,
                            name: publicAccountMetadata.name,
                            index: publicAccountMetadata.index,
                            address: (addressByAccountId.get(
                                publicAccountMetadata.id,
                            ) ?? "") as Address,
                        }),
                    ),
                };
            },
        );
    }

    static getUnlockedWallets(): IWalletMeta[] {
        const client: Client | null = getSdkClient();

        if (!client) {
            return [];
        }

        return client
            .getWalletManager()
            .getAll()
            .map(SdkWalletService.mapWallet);
    }

    static lockAll(): void {
        getSdkClient()?.getWalletManager().clear();
    }

    static removeWallet(walletId: string): Promise<void> {
        return requireSdkClient().removeWallet(walletId);
    }

    static renameAccount(
        walletId: string,
        accountId: string,
        name: string,
    ): Promise<void> {
        return requireSdkClient().renameAccount(walletId, accountId, name);
    }

    static async hasStoredWallets(): Promise<boolean> {
        return (
            (await requireSdkClient().getWalletManager().countInStorage()) > 0
        );
    }
}