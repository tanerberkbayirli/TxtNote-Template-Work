import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { encryptText, decryptText, deriveVaultKey, lockVault, unlockVault } from "../crypto/vault.js";
import { createLocalWalletProvider } from "../wallet/localKeyring.js";
import { clearSealedCache, sealNoteRecord, unsealNoteRecord } from "../crypto/envelope.js";
import { setWalletProvider } from "../wallet/index.js";
import {
  normalizePastedPrivateKey,
  openBlindServerPackage,
  previewNotesWithPrivateKey,
  privateKeyFileContents,
  restoreFromEncryptedPackage,
  sealBlindServerPackage,
  wipeDeviceData,
} from "./blindRelay.js";

const memoryProvider = () => {
  let secret = null;
  const account = () => privateKeyToAccount(secret);
  return {
    id: "local-keyring",
    ensure: async () => ({ address: secret ? account().address : null, durable: true }),
    getAddress: async () => (secret ? account().address : null),
    getPublicKey: async () => account().publicKey,
    isDurable: () => true,
    signMessage: (message) => account().signMessage({ message }),
    exportSecretForTest: () => secret,
    importSecretForTest: async (next) => {
      secret = next;
      return { address: account().address, durable: true };
    },
    lock() {
      secret = null;
    },
  };
};

