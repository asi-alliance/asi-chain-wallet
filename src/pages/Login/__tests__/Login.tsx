import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { loginWithPassword } from "store/Auth/thunks";
import { getRateLimitInfo } from "services/loginRateLimit";
import { analyzeRecentActivity } from "services/loginAuditLog";
import { darkTheme, lightTheme } from "styles/theme";
import { Login } from "../Login";

jest.mock("react-redux", () => ({
    useDispatch: jest.fn(),
    useSelector: jest.fn(),
}));
jest.mock("@asichain/asi-wallet-sdk", () => ({
    WalletTypes: { PRIVATE_KEY: "private-key" },
}));
jest.mock("store/WalletsStore", () => ({
    selectWallets: (state: typeof state) => state.walletsStore.wallets,
    selectHasWallets: (state: typeof state) => state.walletsStore.wallets.length > 0,
    selectWalletByFilter: (state: typeof state, filter: (wallet: typeof wallet) => boolean) =>
        state.walletsStore.wallets.find(filter) ?? null,
}));
jest.mock("components", () => ({
    ...jest.requireActual("components/Card/Card"),
    ...jest.requireActual("components/Button/Button"),
    ...jest.requireActual("components/PasswordInput"),
}));
jest.mock("components/CreateHdWalletModal", () => ({
    CreateHdWalletModal: () => null,
}));
jest.mock("components/CreatePkWalletModal", () => ({
    CreatePkWalletModal: () => null,
}));
jest.mock("components/ImportHdWalletModal", () => ({
    ImportHdWalletModal: () => null,
}));
jest.mock("components/ImportPkWalletModal", () => ({
    ImportPkWalletModal: () => null,
}));
jest.mock("components/ImportKeyfileWalletModal", () => ({
    ImportKeyfileWalletModal: () => null,
}));
jest.mock("store/Auth/thunks", () => ({ loginWithPassword: jest.fn() }));
jest.mock("services/loginRateLimit", () => ({
    buildContextKey: (id?: string) => id ?? "__all_accounts__",
    getRateLimitInfo: jest.fn(),
    formatLockoutMessage: () => "Too many failed attempts. Please try again later.",
}));
jest.mock("services/loginAuditLog", () => ({
    analyzeRecentActivity: jest.fn(),
}));
jest.mock("hooks/", () => ({
    useScreen: () => ({ isLaptop: globalThis.innerWidth <= 768 }),
}));

const wallet = { signerId: "wallet-1", type: "hd", accounts: [] };
const state = {
    auth: { isLoading: false },
    walletsStore: { wallets: [wallet] },
};
const dispatch = jest.fn();
const rateLimit = getRateLimitInfo as jest.Mock;
const activity = analyzeRecentActivity as jest.Mock;
const viewportsAndThemes: Array<[boolean, boolean]> = [
    [false, false],
    [false, true],
    [true, false],
    [true, true],
];

function renderLogin({
    mobile = false,
    dark = false,
    wallets = [wallet],
}: {
    mobile?: boolean;
    dark?: boolean;
    wallets?: typeof wallet[];
} = {}) {
    window.innerWidth = mobile ? 375 : 1440;
    state.walletsStore.wallets = wallets;
    return render(
        <ThemeProvider theme={dark ? darkTheme : lightTheme}>
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/accounts" element={<div>Accounts page</div>} />
                    <Route path="/" element={<div>Wallet page</div>} />
                </Routes>
            </MemoryRouter>
        </ThemeProvider>,
    );
}

beforeEach(() => {
    jest.clearAllMocks();
    state.auth.isLoading = false;
    (useSelector as unknown as jest.Mock).mockImplementation((selector) =>
        selector(state),
    );
    (useDispatch as unknown as jest.Mock).mockReturnValue(dispatch);
    (loginWithPassword as unknown as jest.Mock).mockImplementation((payload) =>
        payload,
    );
    rateLimit.mockResolvedValue({
        locked: false,
        remainingMs: 0,
        failedAttempts: 0,
        maxAttempts: 5,
    });
    activity.mockResolvedValue({ showSecurityWarning: false });
});

