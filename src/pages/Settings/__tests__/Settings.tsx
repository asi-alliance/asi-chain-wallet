import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider } from "styled-components";
import { DEFAULT_NODE_API_PROFILE, WalletTypes } from "@asichain/asi-wallet-sdk";
import { lightTheme, darkTheme } from "styles/theme";
import { Settings } from "pages/Settings/Settings";
import walletReducer, { selectSelectedNetworkId } from "store/WalletsStore";
import authReducer from "store/Auth";
import networkOperationReducer from "store/networkOperationSlice";
import { Network } from "types/wallet";
import {
    removeCustomNetwork,
    selectNetwork,
    updateCustomNetwork,
} from "store/WalletsStore/thunks";
import {
    useGetBalanceQuery,
    useGetTransactionHistoryQuery,
    walletsApi,
} from "store/WalletsStore/api";
import { SdkWalletService } from "sdk";
import {
    getNetworkFormFieldErrors,
    validateNetworkFormValues,
    createEmptyNetworkFormValues,
} from "components/NetworkForm";

jest.mock("sdk", () => ({
    useIsNetworkBusy: () => false,
    useBusyNetworkIds: () => [],
    SdkWalletService: {
        setNetwork: jest.fn(),
        addCustomNetwork: jest.fn(),
        updateCustomNetwork: jest.fn(),
        removeCustomNetwork: jest.fn(),
        getActiveNetworkId: jest.fn(),
        getAvailableBalance: jest.fn(),
        getTransactionsHistory: jest.fn(),
    },
}));

const builtInMainnet: Network = {
    id: "mainnet",
    name: "ASI Mainnet",
    validatorUrl: "https://validator.mainnet.example",
    observerUrl: "https://readonly.mainnet.example",
    indexerUrl: "https://indexer.mainnet.example",
    nodeApiProfile: DEFAULT_NODE_API_PROFILE,
    isDefault: true,
};

const builtInTestnet: Network = {
    id: "testnet",
    name: "ASI Testnet",
    validatorUrl: "https://validator.testnet.example",
    observerUrl: "https://readonly.testnet.example",
    indexerUrl: "https://indexer.testnet.example",
    nodeApiProfile: DEFAULT_NODE_API_PROFILE,
    isDefault: true,
};

const customNetwork: Network = {
    id: "custom-1",
    name: "Local Dev",
    validatorUrl: "http://localhost:40403",
    observerUrl: "http://localhost:40453",
    indexerUrl: "http://localhost:3000",
    nodeApiProfile: DEFAULT_NODE_API_PROFILE,
    isDefault: false,
};

const createStore = (options?: {
    selectedNetworkId?: string;
    customNetworks?: Network[];
    withAccount?: boolean;
}) => {
    const initialWalletState = walletReducer(undefined, { type: "init" });
    const customNetworks = options?.customNetworks ?? [customNetwork];
    const selectedNetworkId =
        options?.selectedNetworkId ?? builtInMainnet.id;
    const networks = [builtInMainnet, builtInTestnet, ...customNetworks];
    const selectedNetwork =
        networks.find((network) => network.id === selectedNetworkId) ??
        builtInMainnet;

    return configureStore({
        reducer: {
            walletsStore: walletReducer,
            [walletsApi.reducerPath]: walletsApi.reducer,
            auth: authReducer,
            networkOperation: networkOperationReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(walletsApi.middleware),
        preloadedState: {
            walletsStore: {
                ...initialWalletState,
                wallets: options?.withAccount
                    ? [{
                          id: "wallet-1",
                          signerId: "signer-1",
                          type: WalletTypes.HD,
                          isUnlocked: true,
                          accounts: [{
                              id: "account-1",
                              name: "Main account",
                              index: 0,
                              address:
                                  "1111111111111111111111111111111111111111111111111111",
                              publicKey: "public-key",
                          }],
                      }]
                    : [],
                networks,
                selectedNetwork,
            },
            auth: authReducer(undefined, { type: "init" }),
            networkOperation: networkOperationReducer(undefined, {
                type: "init",
            }),
        },
    });
};

const renderSettings = (
    theme: typeof lightTheme = lightTheme,
    storeOptions?: Parameters<typeof createStore>[0],
) => {
    const store = createStore(storeOptions);

    render(
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={["/settings"]}>
                    <Settings />
                </MemoryRouter>
            </ThemeProvider>
        </Provider>,
    );

    return store;
};

const fillNetworkForm = async (values: {
    name: string;
    validator: string;
    readonly: string;
    indexer: string;
}): Promise<void> => {
    await userEvent.clear(screen.getByLabelText("Network Name"));
    await userEvent.type(screen.getByLabelText("Network Name"), values.name);
    await userEvent.clear(screen.getByLabelText("Validator URL"));
    await userEvent.type(
        screen.getByLabelText("Validator URL"),
        values.validator,
    );
    await userEvent.clear(screen.getByLabelText("Read-only URL"));
    await userEvent.type(
        screen.getByLabelText("Read-only URL"),
        values.readonly,
    );
    await userEvent.clear(screen.getByLabelText("Indexer URL"));
    await userEvent.type(screen.getByLabelText("Indexer URL"), values.indexer);
};

const viewports = [
    ["desktop", 1440],
    ["mobile", 390],
] as const;

const themes = [
    ["light", lightTheme],
    ["dark", darkTheme],
] as const;

beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: 1440,
    });
    jest.clearAllMocks();
});

