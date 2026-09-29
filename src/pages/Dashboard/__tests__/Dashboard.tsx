import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { WalletTypes } from "@asichain/asi-wallet-sdk";
import { Dashboard } from "pages/Dashboard/Dashboard";
import { darkTheme, lightTheme } from "styles/theme";
import { IUnlockedAccountMeta, IUnlockedWalletMeta } from "types/wallet";

const mockUseGetBalanceQuery = jest.fn();
const mockUseGetTransactionHistoryQuery = jest.fn();

jest.mock("store/WalletsStore/api", () => ({
    useGetBalanceQuery: (...args: unknown[]) => mockUseGetBalanceQuery(...args),
    useGetTransactionHistoryQuery: (...args: unknown[]) =>
        mockUseGetTransactionHistoryQuery(...args),
}));

jest.mock("store/WalletsStore/thunks", () => ({
    selectAccount: (accountId: string) => ({
        type: "test/selectAccount",
        payload: accountId,
    }),
}));

const account0: IUnlockedAccountMeta = {
    id: "account-0",
    name: "Account 0",
    index: 0,
    address: "1111111111111111111111111111111111111111111111111111",
    publicKey: "public-0",
};

const account1: IUnlockedAccountMeta = {
    id: "account-1",
    name: "Account 1",
    index: 1,
    address: "2222222222222222222222222222222222222222222222222222",
    publicKey: "public-1",
};

const createWallet = (
    accounts: IUnlockedAccountMeta[],
): IUnlockedWalletMeta => ({
    id: "wallet-1",
    signerId: "signer-1",
    type: WalletTypes.HD,
    isUnlocked: true,
    accounts,
});

const createStore = (
    accounts: IUnlockedAccountMeta[],
    selectedAccountId = accounts[0]?.id ?? null,
) => {
    const initialWalletsState = {
        wallets: accounts.length > 0 ? [createWallet(accounts)] : [],
        selectedAccountId,
        selectedNetwork: { id: "network-1" },
        networks: [{ id: "network-1" }],
        deployWatches: {},
        isLoading: false,
        isInitialLoadComplete: true,
    };

    return configureStore({
        reducer: {
            walletsStore: (
                state = initialWalletsState,
                action: { type: string; payload?: string },
            ) => {
                if (action.type === "test/selectAccount") {
                    return {
                        ...state,
                        selectedAccountId: action.payload ?? null,
                    };
                }

                return state;
            },
            auth: () => ({
                isAuthenticated: true,
                activeSignerId: "signer-1",
                isLoading: false,
            }),
            theme: () => ({ darkMode: false }),
            networkOperation: () => ({ isPending: false }),
        },
    });
};

const Location = (): React.ReactElement => {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
};

const renderDashboard = ({
    accounts = [account0],
    selectedAccountId,
    theme = lightTheme,
}: {
    accounts?: IUnlockedAccountMeta[];
    selectedAccountId?: string | null;
    theme?: typeof lightTheme;
} = {}) => {
    const store = createStore(
        accounts,
        selectedAccountId === undefined
            ? accounts[0]?.id ?? null
            : selectedAccountId,
    );

    return {
        store,
        ...render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <MemoryRouter initialEntries={["/"]}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="*" element={<Location />} />
                        </Routes>
                    </MemoryRouter>
                </ThemeProvider>
            </Provider>,
        ),
    };
};

beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1440,
    });
    mockUseGetBalanceQuery.mockImplementation((args) => ({
        currentData:
            args && typeof args === "object" && "accountId" in args
                ? args.accountId === account1.id
                    ? "25"
                    : "10"
                : undefined,
        isFetching: false,
        isError: false,
        isSuccess: true,
        refetch: jest.fn(),
    }));
    mockUseGetTransactionHistoryQuery.mockReturnValue({
        currentData: [],
        isFetching: false,
        isError: false,
        isSuccess: true,
    });
});

describe("Dashboard", () => {
    it.each([
        ["light", lightTheme],
        ["dark", darkTheme],
    ] as const)(
        "shows the welcome state when no account is selected in the %s theme",
        (_name, theme) => {
            renderDashboard({ accounts: [], selectedAccountId: null, theme });

            expect(
                screen.getByRole("heading", { name: "Welcome to ASI Wallet" }),
            ).toBeTruthy();
            expect(
                screen.getByRole("button", { name: "Accounts" }),
            ).toBeTruthy();
            expect(screen.queryByText("Recent activity")).toBeNull();
            expect(screen.queryByText("Completed")).toBeNull();
        },
    );

    it("shows the selected account card with rename, balance, and copyable address", () => {
        renderDashboard();

        const accountCard = screen.getByTestId("account-card-account-0");
        expect(accountCard).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Edit Account 0" }),
        ).toBeTruthy();
        expect(screen.getByText("10.0000")).toBeTruthy();
        expect(screen.getByText("ASI Address")).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Copy address, Account 0" }),
        ).toBeTruthy();
        // Compact Wallet keeps the full address in DOM; CSS ellipsis handles narrow widths.
        expect(screen.getByTitle(account0.address)).toHaveTextContent(
            account0.address,
        );
        expect(screen.queryByText("ID:0")).toBeNull();
        expect(screen.queryByText("Recent activity")).toBeNull();
        expect(screen.queryByLabelText("Transaction summary")).toBeNull();
    });

    it("shows View All on desktop", () => {
        renderDashboard({ accounts: [account0, account1] });

        expect(screen.getByRole("button", { name: "View All" })).toBeTruthy();
    });

    it("hides View All at mobile width", () => {
        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            value: 768,
        });

        renderDashboard({ accounts: [account0, account1] });

        expect(screen.queryByRole("button", { name: "View All" })).toBeNull();
    });

    it("opens Accounts from View All", () => {
        renderDashboard();

        fireEvent.click(screen.getByRole("button", { name: "View All" }));
        expect(screen.getByTestId("location")).toHaveTextContent("/accounts");
    });

    it("updates balance and action links after account selection", async () => {
        const user = userEvent.setup();
        renderDashboard({ accounts: [account0, account1] });

        expect(screen.getByText("10.0000")).toBeTruthy();

        await user.click(screen.getByRole("combobox", { name: "Account" }));
        await user.keyboard("{ArrowDown}{Enter}");

        expect(screen.getByTestId("account-card-account-1")).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Edit Account 1" }),
        ).toBeTruthy();
        expect(screen.getByText("25.0000")).toBeTruthy();

        await user.click(screen.getByRole("button", { name: /Send/i }));
        expect(screen.getByTestId("location")).toHaveTextContent(
            "/send?id=account-1",
        );
    });

    it.each([
        ["Receive", "/receive?id=account-0"],
        ["History", "/history"],
    ])("opens %s for the selected account", (action, expectedLocation) => {
        renderDashboard();

        fireEvent.click(screen.getByRole("button", { name: action }));
        expect(screen.getByTestId("location")).toHaveTextContent(
            expectedLocation,
        );
    });

    it("keeps History as a compact icon control", () => {
        renderDashboard();

        const historyButton = screen.getByRole("button", { name: "History" });
        expect(historyButton).toHaveAttribute(
            "title",
            "View transaction history",
        );
        expect(historyButton).toHaveAttribute("id", "history-button");
        expect(screen.queryByText("Recent activity")).toBeNull();
    });
});
