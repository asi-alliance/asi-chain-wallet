import React, { createContext, useContext, useEffect, useState } from "react";
import { Client } from "@asichain/asi-wallet-sdk";
import { DEFAULT_NETWORK, NETWORKS_CONFIG } from "./networksConfig";

interface SdkContextValue {
    client: Client | null;
    isReady: boolean;
}

const SdkContext = createContext<SdkContextValue>({
    client: null,
    isReady: false,
});

export const SdkProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [client, setClient] = useState<Client | null>(null);

    useEffect(() => {
        if (client) {
            return;
        }

        Client.create({
            networksConfig: NETWORKS_CONFIG,
            defaultNetwork: DEFAULT_NETWORK,
        })
            .then((createdClient) => {
                setClient(createdClient);

                console.info(
                    "[sdk] Client initialized. Networks:",
                    createdClient.getNetworksNames(),
                    "current:",
                    createdClient.getCurrentNetwork(),
                );
            })
            .catch((error: unknown) => {
                console.error("[sdk] Failed to initialize Client:", error);
            });
    }, []);

    return (
        <SdkContext.Provider value={{ client, isReady: client !== null }}>
            {children}
        </SdkContext.Provider>
    );
};

export const useSdk = (): SdkContextValue => useContext(SdkContext);
