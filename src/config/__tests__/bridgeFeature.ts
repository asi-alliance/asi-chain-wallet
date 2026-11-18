import { resolveBridgeFeature } from "../bridgeFeature";

const bridgeEnv: NodeJS.ProcessEnv = {
    REACT_APP_BRIDGE_ENABLED: "true",
    REACT_APP_ASI_BRIDGE_URI: "rho:id:test",
    REACT_APP_ASI_CHAIN_ID: "100",
    REACT_APP_SEPOLIA_BRIDGE_ADDRESS: "0x0000000000000000000000000000000000000001",
    REACT_APP_SEPOLIA_TOKEN_ADDRESS: "0x0000000000000000000000000000000000000002",
    REACT_APP_BASE_SEPOLIA_BRIDGE_ADDRESS: "0x0000000000000000000000000000000000000003",
    REACT_APP_BASE_SEPOLIA_TOKEN_ADDRESS: "0x0000000000000000000000000000000000000004",
    REACT_APP_FETCHHUB_DORADO_ROUTE_ID: "200",
    REACT_APP_FETCHHUB_DORADO_CHAIN_ID: "dorado-1",
    REACT_APP_FETCHHUB_DORADO_BRIDGE_ADDRESS: "fetch1example",
    REACT_APP_FETCHHUB_DORADO_DENOM: "atestfet",
    REACT_APP_FETCHHUB_DORADO_RPC_URL: "https://rpc.example",
    REACT_APP_FETCHHUB_DORADO_REST_URL: "https://rest.example",
    REACT_APP_CARDANO_PREPROD_ROUTE_ID: "300",
    REACT_APP_CARDANO_PREPROD_NETWORK_ID: "preprod",
    REACT_APP_CARDANO_PREPROD_NETWORK_MAGIC: "1",
    REACT_APP_CARDANO_PREPROD_BRIDGE_ADDRESS: "addr_test1example",
    REACT_APP_CARDANO_PREPROD_POLICY_ID: "example-policy",
    REACT_APP_CARDANO_PREPROD_ASSET_NAME: "example-asset",
};

test("Bridge is disabled by default and can be explicitly disabled", () => {
    expect(resolveBridgeFeature({})).toEqual({ status: "disabled" });
    expect(
        resolveBridgeFeature({ ...bridgeEnv, REACT_APP_BRIDGE_ENABLED: "false" }),
    ).toEqual({ status: "disabled" });
});

test("Bridge reports a missing required field for an opted-in build", () => {
    expect(resolveBridgeFeature({ REACT_APP_BRIDGE_ENABLED: "true" })).toEqual({
        status: "invalid",
        message: "Set REACT_APP_ASI_BRIDGE_URI to enable Bridge.",
    });
});

test("Bridge reports numeric configuration errors without throwing", () => {
    expect(
        resolveBridgeFeature({ ...bridgeEnv, REACT_APP_ASI_CHAIN_ID: "invalid" }),
    ).toEqual({
        status: "invalid",
        message: "Set REACT_APP_ASI_CHAIN_ID to a valid number to enable Bridge.",
    });
});

test("Bridge returns parsed configuration for an enabled, configured build", () => {
    expect(resolveBridgeFeature(bridgeEnv)).toMatchObject({
        status: "ready",
        config: {
            asi: { bridgeUri: "rho:id:test", routeId: 100 },
            sepolia: { bridge: bridgeEnv.REACT_APP_SEPOLIA_BRIDGE_ADDRESS },
            baseSepolia: { token: bridgeEnv.REACT_APP_BASE_SEPOLIA_TOKEN_ADDRESS },
            fetchhubDorado: { routeId: 200, chainId: "dorado-1" },
            cardanoPreprod: { routeId: 300, networkMagic: 1 },
        },
    });
});
