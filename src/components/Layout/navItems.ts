export interface NavItem {
    path: string;
    label: string;
}

const ACCOUNTS_NAV_ITEM: NavItem = { path: "/accounts", label: "Accounts" };

/** Main nav items when the wallet has at least one account. `/keys` is intentionally omitted. */
export const authenticatedNavItems: NavItem[] = [
    { path: "/", label: "Wallet" },
    { path: "/send", label: "Send" },
    { path: "/bridge", label: "Bridge" },
    { path: "/receive", label: "Receive" },
    ACCOUNTS_NAV_ITEM,
    { path: "/history", label: "Transactions" },
    { path: "/deploy", label: "Deploy" },
    { path: "/settings", label: "Network Settings" },
];

export const accountlessNavItems: NavItem[] = [ACCOUNTS_NAV_ITEM];

export const getNavItems = (hasAccounts: boolean): NavItem[] =>
    hasAccounts ? authenticatedNavItems : accountlessNavItems;
