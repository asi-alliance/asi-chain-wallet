import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { Address, WalletTypes } from "@asichain/asi-wallet-sdk";
import { Receive } from "pages/Receive/Receive";
import walletReducer from "store/WalletsStore";
import { walletsApi } from "store/WalletsStore/api";
import { selectAccount, selectNetwork } from "store/WalletsStore/thunks";
import authReducer from "store/Auth";
import networkOperationReducer from "store/networkOperationSlice";
import { SdkWalletService } from "sdk";
import { darkTheme, lightTheme } from "styles/theme";
import { Network } from "types/wallet";

jest.mock("qrcode.react", () => {
    const mockReact = jest.requireActual<typeof import("react")>("react");
    return {
        QRCodeCanvas: mockReact.forwardRef<
            HTMLCanvasElement,
            {
                value: string;
                style?: React.CSSProperties;
                "aria-label"?: string;
            }
        >(function MockQRCodeCanvas({ value, style, "aria-label": ariaLabel }, ref) {
            return (
                <canvas
                    ref={ref}
                    role="img"
                    aria-label={ariaLabel}
                    data-value={value}
                    style={style}
                />
            );
        }),
    };
});

const firstAddress =
    "1111111111111111111111111111111111111111111111111111" as Address;
const secondAddress =
    "1111222222222222222222222222222222222222222222222222" as Address;

const secondNetwork = (
    current: Network,
): Network => ({
    ...current,
    id: "network-2",
    name: "ASI Testnet",
    isDefault: false,
});

const createStore = (selectedAccountId: string | null = "account-1") => {
    const initialWalletState = walletReducer(undefined, { type: "init" });

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
                                address: firstAddress,
                                publicKey: "public-key",
                            },
                            {
                                id: "account-2",
                                name: "Second account",
                                index: 1,
                                address: secondAddress,
                                publicKey: "public-key-2",
                            },
                        ],
                    },
                ],
                selectedAccountId,
                networks: [
                    ...initialWalletState.networks.filter(
                        (network) => network.id !== "network-2",
                    ),
                    secondNetwork(initialWalletState.selectedNetwork),
                ],
                selectedNetwork: {
                    ...initialWalletState.selectedNetwork,
                    id: "network-1",
                    name: "ASI Mainnet",
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
    });
};

const renderReceive = (
    theme: typeof lightTheme = lightTheme,
    selectedAccountId: string | null = "account-1",
) => {
    const view = createStore(selectedAccountId);
    render(
        <Provider store={view}>
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={["/receive"]}>
                    <Routes>
                        <Route path="/receive" element={<Receive />} />
                        <Route path="/accounts" element={<div>Accounts route</div>} />
                        <Route path="/history" element={<div>History route</div>} />
                    </Routes>
                </MemoryRouter>
            </ThemeProvider>
        </Provider>,
    );
    return view;
};

const qrValue = (): string => {
    const qr = screen.getByRole("img", { name: /QR code for/i, hidden: true });
    return qr.getAttribute("data-value") ?? "";
};

const switchAccount = async (name: string): Promise<void> => {
    await userEvent.click(screen.getByRole("combobox", { name: "Account" }));
    await userEvent.click(screen.getByRole("option", { name }));
};

const writeText = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: 1440,
    });
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
    });
    jest.spyOn(SdkWalletService, "setNetwork").mockImplementation(() => undefined);
    jest.spyOn(SdkWalletService, "getAvailableBalance").mockResolvedValue("10000");
});

afterEach(() => {
    jest.restoreAllMocks();
});

const viewports = [
    ["desktop", 1440],
    ["mobile", 390],
    ["minimum mobile", 320],
] as const;

const themes = [
    ["light", lightTheme],
    ["dark", darkTheme],
] as const;

