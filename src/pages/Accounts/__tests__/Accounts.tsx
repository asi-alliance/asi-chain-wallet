import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider } from "styled-components";
import { WalletTypes } from "@asichain/asi-wallet-sdk";
import { lightTheme, darkTheme } from "styles/theme";
import { Accounts } from "pages/Accounts/Accounts";
import { AccountCard } from "components/AccountCard";
import { RemoveAccountButton } from "components/RemoveAccountButton";
import { DeleteAccountModal } from "components/DeleteAccountModal";
import { DeleteWalletModal } from "components/DeleteWalletModal";
import { DeriveAccountForm } from "components/DeriveAccountForm";
import { ExportWalletKeyfileModal } from "components/ExportWalletKeyfileModal";
import { IUnlockedAccountMeta, IUnlockedWalletMeta } from "types/wallet";

jest.mock("store/WalletsStore/api", () => ({
    walletsApi: {
        util: { invalidateTags: jest.fn((tags) => ({ type: "invalidate", tags })) },
        endpoints: {
            getBalance: {
                select: () => () => ({ isLoading: false }),
            },
        },
    },
    WalletsApiTags: { BALANCE: "Balance" },
    useGetBalanceQuery: () => ({
        currentData: "1000",
        isFetching: false,
        refetch: jest.fn(),
    }),
}));

jest.mock("store/WalletsStore/thunks", () => ({
    selectAccount: jest.fn((accountId: string) => ({
        type: "wallets/selectAccount",
        payload: accountId,
    })),
    updateAccountName: jest.fn((payload) => ({
        type: "wallets/updateAccountName",
        payload,
    })),
    removeAccount: jest.fn((payload) => ({
        type: "wallets/removeAccount",
        payload,
        unwrap: () => Promise.resolve(payload),
    })),
    removeWallet: jest.fn((payload) => ({
        type: "wallets/removeWallet",
        payload,
        unwrap: () => Promise.resolve(payload),
    })),
}));

jest.mock("store/Auth/thunks", () => ({
    deriveHdAccount: jest.fn((payload) => ({
        type: "auth/deriveHdAccount",
        payload,
        unwrap: () => Promise.resolve(payload),
    })),
    logout: jest.fn(() => ({
        type: "auth/logout",
        unwrap: () => Promise.resolve(),
    })),
}));

jest.mock("sdk", () => ({
    SdkWalletService: {
        exportWalletKeyfile: jest.fn(),
    },
}));

jest.mock("utils/fileDownload", () => ({
    downloadExport: jest.fn(),
}));

jest.mock("hooks/", () => {
    const actual = jest.requireActual("hooks");

    return {
        ...actual,
        useScreen: () => ({ isLaptop: false }),
    };
});

jest.mock("hooks", () => {
    const actual = jest.requireActual("hooks");

    return {
        ...actual,
        useScreen: () => ({ isLaptop: false }),
    };
});

jest.mock("components/FirstHdWalletCreatingWidget", () => ({
    FirstHdWalletCreatingWidget: () => <div>Create first wallet</div>,
}));

jest.mock("components/EditableLabel", () => ({
    EditableLabel: ({
        label,
        onSave,
        disabled,
    }: {
        label: string;
        onSave: (value: string) => void;
        disabled?: boolean;
    }) => (
        <button
            type="button"
            disabled={disabled}
            aria-label={`Rename ${label}`}
            onClick={() => onSave(`${label} renamed`)}
        >
            {label}
        </button>
    ),
}));

const hdAccount0: IUnlockedAccountMeta = {
    id: "acc-0",
    name: "Account 0",
    index: 0,
    address: "1111111111111111111111111111111111111111111111111111",
    publicKey: "pub-0",
};

const hdAccount1: IUnlockedAccountMeta = {
    id: "acc-1",
    name: "Account 1",
    index: 1,
    address: "2222222222222222222222222222222222222222222222222222",
    publicKey: "pub-1",
};

const pkAccount: IUnlockedAccountMeta = {
    id: "pk-acc",
    name: "PK Account",
    index: null,
    address: "3333333333333333333333333333333333333333333333333333",
    publicKey: "pub-pk",
};