test.each(viewportsAndThemes)("unlock states render on mobile=%s dark=%s", async (mobile, dark) => {
    renderLogin({ mobile, dark });
    expect(screen.getByRole("heading", { name: "Unlock Wallet" })).toBeTruthy();
    const password = screen.getByLabelText("Password");
    expect(password).toBeTruthy();
    expect((screen.getByRole("button", { name: "Unlock" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Show password" })).toBeTruthy();
    await waitFor(() => expect(rateLimit).toHaveBeenCalledWith("wallet-1"));
});

test.each(viewportsAndThemes)("empty workspace redirects on mobile=%s dark=%s", (mobile, dark) => {
    renderLogin({ mobile, dark, wallets: [] });
    expect(screen.getByText("Accounts page")).toBeTruthy();
});

test.each(viewportsAndThemes)("switching wallets clears credentials on mobile=%s dark=%s", async (mobile, dark) => {
    renderLogin({
        mobile,
        dark,
        wallets: [wallet, { ...wallet, signerId: "wallet-2" }],
    });
    const user = userEvent.setup();
    await waitFor(() => expect(rateLimit).toHaveBeenCalledWith("wallet-1"));
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("combobox", { name: "Select Wallet" }));
    await user.click(screen.getByRole("option", { name: "Wallet 2" }));
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
    await waitFor(() => expect(rateLimit).toHaveBeenCalledWith("wallet-2"));
});

test.each(viewportsAndThemes)(
    "defaults to the first HD wallet when a private-key wallet was stored first on mobile=%s dark=%s",
    async (mobile, dark) => {
        renderLogin({
            mobile,
            dark,
            wallets: [
                { signerId: "pk-first", type: "private-key", accounts: [] },
                { signerId: "hd-second", type: "hd", accounts: [] },
            ],
        });
        await waitFor(() =>
            expect(rateLimit).toHaveBeenCalledWith("hd-second"),
        );
        expect(
            (screen.getByRole("combobox", { name: "Select Wallet" }) as HTMLElement)
                .textContent,
        ).toContain("Wallet 1");
        expect(rateLimit).not.toHaveBeenCalledWith("pk-first");
    },
);

test.each(viewportsAndThemes.flatMap(([mobile, dark]) => [
    [mobile, dark, "Wrong password for wallet-1"],
    [mobile, dark, "Account wallet-1 does not exist"],
]))("a failed unlock hides the SDK error on mobile=%s dark=%s: %s", async (mobile, dark, sdkMessage) => {
    dispatch.mockReturnValue({
        unwrap: () => Promise.reject(new Error(sdkMessage)),
    });
    renderLogin({ mobile: Boolean(mobile), dark: Boolean(dark) });
    fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toBe("Unable to unlock. Check your password and try again.");
    expect(document.body.textContent).not.toContain(sdkMessage);
    expect(screen.getByLabelText("Password").getAttribute("aria-describedby")).toContain("login-password-input-error");
    fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "corrected" },
    });
    expect(screen.queryByRole("alert")).toBeNull();
});

test.each(viewportsAndThemes)("network unlock failures stay off the password wording on mobile=%s dark=%s", async (mobile, dark) => {
    dispatch.mockReturnValue({
        // RTK unwrap() rejects SerializedError, not Error instances.
        unwrap: () =>
            Promise.reject({ name: "TypeError", message: "Failed to fetch" }),
    });
    renderLogin({ mobile, dark });
    fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toBe(
        "Unable to unlock. Check your connection and try again.",
    );
    expect(error.textContent?.toLowerCase()).not.toContain("password");
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).not.toBe(
        "true",
    );
});

test.each(viewportsAndThemes)("timeout unlock failures stay off the password wording on mobile=%s dark=%s", async (mobile, dark) => {
    dispatch.mockReturnValue({
        unwrap: () =>
            Promise.reject({
                name: "TimeoutError",
                message: "The operation was aborted due to timeout",
            }),
    });
    renderLogin({ mobile, dark });
    fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toBe(
        "Unable to unlock. The request timed out. Please try again.",
    );
    expect(error.textContent?.toLowerCase()).not.toContain("password");
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).not.toBe(
        "true",
    );
});

