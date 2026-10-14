import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { decryptText, deriveVaultKey, encryptText, isEncryptedBlob } from "./vault.js";

describe("vault crypto", () => {
  it("derives the same AES key from the same wallet signature", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const sign = (message) => account.signMessage({ message });
    const first = await deriveVaultKey(sign);
    const second = await deriveVaultKey(sign);
    const blob = await encryptText("gizli not", first);
    assert.equal(isEncryptedBlob(blob), true);
    assert.equal(blob.ciphertext.includes("gizli"), false);
    assert.equal(await decryptText(blob, first), "gizli not");
    assert.equal(await decryptText(blob, second), "gizli not");
  });
});