describe.each(viewports)("Receive on %s", (_viewport, width) => {
    describe.each(themes)("%s theme", (_themeName, theme) => {
        beforeEach(() => {
            window.innerWidth = width;
        });

        it("shows the account address in the text, QR, and copy value", async () => {
            renderReceive(theme);

            expect(screen.getByRole("combobox", { name: "Account" })).toHaveTextContent(
                "Main account",
            );
            expect(screen.getByText("ASI Mainnet")).toHaveTextContent("ASI Mainnet");
            expect(screen.getByLabelText("ASI Address")).toHaveValue(firstAddress);
            expect(qrValue()).toBe(firstAddress);
            expect(screen.getByRole("img", { name: /QR code for/i, hidden: true })).toHaveStyle({
                width: "100%",
                height: "auto",
                minWidth: "0",
            });

            await userEvent.click(
                screen.getByRole("button", { name: "Copy ASI Address", exact: true }),
            );

            await waitFor(() =>
                expect(writeText).toHaveBeenCalledWith(firstAddress),
            );
            await waitFor(() =>
                expect(screen.getByRole("status")).toHaveTextContent("Copied"),
            );
        });

        it("updates the address, QR, and copy value when the account changes", async () => {
            renderReceive(theme);
            await userEvent.click(
                screen.getByRole("button", { name: "Copy ASI Address", exact: true }),
            );
            await waitFor(() =>
                expect(screen.getByRole("status")).toHaveTextContent("Copied"),
            );

            await switchAccount("Second account");

            expect(screen.getByLabelText("ASI Address")).toHaveValue(secondAddress);
            expect(qrValue()).toBe(secondAddress);
            expect(screen.getByRole("status")).not.toHaveTextContent("Copied");

            await userEvent.click(
                screen.getByRole("button", { name: "Copy ASI Address", exact: true }),
            );

            await waitFor(() =>
                expect(writeText).toHaveBeenLastCalledWith(secondAddress),
            );
        });

        it("keeps the same address when the network changes", async () => {
            const view = renderReceive(theme);

            await act(async () => {
                await view.dispatch(selectNetwork({ id: "network-2" }));
            });

            expect(screen.getByText("ASI Testnet")).toHaveTextContent("ASI Testnet");
            expect(screen.getByLabelText("ASI Address")).toHaveValue(firstAddress);
            expect(qrValue()).toBe(firstAddress);

            await userEvent.click(
                screen.getByRole("button", { name: "Copy ASI Address", exact: true }),
            );
            await waitFor(() =>
                expect(writeText).toHaveBeenCalledWith(firstAddress),
            );
        });

        it("copies the shown address from the keyboard and ignores a second click", async () => {
            let resolveCopy: (() => void) | undefined;
            writeText.mockImplementation(
                () =>
                    new Promise<void>((resolve) => {
                        resolveCopy = resolve;
                    }),
            );
            renderReceive(theme);

            const button = screen.getByRole("button", { name: "Copy ASI Address", exact: true });
            button.focus();
            expect(button).toHaveFocus();
            await userEvent.keyboard("{Enter}");
            expect(button).toHaveAttribute("aria-busy", "true");

            fireEvent.click(button);
            expect(writeText).toHaveBeenCalledTimes(1);

            resolveCopy?.();
            await waitFor(() =>
                expect(screen.getByRole("status")).toHaveTextContent("Copied"),
            );
            expect(writeText).toHaveBeenCalledWith(firstAddress);
        });
    });
});

