import { Client } from "@asichain/asi-wallet-sdk";

let clientInstance: Client | null = null;

export const setSdkClient = (client: Client | null): void => {
    clientInstance = client;
};

export const getSdkClient = (): Client | null => clientInstance;

export const requireSdkClient = (): Client => {
    if (!clientInstance) {
        throw new Error("SDK client is not ready yet");
    }

    return clientInstance;
};
