import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { generateRandomId, NetworkId } from "@asichain/asi-wallet-sdk";
import { RootState } from "store";
import {
    IPendingOperation,
    TOperation,
    TOperationLookup,
    TOperationStageChange,
    TOperationStart,
} from "types/operations";

interface NetworkActivityState {
    isOperationPending: boolean;
    busyNetworkIds: NetworkId[];
    operations: Record<string, TOperation>;
}

interface INetworkBusyChangedPayload {
    networkId: NetworkId;
    busy: boolean;
}

const initialState: NetworkActivityState = {
    isOperationPending: false,
    busyNetworkIds: [],
    operations: {},
};

const networkActivitySlice = createSlice({
    name: "network-activity",
    initialState,
    reducers: {
        networkOperationStarted: (state) => {
            state.isOperationPending = true;
        },
        networkOperationFinished: (state) => {
            state.isOperationPending = false;
        },
        busyNetworksSynced: (state, action: PayloadAction<NetworkId[]>) => {
            state.busyNetworkIds = action.payload;
        },
        networkBusyChanged: (
            state,
            action: PayloadAction<INetworkBusyChangedPayload>,
        ) => {
            const { networkId, busy } = action.payload;
            const isAlreadyBusy = state.busyNetworkIds.includes(networkId);

            if (busy && !isAlreadyBusy) {
                state.busyNetworkIds.push(networkId);
            }

            if (!busy && isAlreadyBusy) {
                state.busyNetworkIds = state.busyNetworkIds.filter(
                    (busyNetworkId: NetworkId) => busyNetworkId !== networkId,
                );
            }
        },
        operationStarted: {
            reducer: (state, action: PayloadAction<IPendingOperation>) => {
                state.operations[action.payload.id] = action.payload;
            },
            prepare: (operation: TOperationStart) => ({
                payload: {
                    ...operation,
                    id: generateRandomId(),
                    startedAt: Date.now(),
                },
            }),
        },
        operationStageChanged: (
            state,
            action: PayloadAction<TOperationStageChange>,
        ) => {
            const operation = state.operations[action.payload.id];

            if (!operation) {
                return;
            }

            state.operations[action.payload.id] = {
                ...operation,
                ...action.payload,
            };
        },
        operationSettled: (state, action: PayloadAction<string>) => {
            delete state.operations[action.payload];
        },
    },
});

export const selectIsNetworkOperationPending = (state: RootState): boolean =>
    state.networkActivity.isOperationPending;

export const selectBusyNetworkIds = (state: RootState): NetworkId[] =>
    state.networkActivity.busyNetworkIds;

export const selectIsNetworkBusy = (
    state: RootState,
    networkId: NetworkId,
): boolean => state.networkActivity.busyNetworkIds.includes(networkId);

const selectOperationsById = (state: RootState): Record<string, TOperation> =>
    state.networkActivity.operations;

export const selectActiveOperations = createSelector(
    [selectOperationsById],
    (operations: Record<string, TOperation>): TOperation[] =>
        Object.values(operations),
);

export const selectHasOperationInProgress = (state: RootState): boolean =>
    Object.keys(state.networkActivity.operations).length > 0 ||
    state.networkActivity.busyNetworkIds.length > 0;

export const selectOperationById = (
    state: RootState,
    id: string,
): TOperation | null => state.networkActivity.operations[id] ?? null;

export const selectAccountOperation = (
    state: RootState,
    { kind, networkId, accountId }: TOperationLookup,
): TOperation | null =>
    selectActiveOperations(state).find(
        (operation: TOperation) =>
            operation.kind === kind &&
            operation.networkId === networkId &&
            operation.accountId === accountId,
    ) ?? null;

export const {
    networkOperationStarted,
    networkOperationFinished,
    busyNetworksSynced,
    networkBusyChanged,
    operationStarted,
    operationStageChanged,
    operationSettled,
} = networkActivitySlice.actions;

export default networkActivitySlice.reducer;