test.each(viewportsAndThemes)("cancelled unlock failures stay off the password wording on mobile=%s dark=%s", async (mobile, dark) => {
    dispatch.mockReturnValue({
        unwrap: () =>
            Promise.reject({
                name: "AbortError",
                message: "The operation was aborted",
            }),
    });
    renderLogin({ mobile, dark });
    fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toBe(
        "Unable to unlock. The request was cancelled. Please try again.",
    );
    expect(error.textContent?.toLowerCase()).not.toContain("password");
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).not.toBe(
        "true",
    );
});

test.each(viewportsAndThemes)("rate-limited unlock keeps messaging on the lockout banner on mobile=%s dark=%s", async (mobile, dark) => {
    rateLimit
        .mockResolvedValueOnce({
            locked: false,
            remainingMs: 0,
            failedAttempts: 0,
            maxAttempts: 5,
        })
        .mockResolvedValue({
            locked: true,
            remainingMs: 60_000,
            failedAttempts: 5,
            maxAttempts: 5,
        });
    dispatch.mockReturnValue({
        unwrap: () =>
            Promise.reject({
                name: "Error",
                message:
                    "Too many failed attempts. Please try again in about a minute.",
            }),
    });
    renderLogin({ mobile, dark });
    await waitFor(() => expect(rateLimit).toHaveBeenCalledWith("wallet-1"));
    fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    await screen.findByText(/Too many failed attempts/);
    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByRole("button", { name: "Locked" }) as HTMLButtonElement).disabled).toBe(true);
});

test.each(viewportsAndThemes)("unlock error survives failed rate-limit refresh on mobile=%s dark=%s", async (mobile, dark) => {
    rateLimit
        .mockResolvedValueOnce({
            locked: false,
            remainingMs: 0,
            failedAttempts: 0,
            maxAttempts: 5,
        })
        .mockRejectedValueOnce(new Error("rate limit store unavailable"));
    dispatch.mockReturnValue({
        unwrap: () =>
            Promise.reject({
                name: "Error",
                message: "Wrong password for wallet-1",
            }),
    });
    renderLogin({ mobile, dark });
    await waitFor(() => expect(rateLimit).toHaveBeenCalledWith("wallet-1"));
    fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toBe(
        "Unable to unlock. Check your password and try again.",
    );
    expect(document.body.textContent).not.toContain("Wrong password for wallet-1");
    expect(document.body.textContent).not.toContain("rate limit store unavailable");
});
test.each(viewportsAndThemes)("lockout disables unlock on mobile=%s dark=%s", async (mobile, dark) => {
    rateLimit.mockResolvedValue({
        locked: true,
        remainingMs: 60_000,
        failedAttempts: 5,
        maxAttempts: 5,
    });
    renderLogin({ mobile, dark });
    await screen.findByText(/Too many failed attempts/);
    expect((screen.getByLabelText("Password") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Locked" }) as HTMLButtonElement).disabled).toBe(true);
    expect(dispatch).not.toHaveBeenCalled();
});

test.each(viewportsAndThemes)("final attempt locks on mobile=%s dark=%s", async (mobile, dark) => {
    rateLimit
        .mockResolvedValueOnce({
            locked: false,
            remainingMs: 0,
            failedAttempts: 4,
            maxAttempts: 5,
        })
        .mockResolvedValue({
            locked: true,
            remainingMs: 60_000,
            failedAttempts: 5,
            maxAttempts: 5,
        });
    dispatch.mockReturnValue({
        unwrap: () => Promise.reject(new Error("bad password")),
    });
    renderLogin({ mobile, dark });
    await screen.findByText("Last attempt before temporary lockout.");
    fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    await screen.findByText(/Too many failed attempts/);
    expect(screen.queryByText("Last attempt before temporary lockout.")).toBeNull();
    expect((screen.getByRole("button", { name: "Locked" }) as HTMLButtonElement).disabled).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
});

test.each(viewportsAndThemes)("Enter unlocks once on mobile=%s dark=%s", async (mobile, dark) => {
    let finish!: (value: unknown) => void;
    dispatch.mockReturnValue({
        unwrap: () => new Promise((resolve) => { finish = resolve; }),
    });
    renderLogin({ mobile, dark });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Password"), "secret{enter}");
    const button = screen.getByRole("button", { name: "Unlock" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.submit(screen.getByRole("form", { name: "Unlock wallet" }));
    expect(dispatch).toHaveBeenCalledTimes(1);
    finish({});
    await screen.findByText("Wallet page");
});
