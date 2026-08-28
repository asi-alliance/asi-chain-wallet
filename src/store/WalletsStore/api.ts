import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { THistorySource } from "@asichain/asi-wallet-sdk";
import { generateRandomGasFee } from "constants/gas";
import { Transaction } from "types/transactions";
import { SdkWalletService } from "sdk";
import { RootState } from "store";
import {
    getUnlockedWalletAndAccountFromWalletsMeta,
    IUnlockedWalletAndAccountPathFromMeta,
} from "./helpers";

const HISTORY_LIMIT = 50;

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

export const walletsApi = createApi({
    reducerPath: "walletsApi",
    baseQuery: fakeBaseQuery<string>(),
    tagTypes: [WalletsApiTags.BALANCE, WalletsApiTags.HISTORY],
    endpoints: (build) => ({
        getBalance: build.query<string, IAccountQueryArgs>({
            queryFn: async ({ accountId }, { getState }) => {
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
                    const balance = await SdkWalletService.getAvailableBalance(
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
            queryFn: async ({ accountId, source }, { getState }) => {
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
                    const history =
                        await SdkWalletService.getTransactionsHistory(
                            wallet.id,
                            accountId,
                            {
                                sources: HISTORY_SOURCES[source],
                                pagination: { limit: HISTORY_LIMIT },
                            },
                        );

                    return {
                        data: history.map((tx) => ({
                            id: tx.id,
                            deployId: tx.deployId ?? tx.id,
                            from: tx.from,
                            to: tx.to ?? "",
                            amount: tx.amount ?? "",
                            timestamp: tx.timestamp.toString(),
                            status: tx.status,
                            type: tx.type,
                            gasCost:
                                tx.gasCost ??
                                (tx.type === "send"
                                    ? generateRandomGasFee()
                                    : undefined),
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

export const { useGetBalanceQuery, useGetTransactionHistoryQuery } = walletsApi;
