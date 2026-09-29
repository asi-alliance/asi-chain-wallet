import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import {
    act,
    fireEvent,
    render,
    screen,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import {
    Address,
    TRANSACTION_STATUSES,
    TRANSACTION_TYPES,
    WalletTypes,
} from "@asichain/asi-wallet-sdk";
import { createEmptyPanelFilters, History } from "pages/History/History";
import walletReducer from "store/WalletsStore";
import authReducer from "store/Auth";
import networkOperationReducer from "store/networkOperationSlice";
import { darkTheme, lightTheme } from "styles/theme";
import { Transaction } from "types/transactions";
import { serializeHistoryTimestamp } from "store/WalletsStore/api";
import { ACCOUNT_DATA_POLLING_INTERVAL_MS } from "constants/polling";

const mockUseGetTransactionHistoryQuery = jest.fn();

jest.mock("store/WalletsStore/api", () => ({
    ...jest.requireActual("store/WalletsStore/api"),
    useGetTransactionHistoryQuery: (...args: unknown[]) =>
        mockUseGetTransactionHistoryQuery(...args),
}));

const accountAddress =
    "1111111111111111111111111111111111111111111111111111" as Address;
const counterpartyAddress =
    "2222222222222222222222222222222222222222222222222222" as Address;
const longHash =
    "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

const createTransactions = (): Transaction[] => {
    const now = Date.now();

    return [
        {
            id: "tx-completed-send",
            deployId: longHash,
            from: accountAddress,
            to: counterpartyAddress,
            amount: "5",
            timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
            status: "completed",
            type: "send",
        },
        {
            id: "tx-pending-receive",
            deployId: "pending-hash-001",
            from: counterpartyAddress,
            to: accountAddress,
            amount: "2",
            timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
            status: "pending",
            type: "receive",
        },
        {
            id: "tx-failed-deploy",
            deployId: "failed-hash-001",
            from: accountAddress,
            to: "",
            amount: "0",
            timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: "failed",
            type: "deploy",
        },
        {
            id: "tx-old-completed",
            deployId: "old-hash-001",
            from: accountAddress,
            to: counterpartyAddress,
            amount: "100",
            timestamp: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
            status: "completed",
            type: "send",
        },
    ];
};

const createStore = () => {
    const initialWalletState = walletReducer(undefined, { type: "init" });

    return configureStore({
        reducer: {
            walletsStore: walletReducer,
            auth: authReducer,
            networkOperation: networkOperationReducer,
        },
        preloadedState: {
            walletsStore: {
                ...initialWalletState,
                wallets: [
                    {
                        id: "wallet-1",
                        signerId: "signer-1",
                        type: WalletTypes.HD,
                        isUnlocked: true,
                        accounts: [
                            {
                                id: "account-1",
                                name: "Main account",
                                index: 0,
                                address: accountAddress,
                                publicKey: "public-key",
                            },
                        ],
                    },
                ],
                selectedAccountId: "account-1",
                selectedNetwork: {
                    ...initialWalletState.selectedNetwork,
                    id: "network-1",
                },
            },
            auth: {
                ...authReducer(undefined, { type: "init" }),
                isAuthenticated: true,
                activeSignerId: "signer-1",
            },
        },
    });
};

const mockMatchMedia = (width: number): void => {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: jest.fn().mockImplementation((query: string) => {
            const maxWidthMatch = /max-width:\s*(\d+)px/.exec(query);
            const matches = maxWidthMatch
                ? width <= Number(maxWidthMatch[1])
                : false;

            return {
                matches,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            };
        }),
    });
};

const setViewportWidth = (width: number): void => {
    Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: width,
    });
    Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 900,
    });
    mockMatchMedia(width);
    act(() => {
        window.dispatchEvent(new Event("resize"));
    });
};

const renderHistory = ({
    theme = lightTheme,
    width = 1440,
}: {
    theme?: typeof lightTheme;
    width?: number;
} = {}) => {
    setViewportWidth(width);
    const store = createStore();

    return {
        store,
        user: userEvent.setup(),
        ...render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <MemoryRouter>
                        <History />
                    </MemoryRouter>
                </ThemeProvider>
            </Provider>,
        ),
    };
};

