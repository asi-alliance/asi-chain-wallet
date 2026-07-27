// import { Client, IClientEventDispatcher } from "@asichain/asi-wallet-sdk";
// import { DEFAULT_NETWORK, NETWORKS_CONFIG } from "./networksConfig";

// let clientPromise: Promise<Client> | null = null;
// let clientInstance: Client | null = null;

// export const getOrCreateSdkClient = (
//     eventDispatcher?: IClientEventDispatcher,
// ): Promise<Client> => {
//     if (!clientPromise) {
//         clientPromise = Client.create({
//             networksConfig: NETWORKS_CONFIG,
//             defaultNetwork: DEFAULT_NETWORK,
//             eventDispatcher,
//         }).then((client) => {
//             clientInstance = client;
//             return client;
//         });
//     }

//     return clientPromise;
// };

// export const getSdkClient = (): Client | null => clientInstance;