const QueryProbe = () => {
    const networkId = useSelector(selectSelectedNetworkId);
    const { currentData: balance } = useGetBalanceQuery({
        accountId: "account-1",
        networkId,
    });
    const { currentData: history } = useGetTransactionHistoryQuery({
        accountId: "account-1",
        networkId,
        source: "all",
    });

    return (
        <div>
            <span data-testid="balance">{balance ?? "loading"}</span>
            <span data-testid="history">{history?.length ?? "loading"}</span>
        </div>
    );
};

describe("Network form validation", () => {
    it("rejects empty name and invalid URL or port values", () => {
        const empty = createEmptyNetworkFormValues();
        expect(validateNetworkFormValues(empty, [])).toBe(
            "Network name is required.",
        );

        const withBadUrl = {
            name: "Dev",
            config: {
                ...empty.config,
                ValidatorURL: "not-a-url",
                ReadOnlyURL: "http://localhost:40453",
                IndexerURL: "http://localhost:3000",
            },
        };

        expect(validateNetworkFormValues(withBadUrl, [])).toContain(
            "Validator URL",
        );

        const withBadPort = {
            name: "Dev",
            config: {
                ...empty.config,
                ValidatorURL: "http://localhost:notaport",
                ReadOnlyURL: "http://localhost:40453",
                IndexerURL: "http://localhost:3000",
            },
        };

        const fieldErrors = getNetworkFormFieldErrors(withBadPort, []);
        expect(fieldErrors.ValidatorURL).toMatch(/URL is not valid/i);

        const withOutOfRangePort = {
            ...withBadPort,
            config: {
                ...withBadPort.config,
                ValidatorURL: "http://localhost:65536",
            },
        };
        expect(getNetworkFormFieldErrors(withOutOfRangePort, []).ValidatorURL)
            .toMatch(/URL is not valid/i);
    });

    it("rejects reserved network names", () => {
        const values = {
            name: "ASI Mainnet",
            config: {
                ValidatorURL: "http://localhost:40403",
                ReadOnlyURL: "http://localhost:40453",
                IndexerURL: "http://localhost:3000",
                nodeApiProfile: DEFAULT_NODE_API_PROFILE,
            },
        };

        expect(validateNetworkFormValues(values, ["ASI Mainnet"])).toMatch(
            /already used/i,
        );
    });
});

