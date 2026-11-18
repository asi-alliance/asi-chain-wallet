const requireString = (env: NodeJS.ProcessEnv, key: string): string => {
    const value = env[key]?.trim();
    if (!value) {
        throw new Error(`Set ${key} to enable Bridge.`);
    }
    return value;
};

const requireNumber = (env: NodeJS.ProcessEnv, key: string): number => {
    const value = Number(requireString(env, key));
    if (!Number.isFinite(value)) {
        throw new Error(`Set ${key} to a valid number to enable Bridge.`);
    }
    return value;
};

const readBridgeConfiguration = (env: NodeJS.ProcessEnv) => ({
    asi: {
        bridgeUri: requireString(env, "REACT_APP_ASI_BRIDGE_URI"),
        routeId: requireNumber(env, "REACT_APP_ASI_CHAIN_ID"),
    },
    sepolia: {
        bridge: requireString(env, "REACT_APP_SEPOLIA_BRIDGE_ADDRESS"),
        token: requireString(env, "REACT_APP_SEPOLIA_TOKEN_ADDRESS"),
    },
    baseSepolia: {
        bridge: requireString(env, "REACT_APP_BASE_SEPOLIA_BRIDGE_ADDRESS"),
        token: requireString(env, "REACT_APP_BASE_SEPOLIA_TOKEN_ADDRESS"),
    },
    fetchhubDorado: {
        routeId: requireNumber(env, "REACT_APP_FETCHHUB_DORADO_ROUTE_ID"),
        chainId: requireString(env, "REACT_APP_FETCHHUB_DORADO_CHAIN_ID"),
        bridgeAddress: requireString(env, "REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS"),
        denom: requireString(env, "REACT_APP_FETCHHUB_DORADO_DENOM"),
        rpcUrl: requireString(env, "REACT_APP_FETCHHUB_DORADO_RPC_URL"),
        restUrl: requireString(env, "REACT_APP_FETCHHUB_DORADO_REST_URL"),
    },
    cardanoPreprod: {
        routeId: requireNumber(env, "REACT_APP_CARDANO_PREPROD_ROUTE_ID"),
        networkId: requireString(env, "REACT_APP_CARDANO_PREPROD_NETWORK_ID"),
        networkMagic: requireNumber(env, "REACT_APP_CARDANO_PREPROD_NETWORK_MAGIC"),
        bridgeAddress: requireString(env, "REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS"),
        assetPolicyId: requireString(env, "REACT_APP_CARDANO_PREPROD_POLICY_ID"),
        assetName: requireString(env, "REACT_APP_CARDANO_PREPROD_ASSET_NAME"),
    },
});

type BridgeConfiguration = ReturnType<typeof readBridgeConfiguration>;

type BridgeFeature =
    | { status: "disabled" }
    | { status: "invalid"; message: string }
    | { status: "ready"; config: BridgeConfiguration };

export const resolveBridgeFeature = (env: NodeJS.ProcessEnv): BridgeFeature => {
    if (env.REACT_APP_BRIDGE_ENABLED !== "true") {
        return { status: "disabled" };
    }

    try {
        return { status: "ready", config: readBridgeConfiguration(env) };
    } catch (error) {
        return {
            status: "invalid",
            message: error instanceof Error ? error.message : "Check the Bridge configuration.",
        };
    }
};

export const bridgeFeature = resolveBridgeFeature(process.env);

export const getBridgeConfiguration = (): BridgeConfiguration => {
    if (bridgeFeature.status !== "ready") {
        throw new Error("Bridge must be configured before loading its integrations.");
    }
    return bridgeFeature.config;
};
