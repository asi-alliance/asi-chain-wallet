import React from "react";
import { configureStore, Middleware } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { Address, WalletTypes } from "@asichain/asi-wallet-sdk";
import { Deploy } from "pages/Deploy/Deploy";
import walletReducer from "store/WalletsStore";
import authReducer from "store/Auth";
import networkOperationReducer from "store/networkOperationSlice";
import themeReducer from "store/themeSlice";
import { SdkWalletService } from "sdk";
import IDEStorageService from "services/ideStorage";
import { darkTheme, lightTheme } from "styles/theme";

const mockUseGetBalanceQuery = jest.fn();

jest.mock("store/WalletsStore/api", () => ({
    ...jest.requireActual("store/WalletsStore/api"),
    useGetBalanceQuery: (...args: unknown[]) => mockUseGetBalanceQuery(...args),
}));

jest.mock("@monaco-editor/react", () => ({
    __esModule: true,
    default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
        <textarea aria-label="Pro Rholang code" value={value} onChange={(event) => onChange(event.target.value)} />
    ),
}));

jest.mock("components/DeployProModeWidget/rholangLanguage", () => ({
    RHOLANG_LANGUAGE_ID: "rholang",
    registerRholangLanguage: jest.fn(),
}));

const accountAddress = "1111111111111111111111111111111111111111111111111111" as Address;

const renderDeploy = (theme: typeof lightTheme = lightTheme) => {
    const actions: Array<{ type: string; payload?: unknown }> = [];
    const logActions: Middleware = () => (next) => (action) => {
        if (typeof action === "object" && action !== null && "type" in action) {
            actions.push(action as { type: string; payload?: unknown });
        }
        return next(action);
    };
    const initialWalletState = walletReducer(undefined, { type: "init" });
    const store = configureStore({
        reducer: {
            walletsStore: walletReducer,
            auth: authReducer,
            networkOperation: networkOperationReducer,
            theme: themeReducer,
        },
        preloadedState: {
            walletsStore: {
                ...initialWalletState,
                wallets: [{
                    id: "wallet-1",
                    signerId: "signer-1",
                    type: WalletTypes.HD,
                    isUnlocked: true,
                    accounts: [{
                        id: "account-1",
                        name: "Main account",
                        index: 0,
                        address: accountAddress,
                        publicKey: "public-key",
                    }],
                }],
                selectedAccountId: "account-1",
            },
            auth: {
                ...authReducer(undefined, { type: "init" }),
                isAuthenticated: true,
                activeSignerId: "signer-1",
            },
            networkOperation: networkOperationReducer(undefined, { type: "init" }),
            theme: { darkMode: theme.mode === "dark" },
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logActions),
    });
    render(
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={["/deploy"]}>
                    <Deploy />
                </MemoryRouter>
            </ThemeProvider>
        </Provider>,
    );
    return { store, actions };
};

const switchMode = async (user: ReturnType<typeof userEvent.setup>, mode: "Lite mode" | "Pro mode") => {
    await user.click(screen.getByRole("combobox", { name: "Mode" }));
    await user.click(screen.getByRole("option", { name: mode }));
};

beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1440 });
    mockUseGetBalanceQuery.mockReturnValue({ currentData: "10", isError: false });
    jest.spyOn(SdkWalletService, "isWalletUnlocked").mockReturnValue(true);
});

afterEach(() => jest.restoreAllMocks());

it.each([["light", lightTheme], ["dark", darkTheme]] as const)("keeps Lite and Pro input when changing modes in %s", async (_name, theme) => {
    const user = userEvent.setup();
    renderDeploy(theme);
    await user.clear(screen.getByLabelText("Rholang Code"));
    await user.type(screen.getByLabelText("Rholang Code"), "new lite code");
    await user.clear(screen.getByRole("spinbutton", { name: "Phlo Limit" }));
    await user.type(screen.getByRole("spinbutton", { name: "Phlo Limit" }), "250000000");
    await switchMode(user, "Pro mode");
    expect(screen.getByRole("spinbutton", { name: "Phlo Limit" })).toHaveValue(250000000);
    await user.clear(screen.getByLabelText("Pro Rholang code"));
    await user.type(screen.getByLabelText("Pro Rholang code"), "new pro code");
    await switchMode(user, "Lite mode");
    expect(screen.getByLabelText("Rholang Code")).toHaveValue("new lite code");
    expect(screen.getByRole("spinbutton", { name: "Phlo Limit" })).toHaveValue(250000000);
    await switchMode(user, "Pro mode");
    expect(screen.getByLabelText("Pro Rholang code")).toHaveValue("new pro code");
    await user.click(screen.getByRole("button", { name: "Load Example" }));
    expect(screen.getByRole("treeitem", { name: /hello-example-1.rho/ })).toBeInTheDocument();
    await user.click(screen.getByRole("treeitem", { name: /hello.rho/ }));
    expect(screen.getByLabelText("Pro Rholang code")).toHaveValue("new pro code");
});

