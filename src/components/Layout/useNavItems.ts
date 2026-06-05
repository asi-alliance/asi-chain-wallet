import { useMemo } from "react";

export interface NavItem {
    path: string;
    label: string;
}

export const useNavItems = (accounts: any[] | undefined): NavItem[] => {
    return useMemo(() => {
        if (!accounts?.length) {
            return [{ path: "/accounts", label: "Accounts" }];
        }

        return [
            { path: "/", label: "Wallet" },
            { path: "/send", label: "Send" },
            { path: "/receive", label: "Receive" },
            { path: "/accounts", label: "Accounts" },
            { path: "/history", label: "Transactions" },
            { path: "/deploy", label: "Deploy" },
            { path: "/settings", label: "Network Settings" },
        ];
    }, [accounts]);
};
