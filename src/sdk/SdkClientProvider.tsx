import React, { createContext, useContext, useEffect, useState } from "react";
import { setSdkClient } from "./client";
import { SdkWalletService } from "./SdkWalletService";
import { TCustomNetwork } from "types/wallet";
import { useDispatch } from "react-redux";
import { addNetworks } from "store/WalletsStore";
import {
    Client,
    ClientEvent,
    INetworkRecord,
    NetworkId,
    TUnsubscribe,
} from "@asichain/asi-wallet-sdk";
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
        }).then((client) => {
            setSdkClient(client);

            return client;
        });
    }

    return clientPromise;
};

interface ISdkClientContextValue {
    client: Client | null;
    isReady: boolean;
    isNetworkBusy: boolean;
}

type TSdkClientReturnedValue = ISdkClientContextValue & {
    client: Client;
};

const SdkClientContext = createContext<ISdkClientContextValue | null>(null);

export const SdkClientProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const dispatch = useDispatch();

    const [client, setClient] = useState<Client | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isNetworkBusy, setIsNetworkBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;

        initSdkClient()
            .then((client) => {
                if (cancelled) {
                    return;
                }

                const storageCustomNetworks: TCustomNetwork[] =
                    SdkWalletService.getCustomNetworks();

                dispatch(addNetworks(storageCustomNetworks));

                setClient(client);
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
    }, [dispatch]);

    useEffect(() => {
        if (!client) {
            return;
        }

        const eventBus = client.getEventBus();

        const unsubscribes: TUnsubscribe[] = [
            eventBus.on(
                ClientEvent.NETWORK_BUSY_CHANGED,
                (_networkId: NetworkId, busy: boolean) => {
                    setIsNetworkBusy(busy);
                },
            ),
        ];

        return () => {
            for (const unsubscribe of unsubscribes) {
                unsubscribe();
            }
        };
    }, [client]);

    if (!isReady) {
        return null;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <SdkClientContext.Provider
            value={{
                client,
                isReady,
                isNetworkBusy,
            }}
        >
            {children}
        </SdkClientContext.Provider>
    );
};

export const useSdkClient = (): TSdkClientReturnedValue => {
    const context: ISdkClientContextValue | null = useContext(SdkClientContext);

    if (!context || !context.client) {
        throw new Error(
            "useSdkClient must be used inside SdkClientProvider and after client initialization",
        );
    }

    return context as TSdkClientReturnedValue;
};
