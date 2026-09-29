import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { DEFAULT_NODE_API_PROFILE } from "@asichain/asi-wallet-sdk";
import walletReducer from "store/WalletsStore";
import authReducer from "store/Auth";
import { selectNetwork } from "store/WalletsStore/thunks";
import { Layout } from "components/Layout/Layout";
import { lightTheme } from "styles/theme";
import { Network } from "types/wallet";

jest.mock("components/Layout/HeaderBar", () => ({
    HeaderBar: () => null,
}));

jest.mock("components/Layout/DesktopNavComponent", () => ({
    DesktopNavComponent: ({ networkStatus }: { networkStatus: string }) => (
        <span data-testid="network-status">{networkStatus}</span>
    ),
}));

jest.mock("components/Layout/MobileNavDrawerComponent", () => ({
    MobileNavDrawerComponent: () => null,
}));

jest.mock("components/Layout/useNavItems", () => ({
    useNavItems: () => [],
}));

const makeNetwork = (id: string, observerUrl: string): Network => ({
    id,
    name: id,
    validatorUrl: `https://${id}.validator.example`,
    observerUrl,
    indexerUrl: `https://${id}.indexer.example`,
    nodeApiProfile: DEFAULT_NODE_API_PROFILE,
    isDefault: true,
});

it("keeps the selected network status when an earlier check finishes late", async () => {
    const mainnet = makeNetwork("mainnet", "https://mainnet.example");
    const testnet = makeNetwork("testnet", "https://testnet.example");
    const initialState = walletReducer(undefined, { type: "init" });
    const store = configureStore({
        reducer: { walletsStore: walletReducer, auth: authReducer },
        preloadedState: {
            walletsStore: {
                ...initialState,
                networks: [mainnet, testnet],
                selectedNetwork: mainnet,
            },
            auth: authReducer(undefined, { type: "init" }),
        },
    });
    const checks = new Map<string, (response: { ok: boolean }) => void>();
    const originalFetch = global.fetch;
    const originalTimeout = AbortSignal.timeout;
    Object.defineProperty(AbortSignal, "timeout", {
        configurable: true,
        value: () => new AbortController().signal,
    });
    global.fetch = jest.fn(
        (url: RequestInfo | URL) =>
            new Promise<Response>((resolve) => {
                checks.set(String(url), resolve as (response: { ok: boolean }) => void);
            }),
    );
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    });

    try {
        render(
            <Provider store={store}>
                <ThemeProvider theme={lightTheme}>
                    <MemoryRouter>
                        <Layout>Content</Layout>
                    </MemoryRouter>
                </ThemeProvider>
            </Provider>,
        );

        await waitFor(() =>
            expect(checks.has("https://mainnet.example/api/status")).toBe(true),
        );

        act(() => {
            store.dispatch(selectNetwork.fulfilled(testnet, "switch", { id: "testnet" }));
        });

        await waitFor(() =>
            expect(checks.has("https://testnet.example/api/status")).toBe(true),
        );

        await act(async () => {
            checks.get("https://testnet.example/api/status")?.({ ok: true });
        });
        expect(screen.getByTestId("network-status")).toHaveTextContent("connected");

        await act(async () => {
            checks.get("https://mainnet.example/api/status")?.({ ok: false });
        });
        expect(screen.getByTestId("network-status")).toHaveTextContent("connected");
    } finally {
        global.fetch = originalFetch;
        Object.defineProperty(AbortSignal, "timeout", {
            configurable: true,
            value: originalTimeout,
        });
        window.matchMedia = originalMatchMedia;
    }
});
