import { configureStore } from "@reduxjs/toolkit";
import { getWalletActionErrorMessage } from "sdk";
import { selectDeployWatch, default as walletsStoreReducer } from "../index";
import { walletsApi } from "../api";
import { deployContract, sendTransaction } from "../thunks";
import {
    DeployStatus,
    SdkDeployQueueRefusedError,
    SdkDeploySubmissionUnknownError,
    SdkDeployVerdictError,
} from "sdk/__fixtures__/sdkDeployErrors";

jest.mock("services/rchain", () => ({
    BRIDGE_LOCK_MAX_GAS_COST: 0,
    BRIDGE_LOCK_PHLO_LIMIT: 0,
    BRIDGE_LOCK_PHLO_PRICE: 0,
    RChainService: jest.fn(),
}));

interface IUnwrappable {
    unwrap: () => Promise<unknown>;
}

interface IDeployWatchCallbacksLike {
    onError: (error: Error) => void;
}

const WALLET_ID = "wallet-1";
const ACCOUNT_ID = "account-1";

const createTestStore = (walletService: object) =>
    configureStore({
        reducer: {
            walletsStore: walletsStoreReducer,
            [walletsApi.reducerPath]: walletsApi.reducer,
        },
        preloadedState: {
            walletsStore: {
                wallets: [
                    {
                        signerId: "signer-1",
                        type: "hd",
                        id: WALLET_ID,
                        isUnlocked: true,
                        accounts: [
                            {
                                id: ACCOUNT_ID,
                                name: "Account 1",
                                index: 0,
                                address: `1111${ACCOUNT_ID}`,
                                publicKey: "public-key",
                            },
                        ],
                    },
                ],
                selectedAccountId: ACCOUNT_ID,
                networks: [],
                selectedNetwork: {
                    id: "testnet",
                    name: "Testnet",
                    validatorUrl: "",
                    observerUrl: "",
                    indexerUrl: "",
                    nodeApiProfile: "default",
                    isDefault: true,
                },
                deployWatches: {},
                isLoading: false,
                isInitialLoadComplete: true,
            },
        } as never,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: { walletService } },
            }).concat(walletsApi.middleware),
    });

const dispatchThunk = (
    store: ReturnType<typeof createTestStore>,
    action: unknown,
): IUnwrappable =>
    store.dispatch(action as never) as unknown as IUnwrappable;

const getWatch = (store: ReturnType<typeof createTestStore>, deployId: string) =>
    selectDeployWatch(store.getState() as never, deployId);

const sendPayload = {
    walletId: WALLET_ID,
    accountId: ACCOUNT_ID,
    to: `1111${"recipient"}`,
    amount: "1",
};

const deployPayload = {
    walletId: WALLET_ID,
    accountId: ACCOUNT_ID,
    term: "new x in { x!(1) }",
    phloLimit: 1_000,
};

describe("submission refusals through dispatch(...).unwrap()", () => {
    it("keeps the deploy queue wait of a Send refusal", async () => {
        const walletService = {
            transfer: jest.fn().mockRejectedValue(
                new SdkDeployQueueRefusedError(
                    "deploy_queue_full",
                    "deploy-send-1",
                    12_000,
                ),
            ),
        };
        const store = createTestStore(walletService);

        const error: unknown = await dispatchThunk(
            store,
            sendTransaction(sendPayload),
        )
            .unwrap()
            .catch((rejection: unknown) => rejection);

        expect(error).toMatchObject({
            code: "DEPLOY_QUEUE_FULL",
            deployId: "deploy-send-1",
            retryAfterMs: 12_000,
        });
        expect(
            getWalletActionErrorMessage(error, "Failed to send transaction"),
        ).toBe(
            "Not accepted by the node: the network is busy. Please try again in 12 s.",
        );
    });

    it("keeps the signed deploy ID of an unknown contract deploy", async () => {
        const walletService = {
            deploy: jest.fn().mockRejectedValue(
                new SdkDeploySubmissionUnknownError(
                    "deploy-contract-1",
                    "the connection dropped",
                ),
            ),
        };
        const store = createTestStore(walletService);

        const error: unknown = await dispatchThunk(
            store,
            deployContract(deployPayload),
        )
            .unwrap()
            .catch((rejection: unknown) => rejection);

        expect(error).toMatchObject({
            code: "DEPLOY_SUBMISSION_UNKNOWN",
            deployId: "deploy-contract-1",
        });
        expect(getWalletActionErrorMessage(error, "Deploy failed")).toBe(
            "Submission outcome for deploy deploy-contract-1 is unknown. Check its status in transaction history before trying again.",
        );
    });
});

describe("watched verdicts through the reducer", () => {
    it("records a rejected Send as not completed", async () => {
        const subscribe = jest.fn();
        const walletService = {
            transfer: jest
                .fn()
                .mockResolvedValue({ deployId: "deploy-send-2", subscribe }),
        };
        const store = createTestStore(walletService);

        await dispatchThunk(
            store,
            sendTransaction(sendPayload),
        ).unwrap();

        expect(subscribe).toHaveBeenCalledTimes(1);

        const callbacks = subscribe.mock
            .calls[0][0] as IDeployWatchCallbacksLike;

        callbacks.onError(
            new SdkDeployVerdictError(
                "deploy-send-2",
                DeployStatus.REJECTED,
                "rholang_bad_term",
            ),
        );

        expect(getWatch(store, "deploy-send-2")?.failedReason).toBe(
            "The node rejected the transaction when it left the deploy queue. It was not executed and no funds moved. Node detail: rholang_bad_term",
        );
        expect(
            getWatch(store, "deploy-send-2")?.unresolvedReason,
        ).toBeUndefined();
    });

    it("records an expired contract deploy as not completed", async () => {
        const subscribe = jest.fn();
        const walletService = {
            deploy: jest
                .fn()
                .mockResolvedValue({ deployId: "deploy-contract-2", subscribe }),
        };
        const store = createTestStore(walletService);

        await dispatchThunk(
            store,
            deployContract(deployPayload),
        ).unwrap();

        const callbacks = subscribe.mock
            .calls[0][0] as IDeployWatchCallbacksLike;

        callbacks.onError(
            new SdkDeployVerdictError(
                "deploy-contract-2",
                DeployStatus.EXPIRED,
            ),
        );

        expect(getWatch(store, "deploy-contract-2")?.failedReason).toBe(
            "The transaction expired and its effects did not reach finalized state. Create a new transaction.",
        );
        expect(
            getWatch(store, "deploy-contract-2")?.unresolvedReason,
        ).toBeUndefined();
    });

    it("keeps a non-verdict watch error unresolved", async () => {
        const subscribe = jest.fn();
        const walletService = {
            transfer: jest
                .fn()
                .mockResolvedValue({ deployId: "deploy-send-3", subscribe }),
        };
        const store = createTestStore(walletService);

        await dispatchThunk(
            store,
            sendTransaction(sendPayload),
        ).unwrap();

        const callbacks = subscribe.mock
            .calls[0][0] as IDeployWatchCallbacksLike;

        callbacks.onError(new Error("observer is unreachable"));

        expect(getWatch(store, "deploy-send-3")?.unresolvedReason).toBe(
            "observer is unreachable",
        );
        expect(getWatch(store, "deploy-send-3")?.failedReason).toBeUndefined();
    });
});
