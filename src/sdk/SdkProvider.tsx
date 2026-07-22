import React, { createContext, useContext, useRef, useState } from "react";
import { Client } from "@asichain/asi-wallet-sdk";
import { useDisposableAsync } from "hooks/useDisposableAsync";
import { DEFAULT_NETWORK, NETWORKS_CONFIG } from "./networksConfig";

interface SdkContextValue {
    client: Client | null;
    isReady: boolean;
}

const SdkContext = createContext<SdkContextValue>({
    client: null,
    isReady: false,
});

const createSdkClient = (): Promise<Client> =>
    Client.create({
        networksConfig: NETWORKS_CONFIG,
        defaultNetwork: DEFAULT_NETWORK,
    });

export const SdkProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [client, setClient] = useState<Client | null>(null);
    const clientRef = useRef<Client | null>(null);

    useDisposableAsync(createSdkClient, {
        onResolve: (createdClient) => {
            setClient(createdClient);
            clientRef.current = createdClient;

            console.info(
                "[sdk] Client initialized. Networks:",
                createdClient.getNetworksNames(),
                "current:",
                createdClient.getCurrentNetwork(),
            );
        },
        onDispose: (createdClient) => {
            createdClient.close();
        },
        onError: (error) => {
            console.error("[sdk] Failed to initialize Client:", error);
        },
        onUnmount: () => {
            if (!clientRef.current) {
                return;
            }

            clientRef.current.close();
        },
    });

    return (
        <SdkContext.Provider value={{ client, isReady: client !== null }}>
            {children}
        </SdkContext.Provider>
    );
};

export const useSdk = (): SdkContextValue => useContext(SdkContext);