it("ignores a second copy before the loading state renders", async () => {
    renderReceive();
    const button = screen.getByRole("button", { name: "Copy ASI Address", exact: true });

    fireEvent.click(button);
    fireEvent.click(button);
    await act(async () => {
        await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(firstAddress);
});

it("copies with Space and keeps the loading button from submitting again", async () => {
    let resolveCopy: (() => void) | undefined;
    writeText.mockImplementation(
        () =>
            new Promise<void>((resolve) => {
                resolveCopy = resolve;
            }),
    );
    renderReceive();

    screen.getByRole("button", { name: "Copy ASI Address", exact: true }).focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard(" ");
    expect(writeText).toHaveBeenCalledTimes(1);

    await act(async () => resolveCopy?.());
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
});

it("clears a previous confirmation while a new copy is pending", async () => {
    let rejectCopy: (() => void) | undefined;
    writeText
        .mockResolvedValueOnce(undefined)
        .mockImplementationOnce(
            () =>
                new Promise<void>((_resolve, reject) => {
                    rejectCopy = () => reject(new Error("clipboard failed"));
                }),
        );
    renderReceive();

    await userEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    expect(screen.getByRole("status")).toHaveTextContent("Copied");

    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("button", { name: "Copy ASI Address", exact: true })).toHaveAttribute(
        "aria-busy",
        "true",
    );
    await waitFor(() => expect(rejectCopy).toEqual(expect.any(Function)));

    await act(async () => rejectCopy?.());
    expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not copy the address.",
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

it("starts a fresh confirmation timer after each successful copy", async () => {
    jest.useFakeTimers();
    try {
        renderReceive();
        const button = screen.getByRole("button", { name: "Copy ASI Address", exact: true });

        fireEvent.click(button);
        await act(async () => {
            await Promise.resolve();
        });
        expect(screen.getByRole("status")).toHaveTextContent("Copied");

        act(() => jest.advanceTimersByTime(1500));
        fireEvent.click(button);
        await act(async () => {
            await Promise.resolve();
        });

        act(() => jest.advanceTimersByTime(600));
        expect(screen.getByRole("status")).toHaveTextContent("Copied");

        act(() => jest.advanceTimersByTime(1400));
        expect(screen.getByRole("status")).toBeEmptyDOMElement();
    } finally {
        jest.useRealTimers();
    }
});

it("drops an in-flight copy when the account changes", async () => {
    let resolveCopy: (() => void) | undefined;
    let rejectCopy: ((error: Error) => void) | undefined;
    writeText.mockImplementation(
        () =>
            new Promise<void>((resolve, reject) => {
                resolveCopy = resolve;
                rejectCopy = reject;
            }),
    );
    renderReceive();

    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    expect(screen.getByRole("button", { name: "Copy ASI Address", exact: true })).toHaveAttribute(
        "aria-busy",
        "true",
    );

    await switchAccount("Second account");

    const button = screen.getByRole("button", { name: "Copy ASI Address", exact: true });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy", "true");

    await act(async () => {
        rejectCopy?.(new Error("clipboard failed"));
        resolveCopy?.();
    });

    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    expect(screen.getByRole("status")).not.toHaveTextContent("Copied");
    expect(screen.getByLabelText("ASI Address")).toHaveValue(secondAddress);
});

it("repairs the clipboard when an older copy finishes after the new one", async () => {
    const pending: Array<() => void> = [];
    let clipboardValue = "";
    writeText.mockImplementation(
        (value: string) =>
            new Promise<void>((resolve) => {
                pending.push(() => {
                    clipboardValue = value;
                    resolve();
                });
            }),
    );
    renderReceive();

    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    await switchAccount("Second account");
    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));

    await act(async () => pending[1]());
    await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Copied"),
    );
    expect(clipboardValue).toBe(secondAddress);

    await act(async () => pending[0]());
    expect(clipboardValue).toBe(firstAddress);
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(3));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await act(async () => pending[2]());

    expect(clipboardValue).toBe(secondAddress);
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    expect(writeText).toHaveBeenNthCalledWith(1, firstAddress);
    expect(writeText).toHaveBeenLastCalledWith(secondAddress);
});

it("withdraws Copied when a stale write cannot be repaired", async () => {
    const pending: Array<{ resolve: () => void; reject: () => void }> = [];
    writeText.mockImplementation(
        () =>
            new Promise<void>((resolve, reject) => {
                pending.push({
                    resolve,
                    reject: () => reject(new Error("clipboard failed")),
                });
            }),
    );
    renderReceive();

    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    await switchAccount("Second account");
    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));

    await act(async () => pending[1].resolve());
    expect(screen.getByRole("status")).toHaveTextContent("Copied");

    await act(async () => pending[0].resolve());
    expect(writeText).toHaveBeenCalledTimes(3);
    await act(async () => pending[2].reject());

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not copy the address.",
    );
});

it("serializes repairs after several account changes", async () => {
    const pending: Array<{ resolve: () => void; reject: () => void }> = [];
    writeText.mockImplementation(
        () =>
            new Promise<void>((resolve, reject) => {
                pending.push({
                    resolve,
                    reject: () => reject(new Error("clipboard failed")),
                });
            }),
    );
    renderReceive();

    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    await switchAccount("Second account");
    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    await switchAccount("Main account");
    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    expect(writeText).toHaveBeenCalledTimes(3);

    await act(async () => pending[2].resolve());
    await act(async () => pending[0].resolve());
    expect(writeText).toHaveBeenCalledTimes(4);
    await act(async () => pending[1].resolve());
    expect(writeText).toHaveBeenCalledTimes(4);

    await act(async () => pending[3].reject());
    expect(writeText).toHaveBeenCalledTimes(5);
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    await act(async () => pending[4].resolve());

    expect(screen.getByRole("status")).toHaveTextContent("Copied");
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    expect(writeText).toHaveBeenLastCalledWith(firstAddress);
});

it("lets the new account copy while the old copy is still pending", async () => {
    const pending: Array<{ resolve: () => void; reject: () => void }> = [];
    writeText.mockImplementation(
        () =>
            new Promise<void>((resolve, reject) => {
                pending.push({
                    resolve,
                    reject: () => reject(new Error("clipboard failed")),
                });
            }),
    );
    renderReceive();

    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    await switchAccount("Second account");
    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText).toHaveBeenNthCalledWith(1, firstAddress);
    expect(writeText).toHaveBeenNthCalledWith(2, secondAddress);
    expect(screen.getByRole("button", { name: "Copy ASI Address", exact: true })).toHaveAttribute(
        "aria-busy",
        "true",
    );

    await act(async () => pending[0].resolve());
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("button", { name: "Copy ASI Address", exact: true })).toHaveAttribute(
        "aria-busy",
        "true",
    );

    await act(async () => pending[1].reject());
    expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not copy the address.",
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

