import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { setSdkClient } from "./client";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store";
import { initializeNetworks } from "store/WalletsStore/thunks";
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
    busyNetworkIds: NetworkId[];
}

type TSdkClientReturnedValue = ISdkClientContextValue & {
    client: Client;
};

const SdkClientContext = createContext<ISdkClientContextValue | null>(null);

export const SdkClientProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const dispatch = useDispatch<AppDispatch>();

    const [client, setClient] = useState<Client | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busyNetworkIds, setBusyNetworkIds] = useState<NetworkId[]>([]);

    useEffect(() => {
        let cancelled = false;

        initSdkClient()
            .then((client) => {
                if (cancelled) {
                    return;
                }

                dispatch(initializeNetworks());

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
                (networkId: NetworkId, busy: boolean) => {
                    setBusyNetworkIds((previousBusyNetworkIds: NetworkId[]) => {
                        const isAlreadyBusy =
                            previousBusyNetworkIds.includes(networkId);

                        if (busy) {
                            return isAlreadyBusy
                                ? previousBusyNetworkIds
                                : [...previousBusyNetworkIds, networkId];
                        }

                        return isAlreadyBusy
                            ? previousBusyNetworkIds.filter(
                                  (busyNetworkId: NetworkId) =>
                                      busyNetworkId !== networkId,
                              )
                            : previousBusyNetworkIds;
                    });
                },
            ),
        ];

        return () => {
            for (const unsubscribe of unsubscribes) {
                unsubscribe();
            }
        };
    }, [client]);

    const contextValue: ISdkClientContextValue = useMemo(
        () => ({
            client,
            isReady,
            busyNetworkIds,
        }),
        [client, isReady, busyNetworkIds],
    );

    if (error) {
        return <div>{error}</div>;
    }

    if (!isReady) {
        return null;
    }

    return (
        <SdkClientContext.Provider value={contextValue}>
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

export const useIsNetworkBusy = (networkId: NetworkId): boolean => {
    const { busyNetworkIds } = useSdkClient();

    return busyNetworkIds.includes(networkId);
};
