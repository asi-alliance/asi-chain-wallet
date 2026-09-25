import React, { useEffect } from "react";
import { Client, INetworkRecord } from "@asichain/asi-wallet-sdk";
import {
    getInitialNetwork,
    getNetworksEnvError,
    NETWORKS_CONFIG,
} from "constants/networks";

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
        });
    }

    return clientPromise;
};

interface ISdkClientProviderProps {
    onReady: (client: Client) => void;
    onError: (message: string) => void;
    children: React.ReactNode;
}

export const SdkClientProvider: React.FC<ISdkClientProviderProps> = ({
    onReady,
    onError,
    children,
}) => {
    useEffect(() => {
        let cancelled = false;

        initSdkClient()
            .then((client: Client) => {
                if (!cancelled) {
                    onReady(client);
                }
            })
            .catch((initError: unknown) => {
                console.error("Failed to initialize SDK client:", initError);

                if (!cancelled) {
                    onError(
                        initError instanceof Error
                            ? initError.message
                            : "Failed to initialize wallet SDK",
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [onReady, onError]);

    return <>{children}</>;
};
