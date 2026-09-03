import {
    Account,
    Address,
    Client,
    decodeBase16,
    encodeBase16,
    IReservedOperationResult,
    ITransactionsHistoryOptions,
    ITransferRequest,
    IWalletMetadata,
    Mnemonic,
    MnemonicStrength,
    PRIVATE_KEY_LENGTH,
    Transaction,
    Wallet,
} from "@asichain/asi-wallet-sdk";
import { getSdkClient, requireSdkClient } from "./client";
import {
    IUnlockedAccountMeta,
    IUnlockedWalletMeta,
    IWalletMeta,
} from "types/wallet";

export class SdkWalletService {
    private static mapAccount(account: Account): IUnlockedAccountMeta {
        return {
            id: account.getId(),
            name: account.getName(),
            index: account.getIndex(),
            address: account.getAddress(),
            publicKey: encodeBase16(account.getPublicKey()),
        };
    }

    private static mapWallet(wallet: Wallet): IUnlockedWalletMeta {
        return {
            id: wallet.getId(),
            signerId: wallet.getSigner().getId(),
            isUnlocked: true,
            type: wallet.getType(),
            accounts: wallet.getAccounts().map(SdkWalletService.mapAccount),
        };
    }

    static generateMnemonic(
        strength: MnemonicStrength = MnemonicStrength.TWELVE_WORDS,
    ): string {
        return requireSdkClient().generateMnemonic(strength);
    }

    static isMnemonicValid(mnemonic: string): boolean {
        return Mnemonic.isMnemonicValid(mnemonic);
    }

    private static normalizePrivateKeyHex(hex: string): string {
        return hex.trim().replace(/^0x/i, "");
    }

    static isPrivateKeyHexValid(hex: string): boolean {
        const clean = SdkWalletService.normalizePrivateKeyHex(hex);

        return (
            clean.length === PRIVATE_KEY_LENGTH * 2 &&
            !/[^0-9a-fA-F]/.test(clean)
        );
    }

    static async createHdWallet({
        name,
        mnemonic,
        password,
    }: {
        name: string;
        mnemonic: string;
        password: string;
    }): Promise<IUnlockedWalletMeta> {
        const wallet = await requireSdkClient().createHDWallet(
            { mnemonic, accountName: name },
            password,
        );

        return SdkWalletService.mapWallet(wallet);
    }

    static async createPrivateKeyWallet({
        name,
        privateKeyHex,
        password,
    }: {
        name: string;
        privateKeyHex: string;
        password: string;
    }): Promise<IUnlockedWalletMeta> {
        const clean = SdkWalletService.normalizePrivateKeyHex(privateKeyHex);

        if (!SdkWalletService.isPrivateKeyHexValid(clean)) {
            throw new Error(
                "Invalid private key: expected 64 hexadecimal characters",
            );
        }

        const wallet = await requireSdkClient().createPrivateKeyWallet(
            { privateKey: decodeBase16(clean), accountName: name },
            password,
        );

        return SdkWalletService.mapWallet(wallet);
    }

    static async deriveAccount({
        walletId,
        name,
        password,
    }: {
        walletId: string;
        name: string;
        password: string;
    }): Promise<{ wallet: IUnlockedWalletMeta; accountId: string }> {
        const client: Client = requireSdkClient();

        const { accountId } = await client.deriveAccount(
            walletId,
            name,
            password,
        );

        const wallet: Wallet | null = client.getWalletManager().get(walletId);

        if (!wallet) {
            throw new Error(
                "SdkWalletService.deriveAccount: wallet not found after derive",
            );
        }

        return { wallet: SdkWalletService.mapWallet(wallet), accountId };
    }

    static async openWallet(
        signerId: string,
        password: string,
    ): Promise<IUnlockedWalletMeta> {
        const client: Client = requireSdkClient();

        client.closeAllWallets();

        const wallet: Wallet = await client.openWallet(signerId, password);

        return SdkWalletService.mapWallet(wallet);
    }

    static getActiveSession(): IUnlockedWalletMeta | null {
        return SdkWalletService.getUnlockedWallets()[0] ?? null;
    }

    static closeSession(): void {
        SdkWalletService.lockAll();
    }

    static async loadWallets(): Promise<IWalletMeta[]> {
        const client: Client = requireSdkClient();

        const walletManager = client.getWalletManager();

        const publicWalletsMetadata: IWalletMetadata[] =
            await walletManager.getPublicWalletsMetadata();

        const unlockedBySignerId = new Map<string, Wallet>();

        walletManager.getAll().forEach((wallet: Wallet) => {
            unlockedBySignerId.set(wallet.getSigner().getId(), wallet);
        });

        return publicWalletsMetadata.map(
            (publicWalletMeta: IWalletMetadata): IWalletMeta => {
                const unlockedWallet: Wallet | undefined =
                    unlockedBySignerId.get(publicWalletMeta.signerId);

                if (unlockedWallet) {
                    return SdkWalletService.mapWallet(unlockedWallet);
                }

                return {
                    signerId: publicWalletMeta.signerId,
                    type: publicWalletMeta.type,
                    isUnlocked: false,
                    accounts: publicWalletMeta.accounts,
                };
            },
        );
    }

    static getUnlockedWallets(): IUnlockedWalletMeta[] {
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
        requireSdkClient().closeAllWallets();
    }

    static removeWallet(walletId: string): Promise<Wallet> {
        return requireSdkClient().removeWallet(walletId);
    }

    static removeAccount(
        walletId: string,
        accountId: string,
    ): Promise<Account> {
        return requireSdkClient().removeAccount(walletId, accountId);
    }

    static renameAccount(
        walletId: string,
        accountId: string,
        name: string,
    ): Promise<void> {
        return requireSdkClient().renameAccount(walletId, accountId, name);
    }

    static setNetwork(networkId: string): void {
        return requireSdkClient().setNetwork(networkId);
    }

    static async getBalance(address: string): Promise<string> {
        const client = requireSdkClient();
        const atomicBalance = await client.getBalance(address as Address);

        return client.toDisplayAmount(atomicBalance);
    }

    static async getAvailableBalance(
        walletId: string,
        accountId: string,
    ): Promise<string> {
        const client = requireSdkClient();
        const atomicBalance = await client.getAvailableBalance(
            walletId,
            accountId,
        );

        return client.toDisplayAmount(atomicBalance);
    }

    static getTransactionsHistory(
        walletId: string,
        accountId: string,
        options?: ITransactionsHistoryOptions,
    ): Promise<Transaction[]> {
        return requireSdkClient().getTransactionsHistory(
            walletId,
            accountId,
            options,
        );
    }

    static isWalletUnlocked(walletId: string): boolean {
        return getSdkClient()?.isWalletUnlocked(walletId) ?? false;
    }

    static async transfer(
        {
            walletId,
            accountId,
            to,
            amount,
        }: Omit<ITransferRequest, "amount"> & { amount: string },
        password?: string,
    ): Promise<IReservedOperationResult> {
        const client = requireSdkClient();

        return client.transfer(
            { walletId, accountId, to, amount: client.toAtomicAmount(amount) },
            password,
        );
    }

    static async hasStoredWallets(): Promise<boolean> {
        return (
            (await requireSdkClient().getWalletManager().countInStorage()) > 0
        );
    }
}
