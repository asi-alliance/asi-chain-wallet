import React, { useRef, useState } from "react";
import { Client } from "@asichain/asi-wallet-sdk";
import { useDisposableAsync } from "hooks/useDisposableAsync";
import { setSdkClient } from "./client";
import { DEFAULT_NETWORK, NETWORKS_CONFIG } from "./networksConfig";

let clientPromise: Promise<Client> | null = null;

const initSdkClient = (): Promise<Client> => {
    if (!clientPromise) {
        clientPromise = Client.create({
            networksConfig: NETWORKS_CONFIG,
            defaultNetwork: DEFAULT_NETWORK,
            flags: {
                withInsensitiveCacheStorage: true,
            },
            security: {
                autoLockMs: 15 * 1000,
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
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clientRef = useRef<Client | null>(null);

    useDisposableAsync(initSdkClient, {
        onResolve: (client) => {
            clientRef.current = client;
            setIsReady(true);
        },
        onDispose: (client) => {
            client.close();
            clientPromise = null;
        },
        onUnmount: () => {
            clientRef.current?.close();
            clientPromise = null;
        },
        onError: (initError) => {
            console.error("Failed to initialize SDK client:", initError);

            setError(
                initError instanceof Error
                    ? initError.message
                    : "Failed to initialize wallet SDK",
            );
        },
    });

    if (error) {
        return <div>{error}</div>;
    }

    if (!isReady) {
        return null;
    }

    return <>{children}</>;
};
