import { Client, NetworkId } from "@asichain/asi-wallet-sdk";
import { TAppThunk } from "store/appThunk";
import {
    busyNetworksSynced,
    networkBusyChanged,
} from "store/NetworkActivity";
import { sdkClientReady, selectIsSdkClientReady } from "store/SdkClient";
import { initializeNetworks } from "store/WalletsStore/thunks";

export const connectSdkClient =
    (client: Client): TAppThunk =>
    (dispatch, getState, { walletService }) => {
        if (selectIsSdkClientReady(getState())) {
            return;
        }

        walletService.attachClient(client);

        walletService.onNetworkBusyChanged(
            (networkId: NetworkId, busy: boolean) => {
                dispatch(networkBusyChanged({ networkId, busy }));
            },
        );

        dispatch(busyNetworksSynced(walletService.getBusyNetworkIds()));
        dispatch(initializeNetworks());
        dispatch(sdkClientReady());
    };
