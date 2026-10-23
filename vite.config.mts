import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, normalizePath, type Plugin } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "vite-plugin-wasm";
import {
    formatNetworksEnvIssue,
    getNetworksEnvErrorMessage,
    parseNetworksEnv,
} from "./src/config/networksEnv.ts";

const LOG_PREFIX = "[vite.config]";

const ROOT_DIR = fileURLToPath(new URL(".", import.meta.url));

const SRC_DIR = normalizePath(path.resolve(ROOT_DIR, "src"));

const NETWORKS_ENV_FILES = [".env.local", ".env"];

const NETWORKS_LINE_PATTERN = /^\s*NETWORKS\s*=(.*)$/m;

const SRC_MODULE_FILE_PATTERN = /^(?!.*\.d\.ts$).+\.tsx?$/;

const SRC_ROOT_ENTRIES = new Set(
    fs
        .readdirSync(SRC_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() || SRC_MODULE_FILE_PATTERN.test(entry.name))
        .map((entry) => (entry.isDirectory() ? entry.name : path.parse(entry.name).name)),
);

const NODE_PERSIST_STUB_ID = "\0node-persist-stub";

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

const unquoteNetworksEnv = (value: string): string => {
    const unquoted =
        value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;

    return unquoted
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\\\/g, "\\");
};

const readNetworksEnv = (): string | undefined => {
    for (const fileName of NETWORKS_ENV_FILES) {
        const filePath = path.resolve(ROOT_DIR, fileName);

        if (!fs.existsSync(filePath)) {
            continue;
        }

        const match = fs.readFileSync(filePath, "utf8").match(NETWORKS_LINE_PATTERN);

        if (match) {
            return unquoteNetworksEnv(match[1].trim());
        }
    }

    return process.env.NETWORKS;
};

const validateNetworksEnv = (networksEnv: string | undefined): void => {
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
        throw new Error(`${LOG_PREFIX} Invalid NETWORKS env config: ${networksEnvError}`);
    }

    console.log(`${LOG_PREFIX} Networks found:`, networks.map(({ id }) => id).join(", "));
};

export default defineConfig(() => {
    const networksEnv = readNetworksEnv();

    validateNetworksEnv(networksEnv);

    return {
        base: "./",
        envPrefix: "REACT_APP_",
        define: {
            "import.meta.env.NETWORKS": JSON.stringify(networksEnv || "{}"),
        },
        plugins: [
            srcBaseUrlAliases(),
            nodePersistStub(),
            react(),
            wasm(),
            nodePolyfills({
                include: ["buffer", "process", "crypto", "stream", "assert"],
                globals: { Buffer: true, process: true, global: true },
            }),
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