const createHdWallet = (
    accounts: IUnlockedAccountMeta[],
    signerId = "hd-1",
): IUnlockedWalletMeta => ({
    id: "wallet-hd",
    signerId,
    type: WalletTypes.HD,
    isUnlocked: true,
    accounts,
});

const createPkWallet = (
    account: IUnlockedAccountMeta = pkAccount,
): IUnlockedWalletMeta => ({
    id: "wallet-pk",
    signerId: "pk-1",
    type: WalletTypes.PRIVATE_KEY,
    isUnlocked: true,
    accounts: [account],
});

function createStore(wallet: IUnlockedWalletMeta, selectedAccountId: string) {
    const walletsStoreReducer = (
        state = {
            wallets: [wallet],
            selectedAccountId,
            selectedNetwork: { id: "network-1" },
            networks: [{ id: "network-1" }],
            deployWatches: {},
            isLoading: false,
            isInitialLoadComplete: true,
        },
    ) => state;

    const authReducer = (
        state = {
            isAuthenticated: true,
            activeSignerId: wallet.signerId,
            isLoading: false,
        },
    ) => state;

    return configureStore({
        reducer: {
            walletsStore: walletsStoreReducer,
            auth: authReducer,
            theme: () => ({ darkMode: false }),
            networkOperation: () => ({ isPending: false }),
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
            }),
    });
}

function renderWithProviders(
    ui: React.ReactElement,
    wallet: IUnlockedWalletMeta,
    selectedAccountId = wallet.accounts[0]?.id ?? "",
    theme = lightTheme,
    initialEntries: string[] = ["/accounts"],
) {
    const store = createStore(wallet, selectedAccountId);

    store.dispatch = jest.fn((action: unknown) => {
        if (
            action &&
            typeof action === "object" &&
            "unwrap" in action &&
            typeof (action as { unwrap: unknown }).unwrap === "function"
        ) {
            return action;
        }

        return action;
    }) as typeof store.dispatch;

    return {
        store,
        ...render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
                </ThemeProvider>
            </Provider>,
        ),
    };
}

