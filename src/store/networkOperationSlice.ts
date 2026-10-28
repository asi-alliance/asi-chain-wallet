import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "store";

interface NetworkOperationState {
    isPending: boolean;
}

const initialState: NetworkOperationState = {
    isPending: false,
};

const networkOperationSlice = createSlice({
    name: "network-operation",
    initialState,
    reducers: {
        networkOperationStarted: (state) => {
            state.isPending = true;
        },
        networkOperationFinished: (state) => {
            state.isPending = false;
        },
    },
});

export const selectIsNetworkOperationPending = (state: RootState): boolean =>
    state.networkOperation.isPending;

export const { networkOperationStarted, networkOperationFinished } =
    networkOperationSlice.actions;

export default networkOperationSlice.reducer;
