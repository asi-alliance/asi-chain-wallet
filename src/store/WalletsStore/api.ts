import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
    ITransactionsHistoryOptions,
    THistorySource,
} from "@asichain/asi-wallet-sdk";
import { ACCOUNT_DATA_POLLING_INTERVAL_SECONDS } from "constants/polling";
import { Transaction } from "types/transactions";
import { RootState } from "store";
import { IThunkExtraArgument } from "store/appThunk";
import {
    getUnlockedWalletAndAccountFromWalletsMeta,
    IUnlockedWalletAndAccountPathFromMeta,
} from "./helpers";

import { parsePositivePrice } from "utils/deployPrice";

export const HISTORY_LIMIT = 50;

export enum WalletsApiTags {
    BALANCE = "Balance",
    HISTORY = "History",
}

export type THistorySourceFilter = "all" | THistorySource;

const HISTORY_SOURCES: Record<
    THistorySourceFilter,
    THistorySource[] | undefined
> = {
    all: undefined,
    pending: ["pending"],
    executed: ["executed"],
};

export interface IAccountQueryArgs {
    accountId: string;
    networkId: string;
}

export interface IHistoryQueryArgs extends IAccountQueryArgs {
    source: THistorySourceFilter;
}

const toErrorMessage = (error: unknown, fallback: string): string =>
    error instanceof Error ? error.message : fallback;

const getWalletService = (extra: unknown) =>
    (extra as IThunkExtraArgument).walletService;

export const serializeHistoryTimestamp = (timestamp: Date | string): string => {
    if (timestamp instanceof Date) {
        return Number.isNaN(timestamp.getTime()) ? "" : timestamp.toISOString();
    }

    const parsed = new Date(timestamp);

    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
};

export const walletsApi = createApi({
    reducerPath: "walletsApi",
    baseQuery: fakeBaseQuery<string>(),
    tagTypes: [WalletsApiTags.BALANCE, WalletsApiTags.HISTORY],
    refetchOnMountOrArgChange: true,
    keepUnusedDataFor: ACCOUNT_DATA_POLLING_INTERVAL_SECONDS,
    endpoints: (build) => ({
        getMinimumPhloPrice: build.query<string, string>({
            async queryFn(validatorUrl, { signal }) {
                try {
                    const url = `${validatorUrl.replace(/\/+$/, "")}/api/status`;
                    const response = await fetch(url, { signal, cache: "no-store" });
                    if (!response.ok) throw new Error(`Validator status returned HTTP ${response.status}`);
                    const minimum = parsePositivePrice((await response.json()).minPhloPrice);
                    if (!minimum) throw new Error("Validator returned an invalid minimum Phlo Price");
                    return { data: minimum };
                } catch (error) {
                    return { error: toErrorMessage(error, "Could not read validator status") };
                }
            },
        }),
        getBalance: build.query<string, IAccountQueryArgs>({
            queryFn: async ({ accountId }, { getState, extra }) => {
                const { wallets } = (getState() as RootState).walletsStore;

                const walletAndAccount: IUnlockedWalletAndAccountPathFromMeta | null =
                    getUnlockedWalletAndAccountFromWalletsMeta(
                        wallets,
                        accountId,
                    );

                if (!walletAndAccount) {
                    return {
                        error: "walletsApi.getBalance: Incorrect account id",
                    };
                }

                const { wallet } = walletAndAccount;

                try {
                    const balance = await getWalletService(extra).getAvailableBalance(
                        wallet.id,
                        accountId,
                    );

                    return { data: balance };
                } catch (error: unknown) {
                    return {
                        error: toErrorMessage(error, "Failed to fetch balance"),
                    };
                }
            },
            providesTags: (_result, _error, { accountId }) => [
                { type: WalletsApiTags.BALANCE, id: accountId },
            ],
        }),
        getTransactionHistory: build.query<Transaction[], IHistoryQueryArgs>({
            queryFn: async ({ accountId, source }, { getState, extra }) => {
                const { wallets } = (getState() as RootState).walletsStore;

                const walletAndAccount: IUnlockedWalletAndAccountPathFromMeta | null =
                    getUnlockedWalletAndAccountFromWalletsMeta(
                        wallets,
                        accountId,
                    );

                if (!walletAndAccount) {
                    return {
                        error: "walletsApi.getTransactionHistory: Incorrect account id",
                    };
                }

                const { wallet } = walletAndAccount;

                try {
                    const historyOptions: ITransactionsHistoryOptions = {
                        pagination: { limit: HISTORY_LIMIT },
                    };

                    if (!!HISTORY_SOURCES[source]) {
                        historyOptions.sources = HISTORY_SOURCES[source];
                    }

                    const history =
                        await getWalletService(extra).getTransactionsHistory(
                            wallet.id,
                            accountId,
                            historyOptions,
                        );

                    return {
                        data: history.map((tx) => ({
                            id: tx.id,
                            deployId: tx.deployId ?? tx.id,
                            from: tx.from,
                            to: tx.to ?? "",
                            amount: tx.amount ?? "",
                            // Prefer ISO so client-side Date filters parse reliably.
                            timestamp: serializeHistoryTimestamp(tx.timestamp),
                            status: tx.status,
                            type: tx.type,
                        })),
                    };
                } catch (error: unknown) {
                    return {
                        error: toErrorMessage(
                            error,
                            "Failed to fetch transaction history",
                        ),
                    };
                }
            },
            providesTags: (_result, _error, { accountId }) => [
                { type: WalletsApiTags.HISTORY, id: accountId },
            ],
        }),
    }),
});

export const {
    useGetMinimumPhloPriceQuery,
    useGetBalanceQuery,
    useLazyGetBalanceQuery,
    useGetTransactionHistoryQuery,
} = walletsApi;
