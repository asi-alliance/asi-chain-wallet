import {
    Account,
    Address,
    Client,
    decodeBase16,
    encodeBase16,
    IDeployRequest,
    IDeployWatchCallbacks,
    IDeployWatchHandle,
    IDeployWatchOptions,
    IImportWalletKeyfileOptions,
    IKeyfileAccountsImportResult,
    IKeyfileImportPreview,
    INetworkConfig,
    INetworkRecord,
    INetworkUpdate,
    IReservedOperationResult,
    ISignDeployRequest,
    ITransactionReservation,
    ITransactionsHistoryOptions,
    ITransferRequest,
    IWalletKeyfile,
    IWalletMetadata,
    Mnemonic,
    MnemonicStrength,
    NetworkId,
    NetworkName,
    PRIVATE_KEY_LENGTH,
    ClientEvent,
    fromAtomicAmount,
    NATIVE_TOKEN_DECIMALS_AMOUNT,
    SignedResult,
    toAtomicAmount,
    Transaction,
    TUnsubscribe,
    TTransactionReservationRequest,
    Wallet,
} from "@asichain/asi-wallet-sdk";
import {
    IUnlockedAccountMeta,
    IUnlockedWalletMeta,
    IWalletMeta,
    Network,
    TCustomNetwork,
    TCustomNetworkRecord,
} from "types/wallet";

export class SdkWalletService {
    private client: Client | null = null;

    public static toDisplayAmount(atomicAmount: bigint): string {
        return fromAtomicAmount(atomicAmount, NATIVE_TOKEN_DECIMALS_AMOUNT);
    }

    public static toAtomicAmount(amount: string | number): bigint {
        return toAtomicAmount(amount, NATIVE_TOKEN_DECIMALS_AMOUNT);
    }

    public attachClient(client: Client): void {
        this.client = client;
    }

    private requireClient(): Client {
        if (!this.client) {
            throw new Error("SDK client is not ready yet");
        }

        return this.client;
    }

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

    private static toClosedWalletMeta(
        publicWalletMeta: IWalletMetadata,
    ): IWalletMeta {
        return {
            signerId: publicWalletMeta.signerId,
            type: publicWalletMeta.type,
            isUnlocked: false,
            accounts: publicWalletMeta.accounts,
        };
    }

    private static mapNetwork<T extends boolean>(
        record: INetworkRecord & { isDefault: T },
    ): Omit<Network, "isDefault"> & { isDefault: T } {
        return {
            id: record.id,
            name: record.name,
            validatorUrl: record.config.ValidatorURL,
            observerUrl: record.config.ReadOnlyURL,
            indexerUrl: record.config.IndexerURL,
            nodeApiProfile: record.config.nodeApiProfile,
            isDefault: record.isDefault,
        };
    }

