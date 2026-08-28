import React, { useEffect, useState } from "react";
import { Client, INetworkRecord } from "@asichain/asi-wallet-sdk";
import {
    getInitialNetwork,
    getNetworksEnvError,
    NETWORKS_CONFIG,
} from "constants/networks";
import { setSdkClient } from "./client";
import { SdkWalletService } from "./SdkWalletService";
import { TCustomNetwork } from "types/wallet";
import { useDispatch } from "react-redux";
import { addNetworks } from "store/WalletsStore";

let clientPromise: Promise<Client> | null = null;

const initSdkClient = (): Promise<Client> => {
    const networksEnvError = getNetworksEnvError();

    if (networksEnvError) {
        return Promise.reject(new Error(networksEnvError));
    }

    if (!clientPromise) {
        clientPromise = Client.create({
            networksConfig: NETWORKS_CONFIG,
            defaultNetwork: getInitialNetwork().id,
            security: {
                autoLockMs: 15 * 1000,
            },
            eventDispatcher: {
                onNetworkChanged: (network: INetworkRecord) => {
                    console.info("SDK network changed:", network.id);
                },
            },
        }).then((client) => {
            setSdkClient(client);
            return client;
        });
    }

    return clientPromise;
};

export const SdkClientProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const dispatch = useDispatch();

    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        initSdkClient()
            .then(() => {
                if (cancelled) {
                    return;
                }

                const storageCustomNetworks: TCustomNetwork[] =
                    SdkWalletService.getCustomNetworks();

                dispatch(addNetworks(storageCustomNetworks));

                setIsReady(true);
            })
            .catch((initError: unknown) => {
                console.error("Failed to initialize SDK client:", initError);

                if (cancelled) {
                    return;
                }

                setError(
                    initError instanceof Error
                        ? initError.message
                        : "Failed to initialize wallet SDK",
                );
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    if (!isReady) {
        return null;
    }

    return <>{children}</>;
};
