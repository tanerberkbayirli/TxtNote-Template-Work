import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  assertOwnerMatches,
  canAdoptLocalOwner,
  ownerBindingMessage,
  verifyOwnershipProof,
} from "./dbOwner.js";
import { LOCAL_KEYRING_PROVIDER_ID } from "../wallet/index.js";

describe("database owner binding", () => {
  it("pairs the SQLite owner row with the wallet address and signature", async () => {
    const account = privateKeyToAccount(generatePrivateKey());
    const ownershipProof = await account.signMessage({
      message: ownerBindingMessage(account.address),
    });
    const owner = {
      walletAddress: account.address,
      publicKey: account.publicKey,
      ownershipProof,
    };

    assert.equal(assertOwnerMatches(owner, account.address), owner);
    await verifyOwnershipProof(owner);
    assert.equal(owner.publicKey, account.publicKey);
  });

  it("rejects a different wallet and a forged proof", async () => {
    const ownerAccount = privateKeyToAccount(generatePrivateKey());
    const other = privateKeyToAccount(generatePrivateKey());
    const owner = {
      walletAddress: ownerAccount.address,
      ownershipProof: await ownerAccount.signMessage({
        message: ownerBindingMessage(ownerAccount.address),
      }),
    };

    assert.throws(() => assertOwnerMatches(owner, other.address), /başka bir cüzdana/);

    const forged = {
      walletAddress: ownerAccount.address,
      ownershipProof: await other.signMessage({
        message: ownerBindingMessage(ownerAccount.address),
      }),
    };
    await assert.rejects(() => verifyOwnershipProof(forged), /sahiplik imzası/);
    assert.equal(canAdoptLocalOwner(LOCAL_KEYRING_PROVIDER_ID), true);
    assert.equal(canAdoptLocalOwner("privy"), false);
  });
});
