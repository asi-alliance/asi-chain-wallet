import Account, { TCreateAccountPayload, TEditableAccountOptions } from "@domains/Account";
import SecretsProvider from "@domains/SecretsProvider";
import ItemManager from "@services/ItemManager";
export interface ICreatedAccountData {
    accountId: string;
    account: Account;
}
export default class AccountManager extends ItemManager<Account> {
    private activeAccount;
    constructor(accounts?: Map<string, Account>, activeAccount?: Account | null);
    create(payload: TCreateAccountPayload, secretProvider: SecretsProvider): Promise<ICreatedAccountData>;
    remove(id: string): Account;
    update(id: string, payload: TEditableAccountOptions): void;
    setActiveAccount(id: string): void;
    getActiveAccount(): Account | null;
    getAccounts(): Account[];
    getAccountsMap(): Map<string, Account>;
    getAccount(id: string): Account | null;
}