it("clears copy feedback on a network change and ignores the old completion", async () => {
    let resolveCopy: (() => void) | undefined;
    writeText.mockImplementationOnce(
        () =>
            new Promise<void>((resolve) => {
                resolveCopy = resolve;
            }),
    );
    const view = renderReceive();

    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    await act(async () => {
        await view.dispatch(selectNetwork({ id: "network-2" }));
    });
    expect(screen.getByRole("button", { name: "Copy ASI Address", exact: true })).toBeEnabled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    await act(async () => resolveCopy?.());
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByText("ASI Testnet")).toHaveTextContent("ASI Testnet");
});

it("updates all address representations after the shared active account changes", async () => {
    const view = renderReceive();

    await act(async () => {
        await view.dispatch(selectAccount("account-2"));
    });

    expect(screen.getByRole("combobox", { name: "Account" })).toHaveTextContent(
        "Second account",
    );
    expect(screen.getByLabelText("ASI Address")).toHaveValue(secondAddress);
    expect(qrValue()).toBe(secondAddress);
    fireEvent.click(screen.getByRole("button", { name: "Copy ASI Address", exact: true }));
    expect(writeText).toHaveBeenCalledWith(secondAddress);
});

it("keeps the Accounts navigation in the empty state", async () => {
    renderReceive(lightTheme, null);

    expect(screen.getByText("Please select an account first.")).toBeVisible();
    expect(screen.queryByRole("combobox", { name: "Account" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Select Account" }));
    expect(screen.getByText("Accounts route")).toBeVisible();
});

it("restores the Current receive content and copies from the address field", async () => {
    renderReceive();

    expect(screen.getByRole("heading", { name: "Receive Tokens" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Address Format" })).toHaveTextContent("ASI");
    expect(screen.getByRole("button", { name: "Refresh balance, Main account" })).toBeVisible();
    expect(screen.getByLabelText("ASI Address")).toHaveValue(firstAddress);
    expect(screen.getByText(/Tip: Copy a QR code image/)).toBeVisible();
    expect(screen.getByText("Important")).toBeVisible();
    expect(screen.queryByText(/ETH address is for compatibility/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download QR" })).toBeVisible();
    expect(screen.getByRole("button", { name: "View transaction history" })).toBeVisible();

    await userEvent.click(
        screen.getByRole("button", { name: "Copy ASI Address from field" }),
    );
    expect(writeText).toHaveBeenCalledWith(firstAddress);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copied"));
});

it("refreshes the balance and preserves the history destination", async () => {
    renderReceive();
    const getBalance = jest.mocked(SdkWalletService.getAvailableBalance);
    await waitFor(() => expect(getBalance).toHaveBeenCalledTimes(1));

    await userEvent.click(
        screen.getByRole("button", { name: "Refresh balance, Main account" }),
    );
    await waitFor(() => expect(getBalance).toHaveBeenCalledTimes(2));

    await userEvent.click(
        screen.getByRole("button", { name: "View transaction history" }),
    );
    expect(screen.getByText("History route")).toBeVisible();
});

it("keeps the QR inline on mobile and downloads the receive QR canvas", async () => {
    window.innerWidth = 390;
    const toDataURL = jest
        .spyOn(HTMLCanvasElement.prototype, "toDataURL")
        .mockReturnValue("data:image/png;base64,qr");
    const clickLink = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation();
    renderReceive();

    expect(screen.getByRole("button", { name: "Show QR Code" })).toBeVisible();
    expect(screen.queryByRole("img", { name: /QR code for/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show QR Code" }));
    expect(screen.getByRole("button", { name: "Hide QR Code" })).toBeVisible();
    expect(screen.getByRole("img", { name: /QR code for/i })).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Hide QR Code" }));
    expect(screen.getByRole("button", { name: "Show QR Code" })).toBeVisible();
    expect(screen.queryByRole("img", { name: /QR code for/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Download QR" }));
    expect(toDataURL).toHaveBeenCalledWith("image/png");
    expect(clickLink).toHaveBeenCalledTimes(1);
    expect(clickLink.mock.instances[0]).toHaveProperty(
        "download",
        "asi-address-address-qr.png",
    );
    expect(clickLink.mock.instances[0]).toHaveProperty(
        "href",
        "data:image/png;base64,qr",
    );

    await userEvent.click(screen.getByRole("button", { name: "Show QR Code" }));
    expect(qrValue()).toBe(firstAddress);
});
