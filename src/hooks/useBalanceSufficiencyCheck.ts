import { useSelector } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { ACCOUNT_DATA_POLLING_INTERVAL_MS } from "constants/polling";
import { isInsufficientFundsError } from "sdk";
import { selectSelectedNetworkId } from "store/WalletsStore";
import { useGetBalanceQuery } from "store/WalletsStore/api";
import { getInsufficientBalanceError } from "utils/balanceUtils";

const INSUFFICIENT_FUNDS_REJECTION_ERROR =
    "The operation was rejected because the account balance does not cover the amount and fees. Refresh the balance and try again.";

export interface IUseBalanceSufficiencyCheckResponse {
    balance: string | undefined;
    isBalanceLoading: boolean;
    isBalanceError: boolean;
    isBalanceFetching: boolean;
    refetchBalance: () => void;
    submitWithBalanceCheck: <TResult>(
        requiredAmount: bigint,
        submit: () => Promise<TResult>,
    ) => Promise<TResult>;
}

export const useBalanceSufficiencyCheck = (
    accountId: string | undefined,
): IUseBalanceSufficiencyCheckResponse => {
    const networkId = useSelector(selectSelectedNetworkId);
    const { currentData, error, isError, isFetching, refetch } =
        useGetBalanceQuery(accountId ? { accountId, networkId } : skipToken, {
            pollingInterval: ACCOUNT_DATA_POLLING_INTERVAL_MS,
        });

    const getLatestBalance = async (): Promise<string | undefined> => {
        try {
            return await refetch().unwrap();
        } catch (refreshError: unknown) {
            console.error(
                "useBalanceSufficiencyCheck: falling back to the last known balance:",
                refreshError,
            );

            return currentData;
        }
    };

    const submitWithBalanceCheck = async <TResult>(
        requiredAmount: bigint,
        submit: () => Promise<TResult>,
    ): Promise<TResult> => {
        const latestBalance: string | undefined = await getLatestBalance();
        const insufficientBalanceError: string =
            latestBalance === undefined
                ? ""
                : getInsufficientBalanceError(latestBalance, requiredAmount);

        if (insufficientBalanceError) {
            throw new Error(insufficientBalanceError);
        }

        try {
            return await submit();
        } catch (submitError: unknown) {
            if (isInsufficientFundsError(submitError)) {
                throw new Error(INSUFFICIENT_FUNDS_REJECTION_ERROR);
            }

            throw submitError;
        }
    };

    return {
        balance: currentData,
        isBalanceLoading:
            accountId !== undefined &&
            currentData === undefined &&
            error === undefined,
        isBalanceError: isError,
        isBalanceFetching: isFetching,
        refetchBalance: refetch,
        submitWithBalanceCheck,
    };
};
