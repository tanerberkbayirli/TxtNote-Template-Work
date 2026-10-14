import assert from "node:assert/strict";
import { it } from "node:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getWalletProvider, setWalletProvider } from "../wallet/index.js";
import { clearSealedCache, sealNoteRecord, unsealNoteRecord } from "./envelope.js";
import { lockVault, unlockVault } from "./vault.js";

it("encrypts research data, reloads it, and invalidates the sealed cache on research-only edits", async () => {
  const previous = getWalletProvider();
  const account = privateKeyToAccount(generatePrivateKey());
  setWalletProvider({
    ensure: async () => ({ address: account.address }),
    getAddress: async () => account.address,
    isDurable: () => true,
    signMessage: (message) => account.signMessage({ message }),
  });
  try {
    await unlockVault();
    const researchData = { sourceTitle: "Private paper", abstract: "<p>Summary</p>", quotes: [{ id: "quote-uuid", text: "Quote", page: "12", comment: "Comment" }] };
    researchData.sources = [{ id: "src-academic", authors: "Kaya, B.", title: "Makale", volume: "12", issue: "3", accessed: "2026-09-17", doi: "10.1234/test" }];
    const note = {
      title: "Research",
      content: '<span class="fmt-bold fmt-underline fmt-strike">Metin</span><figure class="academic-figure"><img width="320" height="160" src="data:image/png;base64,test"></figure>',
      researchData,
      flashcards: { cards: [{ id: "c1", front: "Soru", back: "Cevap", image: null }] },
    };
    const sealed = await sealNoteRecord("itm-uuid", note);
    assert.equal(sealed.researchData, undefined);
    assert.equal(sealed.flashcards, undefined);
    assert.equal(JSON.stringify(sealed).includes("Private paper"), false);
    clearSealedCache();
    assert.deepEqual((await unsealNoteRecord("itm-uuid", JSON.parse(JSON.stringify(sealed)))).researchData, researchData);
    assert.equal((await unsealNoteRecord("itm-uuid", JSON.parse(JSON.stringify(sealed)))).content, note.content);
    assert.deepEqual((await unsealNoteRecord("itm-uuid", JSON.parse(JSON.stringify(sealed)))).flashcards, note.flashcards);
    const changed = { ...researchData, quotes: [] };
    const edited = await sealNoteRecord("itm-uuid", { ...note, researchData: changed });
    assert.notEqual(edited.vault.ciphertext, sealed.vault.ciphertext);
    assert.deepEqual((await unsealNoteRecord("itm-uuid", edited)).researchData, changed);
    const cardEdit = await sealNoteRecord("itm-uuid", {
      ...note,
      flashcards: { cards: [{ id: "c1", front: "Soru?", back: "Cevap", image: null }] },
    });
    assert.notEqual(cardEdit.vault.ciphertext, sealed.vault.ciphertext);
    assert.equal((await unsealNoteRecord("itm-uuid", cardEdit)).flashcards.cards[0].front, "Soru?");
    const cardAgain = await sealNoteRecord("itm-uuid", {
      ...note,
      flashcards: { cards: [{ id: "c1", front: "Soru?", back: "Cevap", image: null }] },
    });
    assert.equal(cardAgain.vault.ciphertext, cardEdit.vault.ciphertext);
    const cardEdit2 = await sealNoteRecord("itm-uuid", {
      ...note,
      flashcards: { cards: [{ id: "c1", front: "Bambaşka", back: "Cevap", image: null }] },
    });
    assert.notEqual(cardEdit2.vault.ciphertext, cardEdit.vault.ciphertext);
  } finally {
    lockVault();
    clearSealedCache();
    setWalletProvider(previous);
  }
});
