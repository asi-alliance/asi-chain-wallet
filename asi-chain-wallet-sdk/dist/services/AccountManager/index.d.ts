import Account, { TCreateAccountPayload, TEditableAccountOptions } from "@domains/Account";
import SecretsProvider from "@domains/SecretsProvider";
import ItemManager from "@services/ItemManager";
export interface ICreatedAccountData {
    accountId: string;
    account: Account;
}
export default class AccountManager extends ItemManager<Account> {
    private static orderAccounts;
    constructor(accounts?: Map<string, Account>);
    private reorder;
    create(payload: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<ICreatedAccountData>;
    addAccounts(accounts: Account[]): void;
    update(id: string, payload: TEditableAccountOptions): void;
    getAccounts(): Account[];
    getAccountsMap(): Map<string, Account>;
    getAccount(id: string): Account | null;
}
