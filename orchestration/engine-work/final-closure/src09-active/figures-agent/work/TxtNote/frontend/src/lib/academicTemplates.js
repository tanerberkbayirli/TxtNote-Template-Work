/**
 * Ready-made academic outlines. Cover fields (title, authors, institution,
 * keywords, abstract) stay on the paper chrome; the body gets real headings.
 */

import {
  headingHtml,
  normalizeAcademicHtml,
  pageBreakHtml,
  paragraphHtml,
  tocHtml,
} from "./academicDocument.js";

function block(level, title, hint, numbered) {
  const heading = headingHtml(level, title, { numbered: numbered !== false });
  return hint ? `${heading}${paragraphHtml(hint)}` : heading;
}

function assemble(parts) {
  return parts.filter(Boolean).join("");
}

export const ACADEMIC_TEMPLATES = [
  {
    id: "article",
    label: "Akademik Makale",
    hint: "IMRaD makale: Abstract, giriş, yöntem, bulgular, tartışma, sonuç.",
    preview: ["Abstract", "Keywords", "1. Giriş", "2. Literatür Taraması", "3. Yöntem", "4. Bulgular", "5. Tartışma", "6. Sonuç"],
    bibliography: true,
    pageNumberPosition: "bottom-center",
    html: assemble([
      block(1, "Abstract", "English abstract of the study.", false),
      block(1, "Keywords", "keyword one, keyword two, keyword three", false),
      block(1, "Giriş", "Konuyu, sorunu ve çalışmanın amacını yazın."),
      block(1, "Literatür Taraması", "İlgili çalışmaları ve kuramsal çerçeveyi özetleyin."),
      block(1, "Yöntem", "Örneklem, veri toplama ve analiz adımlarını yazın."),
      block(2, "Veri Toplama", "Verinin nasıl toplandığını belirtin."),
      block(2, "Veri Analizi", "Analiz yöntemini kısaca açıklayın."),
      block(1, "Bulgular", "Sonuçları yorum katmadan aktarın."),
      block(1, "Tartışma", "Bulguları literatürle karşılaştırın."),
      block(1, "Sonuç", "Katkıyı, sınırlılıkları ve önerileri özetleyin."),
    ]),
  },
  {
    id: "thesis",
    label: "Tez",
    hint: "Kapak, ön maddeler, içindekiler ve altı bölüm.",
    preview: ["Kapak", "Özet / Abstract", "İçindekiler", "1. Giriş", "6. Sonuç ve Öneriler", "Ekler"],
    bibliography: true,
    pageNumberPosition: "bottom-center",
    pageNumbering: { front: "roman", body: "arabic" },
    html: assemble([
      block(1, "Kapak Sayfası", "Üniversite, enstitü ve tez başlığı buraya.", false),
      block(1, "Öğrenci Adı", "Ad Soyad", false),
      block(1, "Enstitü / Fakülte", "Enstitü veya fakülte adı", false),
      block(1, "Bölüm", "Anabilim dalı / bölüm", false),
      block(1, "Danışman", "Danışmanın unvanı ve adı", false),
      block(1, "Tarih", "Ay Yıl", false),
      block(1, "Abstract", "English abstract.", false),
      block(1, "Keywords", "keyword one, keyword two", false),
      tocHtml(),
      block(1, "Şekiller Listesi", "Şekil 1. …", false),
      block(1, "Tablolar Listesi", "Tablo 1. …", false),
      pageBreakHtml(),
      block(1, "Giriş", "Problem, amaç, araştırma soruları ve kapsam."),
      block(1, "Literatür Taraması", "Kuramsal çerçeve ve ilgili çalışmalar."),
      block(1, "Yöntem", "Araştırma deseni, veri ve analiz."),
      block(1, "Bulgular", "Elde edilen sonuçlar."),
      block(1, "Tartışma", "Yorum ve literatürle karşılaştırma."),
      block(1, "Sonuç ve Öneriler", "Katkı, sınırlılık ve öneriler."),
      block(1, "Ekler", "Ek A. …", false),
    ]),
  },
  {
    id: "report",
    label: "Araştırma Raporu",
    hint: "Yönetici özeti, amaç, yöntem, analiz ve öneriler.",
    preview: ["Yönetici Özeti", "Amaç", "Yöntem", "Bulgular", "Analiz", "Sonuç", "Öneriler"],
    bibliography: true,
    pageNumberPosition: "bottom-center",
    html: assemble([
      block(1, "Tarih", "Rapor tarihi", false),
      block(1, "Yönetici Özeti", "Karar verici için kısa özet.", false),
      block(1, "Amaç", "Raporun amacı ve soruları."),
      block(1, "Yöntem", "Veri ve yöntem."),
      block(1, "Bulgular", "Temel sonuçlar."),
      block(1, "Analiz", "Bulguların değerlendirilmesi."),
      block(1, "Sonuç", "Kısa sonuç."),
      block(1, "Öneriler", "Uygulanabilir öneriler."),
    ]),
  },
  {
    id: "review",
    label: "Literatür Taraması",
    hint: "Kapsam, temalar, karşılaştırma ve araştırma boşlukları.",
    preview: ["Giriş", "Araştırma Kapsamı", "Tematik Bulgular", "Karşılaştırma", "Araştırma Boşlukları"],
    bibliography: true,
    pageNumberPosition: "bottom-center",
    html: assemble([
      block(1, "Giriş", "Taramanın sorusu ve gerekçesi."),
      block(1, "Araştırma Kapsamı", "Hangi dönem, dil ve kaynaklar tarandı?"),
      block(1, "İncelenen Çalışmalar", "Seçilen çalışmaların özeti."),
      block(1, "Tematik Bulgular", "Ortak temalar."),
      block(1, "Karşılaştırma", "Yöntem ve sonuç farkları."),
      block(1, "Tartışma", "Literatürün genel resmi."),
      block(1, "Araştırma Boşlukları", "Eksik kalan yerler."),
      block(1, "Sonuç", "Sizin konumunuz ve sonraki adım."),
    ]),
  },
  {
    id: "lab",
    label: "Deney / Laboratuvar Raporu",
    hint: "Amaç, hipotez, materyal, süreç, bulgular ve tartışma.",
    preview: ["Amaç", "Hipotez", "Yöntem", "Deney Süreci", "Bulgular", "Tartışma"],
    bibliography: true,
    pageNumberPosition: "bottom-center",
    html: assemble([
      block(1, "Amaç", "Deneyin amacı."),
      block(1, "Hipotez", "Sınanan hipotez."),
      block(1, "Kullanılan Materyaller", "Araç-gereç listesi."),
      block(1, "Yöntem", "Deney düzeni."),
      block(1, "Deney Süreci", "Adım adım uygulama."),
      block(1, "Bulgular", "Ölçümler ve gözlemler."),
      block(1, "Tablo ve Grafikler", "Tabloları ve görselleri buraya ekleyin."),
      block(1, "Tartışma", "Beklenenle karşılaştırma."),
      block(1, "Sonuç", "Kısa sonuç."),
    ]),
  },
  {
    id: "free",
    label: "Serbest Akademik Belge",
    hint: "Yalnızca kapak alanları; bölümleri kendiniz ekleyin.",
    preview: ["Başlık", "Yazar", "Gövde"],
    bibliography: false,
    pageNumberPosition: "bottom-center",
    html: "",
  },
];

export function academicTemplateById(id) {
  return ACADEMIC_TEMPLATES.find((item) => item.id === id) ?? null;
}

export function instantiateAcademicTemplate(template, currentResearch = {}) {
  const item = typeof template === "string" ? academicTemplateById(template) : template;
  if (!item) return null;
  return {
    content: normalizeAcademicHtml(item.html || ""),
    researchData: {
      ...currentResearch,
      templateId: item.id,
      bibliographyEnabled: Boolean(item.bibliography),
      docBibliographyItems:
        item.bibliography
          ? (Array.isArray(currentResearch.docBibliographyItems) && currentResearch.docBibliographyItems.some((line) => String(line).trim())
            ? currentResearch.docBibliographyItems
            : [""])
          : currentResearch.docBibliographyItems,
      pageNumberPosition: item.pageNumberPosition || currentResearch.pageNumberPosition || "bottom-center",
      pageNumbering: item.pageNumbering || currentResearch.pageNumbering || { front: "arabic", body: "arabic" },
      footnotes: Array.isArray(currentResearch.footnotes) ? currentResearch.footnotes : [],
    },
  };
}
