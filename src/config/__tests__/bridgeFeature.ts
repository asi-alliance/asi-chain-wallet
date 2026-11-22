import {
    BridgeFeature,
    getBridgeConfiguration,
    resolveBridgeFeature,
    bridgeFeatureWarnings,
} from "../bridgeFeature";

const POLICY_ID = "a".repeat(56);

const bridgeEnv: NodeJS.ProcessEnv = {
    REACT_APP_BRIDGE_ENABLED: "true",
    REACT_APP_ASI_BRIDGE_URI:
        "rho:id:9j876bswk1dd99m7657ianiow4tgxj33r3oaq9rqyxj1cbzox6cdth",
    REACT_APP_ASI_CHAIN_ID: "100",
    REACT_APP_SEPOLIA_BRIDGE_ADDRESS: "0x0000000000000000000000000000000000000001",
    REACT_APP_SEPOLIA_TOKEN_ADDRESS: "0x0000000000000000000000000000000000000002",
    REACT_APP_BASE_SEPOLIA_BRIDGE_ADDRESS: "0x0000000000000000000000000000000000000003",
    REACT_APP_BASE_SEPOLIA_TOKEN_ADDRESS: "0x0000000000000000000000000000000000000004",
    REACT_APP_FETCHHUB_DORADO_ROUTE_ID: "4361",
    REACT_APP_FETCHHUB_DORADO_CHAIN_ID: "dorado-1",
    REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS:
        "fetch133z0cwzwmrmmck3c0jgg9g3lfk2gqnkvgyjcnqlxa655xqpyxldszczv8t",
    REACT_APP_FETCHHUB_DORADO_DENOM: "atestfet",
    REACT_APP_FETCHHUB_DORADO_RPC_URL: "https://rpc-dorado.fetch.ai:443",
    REACT_APP_FETCHHUB_DORADO_REST_URL: "https://rest-dorado.fetch.ai:443",
    REACT_APP_CARDANO_PREPROD_ROUTE_ID: "181501",
    REACT_APP_CARDANO_PREPROD_NETWORK_ID: "preprod",
    REACT_APP_CARDANO_PREPROD_NETWORK_MAGIC: "1",
    REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS:
        "addr_test1wpa3uz0pr7ysg64pvz2hdr5g20s5ruwt3zgf3dxk8qpkjjc5xcrsg",
    REACT_APP_CARDANO_PREPROD_POLICY_ID: POLICY_ID,
    REACT_APP_CARDANO_PREPROD_ASSET_NAME: "415349",
    REACT_APP_CARDANO_PREPROD_KOIOS_URL: "https://preprod.koios.rest/api/v1",
};

const issuesOf = (env: NodeJS.ProcessEnv): string[] => {
    const feature = resolveBridgeFeature(env);
    if (feature.status !== "invalid") {
        throw new Error(`Expected an invalid Bridge feature, got ${feature.status}`);
    }
    return feature.issues;
};

test("Bridge is disabled by default and accepts explicit off values", () => {
    expect(resolveBridgeFeature({})).toEqual({ status: "disabled" });
    for (const value of ["false", "0", "no", "  FALSE  ", ""]) {
        expect(
            resolveBridgeFeature({
                ...bridgeEnv,
                REACT_APP_BRIDGE_ENABLED: value,
            }),
        ).toEqual({ status: "disabled" });
    }
});

test("Bridge accepts trimmed, case-insensitive true values", () => {
    for (const value of ["true", " TRUE ", "1", "Yes"]) {
        expect(
            resolveBridgeFeature({
                ...bridgeEnv,
                REACT_APP_BRIDGE_ENABLED: value,
            }),
        ).toMatchObject({ status: "ready" });
    }
});

test("Bridge reports an unrecognised flag value instead of silently disabling", () => {
    const issues = issuesOf({
        ...bridgeEnv,
        REACT_APP_BRIDGE_ENABLED: "on",
    });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('Received "on"');
});

test("Bridge collects every missing field, not only the first one", () => {
    const issues = issuesOf({ REACT_APP_BRIDGE_ENABLED: "true" });

    expect(issues.length).toBeGreaterThan(1);
    expect(issues.join("\n")).toContain("REACT_APP_ASI_BRIDGE_URI");
    expect(issues.join("\n")).toContain("REACT_APP_ASI_CHAIN_ID");
    expect(issues.join("\n")).toContain("REACT_APP_SEPOLIA_BRIDGE_ADDRESS");
    expect(issues.join("\n")).toContain(
        "REACT_APP_CARDANO_PREPROD_KOIOS_URL",
    );
});

test("Bridge rejects route ids that are not non-negative integers", () => {
    for (const value of ["invalid", "100.5", "-1"]) {
        expect(
            issuesOf({ ...bridgeEnv, REACT_APP_ASI_CHAIN_ID: value }),
        ).toContain(
            "Set REACT_APP_ASI_CHAIN_ID to a non-negative integer route id to enable Bridge.",
        );
    }
    expect(
        resolveBridgeFeature({ ...bridgeEnv, REACT_APP_ASI_CHAIN_ID: "0" }),
    ).toMatchObject({ status: "ready" });
});

