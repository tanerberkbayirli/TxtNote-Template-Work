import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { encryptText, deriveVaultKey } from "../crypto/vault.js";
import { setWalletProvider } from "../wallet/index.js";
import {
  buildEncryptedDbFile,
  encryptedDbFileName,
  verifyVaultUnlocksWithPrivateKey,
} from "./encryptedDbExport.js";

describe("encrypted DB desktop export", () => {
  it("checks every encrypted note, including a foreign vault after a valid one", async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const other = privateKeyToAccount(generatePrivateKey());
    const key = await deriveVaultKey((message) => account.signMessage({ message }));
    const foreignKey = await deriveVaultKey((message) => other.signMessage({ message }));
    const snapshot = { notes: {
      a: { vault: await encryptText("valid", key) },
      b: { vault: await encryptText("foreign", foreignKey) },
    } };
    await assert.rejects(() => verifyVaultUnlocksWithPrivateKey(snapshot, privateKey));
  });
  it("builds a desktop filename and round-trips SQLite payload with the wallet key", async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    setWalletProvider({
      ensure: async () => ({ address: account.address, created: false, providerId: "test", durable: true }),
      getAddress: async () => account.address,
      getPublicKey: async () => account.publicKey,
      signMessage: (message) => account.signMessage({ message }),
      isDurable: () => true,
      exportSecretForTest: () => privateKey,
    });

    const vault = await encryptText("gizli-not-govdesi", await (async () => {
      const { deriveVaultKey } = await import("../crypto/vault.js");
      return deriveVaultKey((message) => account.signMessage({ message }));
    })());

    const snapshot = {
      notes: {
        n1: { title: "", content: "", vault, walletAddress: account.address },
      },
    };

    assert.match(encryptedDbFileName("20260916-120700"), /^txtnote-encrypted-db-20260916-120700\.json$/);

    const dbOwner = {
      walletAddress: account.address,
      publicKey: account.publicKey,
    };

    const { pkg, verified, vaultVerified, payload } = await buildEncryptedDbFile({
      snapshot,
      privateKey,
      walletAddress: account.address,
      publicKey: account.publicKey,
      dbOwner,
    });

    assert.equal(verified, true);
    assert.equal(vaultVerified, true);
    assert.equal(pkg.headers.testPrivateKey, privateKey);
    assert.equal(pkg.headers.walletAddress, account.address);
    assert.equal(pkg.headers.publicKey, account.publicKey);
    assert.equal(payload.dbOwner.walletAddress, account.address);
    assert.equal(await verifyVaultUnlocksWithPrivateKey(snapshot, privateKey), true);
  });
});
