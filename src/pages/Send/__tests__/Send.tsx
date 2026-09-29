import React from "react";
import { configureStore, Middleware } from "@reduxjs/toolkit";
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import {
    Address,
    CustomErrorCode,
    DeployStatus,
    WalletTypes,
} from "@asichain/asi-wallet-sdk";
import { Send } from "pages/Send/Send";
import walletReducer from "store/WalletsStore";
import authReducer from "store/Auth";
import networkOperationReducer from "store/networkOperationSlice";
import { SdkWalletService } from "sdk";
import { darkTheme, lightTheme } from "styles/theme";

const mockUseGetBalanceQuery = jest.fn();
const mockRefetchBalance = jest.fn();
const mockScanImage = jest.fn();
const mockScannerStart = jest.fn();
const mockScannerStop = jest.fn();
const mockScannerDestroy = jest.fn();
let mockQrResultHandler:
    | ((result: { data: string }) => void)
    | undefined;

jest.mock("store/WalletsStore/api", () => ({
    ...jest.requireActual("store/WalletsStore/api"),
    useGetBalanceQuery: (...args: unknown[]) => ({
        refetch: mockRefetchBalance,
        ...mockUseGetBalanceQuery(...args),
    }),
}));

jest.mock("qr-scanner", () => ({
    __esModule: true,
    default: class MockQrScanner {
        static scanImage = (...args: unknown[]) => mockScanImage(...args);
        constructor(
            _video: HTMLVideoElement,
            resultHandler: (result: { data: string }) => void,
        ) {
            mockQrResultHandler = resultHandler;
        }
        start = (...args: unknown[]) => mockScannerStart(...args);
        stop = (...args: unknown[]) => mockScannerStop(...args);
        destroy = (...args: unknown[]) => mockScannerDestroy(...args);
    },
}));

const sourceAddress =
    "1111111111111111111111111111111111111111111111111111" as Address;
const recipientAddress =
    "1111222222222222222222222222222222222222222222222222" as Address;

const createStore = (actionTypes: string[]) => {
    const initialWalletState = walletReducer(undefined, { type: "init" });
    const logActions: Middleware = () => (next) => (action) => {
        if (
            typeof action === "object" &&
            action !== null &&
            "type" in action
        ) {
            actionTypes.push(String(action.type));
        }
        return next(action);
    };

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
                                index: null,
                                address: sourceAddress,
                                publicKey: "public-key",
                            },
                            {
                                id: "account-2",
                                name: "Second account",
                                index: 1,
                                address: recipientAddress,
                                publicKey: "public-key-2",
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
            networkOperation: networkOperationReducer(undefined, {
                type: "init",
            }),
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(logActions),
    });
};

const renderSend = (theme: typeof lightTheme = lightTheme) => {
    const actionTypes: string[] = [];
    const store = createStore(actionTypes);
    render(
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={["/send"]}>
                    <Send />
                </MemoryRouter>
            </ThemeProvider>
        </Provider>,
    );
    return { actionTypes, store };
};

const fillValidTransfer = async (): Promise<void> => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Recipient Address"), recipientAddress);
    await user.type(screen.getByLabelText("Amount"), "1.25");
    await user.click(
        screen.getByRole("button", { name: "Send" }),
    );
};

beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1440,
    });
    mockUseGetBalanceQuery.mockReturnValue({
        currentData: "10",
        isFetching: false,
        isError: false,
    });
    mockRefetchBalance.mockReset();
    mockScanImage.mockReset();
    mockScannerStart.mockReset();
    mockScannerStart.mockResolvedValue(undefined);
    mockScannerStop.mockReset();
    mockScannerDestroy.mockReset();
    mockQrResultHandler = undefined;
    jest.spyOn(SdkWalletService, "isWalletUnlocked").mockReturnValue(true);
});

afterEach(() => {
    jest.restoreAllMocks();
});

