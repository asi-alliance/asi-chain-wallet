import { Client, NetworkId } from "@asichain/asi-wallet-sdk";
import { TAppThunk } from "store/appThunk";
import {
    busyNetworksSynced,
    networkBusyChanged,
} from "store/NetworkActivity";
import { sdkClientReady, selectIsSdkClientReady } from "store/SdkClient";
import { networksStateChanged } from "store/WalletsStore";
import { initializeNetworks } from "store/WalletsStore/thunks";
import { INetworksStateMeta } from "types/wallet";

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

        walletService.onNetworksChanged(
            (networksState: INetworksStateMeta) => {
                dispatch(networksStateChanged(networksState));
            },
        );

        dispatch(busyNetworksSynced(walletService.getBusyNetworkIds()));
        dispatch(networksStateChanged(walletService.getNetworksState()));
        dispatch(initializeNetworks());
        dispatch(sdkClientReady());
    };
