import type Account from "@domains/Account";
import type { TCreateAccountPayload } from "@domains/Account";
import type SecretsProvider from "@domains/SecretsProvider";
export default class WalletPersistenceService {
    static saveAccounts(signerId: string, accounts: Account[]): Promise<void>;
    static createAccounts(signerId: string, accounts: TCreateAccountPayload[], secretProvider: SecretsProvider): Promise<Account[]>;
}
