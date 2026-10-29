/// <reference types="vite/client" />

interface ViteTypeOptions {
    strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
    readonly VITE_NETWORKS: string;

    readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
    readonly VITE_CAPTCHA_TOKEN?: string;
    readonly VITE_JSAPI_URL?: string;
    readonly VITE_EXPLORER_URL?: string;
    readonly VITE_FAUCET_URL?: string;
    readonly VITE_FEEDBACK_FORM_URL?: string;

    readonly VITE_ASI_CHAIN_ID: string;
    readonly VITE_ASI_BRIDGE_URI: string;

    readonly VITE_SEPOLIA_BRIDGE_ADDRESS: string;
    readonly VITE_SEPOLIA_TOKEN_ADDRESS: string;
    readonly VITE_BASE_SEPOLIA_BRIDGE_ADDRESS: string;
    readonly VITE_BASE_SEPOLIA_TOKEN_ADDRESS: string;

    readonly VITE_FETCHHUB_DORADO_ROUTE_ID: string;
    readonly VITE_FETCHHUB_DORADO_CHAIN_ID: string;
    readonly VITE_FETCHHUB_DORADO_BRIDGE_ADDRESS: string;
    readonly VITE_FETCHHUB_DORADO_DENOM: string;
    readonly VITE_FETCHHUB_DORADO_RPC_URL: string;
    readonly VITE_FETCHHUB_DORADO_REST_URL: string;

    readonly VITE_CARDANO_PREPROD_ROUTE_ID: string;
    readonly VITE_CARDANO_PREPROD_NETWORK_ID: string;
    readonly VITE_CARDANO_PREPROD_NETWORK_MAGIC: string;
    readonly VITE_CARDANO_PREPROD_BRIDGE_ADDRESS: string;
    readonly VITE_CARDANO_PREPROD_POLICY_ID: string;
    readonly VITE_CARDANO_PREPROD_ASSET_NAME: string;
    readonly VITE_CARDANO_PREPROD_KOIOS_URL?: string;
}
