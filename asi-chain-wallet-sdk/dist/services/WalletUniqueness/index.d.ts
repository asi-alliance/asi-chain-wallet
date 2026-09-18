import type Account from "@domains/Account";
import type Wallet from "@domains/Wallet";
import type SecretsProvider from "@domains/SecretsProvider";
import type { ISignerStorageRecord } from "@domains/SignersStorageRepository";
import type { IAccountStorageRecord } from "@domains/AccountsStorageRepository";
export default class WalletUniquenessService {
    static findSignerBySecret(secretProvider: SecretsProvider): Promise<ISignerStorageRecord | null>;
    static findExistingAccount(account: Account): Promise<IAccountStorageRecord | null>;
    static assertAccountIsNotDuplicate(account: Account): Promise<void>;
    static assertWalletIsNotDuplicate(wallet: Wallet): Promise<void>;
}
