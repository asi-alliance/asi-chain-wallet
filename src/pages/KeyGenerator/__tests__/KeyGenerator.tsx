import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { lightTheme, darkTheme } from "styles/theme";
import { KeyGenerator } from "../KeyGenerator";
import { generateKeyPair, importPrivateKey } from "utils/crypto";
import { ProtectedRoute } from "components/ProtectedRoute";

jest.mock("utils/crypto", () => ({
    generateKeyPair: jest.fn(),
    importPrivateKey: jest.fn(),
}));

const secret = "1".padStart(64, "0");
const pair = {
    privateKey: secret,
    publicKey: "04public",
    ethAddress: "0xabc123",
    revAddress: "ASI123",
};

const initialState = {
    auth: { isAuthenticated: true, activeSignerId: "signer-1" },
    walletsStore: {
        wallets: [{
            id: "wallet-1",
            signerId: "signer-1",
            isUnlocked: true,
            accounts: [],
        }],
    },
};

const makeStore = (authenticated = true, hasWallet = true) =>
    configureStore({
        reducer: (state = {
            ...initialState,
            auth: { ...initialState.auth, isAuthenticated: authenticated },
            walletsStore: {
                wallets: hasWallet ? initialState.walletsStore.wallets : [],
            },
        }, action: { type: string }) => {
            if (action.type === "lock") {
                return { ...state, auth: { ...state.auth, isAuthenticated: false } };
            }
            if (action.type === "unlock") {
                return { ...state, auth: { ...state.auth, isAuthenticated: true } };
            }
            if (action.type === "switch-wallet") {
                return {
                    ...state,
                    walletsStore: {
                        wallets: state.walletsStore.wallets.map((wallet) => ({
                            ...wallet, id: "wallet-2",
                        })),
                    },
                };
            }
            return state;
        },
    });

const renderPage = (theme = lightTheme) => {
    const store = makeStore();
    const view = render(
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={["/keys"]}>
                    <KeyGenerator />
                </MemoryRouter>
            </ThemeProvider>
        </Provider>,
    );
    return { store, ...view };
};

beforeEach(() => {
    (generateKeyPair as jest.Mock).mockReturnValue(pair);
    (importPrivateKey as jest.Mock).mockReturnValue(pair);
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
});

it.each([["light", lightTheme], ["dark", darkTheme]] as const)(
    "shows generated private key immediately with copy in %s",
    async (_mode, theme) => {
        const user = userEvent.setup();
        const clipboardWrite = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
        renderPage(theme);
        await user.click(screen.getByRole("button", { name: "Generate keypair" }));
        expect(await screen.findByText("Generated key details")).toBeInTheDocument();
        expect(screen.getByDisplayValue(secret)).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Copy private key" }));
        expect(clipboardWrite).toHaveBeenCalledWith(secret);
        await user.click(screen.getByRole("button", { name: "Copy public key" }));
        expect(clipboardWrite).toHaveBeenCalledWith(pair.publicKey);
        expect(screen.queryByRole("button", { name: /Reveal|export private key/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Close key details" })).not.toBeInTheDocument();
    },
);

it("uses the danger alert for a generate failure", async () => {
    const user = userEvent.setup();
    (generateKeyPair as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Internal crypto failure");
    });
    renderPage();
    await user.click(screen.getByRole("button", { name: "Generate keypair" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not prepare key details. Please try again.");
    expect(screen.queryByText("Generated key details")).not.toBeInTheDocument();
});

it("validates import and allows replacing a previous result", async () => {
    const user = userEvent.setup();
    renderPage();
    const field = screen.getByLabelText("Private key");
    const submit = screen.getByRole("button", { name: "Import private key" });
    await user.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent("64-character hexadecimal");
    expect(importPrivateKey).not.toHaveBeenCalled();

    await user.type(field, "0".repeat(64));
    await user.click(submit);
    expect(importPrivateKey).not.toHaveBeenCalled();

    await user.clear(field);
    await user.type(field, "0X" + secret);
    fireEvent.click(submit);
    fireEvent.click(submit);
    await waitFor(() => expect(importPrivateKey).toHaveBeenCalledTimes(1));
    expect(importPrivateKey).toHaveBeenCalledWith(secret);
    expect(await screen.findByText("Imported key details")).toBeInTheDocument();
    expect(screen.getByDisplayValue(secret)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Generate keypair" }));
    expect(await screen.findByText("Generated key details")).toBeInTheDocument();
    expect(screen.queryByText("Imported key details")).not.toBeInTheDocument();
    expect(generateKeyPair).toHaveBeenCalled();
});

it("removes key details when the wallet locks", async () => {
    const user = userEvent.setup();
    const { store } = renderPage();
    await user.click(screen.getByRole("button", { name: "Generate keypair" }));
    expect(await screen.findByDisplayValue(secret)).toBeInTheDocument();
    act(() => { store.dispatch({ type: "lock" }); });
    expect(screen.queryByDisplayValue(secret)).not.toBeInTheDocument();
});

it("clears key details when the active wallet changes", async () => {
    const user = userEvent.setup();
    const { store } = renderPage();
    await user.click(screen.getByRole("button", { name: "Generate keypair" }));
    expect(await screen.findByText("Generated key details")).toBeInTheDocument();
    act(() => { store.dispatch({ type: "switch-wallet" }); });
    expect(screen.queryByText("Generated key details")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue(secret)).not.toBeInTheDocument();
});

it("does not restore a pending generation after lock and unlock", async () => {
    const { store } = renderPage();
    let resolveGeneration!: (value: typeof pair) => void;
    (generateKeyPair as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => { resolveGeneration = resolve; }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Generate keypair" }));
    await waitFor(() => expect(generateKeyPair).toHaveBeenCalledTimes(1));
    act(() => { store.dispatch({ type: "lock" }); });
    act(() => { store.dispatch({ type: "unlock" }); });
    await act(async () => { resolveGeneration(pair); });
    expect(screen.queryByText("Generated key details")).not.toBeInTheDocument();
});

it.each([
    [false, true, "/login"],
    [false, false, "/accounts"],
    [true, true, "/keys"],
])("protects /keys for auth=%s wallet=%s", (authenticated, hasWallet, expectedPath) => {
    const store = makeStore(authenticated, hasWallet);
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/keys"]}>
                <Routes>
                    <Route path="/keys" element={<ProtectedRoute><div>Keys route</div></ProtectedRoute>} />
                    <Route path="/login" element={<div>Login route</div>} />
                    <Route path="/accounts" element={<div>Accounts route</div>} />
                </Routes>
            </MemoryRouter>
        </Provider>,
    );
    expect(screen.getByText(
        expectedPath === "/keys"
            ? "Keys route"
            : expectedPath === "/login"
                ? "Login route"
                : "Accounts route",
    )).toBeInTheDocument();
});
