import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "store";

type TSdkClientStatus = "pending" | "ready" | "failed";

interface SdkClientState {
    status: TSdkClientStatus;
    error: string | null;
}

const initialState: SdkClientState = {
    status: "pending",
    error: null,
};

const sdkClientSlice = createSlice({
    name: "sdk-client",
    initialState,
    reducers: {
        sdkClientReady: (state) => {
            state.status = "ready";
            state.error = null;
        },
        sdkClientFailed: (state, action: PayloadAction<string>) => {
            state.status = "failed";
            state.error = action.payload;
        },
    },
});

export const selectIsSdkClientReady = (state: RootState): boolean =>
    state.sdkClient.status === "ready";

export const selectSdkClientError = (state: RootState): string | null =>
    state.sdkClient.error;

export const { sdkClientReady, sdkClientFailed } = sdkClientSlice.actions;

export default sdkClientSlice.reducer;
