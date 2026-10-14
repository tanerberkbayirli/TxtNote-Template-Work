/**
 * Multi-page academic sample used by export QA (editor, PDF, DOCX).
 */

const PNG_SMALL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAADpjrgTAAAAFElEQVR4nGP4z8BQzzCKQRxlYBgYAAAj6AExkkQ+AAAAAElFTkSuQmCC";
const PNG_LARGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAGQCAYAAABWJQQ0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUATWljcm9zb2Z0IE9mZmljZX/tNXEAAABYSURBVHic7cEBAQAAAIIg/69uSEABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeBsTAAGhZ1n7AAAAAElFTkSuQmCC";

const prose =
  "Türkçe karakterler: ç, ğ, ı, İ, ö, ş, ü. Araştırma bulguları yöntem ve sonuçlarla birlikte değerlendirilmiştir. ".repeat(8);

const longCode = Array.from({ length: 24 }, (_, i) => `function satır${i + 1}(x) {\n  return x + ${i};\n}`).join("\n");

export function academicExportQaHtml() {
  return [
    `<nav class="academic-toc" data-academic-toc="true"><p class="academic-toc__title">İçindekiler</p><ol class="academic-toc__list"></ol></nav>`,
    `<h1 class="academic-h academic-h1" data-academic-heading="1">Giriş</h1>`,
    `<p><span class="fmt-bold">Kalın</span> <span class="fmt-italic">italik</span> <span class="fmt-underline">altı çizili</span> ve ${prose}</p>`,
    `<p>Kısa paragraf.</p>`,
    `<h2 class="academic-h academic-h2" data-academic-heading="2">Yöntem</h2>`,
    `<h3 class="academic-h academic-h3" data-academic-heading="3">Veri Toplama</h3>`,
    `<p>${prose}</p>`,
    `<ul><li>Birinci madde</li><li>İkinci madde</li></ul>`,
    `<ol><li>Önce</li><li>Sonra</li></ol>`,
    `<table class="academic-table" data-kind="table"><caption><span class="academic-caption-label">Tablo 1. </span>Katılımcı dağılımı</caption><thead><tr><th>Ölçüt</th><th>Sonuç</th></tr></thead><tbody><tr><td>Katılımcı</td><td>42</td></tr><tr><td>Başarı</td><td>%85</td></tr></tbody></table>`,
    `<figure class="academic-figure" data-kind="figure" data-academic-id="fig-qa-small" contenteditable="false"><img width="240" height="120" src="${PNG_SMALL}" alt="Küçük görsel"><figcaption><span class="academic-caption-label">Şekil 1. </span>Küçük görsel</figcaption></figure>`,
    `<figure class="academic-figure fmt-align-center" data-kind="figure" data-academic-id="fig-qa" contenteditable="false"><img width="560" height="280" src="${PNG_LARGE}" alt="Büyük görsel"><figcaption><span class="academic-caption-label">Şekil 2. </span>Büyük görsel</figcaption></figure>`,
    `<p>bkz. <span class="academic-xref" data-ref-id="fig-qa" data-ref-kind="figure">Şekil 2</span> ve Tablo 1’de gösterildiği üzere ${prose}</p>`,
    `<div class="academic-page-break" data-academic-page-break="true"></div>`,
    `<h2 class="academic-h academic-h2" data-academic-heading="2">Bulgular</h2>`,
    ...Array.from({ length: 12 }, (_, i) => `<p>${i + 1}. ${prose}</p>`),
    `<pre class="academic-code">const kısa = 1;</pre>`,
    `<pre class="academic-code">${longCode}</pre>`,
    `<span class="math-formula math-formula--block" data-display="block" data-latex="E=mc^2" data-eq-numbered="true">(E=mc^2)</span>`,
    `<p>Sonuç cümlesi dipnotlu<sup class="academic-footnote" data-fn-id="fn-qa" data-fn-index="1" data-fn-text="Dipnot örneği.">1</sup>.</p>`,
  ].join("");
}

export function academicExportQaDoc() {
  return {
    title: "Akademik Yazı Doğrulaması — çok uzun bir başlık satırı",
    html: academicExportQaHtml(),
    docAuthors: "Test Yazarı",
    institution: "Araştırma Üniversitesi",
    keywords: "akademik yazım, düzen, export",
    docAbstract: "Bu belge çok sayfalı metin, atıf, tablo ve görsel yerleşimini doğrular. çğıöşü",
    bibliographyEnabled: true,
    docBibliographyItems: ["Ada, A. (2020). Makale.", "Kaya, B. (2021). Kitap."],
    pageNumberPosition: "bottom-center",
    pageNumbering: { front: "arabic", body: "arabic" },
  };
}
