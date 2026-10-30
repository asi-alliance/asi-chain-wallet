import { configureStore } from "@reduxjs/toolkit";
import { SdkWalletService } from "sdk";
import walletReducer from "./WalletsStore";
import { walletsApi } from "./WalletsStore/api";
import themeReducer from "./themeSlice";
import authReducer from "./Auth/";
import networkActivityReducer from "./NetworkActivity";
import sdkClientReducer from "./SdkClient";
import { IThunkExtraArgument } from "./appThunk";

const thunkExtraArgument: IThunkExtraArgument = {
    walletService: new SdkWalletService(),
};

export const store = configureStore({
    reducer: {
        walletsStore: walletReducer,
        [walletsApi.reducerPath]: walletsApi.reducer,
        theme: themeReducer,
        auth: authReducer,
        networkActivity: networkActivityReducer,
        sdkClient: sdkClientReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: {
                extraArgument: thunkExtraArgument,
            },
        }).concat(walletsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
