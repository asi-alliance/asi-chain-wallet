import { AnyAction, createAsyncThunk, ThunkAction } from "@reduxjs/toolkit";
import { SdkWalletService } from "sdk";
import type { RootState } from "store";

export interface IThunkExtraArgument {
    walletService: SdkWalletService;
}

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
    state: RootState;
    extra: IThunkExtraArgument;
}>();

export type TAppThunk<TReturn = void> = ThunkAction<
    TReturn,
    RootState,
    IThunkExtraArgument,
    AnyAction
>;
