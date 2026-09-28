import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  decryptDatabaseSnapshot,
  encryptDatabaseSnapshot,
  exportContainsPlaintext,
  verifyEncryptedDbRoundtrip,
} from "./encryptedDb.js";

describe("encrypted DB export", () => {
  it("encrypts a snapshot with AES-256-GCM and decrypts it via the embedded test key", async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const snapshot = {
      workspaces: [{ id: "w1", name: "Okul" }],
      notes: { n1: { title: "Ders", content: "gizli-db-icerigi", walletAddress: account.address } },
    };

    const pkg = await encryptDatabaseSnapshot(snapshot, {
      privateKey,
      walletAddress: account.address,
      testEmbedPrivateKey: true,
    });

    assert.equal(pkg.v, 1);
    assert.equal(pkg.kind, "txtnote-encrypted-db");
    assert.equal(pkg.headers.alg, "AES-256-GCM");
    assert.equal(pkg.headers.walletAddress, account.address);
    assert.equal(pkg.headers.publicKey, account.publicKey);
    assert.equal(pkg.headers.testMode, true);
    assert.equal(pkg.headers.testPrivateKey, privateKey);
    assert.equal(exportContainsPlaintext(pkg, "gizli-db-icerigi"), false);
    assert.equal(await verifyEncryptedDbRoundtrip(pkg, snapshot), true);

    const opened = await decryptDatabaseSnapshot(pkg);
    assert.equal(opened.notes.n1.content, "gizli-db-icerigi");
    assert.equal(opened.notes.n1.walletAddress, account.address);
  });

  it("rejects encrypting when the private key does not match the public address", async () => {
    await assert.rejects(
      () =>
        encryptDatabaseSnapshot(
          { notes: {} },
          {
            privateKey: generatePrivateKey(),
            walletAddress: "0x" + "11".repeat(20),
          },
        ),
      /ait değil/,
    );
  });

  it("rejects decryption with a different private key", async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const snapshot = { notes: { n1: { content: "sadece-sahip" } } };
    const pkg = await encryptDatabaseSnapshot(snapshot, {
      privateKey,
      walletAddress: account.address,
      testEmbedPrivateKey: false,
    });
    assert.equal(pkg.headers.testPrivateKey, undefined);
    assert.equal(pkg.headers.publicKey, account.publicKey);
    await assert.rejects(() => decryptDatabaseSnapshot(pkg, generatePrivateKey()));
  });
});
