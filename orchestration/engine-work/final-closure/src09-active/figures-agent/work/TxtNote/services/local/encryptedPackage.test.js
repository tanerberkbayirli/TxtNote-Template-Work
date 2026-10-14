import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { deriveVaultKey, unlockVault } from "../crypto/vault.js";
import { setWalletProvider } from "../wallet/index.js";
import { buildEncryptedPackage, packageContainsPlaintext } from "./encryptedPackage.js";

describe("encrypted package", () => {
  it("encrypts note text and stamps the wallet address", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    setWalletProvider({
      ensure: async () => ({ address: account.address, created: false, providerId: "test", durable: true }),
      getAddress: async () => account.address,
      signMessage: (message) => account.signMessage({ message }),
      isDurable: () => true,
    });
    const key = await deriveVaultKey((message) => account.signMessage({ message }));
    // unlockVault uses the active provider; seed the same key path.
    await unlockVault();
    assert.ok(key);

    const pkg = await buildEncryptedPackage({
      workspace: { id: "ws-a", name: "Okul" },
      item: { id: "itm-n", title: "Ders", parentId: null },
      note: { title: "Ders", content: "gizli-paket-icerigi", revision: 2 },
      deviceUUID: "dev-1",
      walletAddress: account.address,
    });

    assert.equal(pkg.v, 1);
    assert.equal(pkg.walletAddress, account.address);
    assert.equal(pkg.deviceUUID, "dev-1");
    assert.equal(typeof pkg.packageUUID, "string");
    assert.ok(pkg.packageUUID);
    assert.notEqual(pkg.packageUUID, "itm-n");
    assert.equal(pkg.note.noteUUID, "itm-n");
    assert.equal(pkg.note.vault.v, 1);
    assert.equal(packageContainsPlaintext(pkg, "gizli-paket-icerigi"), false);
    assert.equal("content" in pkg.note, false);
  });
});