it("moves keyboard focus to the visible mode selector", async () => {
    const user = userEvent.setup();
    renderDeploy();
    screen.getByRole("combobox", { name: "Mode" }).focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    const visibleSelector = screen.getByRole("combobox", { name: "Mode" });
    expect(visibleSelector).toHaveTextContent("Pro mode");
    expect(visibleSelector).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");
    expect(screen.getByRole("combobox", { name: "Mode" })).toHaveFocus();
});

it("holds the shared chain lock through an in-flight deploy across mounted modes", async () => {
    const user = userEvent.setup();
    let resolveDeploy: ((value: unknown) => void) | undefined;
    const deployPromise = new Promise((resolve) => { resolveDeploy = resolve; });
    const deploy = jest.spyOn(SdkWalletService, "deploy").mockReturnValue(deployPromise as never);
    const { store } = renderDeploy();
    await switchMode(user, "Pro mode");
    await switchMode(user, "Lite mode");
    await user.click(screen.getByRole("button", { name: "Deploy" }));
    await user.click(within(screen.getByRole("dialog", { name: "Confirm deployment" })).getByRole("button", { name: "Deploy Contract" }));
    await waitFor(() => expect(deploy).toHaveBeenCalledTimes(1));
    expect(store.getState().networkOperation.isPending).toBe(true);
    expect(screen.getByRole("combobox", { name: "Mode" })).toBeDisabled();
    await user.click(screen.getByRole("combobox", { name: "Mode" }));
    expect(screen.getByRole("combobox", { name: "Mode" })).toHaveTextContent("Lite mode");
    expect(deploy).toHaveBeenCalledTimes(1);
    await act(async () => resolveDeploy?.({ deployId: "locked-hash", subscribe: () => undefined }));
    await waitFor(() => expect(store.getState().networkOperation.isPending).toBe(false));
    expect(screen.getByRole("combobox", { name: "Mode" })).toBeEnabled();
});

it("holds the shared chain lock through an in-flight Explore across mounted modes", async () => {
    const user = userEvent.setup();
    let resolveExplore: ((value: unknown) => void) | undefined;
    const explorePromise = new Promise((resolve) => { resolveExplore = resolve; });
    const explore = jest.spyOn(SdkWalletService, "exploreDeploy").mockReturnValue(explorePromise as never);
    const deploy = jest.spyOn(SdkWalletService, "deploy");
    const { store } = renderDeploy();
    await switchMode(user, "Pro mode");
    await switchMode(user, "Lite mode");
    await user.click(screen.getByRole("button", { name: "Explore" }));
    expect(store.getState().networkOperation.isPending).toBe(true);
    expect(screen.getByRole("combobox", { name: "Mode" })).toBeDisabled();
    await user.click(within(screen.getByRole("dialog", { name: "Confirm exploration" })).getByRole("button", { name: "Explore Contract" }));
    await waitFor(() => expect(explore).toHaveBeenCalledTimes(1));
    expect(store.getState().networkOperation.isPending).toBe(true);
    await user.click(screen.getByRole("combobox", { name: "Mode" }));
    expect(screen.getByRole("combobox", { name: "Mode" })).toHaveTextContent("Lite mode");
    expect(deploy).not.toHaveBeenCalled();
    await act(async () => resolveExplore?.({ result: "locked" }));
    await waitFor(() => expect(store.getState().networkOperation.isPending).toBe(false));
    expect(screen.getByRole("combobox", { name: "Mode" })).toBeEnabled();
});