describe("Accounts page", () => {
    it.each([
        ["desktop light", lightTheme],
        ["desktop dark", darkTheme],
    ] as const)("shows HD wallet sections and derive for %s", (_label, theme) => {
        const wallet = createHdWallet([hdAccount0, hdAccount1]);
        renderWithProviders(<Accounts />, wallet, hdAccount0.id, theme);

        expect(screen.getByRole("heading", { name: "Your Wallet" })).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Your sub-accounts (1)" })).toBeTruthy();
        expect(screen.getByText("ID:0")).toBeTruthy();
        expect(screen.getByText("ID:1")).toBeTruthy();
        expect(screen.queryByText("Active")).toBeNull();
        expect(screen.queryByText(/Wallet 1|Private Key Account 1/)).toBeNull();
        expect(screen.getByRole("button", { name: /Create Account/i })).toBeTruthy();
        expect(screen.getByRole("button", { name: /Export Keyfile/i })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Import Wallet" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Import Private Key" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Import Wallet from keyfile" })).toBeTruthy();
    });

    it("hides derive for private-key wallets", () => {
        renderWithProviders(<Accounts />, createPkWallet());

        expect(screen.getByRole("heading", { name: "Your Wallet" })).toBeTruthy();
        expect(screen.queryByText(/Your sub-accounts/)).toBeNull();
        expect(screen.queryByText(/ID:\d+/)).toBeNull();
        expect(screen.queryByRole("button", { name: /Create Account/i })).toBeNull();
        expect(screen.getByRole("button", { name: /Export Keyfile/i })).toBeTruthy();
    });

    it("keeps a remaining HD account visible as the primary card after index 0 is removed", () => {
        const hdAccount2 = { ...hdAccount1, id: "acc-2", index: 2, name: "Account 2" };
        renderWithProviders(
            <Accounts />,
            createHdWallet([hdAccount1, hdAccount2]),
            hdAccount1.id,
        );

        expect(screen.getByRole("heading", { name: "Your Wallet" })).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Your sub-accounts (1)" })).toBeTruthy();
        expect(screen.getByTestId(`account-card-${hdAccount1.id}`)).toBeTruthy();
        expect(screen.getByTestId(`account-card-${hdAccount2.id}`)).toBeTruthy();
    });

    it("opens the protected keyfile export from a card action", async () => {
        const user = userEvent.setup();
        renderWithProviders(<Accounts />, createHdWallet([hdAccount0]));

        await user.click(
            screen.getByRole("button", {
                name: "Export wallet keyfile, Account 0",
            }),
        );

        expect(
            screen.getByRole("heading", { name: "Export Wallet Keyfile" }),
        ).toBeTruthy();
    });

    it.each([
        ["Import Wallet", "Import Wallet"],
        ["Import Private Key", "Import Private Key"],
        ["Import Wallet from keyfile", "Import Wallet from keyfile"],
    ])("opens the %s flow from a filled Accounts page", async (action, title) => {
        const user = userEvent.setup();
        renderWithProviders(<Accounts />, createHdWallet([hdAccount0]));

        await user.click(screen.getByRole("button", { name: action }));

        expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    });
});

describe("AccountCard", () => {
    it("activates an account on click and keeps card near 462px", () => {
        const wallet = createHdWallet([hdAccount0, hdAccount1]);
        const { store } = renderWithProviders(
            <AccountCard account={hdAccount1} />,
            wallet,
            hdAccount0.id,
        );

        fireEvent.click(screen.getByTestId(`account-card-${hdAccount1.id}`));
        expect(store.dispatch).toHaveBeenCalled();

        const card = screen.getByTestId(`account-card-${hdAccount1.id}`);
        expect(getComputedStyle(card).maxWidth).toBe("462px");
        expect(card).toHaveAttribute("role", "group");
        expect(card.tabIndex).toBe(0);

        fireEvent.keyDown(card, { key: "Enter" });
        expect(store.dispatch).toHaveBeenCalled();

        const dispatchCalls = (store.dispatch as jest.Mock).mock.calls.length;
        fireEvent.keyDown(
            screen.getByRole("button", { name: "Rename Account 1" }),
            { key: " " },
        );
        expect((store.dispatch as jest.Mock).mock.calls.length).toBe(
            dispatchCalls,
        );
    });

    it("does not open derive modal for private-key wallets via action query", () => {
        renderWithProviders(
            <Accounts />,
            createPkWallet(),
            pkAccount.id,
            lightTheme,
            ["/accounts?action=create-account"],
        );

        expect(screen.queryByRole("heading", { name: "Create Account" })).toBeNull();
        expect(screen.queryByLabelText("Account Name")).toBeNull();
    });

    it("keeps wallet-delete modal hosted on Accounts after last account delete starts", async () => {
        const user = userEvent.setup();
        const { removeWallet } = jest.requireMock("store/WalletsStore/thunks") as {
            removeWallet: jest.Mock;
        };
        let resolveRemove: (value: unknown) => void = () => undefined;
        removeWallet.mockImplementation((payload) => ({
            type: "wallets/removeWallet",
            payload,
            unwrap: () =>
                new Promise((resolve) => {
                    resolveRemove = resolve;
                }),
        }));

        renderWithProviders(
            <Accounts />,
            createHdWallet([hdAccount0]),
            hdAccount0.id,
        );

        await user.click(
            screen.getByRole("button", { name: /Delete wallet, Account 0/i }),
        );
        expect(screen.getByText(/last account in this wallet/i)).toBeTruthy();

        const confirm = screen.getByRole("button", { name: "Delete Wallet" });
        expect(confirm).toBeTruthy();
        await user.click(confirm!);
        expect(confirm).toHaveAttribute("aria-busy", "true");
        expect(screen.queryByText("Create first wallet")).toBeNull();

        resolveRemove({
            removedWalletId: "wallet-hd",
            removedSignerId: "hd-1",
        });

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: "Delete Wallet" }),
            ).toBeTruthy();
        });
        expect(screen.queryByText("Create first wallet")).toBeNull();
    });
});

