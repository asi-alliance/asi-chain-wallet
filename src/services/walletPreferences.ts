import { isStringRecord } from "utils/guards";

const SELECTED_NETWORK_KEY = "asi_wallet_selected_network";
const SELECTED_ACCOUNTS_KEY = "asi_wallet_selected_accounts";

type TSelectedAccountsBySigner = Record<string, string>;

export class WalletPreferencesStorage {
    static getSelectedNetworkId(): string | null {
        try {
            return localStorage.getItem(SELECTED_NETWORK_KEY);
        } catch (error) {
            console.error("Failed to read selected network id:", error);

            return null;
        }
    }

    static setSelectedNetworkId(networkId: string): void {
        try {
            localStorage.setItem(SELECTED_NETWORK_KEY, networkId);
        } catch (error) {
            console.error("Failed to persist selected network id:", error);
        }
    }

    static getSelectedAccountId(signerId: string): string | null {
        return this.readSelectedAccounts()[signerId] ?? null;
    }

    static setSelectedAccountId(signerId: string, accountId: string): void {
        this.writeSelectedAccounts({
            ...this.readSelectedAccounts(),
            [signerId]: accountId,
        });
    }

    static removeSigner(signerId: string): void {
        const selectedAccounts = this.readSelectedAccounts();

        if (!(signerId in selectedAccounts)) {
            return;
        }

        delete selectedAccounts[signerId];

        this.writeSelectedAccounts(selectedAccounts);
    }

    private static readSelectedAccounts(): TSelectedAccountsBySigner {
        try {
            const raw = localStorage.getItem(SELECTED_ACCOUNTS_KEY);

            if (!raw) {
                return {};
            }

            const parsed: unknown = JSON.parse(raw);

            if (!isStringRecord(parsed)) {
                console.error(
                    "Selected accounts snapshot has an unexpected shape and was ignored",
                );

                return {};
            }

            return parsed;
        } catch (error) {
            console.error("Failed to read selected accounts:", error);

            return {};
        }
    }

    private static writeSelectedAccounts(
        selectedAccounts: TSelectedAccountsBySigner,
    ): void {
        try {
            if (!Object.keys(selectedAccounts).length) {
                localStorage.removeItem(SELECTED_ACCOUNTS_KEY);

                return;
            }

            localStorage.setItem(
                SELECTED_ACCOUNTS_KEY,
                JSON.stringify(selectedAccounts),
            );
        } catch (error) {
            console.error("Failed to persist selected accounts:", error);
        }
    }
}