it("keeps the entered transfer after a remote submission error", async () => {
    jest.spyOn(SdkWalletService, "transfer").mockRejectedValue(
        new Error("Remote node rejected the transfer"),
    );
    renderSend();
    await fillValidTransfer();

    await userEvent.click(
        screen.getByRole("button", { name: "Confirm & Send" }),
    );

    expect(
        await screen.findByText("Remote node rejected the transfer"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Recipient Address")).toHaveValue(recipientAddress);
    expect(screen.getByLabelText("Amount")).toHaveValue("1.25");
});

it("moves a remote error after password re-auth back to the form", async () => {
    jest.spyOn(SdkWalletService, "isWalletUnlocked").mockReturnValue(false);
    jest.spyOn(SdkWalletService, "transfer").mockRejectedValue(
        new Error("Remote node rejected the transfer"),
    );
    renderSend();
    await fillValidTransfer();

    await userEvent.click(
        screen.getByRole("button", { name: "Confirm & Send" }),
    );
    const passwordInput =
        await screen.findByPlaceholderText("Enter password");
    await userEvent.type(passwordInput, "correct password");
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(
        await screen.findByText("Remote node rejected the transfer"),
    ).toBeInTheDocument();
    expect(
        screen.queryByRole("dialog", {
            name: "Enter password to sign transaction",
        }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Recipient Address")).toHaveValue(recipientAddress);
    expect(screen.getByLabelText("Amount")).toHaveValue("1.25");
});

it("keeps the transfer for a wrong password and releases it on cancel", async () => {
    jest.spyOn(SdkWalletService, "isWalletUnlocked").mockReturnValue(false);
    const transferSpy = jest.spyOn(SdkWalletService, "transfer").mockRejectedValue(
        Object.assign(new Error("Incorrect password"), {
            code: CustomErrorCode.INVALID_PASSWORD,
        }),
    );
    renderSend();
    await fillValidTransfer();

    await userEvent.click(
        screen.getByRole("button", { name: "Confirm & Send" }),
    );
    await userEvent.type(
        await screen.findByPlaceholderText("Enter password"),
        "incorrect password",
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByText("Incorrect password")).toBeInTheDocument();
    expect(transferSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Recipient Address")).toBeDisabled();
    expect(screen.getByLabelText("Amount")).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByLabelText("Recipient Address")).toHaveValue(recipientAddress);
    expect(screen.getByLabelText("Amount")).toHaveValue("1.25");
    expect(screen.getByLabelText("Recipient Address")).toBeEnabled();
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeEnabled();
    expect(screen.queryByText("Incorrect password")).not.toBeInTheDocument();
});

it("submits once, exposes the pending hash, and refreshes after finalization", async () => {
    let resolveTransfer: (
        value: Awaited<ReturnType<typeof SdkWalletService.transfer>>,
    ) => void = () => undefined;
    let deployCallbacks: {
        onConfirmed: () => void;
    } | null = null;
    const transferPromise = new Promise<
        Awaited<ReturnType<typeof SdkWalletService.transfer>>
    >((resolve) => {
        resolveTransfer = resolve;
    });
    const transferSpy = jest
        .spyOn(SdkWalletService, "transfer")
        .mockReturnValue(transferPromise);
    const { actionTypes } = renderSend();
    await fillValidTransfer();

    const confirmButton = screen.getByRole("button", {
        name: "Confirm & Send",
    });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);
    expect(transferSpy).toHaveBeenCalledTimes(1);
    expect(
        screen.getByRole("button", { name: "View transaction history" }),
    ).toBeDisabled();

    await act(async () => {
        resolveTransfer({
            deployId: "deploy-hash-1",
            subscribe: (callbacks) => {
                deployCallbacks = callbacks;
            },
        });
        await transferPromise;
    });

    expect(await screen.findByText("Transaction pending")).toBeInTheDocument();
    expect(screen.getByText("Deploy ID: deploy-hash-1")).toBeInTheDocument();
    expect(screen.getByLabelText("Recipient Address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(
        screen.getByRole("button", { name: "View transaction history" }),
    ).toBeEnabled();
    expect(
        screen.getByRole("button", { name: "Copy transaction hash" }),
    ).toBeInTheDocument();

    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
            writeText: jest
                .fn()
                .mockRejectedValue(new Error("Clipboard unavailable")),
        },
    });
    await userEvent.click(
        screen.getByRole("button", { name: "Copy transaction hash" }),
    );
    expect(
        await screen.findByText("Could not copy the transaction hash."),
    ).toBeInTheDocument();

    const invalidationsBeforeFinalization = actionTypes.filter(
        (type) => type === "walletsApi/invalidateTags",
    ).length;

    act(() => {
        deployCallbacks?.onConfirmed();
    });

    expect(await screen.findByText("Transaction completed")).toBeInTheDocument();
    expect(
        actionTypes.filter((type) => type === "walletsApi/invalidateTags")
            .length,
    ).toBeGreaterThan(invalidationsBeforeFinalization);
    expect(
        actionTypes.filter(
            (type) =>
                type ===
                `wallets-store/deployStatusChanged`,
        ),
    ).toHaveLength(1);
    expect(
        screen.getByText(/Balance and transaction history are being refreshed/i),
    ).toBeInTheDocument();
    expect(DeployStatus.FINALIZED).toBeDefined();
});

it("shows address, zero, precision, and fee-aware balance errors", async () => {
    renderSend();
    const user = userEvent.setup();
    const recipient = screen.getByLabelText("Recipient Address");
    const amount = screen.getByLabelText("Amount");

    await user.type(recipient, "0x1111111111111111111111111111111111111111");
    expect(
        screen.getByText(/belongs to another network/i),
    ).toBeInTheDocument();

    await user.clear(recipient);
    await user.type(recipient, recipientAddress);
    await user.type(amount, "0");
    expect(
        screen.getByText("Amount must be greater than zero"),
    ).toBeInTheDocument();
    expect(
        screen.queryByRole("region", { name: "Transaction estimate" }),
    ).not.toBeInTheDocument();

    await user.clear(amount);
    await user.type(amount, "1.000000001");
    expect(
        screen.getByText("Amount supports up to 8 decimal places"),
    ).toBeInTheDocument();

    await user.clear(amount);
    await user.type(amount, "1.");
    expect(screen.getByText("Enter a valid amount")).toBeInTheDocument();
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeDisabled();

    await user.clear(amount);
    await user.type(amount, "9.999");
    expect(screen.getByText(/Amount \+ fee/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Max" }));
    await waitFor(() =>
        expect(screen.getByLabelText("Amount")).not.toHaveValue("10"),
    );
    expect(screen.queryByText(/Amount \+ fee/i)).not.toBeInTheDocument();
});

it("keeps Max and Send available during a background balance refresh", async () => {
    mockUseGetBalanceQuery.mockReturnValue({
        currentData: "10",
        isFetching: true,
        isError: false,
    });
    renderSend();
    const user = userEvent.setup();
    const maxButton = screen.getByRole("button", { name: "Max" });

    expect(maxButton).toBeEnabled();
    await user.click(maxButton);
    expect(screen.getByLabelText("Amount")).not.toHaveValue("0");
    await user.type(screen.getByLabelText("Recipient Address"), recipientAddress);
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeEnabled();
});

it("does not freeze Send for an unrelated wallet-store operation", async () => {
    const { store } = renderSend();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Recipient Address"), recipientAddress);
    await user.type(screen.getByLabelText("Amount"), "1");

    act(() => {
        store.dispatch({
            type: "walletsStore/updateAccountName/pending",
        });
    });

    expect(store.getState().walletsStore.isLoading).toBe(true);
    expect(screen.getByLabelText("Recipient Address")).toBeEnabled();
    expect(screen.getByLabelText("Amount")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Max" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Clear all" })).toBeEnabled();
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeEnabled();
    expect(
        screen.getByRole("button", { name: "View transaction history" }),
    ).toBeEnabled();
});

it("keeps a large Max amount within the atomic balance", async () => {
    mockUseGetBalanceQuery.mockReturnValue({
        currentData: "90000000.00000001",
        isFetching: false,
        isError: false,
    });
    renderSend();
    await userEvent.click(screen.getByRole("button", { name: "Max" }));

    expect(screen.getByLabelText("Amount")).toHaveValue(
        "89999999.99750001",
    );
    expect(screen.queryByText(/Amount \+ fee/i)).not.toBeInTheDocument();
});

it("validates recipients returned by the QR scanner", async () => {
    renderSend();
    await userEvent.click(
        screen.getByRole("button", { name: "Scan recipient QR code" }),
    );
    await waitFor(() => expect(mockQrResultHandler).toBeDefined());

    act(() => {
        mockQrResultHandler?.({
            data: "0x1111111111111111111111111111111111111111",
        });
    });

    expect(screen.getByLabelText("Recipient Address")).toHaveValue(
        "0x1111111111111111111111111111111111111111",
    );
    expect(screen.getByText(/belongs to another network/i)).toBeInTheDocument();
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeDisabled();
});

it("keeps camera permission errors inside the QR modal", async () => {
    mockScannerStart.mockRejectedValue(new Error("Camera denied"));
    renderSend();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Recipient Address"), recipientAddress);
    await user.type(screen.getByLabelText("Amount"), "1");

    await user.click(
        screen.getByRole("button", { name: "Scan recipient QR code" }),
    );
    expect(
        await screen.findByText(/Failed to access camera/i),
    ).toBeInTheDocument();
    expect(mockScannerStop).toHaveBeenCalledTimes(1);
    expect(mockScannerDestroy).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Close dialog" }));

    expect(screen.getByLabelText("Recipient Address")).not.toHaveAttribute(
        "aria-invalid",
    );
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeEnabled();
    expect(
        screen.queryByText(/Failed to access camera/i),
    ).not.toBeInTheDocument();
});

it("ignores a late camera start rejection from a closed scanner", async () => {
    let rejectFirstStart: (error: Error) => void = () => undefined;
    mockScannerStart
        .mockImplementationOnce(
            () =>
                new Promise<void>((_resolve, reject) => {
                    rejectFirstStart = reject;
                }),
        )
        .mockResolvedValueOnce(undefined);
    renderSend();
    const user = userEvent.setup();

    await user.click(
        screen.getByRole("button", { name: "Scan recipient QR code" }),
    );
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    await user.click(
        screen.getByRole("button", { name: "Scan recipient QR code" }),
    );
    await act(async () => {
        rejectFirstStart(new Error("Late camera rejection"));
    });

    expect(
        screen.queryByText(/Failed to access camera/i),
    ).not.toBeInTheDocument();
    expect(
        screen.getByRole("dialog", { name: "Scan recipient QR code" }),
    ).toBeInTheDocument();
});

it("ignores a late decoded address after the QR modal closes", async () => {
    renderSend();
    const user = userEvent.setup();
    await user.click(
        screen.getByRole("button", { name: "Scan recipient QR code" }),
    );
    await waitFor(() => expect(mockQrResultHandler).toBeDefined());
    const closedScannerResultHandler = mockQrResultHandler;
    await user.click(screen.getByRole("button", { name: "Close dialog" }));

    act(() => {
        closedScannerResultHandler?.({ data: recipientAddress });
    });

    expect(screen.getByLabelText("Recipient Address")).toHaveValue("");
});

it("renders a failed pasted QR image as non-input feedback", async () => {
    mockScanImage.mockRejectedValue(new Error("No QR code"));
    renderSend();
    const user = userEvent.setup();
    const recipient = screen.getByLabelText("Recipient Address");
    await user.type(recipient, recipientAddress);
    await user.type(screen.getByLabelText("Amount"), "1");

    fireEvent.paste(recipient, {
        clipboardData: {
            getData: () => "",
            items: [
                {
                    type: "image/png",
                    getAsFile: () =>
                        new File(["not-a-qr"], "recipient.png", {
                            type: "image/png",
                        }),
                },
            ],
        },
    });

    expect(
        await screen.findByText("No QR code was found in the pasted image."),
    ).toHaveAttribute("role", "alert");
    expect(recipient).not.toHaveAttribute("aria-invalid");
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeEnabled();
});

it("shows a pasted QR failure alongside an invalid recipient", async () => {
    mockScanImage.mockRejectedValue(new Error("No QR code"));
    renderSend();
    const recipient = screen.getByLabelText("Recipient Address");
    await userEvent.type(recipient, "0x1234");

    fireEvent.paste(recipient, {
        clipboardData: {
            getData: () => "",
            items: [{
                type: "image/png",
                getAsFile: () => new File(["image"], "recipient.png", { type: "image/png" }),
            }],
        },
    });

    expect(await screen.findByText("No QR code was found in the pasted image.")).toBeInTheDocument();
    expect(screen.getByText(/belongs to another network/i)).toBeInTheDocument();
    expect(recipient).toHaveAttribute("aria-invalid", "true");
});

it("supports image paste when clipboard text is unavailable", async () => {
    mockScanImage.mockResolvedValue({ data: recipientAddress });
    renderSend();
    const recipient = screen.getByLabelText("Recipient Address");

    fireEvent.paste(recipient, {
        clipboardData: {
            getData: () => undefined,
            items: [{
                type: "image/png",
                getAsFile: () => new File(["image"], "recipient.png", { type: "image/png" }),
            }],
        },
    });

    await waitFor(() =>
        expect(recipient).toHaveValue(recipientAddress),
    );
});

it("ignores a late pasted QR result after recipient editing", async () => {
    let resolveScan: (result: { data: string }) => void = () => undefined;
    mockScanImage.mockReturnValue(
        new Promise<{ data: string }>((resolve) => {
            resolveScan = resolve;
        }),
    );
    renderSend();
    const user = userEvent.setup();
    const recipient = screen.getByLabelText("Recipient Address");

    fireEvent.paste(recipient, {
        clipboardData: {
            getData: () => "",
            items: [{
                type: "image/png",
                getAsFile: () => new File(["image"], "recipient.png", { type: "image/png" }),
            }],
        },
    });
    await user.type(recipient, recipientAddress);
    await act(async () => {
        resolveScan({
            data: "0x1111111111111111111111111111111111111111",
        });
    });

    expect(recipient).toHaveValue(recipientAddress);
    expect(
        screen.queryByText(/belongs to another network/i),
    ).not.toBeInTheDocument();
});

it("clears stale paste feedback when entering confirmation", async () => {
    mockScanImage.mockRejectedValue(new Error("No QR code"));
    renderSend();
    const user = userEvent.setup();
    const recipient = screen.getByLabelText("Recipient Address");
    await user.type(recipient, recipientAddress);
    await user.type(screen.getByLabelText("Amount"), "1");
    fireEvent.paste(recipient, {
        clipboardData: {
            getData: () => "",
            items: [{
                type: "image/png",
                getAsFile: () => new File(["image"], "recipient.png", { type: "image/png" }),
            }],
        },
    });
    expect(
        await screen.findByText("No QR code was found in the pasted image."),
    ).toBeInTheDocument();

    await user.click(
        screen.getByRole("button", { name: "Send" }),
    );
    expect(
        screen.queryByText("No QR code was found in the pasted image."),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
        screen.queryByText("No QR code was found in the pasted image."),
    ).not.toBeInTheDocument();
});

it("shows a live validation error for self-transfers", async () => {
    renderSend();
    await userEvent.type(screen.getByLabelText("Recipient Address"), sourceAddress);

    expect(screen.getByText(/self-transfer is not allowed/i)).toBeInTheDocument();
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeDisabled();
});

it("revalidates the recipient when the source account changes", async () => {
    const { store } = renderSend();
    await userEvent.type(
        screen.getByLabelText("Recipient Address"),
        recipientAddress,
    );
    await userEvent.type(screen.getByLabelText("Amount"), "1");
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeEnabled();

    act(() => {
        store.dispatch({
            type: "wallets-store/selectAccount/fulfilled",
            payload: "account-2",
        });
    });
    expect(
        await screen.findByText(/self-transfer is not allowed/i),
    ).toBeInTheDocument();
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeDisabled();

    act(() => {
        store.dispatch({
            type: "wallets-store/selectAccount/fulfilled",
            payload: "account-1",
        });
    });
    await waitFor(() =>
        expect(
            screen.queryByText(/self-transfer is not allowed/i),
        ).not.toBeInTheDocument(),
    );
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeEnabled();
});

it("prioritizes a text address over an accompanying clipboard image", () => {
    mockScanImage.mockRejectedValue(new Error("Not a QR code"));
    renderSend();
    const recipient = screen.getByLabelText("Recipient Address");

    fireEvent.paste(recipient, {
        clipboardData: {
            getData: (type: string) =>
                type === "text/plain" ? recipientAddress : "",
            items: [
                {
                    type: "image/png",
                    getAsFile: () =>
                        new File(["image"], "clipboard.png", {
                            type: "image/png",
                        }),
                },
            ],
        },
    });

    expect(mockScanImage).not.toHaveBeenCalled();
    expect(
        screen.queryByText("No QR code was found in the pasted image."),
    ).not.toBeInTheDocument();
});

it("freezes all sibling controls while confirmation owns the snapshot", async () => {
    const { store } = renderSend();
    await fillValidTransfer();

    expect(store.getState().networkOperation.isPending).toBe(true);
    expect(screen.getByLabelText("Recipient Address")).toBeDisabled();
    expect(screen.getByLabelText("Amount")).toBeDisabled();
    expect(
        screen.getByRole("button", { name: "Scan recipient QR code" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Max" })).toBeDisabled();
    expect(
        screen.getByRole("button", { name: "Send" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear all" })).toBeDisabled();
    expect(
        screen.getByRole("button", { name: "View transaction history" }),
    ).toBeDisabled();
});

it("blocks browser history navigation while confirmation owns the snapshot", async () => {
    const historyGo = jest
        .spyOn(window.history, "go")
        .mockImplementation(() => undefined);
    renderSend();
    await fillValidTransfer();

    act(() => {
        window.dispatchEvent(
            new PopStateEvent("popstate", { state: { idx: -1 } }),
        );
    });

    expect(historyGo).toHaveBeenCalled();
});

it("shows one insufficient-fee error when Max cannot send", async () => {
    mockUseGetBalanceQuery.mockReturnValue({
        currentData: "0",
        isFetching: false,
        isError: false,
    });
    renderSend();
    await userEvent.click(screen.getByRole("button", { name: "Max" }));

    expect(
        screen.getByText("Insufficient balance to cover the estimated fee."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toHaveValue("");
    expect(screen.getByLabelText("Amount")).toHaveAttribute(
        "aria-describedby",
        "send-amount-input-error",
    );
    expect(
        screen.queryByText("Amount must be greater than zero"),
    ).not.toBeInTheDocument();
});

it("hides stale spendable balance after a balance error", () => {
    mockUseGetBalanceQuery.mockReturnValue({
        currentData: "10",
        isFetching: false,
        isError: true,
    });
    renderSend();
    const source = screen.getByRole("region", { name: "Source account" });

    expect(within(source).getByText("--")).toBeInTheDocument();
    expect(within(source).queryByText(/10 ASI/)).not.toBeInTheDocument();
});

it("refreshes the displayed balance without submitting the form", async () => {
    renderSend();
    await userEvent.click(
        screen.getByRole("button", { name: "Refresh balance, Main account" }),
    );

    expect(mockRefetchBalance).toHaveBeenCalledTimes(1);
    expect(
        screen.queryByRole("dialog", { name: "Confirm transaction" }),
    ).not.toBeInTheDocument();
});

it("pastes clipboard text into the recipient and amount fields", async () => {
    const readText = jest
        .fn()
        .mockResolvedValueOnce(recipientAddress)
        .mockResolvedValueOnce("1.25");
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { readText },
    });
    renderSend();

    await userEvent.click(
        screen.getByRole("button", {
            name: "Paste recipient address or QR image",
        }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Paste amount" }));

    expect(screen.getByLabelText("Recipient Address")).toHaveValue(recipientAddress);
    expect(screen.getByLabelText("Amount")).toHaveValue("1.25");
    expect(readText).toHaveBeenCalledTimes(2);
});

it("pastes a QR image when clipboard text is unavailable", async () => {
    mockScanImage.mockResolvedValue({ data: recipientAddress });
    const read = jest.fn().mockResolvedValue([
        {
            types: ["image/png"],
            getType: jest.fn().mockResolvedValue(new Blob(["qr"], { type: "image/png" })),
        },
    ]);
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
            readText: jest.fn().mockRejectedValue(new Error("No text")),
            read,
        },
    });
    renderSend();

    await userEvent.click(
        screen.getByRole("button", {
            name: "Paste recipient address or QR image",
        }),
    );

    expect(await screen.findByDisplayValue(recipientAddress)).toBeInTheDocument();
    expect(mockScanImage).toHaveBeenCalledTimes(1);
});

it("keeps the fee total in confirmation and off the form", async () => {
    mockUseGetBalanceQuery.mockReturnValue({
        currentData: "90000000",
        isFetching: false,
        isError: false,
    });
    renderSend();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Recipient Address"), recipientAddress);
    await user.type(
        screen.getByLabelText("Amount"),
        "33557508.54740991",
    );

    expect(screen.queryByText(/33557508\.54990991/)).not.toBeInTheDocument();
    await user.click(
        screen.getByRole("button", { name: "Send" }),
    );
    const dialog = await screen.findByRole("dialog", {
        name: "Confirm transaction",
    });
    expect(mockRefetchBalance).not.toHaveBeenCalled();
    expect(
        within(dialog).getByText(/33557508\.54990991 ASI/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(sourceAddress)).toBeInTheDocument();
    expect(within(dialog).getByText(recipientAddress)).toBeInTheDocument();
    expect(within(dialog).getByText("Commission amount can be :")).toBeInTheDocument();
    expect(within(dialog).getByText("Total Cost:")).toBeInTheDocument();
});

it("supports keyboard submission in the mobile dark-theme layout", async () => {
    Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 375,
    });
    renderSend(darkTheme);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Recipient Address"), recipientAddress);
    await user.type(screen.getByLabelText("Amount"), "1");
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog", {
        name: "Confirm transaction",
    });
    expect(within(dialog).getByText("Commission amount can be :")).toBeInTheDocument();
    expect(within(dialog).getByText("Total Cost:")).toBeInTheDocument();
});
