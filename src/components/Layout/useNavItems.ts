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
            //TODO: Restore Bridge once the SDK exposes a signer-based deploy/lock flow
            // { path: "/bridge", label: "Bridge" },
            { path: "/receive", label: "Receive" },
            { path: "/accounts", label: "Accounts" },
            //TODO: Restore History/Transactions once the single active wallet session lands and slice accounts carry publicKey from SDK Account entities
            // { path: "/history", label: "Transactions" },
            //TODO: Restore Deploy once the SDK exposes a signer-based raw deploy/explore flow
            // { path: "/deploy", label: "Deploy" },
            { path: "/settings", label: "Network Settings" },
        ];
    }, [accounts]);
};
