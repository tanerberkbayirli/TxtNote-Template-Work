import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAcademicHtml, parseAcademicPlainText } from "./academicImport.js";

describe("parseAcademicPlainText", () => {
  it("recognizes title, authors, institution, keywords and abstract", () => {
    const paper = parseAcademicPlainText(`
Yapay Zeka ve Eğitim

Taner Berk Bayırlı
Manisa Celal Bayar Üniversitesi

Anahtar kelimeler: eğitim, yapay zeka

Özet
Bu çalışma öğretmen adaylarının tutumunu inceler.

Giriş
Araştırma deseni niteldir.
`);
    assert.equal(paper.title, "Yapay Zeka ve Eğitim");
    assert.equal(paper.authors, "Taner Berk Bayırlı");
    assert.match(paper.institution, /Manisa Celal Bayar/);
    assert.equal(paper.keywords, "eğitim, yapay zeka");
    assert.match(paper.abstract, /öğretmen adaylarının/);
    assert.match(paper.bodyHtml, /Giriş/);
    assert.match(paper.bodyHtml, /Araştırma deseni/);
    assert.doesNotMatch(paper.bodyHtml, /öğretmen adaylarının/);
  });

  it("reads English Abstract and Keywords headings", () => {
    const paper = parseAcademicPlainText(`
A Study of Learning

Ada Lovelace & Charles Babbage
University of Cambridge

Keywords: learning, machines

Abstract: Short summary of the work.

Introduction
Body paragraph.
`);
    assert.equal(paper.title, "A Study of Learning");
    assert.match(paper.authors, /Ada Lovelace/);
    assert.match(paper.institution, /Cambridge/);
    assert.equal(paper.keywords, "learning, machines");
    assert.match(paper.abstract, /Short summary/);
    assert.match(paper.bodyHtml, /Body paragraph/);
  });

  it("keeps an empty paper empty", () => {
    const paper = parseAcademicPlainText("   \n\n");
    assert.equal(paper.title, "");
    assert.equal(paper.abstract, "");
    assert.equal(paper.bodyHtml, "");
  });
});

describe("parseAcademicHtml", () => {
  it("strips tags before recognizing cover fields", () => {
    const paper = parseAcademicHtml(
      `<h1>Tez Başlığı</h1><p>Ada Lovelace</p><p>Üniversite</p><h2>Özet</h2><p>Kısa özet.</p><h2>Giriş</h2><p>Metin</p>`,
    );
    assert.equal(paper.title, "Tez Başlığı");
    assert.equal(paper.authors, "Ada Lovelace");
    assert.equal(paper.institution, "Üniversite");
    assert.equal(paper.abstract, "Kısa özet.");
    assert.match(paper.bodyHtml, /Metin/);
  });
});
