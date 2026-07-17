import { Network } from "types/wallet";

interface NetworkConfig {
    name: string;
    ValidatorURL: string;
    ReadOnlyURL?: string;
    IndexerURL?: string;
}

export const parseNetworksFromEnv = (): Network[] => {
    const networks: Network[] = [];

    try {
        const networksEnv = process.env.NETWORKS;

        if (!networksEnv) {
            console.warn(
                "NETWORKS environment variable is not set. Using empty networks.",
            );
            return networks;
        }

        const config = JSON.parse(networksEnv) as Record<string, NetworkConfig>;

        Object.entries(config).forEach(([key, networkConfig]) => {
            if (!networkConfig) {
                return;
            }

            const id = key
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

            const validatorUrl = networkConfig.ValidatorURL?.trim() || "";
            if (!validatorUrl) {
                console.warn(
                    `[parseNetworksFromEnv] Skipping network "${key}" because ValidatorURL is empty`,
                );
                return;
            }

            const graphqlUrl = networkConfig.IndexerURL?.trim() || undefined;

            networks.push({
                id,
                name: networkConfig.name || key,
                url: validatorUrl,
                readOnlyUrl: networkConfig.ReadOnlyURL?.trim() || undefined,
                graphqlUrl,
                shardId: "root",
            });
        });
    } catch (error) {
        console.error("Failed to parse NETWORKS:", error);
    }

    return networks;
};