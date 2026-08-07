import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { generateRandomGasFee } from "constants/gas";
import { Transaction } from "types/transactions";
import { SdkWalletService } from "sdk";
import { RootState } from "store";
import {
    getWalletAndAccountFromWalletsMeta,
    IWalletAndAccountPathFromMeta,
} from "./helpers";

const HISTORY_LIMIT = 50;

export enum WalletsApiTags {
    BALANCE = "Balance",
    HISTORY = "History",
}

export interface IAccountQueryArgs {
    accountId: string;
    networkId: string;
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

                const walletAndAccount: IWalletAndAccountPathFromMeta | null =
                    getWalletAndAccountFromWalletsMeta(wallets, accountId);

                if (!walletAndAccount) {
                    return {
                        error: "walletsApi.getBalance: Incorrect account id",
                    };
                }

                const { wallet, account } = walletAndAccount;

                try {
                    const balance =
                        wallet.isUnlocked && wallet.id
                            ? await SdkWalletService.getAvailableBalance(
                                  wallet.id,
                                  accountId,
                              )
                            : await SdkWalletService.getBalance(
                                  account.address,
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
        getTransactionHistory: build.query<Transaction[], IAccountQueryArgs>({
            queryFn: async ({ accountId }, { getState }) => {
                const { wallets } = (getState() as RootState).walletsStore;

                const walletAndAccount: IWalletAndAccountPathFromMeta | null =
                    getWalletAndAccountFromWalletsMeta(wallets, accountId);

                if (!walletAndAccount) {
                    return {
                        error: "walletsApi.getTransactionHistory: Incorrect account id",
                    };
                }

                const { account } = walletAndAccount;

                try {
                    const history =
                        await SdkWalletService.getTransactionsHistory(
                            account.address,
                            account.publicKey,
                            { limit: HISTORY_LIMIT },
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
                                tx.type === "send"
                                    ? generateRandomGasFee()
                                    : undefined,
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
