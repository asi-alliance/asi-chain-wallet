import {
    ApiClientManager, Client, GasFee, NodeApiProfile,
    getNativeTokenDecimals, toAtomicAmount,
} from "@asichain/asi-wallet-sdk";
import { SdkWalletService } from "../SdkWalletService";
import { parseNetworksEnv, getNetworksEnvErrorMessage } from "../../config/networksEnv";
import {
    getAmountValidationError, getMaxSendableAmount,
    getTokenAmountWithFee, isPositiveTokenAmount,
} from "../../utils/balanceUtils";
import { getGasFeeRangeLabel } from "../../constants/gas";
import { canCoverDeployCost } from "../../utils/deployFees";
import { configureStore } from "@reduxjs/toolkit";
import { walletsApi } from "../../store/WalletsStore/api";

const base = {
    ValidatorURL: "http://validator.test:40403", ReadOnlyURL: "http://observer.test:40403",
    IndexerURL: "http://indexer.test/graphql", nodeApiProfile: NodeApiProfile.RUST,
};
const manager = ApiClientManager.getInstance();
const service = new SdkWalletService();
const transfer = jest.fn(async () => ({ deployId: "fixture", subscribe: jest.fn() }));
const deploy = jest.fn(async () => ({ deployId: "fixture", subscribe: jest.fn() }));
const sdk = {
    transfer, deploy,
    getBalance: jest.fn(async () => 10000000000000000001n),
    getAvailableBalance: jest.fn(async () => 10000000000000000001n),
    toAtomicAmount: (value: string) => toAtomicAmount(value, getNativeTokenDecimals(manager.getCurrentNetwork().config)),
    getCurrentNetwork: () => manager.getCurrentNetwork(),
    getCurrentNetworkId: () => manager.getCurrentNetworkId(),
    getTransactionsHistory: jest.fn(async () => [] as any[]),
};

beforeEach(() => {
    manager.initialize({ Wide: { ...base, nativeTokenDecimals: 18 }, Legacy: base }, [], "Wide");
    service.attachClient(sdk as unknown as Client);
    transfer.mockClear(); deploy.mockClear();
    sdk.getBalance.mockReset().mockResolvedValue(10000000000000000001n);
    sdk.getAvailableBalance.mockReset().mockResolvedValue(10000000000000000001n);
});
afterEach(() => { manager.close(); });

test.each([
    [8, "0.00000001", "1.50000001", "1", "0.0025"],
    [18, "0.000000000000000001", "10.000000000000000001", "10", "0.00000000000025"],
])("precision %i reaches dust validation, fees, totals and Max without rounding", (decimals, dust, amount, whole, fee) => {
    expect(isPositiveTokenAmount(dust, decimals)).toBe(true);
    expect(toAtomicAmount(dust, decimals)).toBe(1n);
    const total = getTokenAmountWithFee(amount, GasFee.MAX, decimals)!;
    expect(getAmountValidationError(amount, total, GasFee.MAX, true, decimals)).toBe("");
    expect(getMaxSendableAmount(total, GasFee.MAX, decimals)).toBe(amount);
    expect(getTokenAmountWithFee("0", GasFee.MAX, decimals)).toBe(fee);
    expect(getAmountValidationError(amount, amount, GasFee.MAX, true, decimals)).toContain("exceeds balance");
    expect(getAmountValidationError(`${whole}.${"0".repeat(decimals)}1`, total, GasFee.MAX, true, decimals)).toContain(`up to ${decimals}`);
});

test("18-decimal Max handles reservations and insufficient funds by one atomic unit", async () => {
    sdk.getAvailableBalance.mockResolvedValueOnce(10000000000000250000n);
    const available = await service.getAvailableBalance("wallet", "account");
    expect(getMaxSendableAmount(available, GasFee.MAX, 18)).toBe("10");
    expect(getAmountValidationError("10.000000000000000001", available, GasFee.MAX, true, 18)).toContain("exceeds balance");
    expect(getAmountValidationError("1", "--", GasFee.MAX, true, 18)).toBe("Balance is unavailable");
});

test("wide transfer values reach the SDK as exact atomic bigint", async () => {
    await service.transfer({ walletId: "wallet", accountId: "account", to: "recipient" as never,
        amount: "10.000000000000000001", context: SdkWalletService.captureOperationContext() });
    expect(transfer.mock.calls[0][0]).toMatchObject({ amount: 10000000000000000001n });
});