describe("delete confirmations", () => {
    it("explains private-key account removal as wallet deletion", async () => {
        const user = userEvent.setup();
        const onRequestDeleteWallet = jest.fn();
        renderWithProviders(
            <RemoveAccountButton
                accountId={pkAccount.id}
                onRequestDeleteWallet={onRequestDeleteWallet}
            />,
            createPkWallet(),
        );

        await user.click(
            screen.getByRole("button", { name: /Delete wallet, PK Account/i }),
        );
        expect(onRequestDeleteWallet).toHaveBeenCalledWith(
            expect.stringMatching(/private-key wallet has a single account/i),
        );
    });

    it("explains last HD account removal as wallet deletion", async () => {
        const user = userEvent.setup();
        const onRequestDeleteWallet = jest.fn();
        renderWithProviders(
            <RemoveAccountButton
                accountId={hdAccount0.id}
                onRequestDeleteWallet={onRequestDeleteWallet}
            />,
            createHdWallet([hdAccount0]),
        );

        await user.click(
            screen.getByRole("button", { name: /Delete wallet, Account 0/i }),
        );
        expect(onRequestDeleteWallet).toHaveBeenCalledWith(
            expect.stringMatching(/last account in this wallet/i),
        );
    });

    it("removes a non-last HD account with account confirmation", async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <RemoveAccountButton accountId={hdAccount1.id} />,
            createHdWallet([hdAccount0, hdAccount1]),
        );

        await user.click(
            screen.getByRole("button", { name: /Remove account, Account 1/i }),
        );
        expect(screen.getByRole("heading", { name: "Remove Account" })).toBeTruthy();
        expect(screen.getByText(/Account 1/)).toBeTruthy();
    });

    it("hosts non-last account delete on Accounts so the modal outlives the card", async () => {
        const user = userEvent.setup();
        const { removeAccount } = jest.requireMock("store/WalletsStore/thunks") as {
            removeAccount: jest.Mock;
        };
        let resolveRemove: (value: unknown) => void = () => undefined;
        removeAccount.mockImplementation((payload) => ({
            type: "wallets/removeAccount",
            payload,
            unwrap: () =>
                new Promise((resolve) => {
                    resolveRemove = resolve;
                }),
        }));

        renderWithProviders(
            <Accounts />,
            createHdWallet([hdAccount0, hdAccount1]),
            hdAccount0.id,
        );

        await user.click(
            screen.getByRole("button", { name: /Remove account, Account 1/i }),
        );
        expect(screen.getByRole("heading", { name: "Remove Account" })).toBeTruthy();

        const confirm = screen.getByRole("button", { name: "Remove Account" });
        expect(confirm).toBeTruthy();
        await user.click(confirm!);
        expect(confirm).toHaveAttribute("aria-busy", "true");

        resolveRemove({ walletId: "wallet-hd", accountId: hdAccount1.id });

        await waitFor(() => {
            expect(
                screen.queryByRole("heading", { name: "Remove Account" }),
            ).toBeNull();
        });
    });

    it("names remove/delete actions per account", () => {
        renderWithProviders(
            <Accounts />,
            createHdWallet([hdAccount0, hdAccount1]),
            hdAccount0.id,
        );

        expect(
            screen.getByRole("button", { name: "Remove account, Account 0" }),
        ).toBeTruthy();
        expect(
            screen.getByRole("button", { name: "Remove account, Account 1" }),
        ).toBeTruthy();
    });

    it("keeps delete-account modal open on Cancel and on error", async () => {
        const user = userEvent.setup();
        const onConfirm = jest.fn();
        const onCancel = jest.fn();

        const { rerender } = render(
            <ThemeProvider theme={lightTheme}>
                <DeleteAccountModal
                    isOpen
                    accountName="Account 1"
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            </ThemeProvider>,
        );

        await user.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).toHaveBeenCalledTimes(1);

        rerender(
            <ThemeProvider theme={lightTheme}>
                <DeleteAccountModal
                    isOpen
                    accountName="Account 1"
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    error="Remove failed"
                />
            </ThemeProvider>,
        );

        expect(screen.getByRole("alert")).toHaveTextContent("Remove failed");
        expect(screen.getByRole("heading", { name: "Remove Account" })).toBeTruthy();
    });

    it("blocks repeated delete-wallet confirm while pending", () => {
        const onConfirm = jest.fn();

        render(
            <ThemeProvider theme={lightTheme}>
                <DeleteWalletModal
                    isOpen
                    onConfirm={onConfirm}
                    onCancel={jest.fn()}
                    isDeleting
                />
            </ThemeProvider>,
        );

        const confirm = screen.getByRole("button", { name: /Delete Wallet/i });
        expect(confirm).toBeDisabled();
        expect(confirm).toHaveAttribute("aria-busy", "true");
        expect(onConfirm).not.toHaveBeenCalled();
    });
});