it("validates Phlo Limit, confirms once, and shows the pending hash and final result", async () => {
    const user = userEvent.setup();
    let onConfirmed: (() => void) | undefined;
    const deploy = jest.spyOn(SdkWalletService, "deploy").mockResolvedValue({
        deployId: "deploy-hash-1",
        subscribe: (callbacks: { onConfirmed: () => void }) => { onConfirmed = callbacks.onConfirmed; },
    } as never);
    const { actions } = renderDeploy();
    const limit = screen.getByRole("spinbutton", { name: "Phlo Limit" });
    await user.clear(limit);
    await user.type(limit, "0");
    expect(limit).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Deploy" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Deploy" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a whole Phlo Limit greater than zero.");
    expect(screen.queryByText(/Deploy aborted: invalid phlo limit/)).not.toBeInTheDocument();
    await user.clear(limit);
    await user.type(limit, "100000000");
    await user.click(screen.getByRole("button", { name: "Deploy" }));
    const dialog = screen.getByRole("dialog", { name: "Confirm deployment" });
    expect(within(dialog).getByText(/Estimated Cost:/)).toBeInTheDocument();
    expect(within(dialog).getByText(/phlo/)).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", { name: "Deploy Contract" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(deploy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Deploy sent! Waiting for confirmation/)).toBeInTheDocument();
    expect(screen.getByText("Deploy ID: deploy-hash-1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy deploy hash" })).toHaveTextContent("Copy hash");
    await act(async () => onConfirmed?.());
    expect(await screen.findByText("Deploy submitted successfully!")).toBeInTheDocument();
    const invalidations = actions.filter((action) => action.type.endsWith("/invalidateTags"));
    expect(invalidations.length).toBeGreaterThanOrEqual(2);
    expect(invalidations[invalidations.length - 1].payload).toEqual(expect.arrayContaining([
        { type: "Balance", id: "account-1" },
        { type: "History", id: "account-1" },
    ]));
});