test("Bridge rejects malformed EVM addresses", () => {
    expect(
        issuesOf({ ...bridgeEnv, REACT_APP_SEPOLIA_BRIDGE_ADDRESS: "0x123" }),
    ).toContain(
        "Set REACT_APP_SEPOLIA_BRIDGE_ADDRESS to a 0x-prefixed 20-byte address to enable Bridge.",
    );
});

test("Bridge checks address and URI prefixes", () => {
    expect(
        issuesOf({ ...bridgeEnv, REACT_APP_ASI_BRIDGE_URI: "https://example" }),
    ).toContain(
        "Set REACT_APP_ASI_BRIDGE_URI to a rho:id:... URI to enable Bridge.",
    );
    expect(
        issuesOf({
            ...bridgeEnv,
            REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS: "0x123",
        }),
    ).toContain(
        "Set REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS to a fetch1... address to enable Bridge.",
    );
    expect(
        issuesOf({
            ...bridgeEnv,
            REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS: "0x123",
        }),
    ).toContain(
        "Set REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS to a Preprod address starting with addr_test1 to enable Bridge.",
    );
});

test("Bridge requires a Koios endpoint and an http(s) URL", () => {
    expect(
        issuesOf({ ...bridgeEnv, REACT_APP_CARDANO_PREPROD_KOIOS_URL: "" }),
    ).toContain(
        "Set REACT_APP_CARDANO_PREPROD_KOIOS_URL to an http(s) URL to enable Bridge.",
    );
    expect(
        issuesOf({
            ...bridgeEnv,
            REACT_APP_CARDANO_PREPROD_KOIOS_URL: "preprod.koios.rest",
        }),
    ).toContain(
        "Set REACT_APP_CARDANO_PREPROD_KOIOS_URL to an http(s) URL to enable Bridge.",
    );
});

test("Bridge returns parsed configuration for an enabled, configured build", () => {
    expect(resolveBridgeFeature(bridgeEnv)).toEqual({
        status: "ready",
        config: {
            asi: {
                bridgeUri:
                    "rho:id:9j876bswk1dd99m7657ianiow4tgxj33r3oaq9rqyxj1cbzox6cdth",
                routeId: 100,
            },
            sepolia: {
                bridge: bridgeEnv.REACT_APP_SEPOLIA_BRIDGE_ADDRESS,
                token: bridgeEnv.REACT_APP_SEPOLIA_TOKEN_ADDRESS,
            },
            baseSepolia: {
                bridge: bridgeEnv.REACT_APP_BASE_SEPOLIA_BRIDGE_ADDRESS,
                token: bridgeEnv.REACT_APP_BASE_SEPOLIA_TOKEN_ADDRESS,
            },
            fetchhubDorado: {
                routeId: 4361,
                chainId: "dorado-1",
                bridgeAddress:
                    bridgeEnv.REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS,
                denom: "atestfet",
                rpcUrl: "https://rpc-dorado.fetch.ai:443",
                restUrl: "https://rest-dorado.fetch.ai:443",
            },
            cardanoPreprod: {
                routeId: 181501,
                networkId: "preprod",
                networkMagic: 1,
                bridgeAddress:
                    bridgeEnv.REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS,
                assetPolicyId: POLICY_ID,
                assetName: "415349",
                koiosUrl: "https://preprod.koios.rest/api/v1",
            },
        },
    });
});

test("getBridgeConfiguration refuses a feature that is not ready", () => {
    const disabled: BridgeFeature = { status: "disabled" };
    const invalid: BridgeFeature = {
        status: "invalid",
        issues: ["Set REACT_APP_ASI_CHAIN_ID to a non-negative integer route id to enable Bridge."],
    };

    expect(() => getBridgeConfiguration(disabled)).toThrow(
        "Bridge must be configured before loading its integrations.",
    );
    expect(() => getBridgeConfiguration(invalid)).toThrow(
        "REACT_APP_ASI_CHAIN_ID",
    );
});

test("getBridgeConfiguration returns the parsed configuration when ready", () => {
    const feature = resolveBridgeFeature(bridgeEnv);
    expect(getBridgeConfiguration(feature)).toEqual(
        feature.status === "ready" ? feature.config : undefined,
    );
});

test("Bridge warns when variables are set but the flag is off", () => {
    const feature: BridgeFeature = { status: "disabled" };
    const warnings = bridgeFeatureWarnings(feature, {
        REACT_APP_ASI_BRIDGE_URI: "rho:id:test",
        REACT_APP_ASI_CHAIN_ID: "100",
    });

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("REACT_APP_ASI_BRIDGE_URI");
    expect(warnings[0]).toContain("REACT_APP_BRIDGE_ENABLED is off");
    expect(bridgeFeatureWarnings(feature, {})).toEqual([]);
});