describe.each(viewports)("Settings on %s", (_viewport, width) => {
    describe.each(themes)("%s theme", (_themeName, theme) => {
        beforeEach(() => {
            window.innerWidth = width;
        });

        it("lists custom networks with edit and delete actions", () => {
            renderSettings(theme);

            expect(
                screen.queryByRole("heading", { name: "Built-in Networks" }),
            ).not.toBeInTheDocument();
            expect(
                screen.getByRole("heading", { name: "Existing Custom Networks" }),
            ).toBeInTheDocument();
            expect(screen.queryByText("ASI Mainnet")).not.toBeInTheDocument();
            expect(screen.getByText("Local Dev")).toBeInTheDocument();
            expect(screen.getByText("(custom-1)")).toBeInTheDocument();

            expect(screen.getAllByRole("button", { name: "Edit network" })).toHaveLength(1);
            expect(screen.getAllByRole("button", { name: "Delete network" })).toHaveLength(1);
        });

        it("restores every custom-network field when Restore to default is pressed", async () => {
            renderSettings(theme);

            await fillNetworkForm({
                name: "Temp",
                validator: "http://localhost:1",
                readonly: "http://localhost:2",
                indexer: "http://localhost:3",
            });

            const profile = screen.getByRole("combobox", {
                name: "Node API Profile",
            });
            await userEvent.click(profile);
            await userEvent.click(screen.getByRole("option", { name: /Rust node/i }));
            expect(profile).toHaveTextContent("Rust node");

            await userEvent.click(
                screen.getByRole("button", { name: "Restore to default" }),
            );

            expect(screen.getByLabelText("Network Name")).toHaveValue("");
            expect(screen.getByLabelText("Validator URL")).toHaveValue("");
            expect(screen.getByLabelText("Read-only URL")).toHaveValue("");
            expect(screen.getByLabelText("Indexer URL")).toHaveValue("");
            expect(profile).toHaveTextContent("Scala node");
        });

        it("shows field errors for invalid URL values without submitting", async () => {
            renderSettings(theme);

            await userEvent.type(
                screen.getByLabelText("Network Name"),
                "Broken",
            );
            await userEvent.type(
                screen.getByLabelText("Validator URL"),
                "bad-url",
            );
            await userEvent.type(
                screen.getByLabelText("Read-only URL"),
                "http://localhost:40453",
            );
            await userEvent.type(
                screen.getByLabelText("Indexer URL"),
                "http://localhost:3000",
            );

            await userEvent.click(
                screen.getByRole("button", { name: "Save Custom Network" }),
            );

            expect(
                await screen.findByText(/Validator URL: URL is not valid/i),
            ).toBeInTheDocument();
            expect(SdkWalletService.addCustomNetwork).not.toHaveBeenCalled();
        });

        it("keeps other field errors until those fields are corrected", async () => {
            renderSettings(theme);

            await userEvent.type(screen.getByLabelText("Network Name"), "Broken");
            await userEvent.type(screen.getByLabelText("Validator URL"), "bad-url");
            await userEvent.type(screen.getByLabelText("Read-only URL"), "bad-url");
            await userEvent.type(
                screen.getByLabelText("Indexer URL"),
                "http://localhost:3000",
            );
            await userEvent.click(
                screen.getByRole("button", { name: "Save Custom Network" }),
            );

            expect(screen.getByText(/Validator URL: URL is not valid/i)).toBeInTheDocument();
            expect(screen.getByText(/Read-only URL: URL is not valid/i)).toBeInTheDocument();

            await userEvent.clear(screen.getByLabelText("Validator URL"));
            await userEvent.type(
                screen.getByLabelText("Validator URL"),
                "http://localhost:40403",
            );

            expect(screen.queryByText(/Validator URL: URL is not valid/i)).not.toBeInTheDocument();
            expect(screen.getByText(/Read-only URL: URL is not valid/i)).toBeInTheDocument();
        });
    });
});