it("keeps invalid Phlo Limit errors at the field in both modes", async () => {
    const user = userEvent.setup();
    const deploy = jest.spyOn(SdkWalletService, "deploy");
    renderDeploy();
    const limit = screen.getByRole("spinbutton", { name: "Phlo Limit" });
    await user.clear(limit);
    expect(limit).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Deploy" })).toBeDisabled();
    await switchMode(user, "Pro mode");
    expect(screen.getByRole("spinbutton", { name: "Phlo Limit" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Deploy" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a whole Phlo Limit greater than zero.");
    expect(screen.queryByText(/Deploy aborted: invalid phlo limit/)).not.toBeInTheDocument();
    expect(deploy).not.toHaveBeenCalled();
});

it("preserves Pro actions and displays Explore output in Console", async () => {
    const user = userEvent.setup();
    jest.spyOn(SdkWalletService, "exploreDeploy").mockResolvedValue({ result: "ok" } as never);
    renderDeploy();
    await switchMode(user, "Pro mode");
    expect(screen.getByRole("button", { name: "Import Workspace" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Export Workspace" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "New File" }));
    expect(screen.getByRole("treeitem", { name: /untitled-2.rho/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "New Folder" }));
    expect(screen.getByRole("treeitem", { name: /new-folder-3/ })).toBeInTheDocument();
    await user.click(screen.getByRole("treeitem", { name: /hello.rho/ }));
    await user.click(screen.getByRole("button", { name: "Explore" }));
    await user.click(within(screen.getByRole("dialog", { name: "Confirm exploration" })).getByRole("button", { name: "Explore Contract" }));
    expect(await screen.findByText(/Explore result:/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear console output" }));
    expect(screen.getByText("Console output will appear here...")).toBeInTheDocument();
});

it("supports Lite example, clear, keyboard cancellation, and Explore", async () => {
    const user = userEvent.setup();
    jest.spyOn(SdkWalletService, "exploreDeploy").mockResolvedValue({ output: "lite-result" } as never);
    renderDeploy();
    const code = screen.getByLabelText("Rholang Code");
    await user.click(screen.getByRole("button", { name: "Clear code editor" }));
    expect(code).toHaveValue("");
    expect(screen.getByRole("button", { name: "Deploy" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Load Example" }));
    expect((code as HTMLTextAreaElement).value).toContain("Hello from ASI Wallet!");
    await user.click(screen.getByRole("button", { name: "Deploy" }));
    expect(screen.getByRole("dialog", { name: "Confirm deployment" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deploy" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Explore" }));
    await user.click(within(screen.getByRole("dialog", { name: "Confirm exploration" })).getByRole("button", { name: "Explore Contract" }));
    expect(await screen.findByText(/lite-result/)).toBeInTheDocument();
});

it.each([["light", lightTheme], ["dark", darkTheme]] as const)("keeps imported Pro workspace controls usable from the keyboard on mobile in %s", async (_name, theme) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    const user = userEvent.setup();
    const exportWorkspace = jest.spyOn(IDEStorageService, "exportWorkspace").mockImplementation(() => undefined);
    const exportFile = jest.spyOn(IDEStorageService, "exportFile").mockImplementation(() => undefined);
    const importWorkspace = jest.spyOn(IDEStorageService, "importWorkspace").mockResolvedValue([{
        id: "imported-file",
        name: "imported.rho",
        type: "file",
        content: "new imported code",
        modified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    }]);
    renderDeploy(theme);
    expect(screen.getByRole("button", { name: "Clear code editor" })).toHaveTextContent("Clear");
    await switchMode(user, "Pro mode");
    expect(screen.getByRole("button", { name: "Clear console output" })).toHaveTextContent("Clear");
    await user.click(screen.getByRole("button", { name: "Export Workspace" }));
    expect(exportWorkspace).toHaveBeenCalledTimes(1);
    const file = new File(["{}"], "workspace.json", { type: "application/json" });
    await user.upload(screen.getByLabelText("Import workspace file"), file);
    expect(importWorkspace).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("treeitem", { name: "imported.rho" })).toBeInTheDocument();
    expect(screen.getByLabelText("Pro Rholang code")).toHaveValue("new imported code");
    const imported = screen.getByRole("treeitem", { name: "imported.rho" });
    imported.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(screen.getByRole("menu", { name: "imported.rho actions" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(imported).toHaveFocus();
    fireEvent.contextMenu(imported);
    expect(screen.getByRole("menu", { name: "imported.rho actions" })).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("heading", { name: "Deploy Rholang Contract" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await waitFor(() => expect(imported).toHaveFocus());
    fireEvent.contextMenu(imported);
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));
    const rename = screen.getByDisplayValue("imported.rho");
    await user.clear(rename);
    await user.type(rename, "renamed.rho{Enter}");
    expect(screen.getByRole("treeitem", { name: "renamed.rho" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import File" })).toBeEnabled();
    fireEvent.contextMenu(screen.getByRole("treeitem", { name: "renamed.rho" }));
    await user.click(screen.getByRole("menuitem", { name: "Export File" }));
    expect(exportFile).toHaveBeenCalledWith(expect.objectContaining({ name: "renamed.rho" }));
    fireEvent.contextMenu(screen.getByRole("treeitem", { name: "renamed.rho" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(screen.queryByRole("treeitem", { name: "renamed.rho" })).not.toBeInTheDocument();
});

it("supports Pro file import, folder actions, and closing an editor tab", async () => {
    const user = userEvent.setup();
    jest.spyOn(IDEStorageService, "importFile").mockResolvedValue({
        id: "uploaded-file",
        name: "uploaded.rho",
        type: "file",
        content: "new upload code",
        modified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    renderDeploy();
    await switchMode(user, "Pro mode");
    await user.upload(screen.getByLabelText("Import Rholang file"), new File(["code"], "uploaded.rho"));
    expect(await screen.findByRole("treeitem", { name: "uploaded.rho" })).toBeInTheDocument();
    expect(screen.getByLabelText("Pro Rholang code")).toHaveValue("new upload code");
    fireEvent.contextMenu(screen.getByRole("treeitem", { name: "Examples" }));
    await user.click(screen.getByRole("menuitem", { name: "New File" }));
    expect(screen.getByRole("treeitem", { name: /untitled-3.rho/ })).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByRole("treeitem", { name: "Examples" }));
    await user.click(screen.getByRole("menuitem", { name: "New Folder" }));
    expect(screen.getByRole("treeitem", { name: /new-folder-3/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Close untitled-3.rho/ }));
    expect(screen.queryByRole("tab", { name: /untitled-3.rho/ })).not.toBeInTheDocument();
});

it("keeps focus on an outside control when dismissing the Pro context menu", async () => {
    const user = userEvent.setup();
    renderDeploy();
    await switchMode(user, "Pro mode");
    const file = screen.getByRole("treeitem", { name: "hello.rho" });
    file.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(screen.getByRole("menuitem", { name: "Export File" })).toHaveFocus();

    const phloLimit = screen.getByRole("spinbutton", { name: "Phlo Limit" });
    await user.click(phloLimit);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await waitFor(() => expect(phloLimit).toHaveFocus());

    fireEvent.contextMenu(file);
    const loadExample = screen.getByRole("button", { name: "Load Example" });
    await user.click(loadExample);
    await waitFor(() => expect(loadExample).toHaveFocus());
});

it("clears the hidden Pro menu when switching to Lite with the keyboard", async () => {
    const user = userEvent.setup();
    renderDeploy();
    await switchMode(user, "Pro mode");
    const file = screen.getByRole("treeitem", { name: "hello.rho" });
    file.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(screen.getByRole("menu")).toBeInTheDocument();

    screen.getByRole("combobox", { name: "Mode" }).focus();
    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");
    expect(screen.getByRole("combobox", { name: "Mode" })).toHaveTextContent("Lite mode");
    expect(screen.queryByRole("menu", { hidden: true })).not.toBeInTheDocument();

    const phloLimit = screen.getByRole("spinbutton", { name: "Phlo Limit" });
    await user.click(phloLimit);
    await waitFor(() => expect(phloLimit).toHaveFocus());
    expect(file).not.toHaveFocus();
});

it("creates distinct workspace IDs when the clock does not advance", async () => {
    const user = userEvent.setup();
    const saveFiles = jest.spyOn(IDEStorageService, "saveFiles");
    renderDeploy();
    await switchMode(user, "Pro mode");
    jest.spyOn(Date, "now").mockReturnValue(123456789);

    await user.click(screen.getByRole("button", { name: "New File" }));
    await user.click(screen.getByRole("button", { name: "New File" }));
    await user.click(screen.getByRole("button", { name: "New Folder" }));
    const calls = saveFiles.mock.calls;
    const savedItems = calls[calls.length - 1][0];
    expect(new Set(savedItems.map((item) => item.id)).size).toBe(savedItems.length);
    expect(savedItems.filter((item) => item.id.startsWith("file-123456789-") && item.type === "file")).toHaveLength(2);
    expect(savedItems.filter((item) => item.id.startsWith("folder-123456789-") && item.type === "folder")).toHaveLength(1);
});

it("loads the actual example when an imported hello-rho id has other content", async () => {
    const user = userEvent.setup();
    jest.spyOn(IDEStorageService, "importWorkspace").mockResolvedValue([{
        id: "hello-rho",
        name: "imported.rho",
        type: "file",
        content: "new imported contract",
        modified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    }]);
    renderDeploy();
    await switchMode(user, "Pro mode");
    await user.upload(
        screen.getByLabelText("Import workspace file"),
        new File(["{}"], "workspace.json", { type: "application/json" }),
    );
    expect(await screen.findByRole("treeitem", { name: "imported.rho" })).toBeInTheDocument();
    expect(screen.getByLabelText("Pro Rholang code")).toHaveValue("new imported contract");
    await user.click(screen.getByRole("button", { name: "Load Example" }));
    expect((screen.getByLabelText("Pro Rholang code") as HTMLTextAreaElement).value).toContain("Hello from ASI Wallet!");
    expect(screen.getByRole("treeitem", { name: "imported.rho" })).toBeInTheDocument();
    await user.click(screen.getByRole("treeitem", { name: "imported.rho" }));
    expect(screen.getByLabelText("Pro Rholang code")).toHaveValue("new imported contract");
});

it("shows Pro pending and finalized results without clearing the workspace", async () => {
    const user = userEvent.setup();
    let onConfirmed: (() => void) | undefined;
    jest.spyOn(SdkWalletService, "deploy").mockResolvedValue({
        deployId: "pro-hash-1",
        subscribe: (callbacks: { onConfirmed: () => void }) => { onConfirmed = callbacks.onConfirmed; },
    } as never);
    renderDeploy();
    await switchMode(user, "Pro mode");
    await user.click(screen.getByRole("button", { name: "Deploy" }));
    await user.click(within(screen.getByRole("dialog", { name: "Confirm deployment" })).getByRole("button", { name: "Deploy Contract" }));
    expect(await screen.findByText("Deploy pending")).toBeInTheDocument();
    expect(screen.getByText("Deploy ID: pro-hash-1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy deploy hash" })).toBeEnabled();
    await act(async () => onConfirmed?.());
    expect(await screen.findByText("Deploy finalized")).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /hello.rho/ })).toBeInTheDocument();
});
