import Account, { TCreateAccountPayload } from "@domains/Account";
import SecretsProvider from "@domains/SecretsProvider";
export default class AccountsService {
    static createAccounts(accounts: TCreateAccountPayload[], secretProvider: SecretsProvider): Promise<Account[]>;
}