describe("derive and export pending protection", () => {
    it("keeps derive modal open on password error and ignores Cancel while loading", async () => {
        const { deriveHdAccount } = jest.requireMock("store/Auth/thunks") as {
            deriveHdAccount: jest.Mock;
        };
        let resolveDerive: (value: unknown) => void = () => undefined;
        let rejectDerive: (reason?: unknown) => void = () => undefined;
        deriveHdAccount.mockImplementation((payload) => ({
            type: "auth/deriveHdAccount",
            payload,
            unwrap: () =>
                new Promise((resolve, reject) => {
                    resolveDerive = resolve;
                    rejectDerive = reject;
                }),
        }));

        const onCancel = jest.fn();
        const user = userEvent.setup();

        renderWithProviders(
            <DeriveAccountForm onCancel={onCancel} />,
            createHdWallet([hdAccount0]),
        );

        await user.type(screen.getByLabelText("Account Name"), "Account 2");
        await user.click(screen.getByRole("button", { name: /Create Account/i }));
        await user.type(screen.getByLabelText("Wallet Password"), "bad-pass");
        await user.click(screen.getByRole("button", { name: /Add Account/i }));

        const cancel = screen.getByRole("button", { name: "Cancel" });
        // Sync Cancel while pending — handler must no-op even if click reaches it.
        fireEvent.click(cancel);
        expect(screen.getByLabelText("Wallet Password")).toBeTruthy();
        expect(onCancel).not.toHaveBeenCalled();

        rejectDerive(new Error("Incorrect password"));

        await waitFor(() => {
            expect(screen.getByText(/Incorrect password/i)).toBeTruthy();
        });
        expect(onCancel).not.toHaveBeenCalled();

        resolveDerive({});
    });

    it("shows export password error without closing the modal", async () => {
        const { SdkWalletService } = jest.requireMock("sdk") as {
            SdkWalletService: { exportWalletKeyfile: jest.Mock };
        };
        SdkWalletService.exportWalletKeyfile.mockRejectedValue(
            new Error("Invalid password"),
        );

        const onClose = jest.fn();
        const user = userEvent.setup();

        render(
            <ThemeProvider theme={lightTheme}>
                <ExportWalletKeyfileModal
                    isOpen
                    walletId="wallet-hd"
                    onClose={onClose}
                />
            </ThemeProvider>,
        );

        await user.type(screen.getByTestId("password-modal-input"), "wrong");
        await user.click(screen.getByRole("button", { name: "Confirm" }));

        await waitFor(() => {
            expect(screen.getByText("Invalid password")).toBeTruthy();
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    it("ignores a second Confirm click while export is pending", async () => {
        const { SdkWalletService } = jest.requireMock("sdk") as {
            SdkWalletService: { exportWalletKeyfile: jest.Mock };
        };
        let resolveExport: (value: unknown) => void = () => undefined;
        SdkWalletService.exportWalletKeyfile.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveExport = resolve;
                }),
        );

        const onClose = jest.fn();
        const user = userEvent.setup();

        render(
            <ThemeProvider theme={lightTheme}>
                <ExportWalletKeyfileModal
                    isOpen
                    walletId="wallet-hd"
                    onClose={onClose}
                />
            </ThemeProvider>,
        );

        await user.type(screen.getByTestId("password-modal-input"), "pass");
        const confirm = screen.getByRole("button", { name: "Confirm" });
        // Synchronous double-fire before loading re-render disables the button.
        fireEvent.click(confirm);
        fireEvent.click(confirm);

        expect(SdkWalletService.exportWalletKeyfile).toHaveBeenCalledTimes(1);

        resolveExport({ version: 1 });
        await waitFor(() => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