const mockHistoryQuery = (
    transactions: Transaction[] | undefined,
    overrides: Record<string, unknown> = {},
): void => {
    mockUseGetTransactionHistoryQuery.mockImplementation(() => ({
        currentData: transactions,
        isFetching: false,
        isError: false,
        isSuccess: transactions !== undefined,
        fulfilledTimeStamp: Date.now(),
        ...overrides,
    }));
};

const applyPanelChoice = async (
    user: ReturnType<typeof userEvent.setup>,
    panelName: string | RegExp,
    choiceName: string | RegExp,
): Promise<void> => {
    await user.click(screen.getByRole("button", { name: panelName }));
    await user.click(screen.getByRole("button", { name: choiceName }));
    const applyButton = screen.queryByRole("button", { name: /Apply .+ filter/ });
    if (applyButton) {
        await user.click(applyButton);
    }
};

beforeEach(() => {
    jest.clearAllMocks();
    mockMatchMedia(1440);
    mockHistoryQuery(createTransactions());
});

describe("History status contract and filters", () => {
    it("creates independent empty Date and Amount range values", () => {
        const first = createEmptyPanelFilters();
        const second = createEmptyPanelFilters();

        expect(first.date).not.toBe(first.amount);
        expect(first.date).not.toBe(second.date);
        expect(first.amount).not.toBe(second.amount);
    });

    it("selects the account whose ID is stored", async () => {
        const { user } = renderHistory();

        const account = screen.getByRole("combobox", { name: "Account" });
        expect(account).toHaveTextContent("Main account");
        await user.click(account);
        expect(
            screen.getByRole("option", { name: "Main account" }),
        ).toHaveAttribute("aria-selected", "true");
    });

    it("loads history with source all and exposes only SDK status values", async () => {
        const { user } = renderHistory();

        expect(mockUseGetTransactionHistoryQuery).toHaveBeenCalledWith(
            expect.objectContaining({
                accountId: "account-1",
                networkId: "network-1",
                source: "all",
            }),
            expect.any(Object),
        );

        await user.click(screen.getByRole("button", { name: /Status/ }));

        const statusChoices = within(
            screen.getByRole("group", { name: "Status" }),
        )
            .getAllByRole("button")
            .map((button) => button.textContent);

        expect(statusChoices).toEqual([
            "All statuses",
            ...TRANSACTION_STATUSES.map(
                (status) =>
                    `${status.charAt(0).toUpperCase()}${status.slice(1)}`,
            ),
        ]);
        expect(statusChoices).not.toContain("Executed");
        expect(
            screen.queryByRole("button", { name: "Clear status filter" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Apply status filter" }),
        ).not.toBeInTheDocument();

        await user.keyboard("{Escape}");

        await user.click(screen.getByRole("button", { name: /Type/ }));
        const typeChoices = within(
            screen.getByRole("group", { name: "Type" }),
        )
            .getAllByRole("button")
            .map((button) => button.textContent);

        expect(typeChoices).toEqual([
            "All types",
            ...TRANSACTION_TYPES.map(
                (type) => `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
            ),
        ]);
        expect(typeChoices).not.toContain("Stake");
        expect(typeChoices).not.toContain("Delegate");
    });

    it("filters by Status on transaction.status, not history source", async () => {
        const { user } = renderHistory();

        await applyPanelChoice(user, /Status/, "Pending");

        expect(screen.getByText("pending-hash-001")).toBeInTheDocument();
        expect(screen.queryByText(longHash)).not.toBeInTheDocument();
        expect(screen.queryByText("failed-hash-001")).not.toBeInTheDocument();

        expect(mockUseGetTransactionHistoryQuery).toHaveBeenLastCalledWith(
            expect.objectContaining({ source: "all" }),
            expect.any(Object),
        );

        await applyPanelChoice(user, /Status/, "Completed");
        expect(screen.getByText(longHash)).toBeInTheDocument();
        expect(screen.getByText("old-hash-001")).toBeInTheDocument();
        expect(screen.queryByText("pending-hash-001")).not.toBeInTheDocument();

        await applyPanelChoice(user, /Status/, "Failed");
        expect(screen.getByText("failed-hash-001")).toBeInTheDocument();
        expect(screen.queryByText(longHash)).not.toBeInTheDocument();
        expect(screen.queryByText("pending-hash-001")).not.toBeInTheDocument();
    });

    it("filters by Type alone and together with Status", async () => {
        const { user } = renderHistory();

        await applyPanelChoice(user, /Type/, "Deploy");
        expect(screen.getByText("failed-hash-001")).toBeInTheDocument();
        expect(screen.queryByText(longHash)).not.toBeInTheDocument();

        await applyPanelChoice(user, /Status/, "Completed");
        expect(
            screen.getByText("No transactions match the selected filters."),
        ).toBeInTheDocument();

        await applyPanelChoice(user, /Status/, "Failed");
        expect(screen.getByText("failed-hash-001")).toBeInTheDocument();
    });

    it("applies Type and Status immediately and clears them via All / Clear Filter", async () => {
        const { user } = renderHistory();

        const typeTrigger = screen.getByRole("button", { name: /Type/ });
        await user.click(typeTrigger);
        await user.click(screen.getByRole("button", { name: "Send" }));
        expect(screen.queryByText("pending-hash-001")).not.toBeInTheDocument();
        expect(typeTrigger).toHaveFocus();

        await user.click(typeTrigger);
        await user.click(screen.getByRole("button", { name: "All types" }));
        expect(screen.getByText("pending-hash-001")).toBeInTheDocument();

        const statusTrigger = screen.getByRole("button", { name: /Status/ });
        await user.click(statusTrigger);
        await user.click(screen.getByRole("button", { name: "Failed" }));
        expect(screen.queryByText(longHash)).not.toBeInTheDocument();
        expect(screen.getByText("failed-hash-001")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Clear Filter" }));
        expect(screen.getByText(longHash)).toBeInTheDocument();
    });

    it("applies and clears Date and Amount panel filters", async () => {
        const { user } = renderHistory();

        await user.click(screen.getByRole("button", { name: /Date/ }));
        await user.click(screen.getByRole("button", { name: "Last 1H" }));
        await user.click(
            screen.getByRole("button", { name: "Apply date filter" }),
        );

        expect(screen.getByText(longHash)).toBeInTheDocument();
        expect(screen.queryByText("pending-hash-001")).not.toBeInTheDocument();
        expect(screen.queryByText("old-hash-001")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Date/ }));
        await user.click(
            screen.getByRole("button", { name: "Clear date filter" }),
        );

        expect(screen.getByText("pending-hash-001")).toBeInTheDocument();
        expect(screen.getByText("old-hash-001")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Amount/ }));
        await user.click(screen.getByRole("button", { name: "1-10" }));
        await user.click(
            screen.getByRole("button", { name: "Apply amount filter" }),
        );

        expect(screen.getByText(longHash)).toBeInTheDocument();
        expect(screen.getByText("pending-hash-001")).toBeInTheDocument();
        expect(screen.queryByText("old-hash-001")).not.toBeInTheDocument();
        expect(screen.queryByText("failed-hash-001")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Amount/ }));
        await user.click(screen.getByRole("button", { name: "Clear amount filter" }));
        expect(screen.getByText("old-hash-001")).toBeInTheDocument();
    });

    it("filters an SDK Date after the production history timestamp serialization", async () => {
        const timestamp = serializeHistoryTimestamp(
            new Date("2025-05-16T12:34:56.000Z"),
        );
        expect(timestamp).toBe("2025-05-16T12:34:56.000Z");
        mockHistoryQuery([
            {
                ...createTransactions()[0],
                id: "production-date",
                deployId: "production-date-hash",
                timestamp,
            },
            {
                ...createTransactions()[1],
                id: "other-date",
                deployId: "other-date-hash",
                timestamp: serializeHistoryTimestamp(
                    new Date("2025-05-18T12:34:56.000Z"),
                ),
            },
        ]);
        const { user } = renderHistory();

        await user.click(screen.getByRole("button", { name: /Date/ }));
        // Prefer input ids: "From"/"To" also label the address-filter triggers.
        fireEvent.change(screen.getByLabelText("From", { selector: "input" }), {
            target: { value: "2025-05-16" },
        });
        fireEvent.change(screen.getByLabelText("To", { selector: "input" }), {
            target: { value: "2025-05-16" },
        });
        await user.click(screen.getByRole("button", { name: "Apply date filter" }));

        expect(screen.getByText("production-date-hash")).toBeInTheDocument();
        expect(screen.queryByText("other-date-hash")).not.toBeInTheDocument();
    });

    it("excludes future transactions from a Last 1H preset", async () => {
        mockHistoryQuery([
            {
                ...createTransactions()[0],
                id: "future-transaction",
                deployId: "future-hash",
                timestamp: serializeHistoryTimestamp(
                    new Date(Date.now() + 10 * 60 * 1000),
                ),
            },
            createTransactions()[0],
        ]);
        const { user } = renderHistory();

        await user.click(screen.getByRole("button", { name: /Date/ }));
        await user.click(screen.getByRole("button", { name: "Last 1H" }));
        await user.click(screen.getByRole("button", { name: "Apply date filter" }));

        expect(screen.getByText(longHash)).toBeInTheDocument();
        expect(screen.queryByText("future-hash")).not.toBeInTheDocument();
    });

    it("expires cached transactions when a relative Date boundary passes", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2025-05-16T12:00:00.000Z"));

        try {
            mockHistoryQuery([
                {
                    ...createTransactions()[0],
                    id: "near-expiry",
                    deployId: "near-expiry-hash",
                    timestamp: serializeHistoryTimestamp(
                        new Date(Date.now() - 60 * 60 * 1000 + 1000),
                    ),
                },
            ], { isError: true });
            renderHistory();

            fireEvent.click(screen.getByRole("button", { name: /Date/ }));
            fireEvent.click(screen.getByRole("button", { name: "Last 1H" }));
            fireEvent.click(screen.getByRole("button", { name: "Apply date filter" }));
            expect(screen.getByText("near-expiry-hash")).toBeInTheDocument();

            act(() => {
                jest.advanceTimersByTime(2000);
            });

            expect(screen.queryByText("near-expiry-hash")).not.toBeInTheDocument();
            expect(
                screen.getByText("No transactions match the selected filters."),
            ).toBeInTheDocument();
        } finally {
            jest.useRealTimers();
        }
    });

    it("applies From, To, and Details filters with Clear/Apply", async () => {
        const { user } = renderHistory();

        await user.click(screen.getByRole("button", { name: /From/ }));
        fireEvent.change(screen.getByLabelText("Search by sender address"), {
            target: { value: counterpartyAddress },
        });
        await user.click(
            screen.getByRole("button", { name: "Apply sender filter" }),
        );

        expect(screen.getByText("pending-hash-001")).toBeInTheDocument();
        expect(screen.queryByText(longHash)).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: `From ${counterpartyAddress}`,
            }),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Clear Filter" }),
        );
        expect(screen.getByText(longHash)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /^To/ }));
        fireEvent.change(
            screen.getByLabelText("Search by recipient address"),
            {
                target: { value: counterpartyAddress },
            },
        );
        await user.click(
            screen.getByRole("button", { name: "Apply recipient filter" }),
        );

        expect(screen.getByText(longHash)).toBeInTheDocument();
        expect(screen.getByText("old-hash-001")).toBeInTheDocument();
        expect(screen.queryByText("pending-hash-001")).not.toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Clear Filter" }),
        );

        await user.click(screen.getByRole("button", { name: /Details/ }));
        fireEvent.change(screen.getByLabelText("Search by details"), {
            target: { value: "pending-hash" },
        });
        await user.click(
            screen.getByRole("button", { name: "Apply details filter" }),
        );

        expect(screen.getByText("pending-hash-001")).toBeInTheDocument();
        expect(screen.queryByText(longHash)).not.toBeInTheDocument();
    });

    it.each([
        ["From", "Search by sender address", "sender", counterpartyAddress, "old-hash-001"],
        ["To", "Search by recipient address", "recipient", counterpartyAddress, "pending-hash-001"],
        ["Details", "Search by details", "details", "pending-hash", "old-hash-001"],
    ])(
        "clears the applied %s filter from its own panel",
        async (label, fieldLabel, actionName, query, hiddenHash) => {
            const { user } = renderHistory();
            const trigger = screen.getByRole("button", {
                name: new RegExp(`^${label}\\b`),
            });

            await user.click(trigger);
            fireEvent.change(screen.getByLabelText(fieldLabel), {
                target: { value: query },
            });
            await user.click(
                screen.getByRole("button", { name: `Apply ${actionName} filter` }),
            );
            expect(screen.queryByText(hiddenHash)).not.toBeInTheDocument();

            await user.click(trigger);
            await user.click(
                screen.getByRole("button", { name: `Clear ${actionName} filter` }),
            );
            expect(screen.getByText(hiddenHash)).toBeInTheDocument();
            await user.click(
                screen.getByRole("button", { name: `Apply ${actionName} filter` }),
            );
            expect(trigger).toHaveFocus();
        },
    );

    it("combines Type, Status, and Details and clears them together", async () => {
        const { user } = renderHistory();

        await applyPanelChoice(user, /Type/, "Send");
        await applyPanelChoice(user, /Status/, "Completed");
        await user.click(screen.getByRole("button", { name: /Details/ }));
        fireEvent.change(screen.getByLabelText("Search by details"), {
            target: { value: longHash.slice(0, 12) },
        });
        await user.click(
            screen.getByRole("button", { name: "Apply details filter" }),
        );

        expect(screen.getByText(longHash)).toBeInTheDocument();
        expect(screen.queryByText("old-hash-001")).not.toBeInTheDocument();
        expect(
            screen.queryByText(/Showing .* loaded transactions/),
        ).not.toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Clear Filter" }),
        );
        expect(screen.getByText("old-hash-001")).toBeInTheDocument();
        expect(screen.getByText("pending-hash-001")).toBeInTheDocument();
    });

    it("shows an empty filtered state and recovers after Clear", async () => {
        const { user } = renderHistory();

        await applyPanelChoice(user, /Status/, "Failed");
        await applyPanelChoice(user, /Type/, "Send");

        expect(
            screen.getByText("No transactions match the selected filters."),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Clear Filter" }),
        );

        expect(screen.getByText(longHash)).toBeInTheDocument();
    });

    it("returns focus to the panel trigger after Apply", async () => {
        const { user } = renderHistory();
        const dateTrigger = screen.getByRole("button", { name: /Date/ });

        await user.click(dateTrigger);
        await user.click(screen.getByRole("button", { name: "Last 1H" }));
        await user.click(
            screen.getByRole("button", { name: "Apply date filter" }),
        );

        expect(dateTrigger).toHaveFocus();
        expect(
            screen.getByRole("button", { name: /Date.*Last 1H/i }),
        ).toBeInTheDocument();
    });

    it("keeps focus on the newly opened desktop filter", async () => {
        const { user } = renderHistory();
        const dateTrigger = screen.getByRole("button", { name: /Date/ });
        const statusTrigger = screen.getByRole("button", { name: /Status/ });

        await user.click(dateTrigger);
        await user.click(statusTrigger);

        expect(dateTrigger).toHaveAttribute("aria-expanded", "false");
        expect(statusTrigger).toHaveAttribute("aria-expanded", "true");
        expect(statusTrigger).toHaveFocus();
    });

    it("applies Details on Enter and returns focus to its trigger", async () => {
        const { user } = renderHistory();
        const trigger = screen.getByRole("button", { name: /Details/ });

        await user.click(trigger);
        await user.type(screen.getByLabelText("Search by details"), "pending-hash{Enter}");

        expect(trigger).toHaveFocus();
        expect(screen.getByText("pending-hash-001")).toBeInTheDocument();
        expect(screen.queryByText(longHash)).not.toBeInTheDocument();
    });

    it("closes the filter panel on Escape and restores trigger focus", async () => {
        const { user } = renderHistory();
        const dateTrigger = screen.getByRole("button", { name: /Date/ });

        await user.click(dateTrigger);
        expect(dateTrigger).toHaveAttribute("aria-expanded", "true");

        await user.keyboard("{Escape}");

        expect(dateTrigger).toHaveAttribute("aria-expanded", "false");
        expect(dateTrigger).toHaveFocus();
        expect(
            screen.queryByRole("button", { name: "Last 1H" }),
        ).not.toBeInTheDocument();
    });

    it("opens mobile filter content in a separate dialog sheet", async () => {
        const { user } = renderHistory({ width: 500 });

        await user.click(screen.getByRole("button", { name: /Date/ }));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
            screen.getByTestId("history-filter-date-panel-overlay"),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Last 1H" })).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Apply date filter" }),
        ).toBeInTheDocument();
        expect(document.body.style.overflow).toBe("hidden");
    });

    it("dismisses the mobile sheet with overlay or Escape and restores focus", async () => {
        const { user } = renderHistory({ width: 768 });
        const trigger = screen.getByRole("button", { name: /Date/ });
        const previousOverflow = document.body.style.overflow;

        await user.click(trigger);
        await user.click(screen.getByTestId("history-filter-date-panel-overlay"));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
        expect(document.body.style.overflow).toBe(previousOverflow);

        await user.click(trigger);
        await user.keyboard("{Escape}");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it("restores the mobile trigger after Apply", async () => {
        const { user } = renderHistory({ width: 768 });
        const dateTrigger = screen.getByRole("button", { name: /Date/ });

        await user.click(dateTrigger);
        await user.click(screen.getByRole("button", { name: "Last 1H" }));
        await user.click(screen.getByRole("button", { name: "Apply date filter" }));
        expect(dateTrigger).toHaveFocus();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("keeps Tab focus inside the mobile filter sheet", async () => {
        const { user } = renderHistory({ width: 500 });

        await user.click(screen.getByRole("button", { name: /Date/ }));
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveFocus();

        await user.tab();
        expect(screen.getByRole("button", { name: "Close Date" })).toHaveFocus();
        await user.tab({ shift: true });
        expect(screen.getByRole("button", { name: "Apply date filter" })).toHaveFocus();
        await user.tab();
        expect(screen.getByRole("button", { name: "Close Date" })).toHaveFocus();
    });

    it("reclaims focus into the mobile sheet on focusin outside", async () => {
        renderHistory({ width: 500 });

        await userEvent.click(screen.getByRole("button", { name: /Date/ }));
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        const outside = document.createElement("button");
        outside.textContent = "outside";
        document.body.appendChild(outside);

        act(() => {
            outside.focus();
        });

        expect(screen.getByRole("button", { name: "Close Date" })).toHaveFocus();
        outside.remove();
    });

    it("attaches Amount validation to the invalid field", async () => {
        const { user } = renderHistory();

        await user.click(screen.getByRole("button", { name: /Amount/ }));
        fireEvent.change(screen.getByLabelText(/From \(ASI\)/), {
            target: { value: "-1" },
        });

        expect(screen.getByLabelText(/From \(ASI\)/)).toBeInvalid();
        expect(screen.getByLabelText(/To \(ASI\)/)).not.toBeInvalid();
        expect(screen.getByText("Enter a valid amount.")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Apply amount filter" }),
        ).toBeDisabled();
    });

    it.each([769, 900, 1023])(
        "keeps horizontal overflow on the %ipx table layout",
        (width) => {
            renderHistory({ width });

            expect(screen.getByRole("table")).toBeInTheDocument();
            expect(screen.queryByRole("list", { name: "Transactions" })).toBeNull();
            expect(screen.getByTestId("history-transaction-table")).toHaveStyle({
                overflowX: "auto",
            });
        },
    );

    it("keeps long hash and address values available while shortening visually", () => {
        renderHistory();

        const hash = screen.getByTitle(longHash);
        expect(hash).toHaveTextContent(longHash);
        expect(hash).toHaveStyle({ textOverflow: "ellipsis" });
        expect(screen.getAllByRole("button", { name: "Copy Deploy ID" }).length).toBeGreaterThan(0);

        const fromCells = screen.getAllByTitle(accountAddress);
        expect(fromCells.length).toBeGreaterThan(0);
        expect(fromCells[0]).toHaveTextContent(accountAddress);
        expect(
            screen.getAllByRole("button", { name: "Copy sender address" }).length,
        ).toBeGreaterThan(0);
    });

    it("renders a compact mobile table with Date, Type, and Status", () => {
        renderHistory({ width: 500 });

        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Date\b/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Type\b/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Status\b/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^From\b/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Details\b/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^To\b/ })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Amount\b/ })).toBeInTheDocument();
        expect(screen.getAllByText("send").length).toBeGreaterThan(0);
        expect(screen.getAllByText("completed").length).toBeGreaterThan(0);
        expect(screen.queryByText(longHash)).not.toBeInTheDocument();
        expect(
            screen.getAllByRole("button", { name: /View details for/ }).length,
        ).toBeGreaterThan(0);
        expect(screen.queryByRole("list", { name: "Transactions" })).toBeNull();
    });

    it("opens mobile transaction details with copy actions", async () => {
        const { user } = renderHistory({ width: 500 });

        await user.click(
            screen.getAllByRole("button", {
                name: "View details for send transaction",
            })[0],
        );

        expect(
            screen.getByRole("heading", { name: "Transaction details" }),
        ).toBeInTheDocument();
        expect(screen.getByTitle(longHash)).toHaveTextContent(longHash);
        expect(
            screen.getByRole("button", { name: "Copy Deploy ID" }),
        ).toBeInTheDocument();
        expect(
            screen.getAllByRole("button", { name: "Copy sender address" }).length,
        ).toBeGreaterThan(0);
    });

    it("updates visible rows when history data refreshes", () => {
        const { rerender } = renderHistory();

        expect(screen.getByText(longHash)).toBeInTheDocument();

        mockHistoryQuery([
            {
                id: "tx-refreshed",
                deployId: "refreshed-hash-001",
                from: accountAddress,
                to: counterpartyAddress,
                amount: "9",
                timestamp: new Date().toISOString(),
                status: "completed",
                type: "receive",
            },
        ]);

        rerender(
            <Provider store={createStore()}>
                <ThemeProvider theme={lightTheme}>
                    <MemoryRouter>
                        <History />
                    </MemoryRouter>
                </ThemeProvider>
            </Provider>,
        );

        expect(screen.getByText("refreshed-hash-001")).toBeInTheDocument();
        expect(screen.queryByText(longHash)).not.toBeInTheDocument();
    });

    it("keeps polling and distinguishes load failure from refresh failure with cache", () => {
        mockHistoryQuery(undefined, {
            isError: true,
            isSuccess: false,
            fulfilledTimeStamp: undefined,
        });
        const { unmount: unmountInitial } = renderHistory();
        expect(screen.getByRole("alert")).toHaveTextContent(
            "Failed to load transaction history",
        );
        expect(mockUseGetTransactionHistoryQuery).toHaveBeenCalledWith(
            expect.objectContaining({ source: "all" }),
            expect.objectContaining({ pollingInterval: ACCOUNT_DATA_POLLING_INTERVAL_MS }),
        );
        unmountInitial();

        mockHistoryQuery(createTransactions(), { isError: true, isSuccess: false });
        const { unmount: unmountCached } = renderHistory();
        expect(screen.getByRole("alert")).toHaveTextContent(
            "Could not refresh. Showing the last loaded transactions.",
        );
        expect(screen.getByText(longHash)).toBeInTheDocument();
        unmountCached();

        mockHistoryQuery([], { isError: true, isSuccess: false });
        renderHistory();
        expect(screen.getByRole("alert")).toHaveTextContent(
            "Could not refresh. Showing the last loaded transactions.",
        );
    });

    it.each([
        { mode: "light", theme: lightTheme },
        { mode: "dark", theme: darkTheme },
    ] as const)(
        "uses $mode theme tokens and compact table at 768 px",
        ({ theme }) => {
            renderHistory({ theme, width: 768 });
            const completed = screen.getAllByText("completed")[0];
            expect(completed).toHaveStyle({ color: theme.actionText });
            expect(screen.getByRole("table")).toBeInTheDocument();
            expect(screen.queryByRole("list", { name: "Transactions" })).toBeNull();
            expect(screen.getByRole("button", { name: /^Details\b/ })).toBeInTheDocument();
            expect(
                screen.getAllByRole("button", { name: /View details for/ }).length,
            ).toBeGreaterThan(0);
        },
    );

    it.each([
        { mode: "light", theme: lightTheme, width: 1024 },
        { mode: "dark", theme: darkTheme, width: 1024 },
        { mode: "light", theme: lightTheme, width: 1250 },
        { mode: "dark", theme: darkTheme, width: 1250 },
    ] as const)(
        "uses $mode theme tokens and table at $width px",
        ({ theme, width }) => {
            renderHistory({ theme, width });
            const completed = screen.getAllByText("completed")[0];
            expect(completed).toHaveStyle({ color: theme.actionText });
            expect(screen.getByRole("table")).toBeInTheDocument();
            expect(screen.queryByRole("list", { name: "Transactions" })).toBeNull();
        },
    );

});
