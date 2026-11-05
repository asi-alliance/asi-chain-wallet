import React from "react";
import { act } from "react-dom/test-utils";
import { createRoot, Root } from "react-dom/client";
import { useWalletSessionAction } from "./useWalletSessionAction";

jest.mock("@asichain/asi-wallet-sdk", () => ({
    CustomErrorCode: { WALLET_LOCKED: "WALLET_LOCKED", INVALID_PASSWORD: "INVALID_PASSWORD" },
    getErrorMessage: (error: { message?: string }, fallback: string) => error?.message || fallback,
}));
jest.mock("sdk", () => jest.requireActual("../sdk/errors"));
jest.mock("store/hooks", () => ({ useAppDispatch: () => () => true }));
jest.mock("store/WalletsStore/thunks", () => ({ checkWalletUnlocked: () => ({ type: "check" }) }));

const roots: Root[] = [];
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => { act(() => { roots.splice(0).forEach((root) => root.unmount()); }); });
const renderHook = <T,>(hook: () => T): { result: { current: T } } => {
    const result = {} as { current: T };
    const Probe = () => { result.current = hook(); return null; };
    const root = createRoot(document.createElement("div"));
    roots.push(root);
    act(() => { root.render(<Probe />); });
    return { result };
};

it("does not enter the accepted/finalization path after an admission refusal", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const action = jest.fn().mockRejectedValue(Object.assign(new Error("busy"), { code: "DEPLOY_ADMISSION_REFUSED" }));
    const { result } = renderHook(() => useWalletSessionAction({ walletId: "wallet", action, onSuccess, onError }));
    await act(async () => { await result.current.run(); });
    expect(action).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("Not accepted by the node. Please try again later.");
    expect(result.current.isRunning).toBe(false);
});

it("keeps an unknown submission distinct from not accepted", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const action = jest.fn().mockRejectedValue({ code: "DEPLOY_SUBMISSION_UNKNOWN", message: "timeout" });
    const { result } = renderHook(() => useWalletSessionAction({ walletId: "wallet", action, onSuccess, onError }));
    await act(async () => { await result.current.run(); });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("Submission outcome is unknown. Check transaction history before trying again.");
});

it("starts the accepted path only after submission resolves", async () => {
    let accept!: (value: { deployId: string }) => void;
    const pending = new Promise<{ deployId: string }>((resolve) => { accept = resolve; });
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useWalletSessionAction({ walletId: "wallet", action: () => pending, onSuccess }));
    let running!: Promise<void>;
    act(() => { running = result.current.run(); });
    expect(onSuccess).not.toHaveBeenCalled();
    await act(async () => { accept({ deployId: "signed-id" }); await running; });
    expect(onSuccess).toHaveBeenCalledWith({ deployId: "signed-id" });
});
