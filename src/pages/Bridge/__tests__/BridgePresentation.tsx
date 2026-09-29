import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { Bridge } from "pages/Bridge/Bridge";
import { lightTheme } from "styles/theme";

const mockBalanceQuery = jest.fn();
const mockConfirmationModal = jest.fn((_props: Record<string, unknown>) => null);
const mockActiveWallet = { id: "wallet-1" };
const mockSelectedAccount = {
    id: "account-1",
    name: "Main account",
    address: "1111111111111111111111111111111111111111111111111111",
};
const recipientAddress = "0x1234567890123456789012345678901234567890";
let mockDestinationAddress: string | undefined = recipientAddress;

jest.mock("components", () => ({
    ...jest.requireActual("components/Card"),
    ...jest.requireActual("components/Button"),
    ...jest.requireActual("components/Input"),
    TransactionConfirmationModal: (props: Record<string, unknown>) =>
        mockConfirmationModal(props),
    PasswordModal: () => null,
}));

jest.mock("components/BridgeWalletSelector", () => ({
    ASIWalletSection: () => <div>Source account</div>,
    BridgeWalletSelector: () => <div>Destination wallet</div>,
}));

jest.mock("store/WalletsStore", () => ({
    selectActiveWallet: () => mockActiveWallet,
    selectSelectedAccount: () => mockSelectedAccount,
}));

jest.mock("store/WalletsStore/api", () => ({
    useGetBalanceQuery: (...args: unknown[]) => mockBalanceQuery(...args),
}));

jest.mock("store/WalletsStore/thunks", () => ({ bridgeLock: jest.fn() }));

jest.mock("hooks", () => ({
    useWalletSessionAction: () => ({
        isRunning: false,
        run: jest.fn(),
        passwordPrompt: {
            isOpen: false,
            loading: false,
            error: "",
            onConfirm: jest.fn(),
            onClose: jest.fn(),
        },
    }),
}));

jest.mock("hooks/useCardanoWallet", () => ({
    useCardanoWallet: () => ({ session: { account: null } }),
}));

jest.mock("hooks/useCosmosWallet", () => ({
    useCosmosWallet: () => ({ session: { account: null } }),
}));

jest.mock("hooks/useEvmBridge", () => ({
    useEvmBridge: (_chain: unknown, isDestination: boolean) => ({
        session: {
            connected: isDestination && Boolean(mockDestinationAddress),
            account: isDestination && mockDestinationAddress
                ? { id: "evm-1", address: mockDestinationAddress }
                : null,
        },
        isSuccess: false,
        isPending: false,
        isConfirming: false,
        lastAction: null,
        wrongNetwork: false,
        reset: jest.fn(),
        refetch: jest.fn(),
        resetIfCurrent: jest.fn(),
    }),
}));

jest.mock("sdk", () => ({
    SdkWalletService: {
        toAtomicAmount: (value: string) => {
            if (!/^\d+(?:\.\d{1,8})?$/.test(value)) {
                throw new Error("Invalid amount");
            }
            const [whole, fraction = ""] = value.split(".");
            return BigInt(whole) * 100000000n + BigInt(fraction.padEnd(8, "0"));
        },
    },
}));

const renderBridge = () => {
    const store = configureStore({
        reducer: () => ({ walletsStore: { selectedNetwork: { id: "network-1" } } }),
    });
    const ui = () => (
        <Provider store={store}>
            <ThemeProvider theme={lightTheme}>
                <MemoryRouter initialEntries={["/bridge"]}>
                    <Bridge />
                </MemoryRouter>
            </ThemeProvider>
        </Provider>
    );
    const { rerender } = render(ui());
    return { rerenderBridge: () => rerender(ui()) };
};

beforeEach(() => {
    mockConfirmationModal.mockClear();
    mockDestinationAddress = recipientAddress;
    mockBalanceQuery.mockReturnValue({
        currentData: "10.00000000",
        isFetching: false,
        isError: false,
    });
});

afterEach(() => mockBalanceQuery.mockReset());

it("keeps balance loading and failure separate from Amount validation", () => {
    const { rerenderBridge } = renderBridge();
    const amount = screen.getByRole("spinbutton", { name: "Amount" });
    fireEvent.change(amount, { target: { value: "1" } });

    mockBalanceQuery.mockReturnValue({
        currentData: undefined,
        isFetching: true,
        isError: false,
    });
    rerenderBridge();
    expect(amount).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Balance is still loading");

    mockBalanceQuery.mockReturnValue({
        currentData: undefined,
        isFetching: false,
        isError: true,
    });
    rerenderBridge();
    expect(amount).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load balance");
});

it("links the helper and validation errors to Amount", () => {
    renderBridge();
    const amount = screen.getByRole("spinbutton", { name: "Amount" });
    expect(amount).toHaveAccessibleDescription("8 decimal places (1 ASI = 1.00000000)");

    fireEvent.change(amount, { target: { value: "0" } });
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveAccessibleDescription("Amount must be greater than zero");

    fireEvent.change(amount, { target: { value: "1.123456789" } });
    expect(amount).toHaveAccessibleDescription("Amount supports up to 8 decimal places");
});

it("copies the EVM recipient and links to its configured explorer", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
    });
    renderBridge();
    const recipient = screen.getByRole("textbox", {
        name: "ETH recipient address (0x...)",
    });
    expect(recipient).toHaveValue(recipientAddress);
    expect(recipient).toHaveAttribute("readonly");
    const copyAddress = screen.getByRole("button", { name: "Copy address" });
    expect(copyAddress).toBeEnabled();
    fireEvent.click(copyAddress);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(recipientAddress));
    expect(
        screen.getByRole("link", { name: "View recipient in Sepolia explorer" }),
    ).toHaveAttribute(
        "href",
        `https://sepolia.etherscan.io/address/${recipientAddress}`,
    );
});

it("shows only the recipient for a connected destination", async () => {
    const user = userEvent.setup();
    renderBridge();

    const destination = screen.getByRole("combobox", { name: "Destination" });
    expect(screen.queryByText("Destination wallet")).not.toBeInTheDocument();

    await user.click(destination);
    await user.click(screen.getByRole("option", { name: "Base Sepolia" }));
    expect(screen.queryByText("Destination wallet")).not.toBeInTheDocument();
    expect(destination).toHaveTextContent("Base Sepolia");
    expect(
        screen.queryByRole("region", { name: "Bridge summary" }),
    ).not.toBeInTheDocument();
});

it("reaches the recipient copy action with the keyboard", async () => {
    const user = userEvent.setup();
    renderBridge();
    screen.getByRole("textbox", { name: "ETH recipient address (0x...)" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Copy address" })).toHaveFocus();
});

it("hides the explorer action until a valid recipient is available", () => {
    mockDestinationAddress = undefined;
    const { rerenderBridge } = renderBridge();
    expect(screen.getByText("Destination wallet")).toBeInTheDocument();
    expect(
        screen.queryByRole("link", { name: "View recipient in Sepolia explorer" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy address" })).toBeDisabled();

    mockDestinationAddress = "invalid-address";
    rerenderBridge();
    expect(
        screen.queryByRole("link", { name: "View recipient in Sepolia explorer" }),
    ).not.toBeInTheDocument();
});

it("uses the fee and total labels in the confirmation details", () => {
    renderBridge();
    expect(mockConfirmationModal).toHaveBeenCalledWith(
        expect.objectContaining({
            feeDetailLabel: "Estimated maximum fee",
            totalLabel: "Maximum total",
        }),
    );
});
