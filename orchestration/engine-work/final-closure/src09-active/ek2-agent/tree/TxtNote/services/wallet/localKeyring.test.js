import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocalWalletProvider, WALLET_SECRET_ACCOUNT } from "./localKeyring.js";

const memoryStore = () => {
  const secrets = new Map();
  return {
    secrets,
    async load(account) {
      return secrets.get(account) ?? null;
    },
    async save(account, secret) {
      secrets.set(account, secret);
    },
  };
};

describe("local keyring wallet", () => {
  it("does not silently replace a corrupt stored key or hide persistence failure", async () => {
    const store = memoryStore();
    store.secrets.set(WALLET_SECRET_ACCOUNT, "broken");
    const provider = createLocalWalletProvider({ store, allowEphemeral: false });
    await assert.rejects(() => provider.ensure(), /okunamadı/);
    assert.equal(store.secrets.get(WALLET_SECRET_ACCOUNT), "broken");
    store.secrets.clear();
    store.save = async () => { throw new Error("store unavailable"); };
    await assert.rejects(() => provider.ensure(), /store unavailable/);
    await assert.rejects(() => provider.importSecretForTest(`0x${"1".repeat(64)}`), /store unavailable/);
    assert.throws(() => provider.exportSecretForTest(), /kilitli/);
  });

  it("uses one identity for concurrent startup callers and retains an imported key after restart", async () => {
    const store = memoryStore();
    let writes = 0;
    const save = store.save;
    store.save = async (...args) => { writes++; await save(...args); };
    const provider = createLocalWalletProvider({ store, allowEphemeral: false });
    const [meta, address, publicKey] = await Promise.all([
      provider.ensure(), provider.getAddress(), provider.getPublicKey(), provider.signMessage("test"),
    ]);
    assert.equal(writes, 1);
    assert.equal(meta.address, address);
    assert.equal(publicKey, await provider.getPublicKey());
    const importedKey = `0x${"2".repeat(64)}`;
    const imported = await provider.importSecretForTest(importedKey);
    const restarted = createLocalWalletProvider({ store, allowEphemeral: false });
    assert.equal((await restarted.ensure()).address, imported.address);
    assert.equal(restarted.exportSecretForTest(), importedKey);
  });
  it("creates a real secp256k1 account and rebuilds it from the store", async () => {
    const store = memoryStore();
    const first = createLocalWalletProvider({ store });
    const created = await first.ensure();

    assert.match(created.address, /^0x[a-fA-F0-9]{40}$/);
    assert.equal(created.created, true);
    assert.equal(store.secrets.has(WALLET_SECRET_ACCOUNT), true);
    assert.equal(JSON.stringify(created).includes("private"), false);

    first.lock();
    const second = createLocalWalletProvider({ store });
    const restored = await second.ensure();
    assert.equal(restored.created, false);
    assert.equal(restored.address, created.address);

    const again = await first.signMessage("TxtNote Vault Key v1");
    const copy = await second.signMessage("TxtNote Vault Key v1");
    assert.equal(again, copy);
    assert.match(again, /^0x[0-9a-fA-F]+$/);

    const secret = second.exportSecretForTest();
    assert.match(secret, /^0x[0-9a-fA-F]{64}$/);
    assert.equal(JSON.stringify(restored).includes(secret.slice(2)), false);

    const { privateKeyToAccount } = await import("viem/accounts");
    const publicKey = await second.getPublicKey();
    assert.equal(publicKey, privateKeyToAccount(secret).publicKey);
  });
});