test.each(["9007199254740993.000000000000000001", "0.000000000000000001"])("exact string conversion survives %s", async (amount) => {
    await service.transfer({ walletId: "wallet", accountId: "account", to: "recipient" as never,
        amount, context: SdkWalletService.captureOperationContext() });
    expect(transfer.mock.calls[0][0]).toMatchObject({ amount: toAtomicAmount(amount, 18) });
});

test("legacy native transfer conversion remains eight decimals", async () => {
    manager.switchNetwork("Legacy");
    await service.transfer({ walletId: "wallet", accountId: "account", to: "recipient" as never,
        amount: "1.5", context: SdkWalletService.captureOperationContext() });
    expect(transfer.mock.calls[0][0]).toMatchObject({ amount: 150000000n });
});

test("a confirmed transfer or deploy cannot be reinterpreted after A → B → A", async () => {
    const context = SdkWalletService.captureOperationContext();
    manager.switchNetwork("Legacy"); manager.switchNetwork("Wide");
    await expect(service.transfer({ walletId: "wallet", accountId: "account", to: "recipient" as never,
        amount: "10.000000000000000001", context })).rejects.toThrow("Network changed");
    expect(() => service.deploy({ walletId: "wallet", accountId: "account", term: "Nil", context })).toThrow("Network changed");
    expect(transfer).not.toHaveBeenCalled(); expect(deploy).not.toHaveBeenCalled();
});

test("balance formatting uses the captured precision and rejects stale results", async () => {
    expect(await service.getBalance("account")).toBe("10.000000000000000001");
    let release!: (value: bigint) => void;
    sdk.getAvailableBalance.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const result = service.getAvailableBalance("wallet", "account");
    manager.switchNetwork("Legacy"); release(150000000n);
    await expect(result).rejects.toThrow("Network changed");
});

test("same-id endpoint changes invalidate confirmed transfers before submission", async () => {
    const custom = manager.addNetwork("Custom", { ...base, IndexerURL: "http://custom.test/graphql", nativeTokenDecimals: 18 });
    manager.switchNetwork(custom.id);
    const context = SdkWalletService.captureOperationContext();
    manager.updateNetwork(custom.id, { config: { ReadOnlyURL: "http://new-observer.test:40403" } });
    await expect(service.transfer({ walletId: "wallet", accountId: "account", to: "recipient" as never,
        amount: "1", context })).rejects.toThrow("Network changed");
    expect(transfer).not.toHaveBeenCalled();
});

test("in-flight history cannot be cached under a newly selected network", async () => {
    let release!: (value: any[]) => void;
    sdk.getTransactionsHistory.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const result = service.getTransactionsHistory("wallet", "account");
    manager.switchNetwork("Legacy"); release([]);
    await expect(result).rejects.toThrow("Network changed");
});

test("network mapping retains precision and cache identities include denomination and endpoints", () => {
    const wide = service.getActiveNetwork();
    expect(wide.nativeTokenDecimals).toBe(18);
    expect(SdkWalletService.toNetworkConfig(wide).nativeTokenDecimals).toBe(18);
    const key = SdkWalletService.getNetworkKey(wide);
    expect(SdkWalletService.getNetworkKey({ ...wide, nativeTokenDecimals: 8 })).not.toBe(key);
    expect(SdkWalletService.getNetworkKey({ ...wide, observerUrl: "http://new.test" })).not.toBe(key);
    const legacy = { ...wide }; delete legacy.nativeTokenDecimals;
    expect(SdkWalletService.getNetworkKey(legacy)).toBe(SdkWalletService.getNetworkKey({ ...wide, nativeTokenDecimals: 8 }));
});

test.each([null, "18", -1, 19, 1.5])("invalid env precision %s blocks initialization instead of defaulting", (nativeTokenDecimals) => {
    const parsed = parseNetworksEnv(JSON.stringify({ Invalid: { ...base, nativeTokenDecimals } }));
    expect(parsed.networks).toHaveLength(0);
    expect(getNetworksEnvErrorMessage(parsed.issues)).toContain("nativeTokenDecimals");
});