describe("Settings network CRUD", () => {
    it("adds a custom network and clears the form", async () => {
        const created: Network = {
            id: "custom-2",
            name: "New Custom",
            validatorUrl: "http://127.0.0.1:40403",
            observerUrl: "http://127.0.0.1:40453",
            indexerUrl: "http://127.0.0.1:3000",
            nodeApiProfile: DEFAULT_NODE_API_PROFILE,
            isDefault: false,
        };

        (SdkWalletService.addCustomNetwork as jest.Mock).mockResolvedValue(
            created,
        );

        const view = renderSettings();

        await fillNetworkForm({
            name: "New Custom",
            validator: "http://127.0.0.1:40403",
            readonly: "http://127.0.0.1:40453",
            indexer: "http://127.0.0.1:3000",
        });

        await userEvent.click(
            screen.getByRole("button", { name: "Save Custom Network" }),
        );

        await waitFor(() =>
            expect(SdkWalletService.addCustomNetwork).toHaveBeenCalled(),
        );

        await waitFor(() =>
            expect(view.getState().walletsStore.networks).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ id: "custom-2", name: "New Custom" }),
                ]),
            ),
        );

        expect(screen.getByLabelText("Network Name")).toHaveValue("");
    });

    it("keeps connection errors visible when create fails", async () => {
        (SdkWalletService.addCustomNetwork as jest.Mock).mockRejectedValue(
            new Error("Unable to reach validator endpoint"),
        );

        renderSettings();

        await fillNetworkForm({
            name: "Offline",
            validator: "http://127.0.0.1:40403",
            readonly: "http://127.0.0.1:40453",
            indexer: "http://127.0.0.1:3000",
        });

        await userEvent.click(
            screen.getByRole("button", { name: "Save Custom Network" }),
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            /Unable to reach validator endpoint/i,
        );
    });

    it("keeps the existing update operation available through the SDK thunk", async () => {
        const updated = { ...customNetwork, name: "Local Dev Updated" };
        (SdkWalletService.updateCustomNetwork as jest.Mock).mockResolvedValue(updated);
        const store = createStore();

        const result = await store.dispatch(
            updateCustomNetwork({ id: "custom-1", update: { name: updated.name } }),
        );

        expect(updateCustomNetwork.fulfilled.match(result)).toBe(true);
        expect(SdkWalletService.updateCustomNetwork).toHaveBeenCalledWith(
            "custom-1",
            { name: updated.name },
        );
        expect(store.getState().walletsStore.networks).toContainEqual(updated);
    });

    it("keeps the existing delete operation available through the SDK thunk", async () => {
        (SdkWalletService.removeCustomNetwork as jest.Mock).mockResolvedValue(undefined);
        (SdkWalletService.getActiveNetworkId as jest.Mock).mockReturnValue("mainnet");
        const store = createStore();

        const result = await store.dispatch(removeCustomNetwork({ id: "custom-1" }));

        expect(removeCustomNetwork.fulfilled.match(result)).toBe(true);
        expect(SdkWalletService.removeCustomNetwork).toHaveBeenCalledWith("custom-1");
        expect(store.getState().walletsStore.networks.some((network) => network.id === "custom-1"))
            .toBe(false);
    });

    it("allows deleting the active custom network and follows the SDK selected network", async () => {
        (SdkWalletService.removeCustomNetwork as jest.Mock).mockResolvedValue(undefined);
        (SdkWalletService.getActiveNetworkId as jest.Mock).mockReturnValue("mainnet");
        const store = createStore({ selectedNetworkId: "custom-1" });

        const result = await store.dispatch(
            removeCustomNetwork({ id: "custom-1" }),
        );

        expect(removeCustomNetwork.fulfilled.match(result)).toBe(true);
        expect(SdkWalletService.removeCustomNetwork).toHaveBeenCalledWith("custom-1");
        expect(store.getState().walletsStore.selectedNetwork.id).toBe("mainnet");
    });

    it("edits and deletes a custom network through its card actions", async () => {
        (SdkWalletService.updateCustomNetwork as jest.Mock).mockResolvedValue({
            ...customNetwork,
            name: "Local Updated",
        });
        (SdkWalletService.removeCustomNetwork as jest.Mock).mockResolvedValue(undefined);
        (SdkWalletService.getActiveNetworkId as jest.Mock).mockReturnValue("mainnet");
        renderSettings();

        await userEvent.click(screen.getByRole("button", { name: "Edit network" }));
        const editDialog = screen.getByRole("dialog", { name: "Edit Custom Network" });
        const nameInput = within(editDialog).getByLabelText("Network Name");
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, "Local Updated");
        await userEvent.click(
            within(editDialog).getByRole("button", { name: "Restore to default" }),
        );
        expect(nameInput).toHaveValue(customNetwork.name);

        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, "Local Updated");
        await userEvent.click(within(editDialog).getByRole("button", { name: "Save Custom Network" }));
        await waitFor(() => expect(SdkWalletService.updateCustomNetwork).toHaveBeenCalled());

        await userEvent.click(screen.getByRole("button", { name: "Delete network" }));
        expect(screen.getByRole("dialog", { name: "Delete Custom Network" })).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", { name: "Delete Network" }));
        await waitFor(() => expect(SdkWalletService.removeCustomNetwork).toHaveBeenCalledWith("custom-1"));
    });

    it("keeps delete available for the active custom network", () => {
        renderSettings(lightTheme, { selectedNetworkId: "custom-1" });

        expect(screen.getByRole("button", { name: "Delete network" })).toBeEnabled();
    });
});

