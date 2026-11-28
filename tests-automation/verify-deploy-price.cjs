const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { ec: EC } = require("elliptic");
const { blake2b } = require("blakejs");
const { ApiServiceRegistry, Client, SignerService } = require("@asichain/asi-wallet-sdk");

require("ts-node").register({ transpileOnly: true, compilerOptions: { module: "CommonJS" } });
const { SdkWalletService } = require("../src/sdk/SdkWalletService");

test("deploy signs the confirmed price and reserves the same maximum charge", async (t) => {
    const directory = await mkdtemp(join(tmpdir(), "wallet-deploy-price-"));
    const endpoint = "http://127.0.0.1:1";
    const client = await Client.create({
        networksConfig: { Test: { ValidatorURL: endpoint, ReadOnlyURL: endpoint, IndexerURL: endpoint,
            nodeApiProfile: "rust" } },
        defaultNetwork: "Test",
        storageOptions: { nodeStorageDir: directory },
    });
    t.after(async () => {
        await client.close();
        await rm(directory, { recursive: true, force: true });
    });
    const wallet = await client.createPrivateKeyWallet(
        { privateKey: client.generatePrivateKey(), accountName: "Signing test" }, "test-password",
    );
    const service = new SdkWalletService();
    service.attachClient(client);
    const registry = ApiServiceRegistry.getInstance();
    t.mock.method(registry.blocks, "getLatestBlockNumber", async () => 5);
    t.mock.method(registry.assets, "getBalance", async () => ({ amount: 10n ** 26n }));
    const submitted = t.mock.method(registry.transactions, "submitSignedDeploy", async (signed) => signed.signature);
    const ec = new EC("secp256k1");
    for (const confirmedPrice of ["100000000000", "100000000001", "9007199254740993"]) {
        const { deployId } = await service.deploy({
            walletId: wallet.getId(), accountId: wallet.getAccounts()[0].getId(), term: "Nil",
            phloLimit: 1000, phloPrice: confirmedPrice,
        }, "test-password");
        const signed = submitted.mock.calls.at(-1).arguments[0];
        assert.equal(signed.signature, deployId);
        assert.equal(String(signed.data.phloPrice), confirmedPrice);
        const verify = (data) => {
            const bytes = SignerService.deployDataUint256ProtobufSerialize(data);
            return ec.verify(blake2b(bytes, undefined, 32), signed.signature, signed.deployer, "hex");
        };
        assert.ok(verify(signed.data));
        assert.equal(verify({ ...signed.data, phloPrice: 1 }), false);
        const reservations = await client.getReservations(wallet.getId());
        const reservation = reservations.find(({ details }) => details.deployId === deployId);
        assert.equal(BigInt(reservation.pendingAmount), 1000n * BigInt(confirmedPrice));
    }
});