test("environment config retains 18 and explicit zero while omitted legacy metadata means 8", () => {
    const parsed = parseNetworksEnv(JSON.stringify({
        Wide: { ...base, nativeTokenDecimals: 18 },
        Legacy: { ...base, ValidatorURL: "http://legacy.test" },
        Zero: { ...base, ValidatorURL: "http://zero.test", nativeTokenDecimals: 0 },
    }));
    expect(getNetworksEnvErrorMessage(parsed.issues)).toBeNull();
    expect(parsed.networks.map((network) => network.nativeTokenDecimals)).toEqual([18, 8, 0]);
});

test("deploy affordability and fee label use native precision", () => {
    expect(canCoverDeployCost("0.000000000001", 1000000n, 18)).toBe(true);
    expect(canCoverDeployCost("0.000000000000999999", 1000000n, 18)).toBe(false);
    expect(getGasFeeRangeLabel(18)).toBe("~0.00000000000017-0.00000000000025");
    expect(getGasFeeRangeLabel(8)).toBe("~0.0017-0.0025");
});

test("redundant zeros are exact, nonzero excess precision and uint256 overflow are rejected", () => {
    expect(getAmountValidationError("1.0000000000000000000", "2", GasFee.MAX, true, 18)).toBe("");
    expect(getAmountValidationError("0.0000000000000000001", "2", GasFee.MAX, true, 18)).toContain("up to 18");
    expect(getAmountValidationError((1n << 256n).toString(), (1n << 257n).toString(), GasFee.MAX, true, 0)).toContain("supported transfer limit");
    expect(getMaxSendableAmount((1n << 257n).toString(), GasFee.MAX, 0)).toBe(((1n << 256n) - 1n).toString());
});

const queryStore = () => configureStore({
    reducer: {
        walletsStore: (state = { wallets: [{
            id: "wallet", signerId: "fixture", isUnlocked: true,
            accounts: [{ id: "account", address: "fixture" }],
        }] }) => state,
        [walletsApi.reducerPath]: walletsApi.reducer,
    },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: { walletService: service } } }).concat(walletsApi.middleware),
});

test("RTK balance cache separates 8/18 networks and rejects the previous config key", async () => {
    const store = queryStore();
    const wideArgs = { accountId: "account", networkId: "Wide", networkKey: service.getActiveNetworkKey() };
    const wideRead = store.dispatch(walletsApi.endpoints.getBalance.initiate(wideArgs));
    expect((await wideRead).data).toBe("10.000000000000000001");
    manager.switchNetwork("Legacy");
    sdk.getAvailableBalance.mockResolvedValueOnce(150000000n);
    const legacyRead = store.dispatch(walletsApi.endpoints.getBalance.initiate({
        accountId: "account", networkId: "Legacy", networkKey: service.getActiveNetworkKey(),
    }));
    expect((await legacyRead).data).toBe("1.5");
    expect(walletsApi.endpoints.getBalance.select(wideArgs)(store.getState()).data).toBe("10.000000000000000001");
    const staleRead = store.dispatch(walletsApi.endpoints.getBalance.initiate(wideArgs, { forceRefetch: true }));
    expect((await staleRead).error).toContain("different network configuration");
    wideRead.unsubscribe(); legacyRead.unsubscribe(); staleRead.unsubscribe();
    store.dispatch(walletsApi.util.resetApiState());
});

test("history retains recorded amount, fees and precision independently of the selected scale", async () => {
    const store = queryStore();
    sdk.getTransactionsHistory.mockResolvedValueOnce([{
        id: "legacy-record", from: "sender", to: "recipient", amount: "1.50000000",
        gasCost: "0.0025", nativeTokenDecimals: 8, networkId: "Wide",
        timestamp: new Date("2026-01-01T00:00:00Z"), status: "success", type: "transfer",
    }, {
        id: "wide-record", from: "sender", to: "recipient", amount: "10.000000000000000001",
        gasCost: "0.00000000000025", nativeTokenDecimals: 18, networkId: "Wide",
        timestamp: new Date("2026-01-02T00:00:00Z"), status: "success", type: "transfer",
    }]);
    const read = store.dispatch(walletsApi.endpoints.getTransactionHistory.initiate({
        accountId: "account", networkId: "Wide", networkKey: service.getActiveNetworkKey(), source: "all",
    }));
    expect((await read).data?.map((tx) => [tx.amount, tx.gasCost, tx.nativeTokenDecimals])).toEqual([
        ["1.50000000", "0.0025", 8], ["10.000000000000000001", "0.00000000000025", 18],
    ]);
    read.unsubscribe(); store.dispatch(walletsApi.util.resetApiState());
});