describe("blind server relay (device A → server → device B)", () => {
  it("keeps the same key and binds every note across five wipe/restore/restart cycles", async () => {
    const secrets = new Map();
    const store = {
      load: async (id) => secrets.get(id) ?? null,
      save: async (id, value) => { secrets.set(id, value); },
    };
    const storage = new Map();
    const previousWindow = globalThis.window;
    globalThis.window = { localStorage: {
      getItem: (id) => storage.get(id) ?? null,
      setItem: (id, value) => storage.set(id, value),
      removeItem: (id) => storage.delete(id),
      key: (index) => [...storage.keys()][index],
      get length() { return storage.size; },
    } };
    try {
      let provider = createLocalWalletProvider({ store, allowEphemeral: false });
      setWalletProvider(provider);
      const { address } = await provider.ensure();
      const privateKey = provider.exportSecretForTest();
      const publicKey = await provider.getPublicKey();
      lockVault();
      clearSealedCache();
      await unlockVault();
      // Reading a legacy plaintext note must not cache it as already encrypted.
      const legacy = await unsealNoteRecord("a", { title: "Legacy", content: "secret-a" });
      const sealed = await sealNoteRecord("a", legacy);
      assert.ok(sealed.vault);
      let snapshot = { notes: { a: sealed, b: { title: "Other", content: "secret-b" } } };
      for (let cycle = 0; cycle < 5; cycle++) {
        const { serverPackage } = await sealBlindServerPackage({ snapshot, privateKey, walletAddress: address, publicKey });
        await wipeDeviceData();
        provider = createLocalWalletProvider({ store, allowEphemeral: false });
        setWalletProvider(provider);
        assert.equal((await provider.ensure()).address, address);
        await restoreFromEncryptedPackage({ pkg: serverPackage, privateKey });
        snapshot = JSON.parse(storage.get("txtnote.disk.snapshot.v1"));
        const key = await deriveVaultKey();
        for (const [id, note] of Object.entries(snapshot.notes)) {
          assert.equal(note.walletAddress, address);
          assert.equal(note.content, "");
          assert.equal(JSON.parse(await decryptText(note.vault, key)).content, `secret-${id}`);
        }
        provider = createLocalWalletProvider({ store, allowEphemeral: false });
        setWalletProvider(provider);
        assert.equal((await provider.ensure()).address, address);
        assert.equal(await provider.getPublicKey(), publicKey);
        assert.equal(provider.exportSecretForTest(), privateKey);
      }
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      lockVault();
      clearSealedCache();
    }
  });

  it("rejects a package with a foreign inner note before replacing the wallet", async () => {
    const privateKey = generatePrivateKey();
    const foreign = privateKeyToAccount(generatePrivateKey());
    const key = await deriveVaultKey((message) => foreign.signMessage({ message }));
    const vault = await encryptText(JSON.stringify({ content: "foreign" }), key);
    const { serverPackage } = await sealBlindServerPackage({
      snapshot: { notes: { a: { vault } } }, privateKey,
      walletAddress: privateKeyToAccount(privateKey).address,
    });
    const provider = memoryProvider();
    const original = generatePrivateKey();
    await provider.importSecretForTest(original);
    setWalletProvider(provider);
    await assert.rejects(() => restoreFromEncryptedPackage({ pkg: serverPackage, privateKey }), /tamamı/);
    assert.equal(provider.exportSecretForTest(), original);
  });
  it("lets the same private key open the package and rejects a foreign key", async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const snapshot = {
      workspaces: [{ id: "w1", name: "Okul" }],
      notes: {
        n1: {
          title: "Kimya",
          content: "gizli-sinif-notu",
          walletAddress: account.address,
        },
      },
    };

    const { serverPackage, plaintextLeaked, serverSeesPrivateKey } = await sealBlindServerPackage({
      snapshot,
      privateKey,
      walletAddress: account.address,
      publicKey: account.publicKey,
      dbOwner: { walletAddress: account.address, publicKey: account.publicKey },
    });

    assert.equal(serverSeesPrivateKey, false);
    assert.equal(serverPackage.headers.testPrivateKey, undefined);
    assert.equal(plaintextLeaked, false);
    assert.equal(JSON.stringify(serverPackage).includes("gizli-sinif-notu"), false);
    assert.equal(JSON.stringify(serverPackage).includes(privateKey), false);

    const opened = await openBlindServerPackage(serverPackage, privateKey);
    assert.equal(opened.snapshot.notes.n1.content, "gizli-sinif-notu");
    assert.equal(opened.workspaceNames[0], "Okul");
    assert.equal(opened.notes[0].title, "Kimya");
    assert.equal(opened.wrongKeyRejected, true);
  });

  it("reads a pasted key from the whole .txt file and restores after a wipe", async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const txt = privateKeyFileContents({
      privateKey,
      walletAddress: account.address,
      encryptedFileName: "txtnote-encrypted-db-x.json",
    });
    assert.equal(normalizePastedPrivateKey(txt), privateKey);
    assert.equal(normalizePastedPrivateKey(`  ${privateKey.slice(2)}\n`), privateKey);
    assert.equal(normalizePastedPrivateKey("abc"), "");

    const snapshot = {
      workspaces: [{ id: "w1", name: "Okul" }],
      items: [{ id: "n1", workspaceId: "w1", title: "Kimya", type: "document" }],
      notes: { n1: { title: "Kimya", content: "geri-gelen-not" } },
    };
    const { serverPackage } = await sealBlindServerPackage({
      snapshot,
      privateKey,
      walletAddress: account.address,
    });

    // Fresh device: a different wallet is active, no data on disk.
    const provider = memoryProvider();
    await provider.importSecretForTest(generatePrivateKey());
    setWalletProvider(provider);

    const restored = await restoreFromEncryptedPackage({ pkg: serverPackage, privateKey: txt });
    assert.equal(restored.openedWithAddress, account.address);
    assert.equal(restored.noteCount, 1);
    assert.equal(restored.workspaceCount, 1);
    assert.match(restored.notes[0].contentPreview, /geri-gelen-not/);
    assert.equal(provider.exportSecretForTest(), privateKey);
    assert.equal(restored.wrongKeyRejected, true);

    await assert.rejects(
      () => restoreFromEncryptedPackage({ pkg: serverPackage, privateKey: generatePrivateKey() }),
      /ait değil/,
    );
  });

  it("opens sealed note vaults on the peer device with the same key", async () => {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const { deriveVaultKey } = await import("../crypto/vault.js");
    const vaultKey = await deriveVaultKey((message) => account.signMessage({ message }));
    const vault = await encryptText(
      JSON.stringify({ title: "Gizli başlık", content: "cihaz-b-gorecek" }),
      vaultKey,
    );
    const snapshot = {
      notes: {
        n1: { title: "", content: "", vault, walletAddress: account.address },
      },
    };

    const { serverPackage } = await sealBlindServerPackage({
      snapshot,
      privateKey,
      walletAddress: account.address,
    });
    const opened = await openBlindServerPackage(serverPackage, privateKey, { tryWrongKey: false });
    const preview = await previewNotesWithPrivateKey(opened.snapshot, privateKey);
    assert.equal(preview[0].vaultOpened, true);
    assert.equal(preview[0].title, "Gizli başlık");
    assert.match(preview[0].contentPreview, /cihaz-b-gorecek/);
  });
});
