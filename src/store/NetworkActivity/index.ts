import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NetworkId } from "@asichain/asi-wallet-sdk";
import { RootState } from "store";

interface NetworkActivityState {
    isOperationPending: boolean;
    busyNetworkIds: NetworkId[];
}

interface INetworkBusyChangedPayload {
    networkId: NetworkId;
    busy: boolean;
}

const initialState: NetworkActivityState = {
    isOperationPending: false,
    busyNetworkIds: [],
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

export const {
    networkOperationStarted,
    networkOperationFinished,
    busyNetworksSynced,
    networkBusyChanged,
} = networkActivitySlice.actions;

export default networkActivitySlice.reducer;
