import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, normalizePath, type Plugin, type Rolldown } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "vite-plugin-wasm";
import {
    formatNetworksEnvIssue,
    getNetworksEnvErrorMessage,
    parseNetworksEnv,
} from "./src/config/networksEnv.ts";
import { BRIDGE_ENV_KEYS } from "./src/config/bridgeEnv.ts";

const LOG_PREFIX = "[vite.config]";

const ROOT_DIR = fileURLToPath(new URL(".", import.meta.url));

const SRC_DIR = normalizePath(path.resolve(ROOT_DIR, "src"));

const SRC_MODULE_FILE_PATTERN = /^(?!.*\.d\.ts$).+\.tsx?$/;

const SRC_ROOT_ENTRIES = new Set(
    fs
        .readdirSync(SRC_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() || SRC_MODULE_FILE_PATTERN.test(entry.name))
        .map((entry) => (entry.isDirectory() ? entry.name : path.parse(entry.name).name)),
);

const NODE_PERSIST_STUB_ID = "\0node-persist-stub";

const SERVICE_WORKER_SOURCE = path.resolve(SRC_DIR, "service-worker.js");

const SERVICE_WORKER_FILE_NAME = "service-worker.js";

const SERVICE_WORKER_STATIC_URLS = ["./", "./manifest.json", "./favicon.ico"];

const VENDOR_CHUNK_GROUPS = [
    { name: "monaco-editor", test: /[\\/]node_modules[\\/]monaco-editor[\\/]/, priority: 30 },
    { name: "ethers", test: /[\\/]node_modules[\\/]ethers[\\/]/, priority: 25 },
    { name: "walletconnect", test: /[\\/]node_modules[\\/]@walletconnect[\\/]/, priority: 25 },
    { name: "ledger", test: /[\\/]node_modules[\\/]@ledgerhq[\\/]/, priority: 25 },
    { name: "trezor", test: /[\\/]node_modules[\\/]@trezor[\\/]/, priority: 25 },
    {
        name: "react",
        test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-redux)[\\/]/,
        priority: 20,
    },
    { name: "redux", test: /[\\/]node_modules[\\/]@reduxjs[\\/]/, priority: 20 },
    {
        name: "crypto",
        test: /[\\/]node_modules[\\/](crypto-js|elliptic|ethereumjs-util|blakejs|blake2b|js-sha3)[\\/]/,
        priority: 20,
    },
    { name: "vendors", test: /[\\/]node_modules[\\/]/, priority: 10, minShareCount: 2 },
];

const srcBaseUrlAliases = (): Plugin => ({
    name: "src-base-url-aliases",
    enforce: "pre",
    resolveId(source, importer, options) {
        if (!importer || !normalizePath(importer).startsWith(SRC_DIR)) {
            return null;
        }

        const [rootSegment] = source.split("/");

        if (!SRC_ROOT_ENTRIES.has(rootSegment)) {
            return null;
        }

        return this.resolve(path.posix.join(SRC_DIR, source), importer, {
            ...options,
            skipSelf: true,
        });
    },
});

const nodePersistStub = (): Plugin => ({
    name: "node-persist-stub",
    enforce: "pre",
    resolveId(source) {
        return source === "node-persist" ? NODE_PERSIST_STUB_ID : null;
    },
    load(id) {
        return id === NODE_PERSIST_STUB_ID ? "export default {};" : null;
    },
});

const collectInitialFiles = (bundle: Rolldown.OutputBundle): string[] => {
    const files = new Set<string>();

    const visitChunk = (fileName: string): void => {
        const chunk = bundle[fileName];

        if (chunk?.type !== "chunk" || files.has(fileName)) {
            return;
        }

        files.add(fileName);
        chunk.viteMetadata?.importedCss.forEach((cssFileName) => files.add(cssFileName));
        chunk.imports.forEach(visitChunk);
    };

    Object.values(bundle).forEach((output) => {
        if (output.type === "chunk" && output.isEntry) {
            visitChunk(output.fileName);
        }
    });

    return [...files];
};

const serviceWorker = (): Plugin => ({
    name: "service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
        const precacheUrls = [
            ...SERVICE_WORKER_STATIC_URLS,
            ...collectInitialFiles(bundle).map((fileName) => `./${fileName}`),
        ];
        const buildId = createHash("sha256")
            .update(Object.keys(bundle).sort().join("\n"))
            .digest("hex")
            .slice(0, 12);

        this.emitFile({
            type: "asset",
            fileName: SERVICE_WORKER_FILE_NAME,
            source: fs
                .readFileSync(SERVICE_WORKER_SOURCE, "utf8")
                .replace("self.__SW_BUILD_ID", JSON.stringify(buildId))
                .replace("self.__SW_PRECACHE_URLS", JSON.stringify(precacheUrls)),
        });
    },
});

const validateNetworksEnv =(networksEnv: string | undefined): void => {
    const { networks, issues } = parseNetworksEnv(networksEnv);

    issues.forEach((issue) => {
        const text = `${LOG_PREFIX} ${formatNetworksEnvIssue(issue)}`;

        if (issue.level === "error") {
            console.error(text);

            return;
        }

        console.warn(text);
    });

    const networksEnvError = getNetworksEnvErrorMessage(issues);

    if (networksEnvError) {
        throw new Error(`${LOG_PREFIX} Invalid VITE_NETWORKS env config: ${networksEnvError}`);
    }

    console.log(`${LOG_PREFIX} Networks found:`, networks.map(({ id }) => id).join(", "));
};

const validateBridgeEnv = (env: Record<string, string>): void => {
    const missingKeys = Object.values(BRIDGE_ENV_KEYS).filter((key) => !env[key]?.trim());

    if (missingKeys.length) {
        throw new Error(`${LOG_PREFIX} Missing required env variables: ${missingKeys.join(", ")}`);
    }
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, ROOT_DIR);

    validateNetworksEnv(env.VITE_NETWORKS);
    validateBridgeEnv(env);

    return {
        base: "./",
        plugins: [
            srcBaseUrlAliases(),
            nodePersistStub(),
            react(),
            wasm(),
            nodePolyfills({
                include: ["buffer", "process", "crypto", "stream", "assert"],
                globals: { Buffer: true, process: true, global: true },
            }),
            serviceWorker(),
        ],
        resolve: {
            preserveSymlinks: true,
        },
        optimizeDeps: {
            exclude: ["@emurgo/cardano-serialization-lib-browser"],
            rolldownOptions: {
                plugins: [nodePersistStub()],
            },
        },
        server: {
            port: 3000,
        },
        build: {
            outDir: "build",
            target: "es2022",
            chunkSizeWarningLimit: 1000,
            rolldownOptions: {
                output: {
                    codeSplitting: {
                        minSize: 20000,
                        groups: VENDOR_CHUNK_GROUPS,
                    },
                },
            },
        },
    };
});
