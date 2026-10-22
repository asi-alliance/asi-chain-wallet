import { configureStore } from "@reduxjs/toolkit";
import walletReducer from "./WalletsStore";
import { walletsApi } from "./WalletsStore/api";
import themeReducer from "./themeSlice";
import authReducer from "./Auth/";
import networkOperationReducer from "./networkOperationSlice";

export const store = configureStore({
    reducer: {
        walletsStore: walletReducer,
        [walletsApi.reducerPath]: walletsApi.reducer,
        theme: themeReducer,
        auth: authReducer,
        networkOperation: networkOperationReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(walletsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
