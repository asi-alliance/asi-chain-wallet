const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { Client } = require("@asichain/asi-wallet-sdk");

require("ts-node").register({ transpileOnly: true, compilerOptions: { module: "CommonJS" } });
const { SdkWalletService } = require("../src/sdk/SdkWalletService");
const { isPhloQuoteNetworkActive } = require("../src/store/WalletsStore/phloQuote");

const startStatusServer = async (status) => {
    const server = http.createServer((request, response) => {
        if (request.url === "/api/status") {
            response.setHeader("content-type", "application/json");
            response.end(JSON.stringify(status));
            return;
        }

        response.statusCode = 404;
        response.end();
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    return {
        server,
        url: `http://127.0.0.1:${server.address().port}`,
    };
};

const createService = async (validatorUrl, directory) => {
    const client = await Client.create({
        networksConfig: {
            Test: {
                ValidatorURL: validatorUrl,
                ReadOnlyURL: validatorUrl,
                IndexerURL: validatorUrl,
                nodeApiProfile: "rust",
            },
        },
        defaultNetwork: "Test",
        storageOptions: { nodeStorageDir: directory },
    });
    const service = new SdkWalletService();
    service.attachClient(client);

    return { client, service };
};

test("Phlo quote uses the validator minimum and caps the preferred limit", async (t) => {
    const { server, url } = await startStatusServer({
        minPhloPrice: "100000000000",
        maxPhloLimit: "4000000",
    });
    const directory = await mkdtemp(join(tmpdir(), "wallet-phlo-quote-"));
    const { client, service } = await createService(url, directory);

    t.after(async () => {
        await client.close();
        server.close();
        await rm(directory, { recursive: true, force: true });
    });

    assert.deepEqual(await service.getPhloQuote(), {
        phloLimit: 500000,
        phloPrice: "100000000000",
        gasReserve: "50000000000000000",
    });
    assert.deepEqual(await service.getPhloQuote(5000000000), {
        phloLimit: 4000000,
        phloPrice: "100000000000",
        gasReserve: "400000000000000000",
    });
});

test("Phlo quote keeps the preferred limit when the node reports no maximum", async (t) => {
    const { server, url } = await startStatusServer({ minPhloPrice: "1" });
    const directory = await mkdtemp(join(tmpdir(), "wallet-phlo-quote-"));
    const { client, service } = await createService(url, directory);

    t.after(async () => {
        await client.close();
        server.close();
        await rm(directory, { recursive: true, force: true });
    });

    assert.deepEqual(await service.getPhloQuote(5000000000), {
        phloLimit: 5000000000,
        phloPrice: "1",
        gasReserve: "5000000000",
    });
});

test("quote guard rejects a different validator for the same network", () => {
    const activeNetwork = {
        id: "Test",
        validatorUrl: "http://127.0.0.1:1",
    };

    assert.equal(
        isPhloQuoteNetworkActive(activeNetwork, {
            networkId: "Test",
            validatorUrl: activeNetwork.validatorUrl,
        }),
        true,
    );
    assert.equal(
        isPhloQuoteNetworkActive(activeNetwork, {
            networkId: "Test",
            validatorUrl: "http://127.0.0.1:2",
        }),
        false,
    );
    assert.equal(
        isPhloQuoteNetworkActive(activeNetwork, {
            networkId: "Other",
            validatorUrl: activeNetwork.validatorUrl,
        }),
        false,
    );
});