describe("selectNetwork", () => {
    it("switches the selected network used by Wallet/History query keys", async () => {
        const store = createStore({ selectedNetworkId: "mainnet" });

        (SdkWalletService.setNetwork as jest.Mock).mockImplementation(
            () => undefined,
        );

        await act(async () => {
            const result = await store.dispatch(
                selectNetwork({ id: "testnet" }),
            );
            expect(selectNetwork.fulfilled.match(result)).toBe(true);
        });

        expect(SdkWalletService.setNetwork).toHaveBeenCalledWith("testnet");
        expect(store.getState().walletsStore.selectedNetwork.id).toBe(
            "testnet",
        );
    });

    it("reads fresh balance and history after a network switch", async () => {
        let activeNetworkId = "mainnet";
        (SdkWalletService.setNetwork as jest.Mock).mockImplementation(
            (id: string) => {
                activeNetworkId = id;
            },
        );
        (SdkWalletService.getAvailableBalance as jest.Mock).mockImplementation(
            async () => (activeNetworkId === "mainnet" ? "1" : "2"),
        );
        (SdkWalletService.getTransactionsHistory as jest.Mock).mockResolvedValue(
            [],
        );
        const store = createStore({ withAccount: true });

        render(
            <Provider store={store}>
                <QueryProbe />
            </Provider>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("balance")).toHaveTextContent("1"),
        );
        expect(SdkWalletService.getTransactionsHistory).toHaveBeenCalledTimes(1);

        await act(async () => {
            await store.dispatch(selectNetwork({ id: "testnet" }));
        });

        await waitFor(() =>
            expect(screen.getByTestId("balance")).toHaveTextContent("2"),
        );
        expect(SdkWalletService.getAvailableBalance).toHaveBeenCalledTimes(2);
        expect(SdkWalletService.getTransactionsHistory).toHaveBeenCalledTimes(2);

        await act(async () => {
            await store.dispatch(selectNetwork({ id: "mainnet" }));
        });

        await waitFor(() =>
            expect(screen.getByTestId("balance")).toHaveTextContent("1"),
        );
        await waitFor(() =>
            expect(SdkWalletService.getAvailableBalance).toHaveBeenCalledTimes(3),
        );
        expect(SdkWalletService.getTransactionsHistory).toHaveBeenCalledTimes(3);
    });

    it("refreshes active network queries after its endpoints change", async () => {
        let balance = "1";
        (SdkWalletService.getAvailableBalance as jest.Mock).mockImplementation(
            async () => balance,
        );
        (SdkWalletService.getTransactionsHistory as jest.Mock).mockResolvedValue(
            [],
        );
        (SdkWalletService.updateCustomNetwork as jest.Mock).mockImplementation(
            async () => {
                balance = "2";
                return { ...customNetwork, observerUrl: "http://localhost:5053" };
            },
        );
        const store = createStore({
            selectedNetworkId: "custom-1",
            withAccount: true,
        });

        render(
            <Provider store={store}>
                <QueryProbe />
            </Provider>,
        );

        await waitFor(() =>
            expect(screen.getByTestId("balance")).toHaveTextContent("1"),
        );
        expect(SdkWalletService.getTransactionsHistory).toHaveBeenCalledTimes(1);

        await act(async () => {
            await store.dispatch(
                updateCustomNetwork({
                    id: "custom-1",
                    update: {
                        config: { ReadOnlyURL: "http://localhost:5053" },
                    },
                }),
            );
        });

        await waitFor(() =>
            expect(screen.getByTestId("balance")).toHaveTextContent("2"),
        );
        expect(SdkWalletService.getAvailableBalance).toHaveBeenCalledTimes(2);
        expect(SdkWalletService.getTransactionsHistory).toHaveBeenCalledTimes(2);
    });
});

describe("Settings double-submit protection", () => {
    it("does not start a second create while the first is pending", async () => {
        let resolveCreate: ((value: Network) => void) | undefined;
        (SdkWalletService.addCustomNetwork as jest.Mock).mockImplementation(
            () =>
                new Promise<Network>((resolve) => {
                    resolveCreate = resolve;
                }),
        );

        renderSettings();

        await fillNetworkForm({
            name: "Pending Net",
            validator: "http://127.0.0.1:40403",
            readonly: "http://127.0.0.1:40453",
            indexer: "http://127.0.0.1:3000",
        });

        const addButton = screen.getByRole("button", {
            name: "Save Custom Network",
        });

        await userEvent.click(addButton);

        await waitFor(() =>
            expect(addButton).toHaveAttribute("aria-busy", "true"),
        );

        // Loading state sets pointer-events: none; a second user click is ignored.
        expect(SdkWalletService.addCustomNetwork).toHaveBeenCalledTimes(1);

        resolveCreate?.({
            id: "custom-pending",
            name: "Pending Net",
            validatorUrl: "http://127.0.0.1:40403",
            observerUrl: "http://127.0.0.1:40453",
            indexerUrl: "http://127.0.0.1:3000",
            nodeApiProfile: DEFAULT_NODE_API_PROFILE,
            isDefault: false,
        });

        await waitFor(() =>
            expect(screen.getByLabelText("Network Name")).toHaveValue(""),
        );
    });
});
