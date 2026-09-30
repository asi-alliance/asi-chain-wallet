import { useMemo } from "react";

export interface NavItem {
    path: string;
    label: string;
}

/** Main nav items when the wallet has at least one account. `/keys` is intentionally omitted. */
export const authenticatedNavItems: NavItem[] = [
    { path: "/", label: "Wallet" },
    { path: "/send", label: "Send" },
    { path: "/bridge", label: "Bridge" },
    { path: "/receive", label: "Receive" },
    { path: "/accounts", label: "Accounts" },
    { path: "/history", label: "Transactions" },
    { path: "/deploy", label: "Deploy" },
    { path: "/settings", label: "Network Settings" },
];

export const accountlessNavItems: NavItem[] = [
    { path: "/accounts", label: "Accounts" },
];

export const useNavItems = (accounts: unknown[] | undefined): NavItem[] => {
    return useMemo(() => {
        if (!accounts?.length) {
            return accountlessNavItems;
        }

        return authenticatedNavItems;
    }, [accounts]);
};