    static generateMnemonic(
        strength: MnemonicStrength = MnemonicStrength.TWELVE_WORDS,
    ): string {
        return Mnemonic.generateMnemonic(strength);
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

    public async createHdWallet({
        name,
        mnemonic,
        password,
    }: {
        name: string;
        mnemonic: string;
        password: string;
    }): Promise<IUnlockedWalletMeta> {
        const wallet = await this.requireClient().createHDWallet(
            { mnemonic, accountName: name },
            password,
        );

        return SdkWalletService.mapWallet(wallet);
    }

    public async createPrivateKeyWallet({
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

        const wallet = await this.requireClient().createPrivateKeyWallet(
            { privateKey: decodeBase16(clean), accountName: name },
            password,
        );

        return SdkWalletService.mapWallet(wallet);
    }

    public async deriveAccount({
        walletId,
        name,
        password,
    }: {
        walletId: string;
        name: string;
        password: string;
    }): Promise<{ wallet: IUnlockedWalletMeta; accountId: string }> {
        const client: Client = this.requireClient();

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

    public async openWallet(
        signerId: string,
        password: string,
    ): Promise<IUnlockedWalletMeta> {
        const client: Client = this.requireClient();

        const wallet: Wallet = await client.openWallet(signerId, password);
        const openedWalletId: string = wallet.getId();

        [...client.getWalletManager().getAll()].forEach(
            (previousWallet: Wallet) => {
                if (previousWallet.getId() === openedWalletId) {
                    return;
                }

                client.closeWallet(previousWallet.getId());
            },
        );

        return SdkWalletService.mapWallet(wallet);
    }

    public getActiveSession(): IUnlockedWalletMeta | null {
        return this.getUnlockedWallets()[0] ?? null;
    }

    public closeSession(): void {
        this.lockAll();
    }

    public async loadWallets(): Promise<IWalletMeta[]> {
        const client: Client = this.requireClient();

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

                return SdkWalletService.toClosedWalletMeta(publicWalletMeta);
            },
        );
    }

    public async getWalletMetaBySignerId(
        signerId: string,
    ): Promise<IWalletMeta> {
        const walletManager = this.requireClient().getWalletManager();

        const openWallet: Wallet | null = walletManager.getBySignerId(signerId);

        if (openWallet) {
            return SdkWalletService.mapWallet(openWallet);
        }

        const publicWalletsMetadata: IWalletMetadata[] =
            await walletManager.getPublicWalletsMetadata();

        const publicWalletMeta: IWalletMetadata | undefined =
            publicWalletsMetadata.find(
                (walletMeta: IWalletMetadata) =>
                    walletMeta.signerId === signerId,
            );

        if (!publicWalletMeta) {
            throw new Error(
                "SdkWalletService.getWalletMetaBySignerId: wallet not found",
            );
        }

        return SdkWalletService.toClosedWalletMeta(publicWalletMeta);
    }

    public getUnlockedWallets(): IUnlockedWalletMeta[] {
        return (
            this.client
                ?.getWalletManager()
                .getAll()
                .map(SdkWalletService.mapWallet) ?? []
        );
    }

    public getCustomNetworks(): TCustomNetwork[] {
        return this.requireClient()
            .getNetworks()
            .filter(
                (network: INetworkRecord): network is TCustomNetworkRecord =>
                    !network.isDefault,
            )
            .map(SdkWalletService.mapNetwork);
    }

    public getActiveNetwork(): Network {
        return SdkWalletService.mapNetwork(
            this.requireClient().getCurrentNetwork(),
        );
    }

    public getActiveNetworkId(): NetworkId {
        return this.requireClient().getCurrentNetworkId();
    }

    public async addCustomNetwork(
        name: NetworkName,
        config: INetworkConfig,
    ): Promise<TCustomNetwork> {
        const addedNetworkRecord = (await this.requireClient().addNetwork(
            name,
            config,
        )) as TCustomNetworkRecord;

        return SdkWalletService.mapNetwork(addedNetworkRecord);
    }

    public async updateCustomNetwork(
        id: NetworkId,
        update: INetworkUpdate,
    ): Promise<TCustomNetwork> {
        const client = this.requireClient();

        await client.updateNetwork(id, update);

        return SdkWalletService.mapNetwork(
            client.getNetwork(id) as TCustomNetworkRecord,
        );
    }

    public async removeCustomNetwork(id: NetworkId): Promise<void> {
        const client = this.requireClient();

        await client.removeNetwork(id);
    }

    public lockAll(): void {
        this.requireClient().closeAllWallets();
    }

    public removeWallet(walletId: string): Promise<Wallet> {
        return this.requireClient().removeWallet(walletId);
    }

    public removeAccount(
        walletId: string,
        accountId: string,
    ): Promise<Account> {
        return this.requireClient().removeAccount(walletId, accountId);
    }

    public renameAccount(
        walletId: string,
        accountId: string,
        name: string,
    ): Promise<void> {
        return this.requireClient().renameAccount(walletId, accountId, name);
    }

    public setNetwork(networkId: string): void {
        return this.requireClient().setNetwork(networkId);
    }

    public async getBalance(address: string): Promise<string> {
        const client = this.requireClient();
        const atomicBalance = await client.getBalance(address as Address);

        return SdkWalletService.toDisplayAmount(atomicBalance);
    }

    public async getAvailableBalance(
        walletId: string,
        accountId: string,
    ): Promise<string> {
        const client = this.requireClient();
        const atomicBalance = await client.getAvailableBalance(
            walletId,
            accountId,
        );

        return SdkWalletService.toDisplayAmount(atomicBalance);
    }

    public getTransactionsHistory(
        walletId: string,
        accountId: string,
        options?: ITransactionsHistoryOptions,
    ): Promise<Transaction[]> {
        return this.requireClient().getTransactionsHistory(
            walletId,
            accountId,
            options,
        );
    }

    public signDeploy(
        request: ISignDeployRequest,
        password?: string,
    ): Promise<SignedResult> {
        return this.requireClient().signDeploy(request, password);
    }

    public addTransactionReservation(
        request: TTransactionReservationRequest,
        password?: string,
    ): Promise<ITransactionReservation> {
        return this.requireClient().addTransactionReservation(request, password);
    }

    public removeTransactionReservation(
        walletId: string,
        reservationId: ITransactionReservation["id"],
    ): Promise<ITransactionReservation> {
        return this.requireClient().removeTransactionReservation(
            walletId,
            reservationId,
        );
    }

    public isWalletUnlocked(walletId: string): boolean {
        return this.client?.isWalletUnlocked(walletId) ?? false;
    }

    public async transfer(
        {
            walletId,
            accountId,
            to,
            amount,
        }: Omit<ITransferRequest, "amount"> & { amount: string },
        password?: string,
    ): Promise<IReservedOperationResult> {
        return this.requireClient().transfer(
            {
                walletId,
                accountId,
                to,
                amount: SdkWalletService.toAtomicAmount(amount),
            },
            password,
        );
    }

    public deploy(
        { walletId, accountId, term, phloLimit }: IDeployRequest,
        password?: string,
    ): Promise<IReservedOperationResult> {
        return this.requireClient().deploy(
            { walletId, accountId, term, phloLimit },
            password,
        );
    }

    public exploreDeploy(term: string): Promise<unknown> {
        return this.requireClient().exploreDeploy(term);
    }

    public watchDeploy(
        deployId: string,
        callbacks?: IDeployWatchCallbacks,
        options?: IDeployWatchOptions,
    ): IDeployWatchHandle {
        return this.requireClient().watchDeploy(deployId, callbacks, options);
    }

    public exportWalletKeyfile(
        walletId: string,
        password: string,
    ): Promise<IWalletKeyfile> {
        return this.requireClient().exportWalletKeyfile(walletId, password);
    }

    public previewWalletKeyfileImport(
        source: string,
        password: string,
    ): Promise<IKeyfileImportPreview> {
        return this.requireClient().previewWalletKeyfileImport(source, password);
    }

    public async importWalletKeyfile(
        source: string,
        password: string,
        options?: IImportWalletKeyfileOptions,
    ): Promise<IUnlockedWalletMeta> {
        const wallet: Wallet = await this.requireClient().importWalletKeyfile(
            source,
            password,
            options,
        );

        return SdkWalletService.mapWallet(wallet);
    }

    public importKeyfileAccounts(
        source: string,
        password: string,
        options?: IImportWalletKeyfileOptions,
    ): Promise<IKeyfileAccountsImportResult> {
        return this.requireClient().importKeyfileAccounts(
            source,
            password,
            options,
        );
    }

    public async hasStoredWallets(): Promise<boolean> {
        return (
            (await this.requireClient().getWalletManager().countInStorage()) > 0
        );
    }

    public getBusyNetworkIds(): NetworkId[] {
        const client: Client = this.requireClient();

        return client
            .getNetworks()
            .filter(({ id }: INetworkRecord) => client.isNetworkBusy(id))
            .map(({ id }: INetworkRecord) => id);
    }

    public onNetworkBusyChanged(
        listener: (networkId: NetworkId, busy: boolean) => void,
    ): TUnsubscribe {
        return this.requireClient()
            .getEventBus()
            .on(ClientEvent.NETWORK_BUSY_CHANGED, listener);
    }
}
