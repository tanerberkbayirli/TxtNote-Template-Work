// my own adversarial fixture generator: node mkadv.mjs <registryId> <fillParas> <out.json> [mode]
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const [rid, fillArg, out, mode = "full"] = process.argv.slice(2);
const SP = process.env.SP;
const ROOT = "/home/user/TxtNote-Template-Work";
const base = JSON.parse(await readFile(`${SP}/x/${rid}.fixture.json`, "utf8"));
const IMAGE = base.content.match(/src="(data:image\/png;base64,[^"]+)"/)[1];
const fill = Number(fillArg);
const P = (t) => `<p>${t}</p>`;
const fn = (id, text) => `<sup class="academic-footnote" contenteditable="false" data-fn-id="${id}" data-fn-text="${text}">1</sup>`;
const figure = (cap, kind = "") => `<figure class="academic-figure" data-kind="figure"${kind ? ` data-caption-kind="${kind}"` : ""} contenteditable="false"><img width="420" height="210" src="${IMAGE}" alt=""><figcaption>${cap}</figcaption></figure>`;
const table = (cap, head, rows) => `<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>${cap}</caption><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const eq = (latex, num = true) => `<span class="math-formula math-formula--block" data-display="block" data-latex="${latex}"${num ? ' data-eq-numbered="true"' : ""}>(${latex})</span>`;
const note = (t) => `<p data-thesis-style="tableNote">${t}</p>`;
const S = "Çevrimiçi öğrenme ortamlarında öğretmen adaylarının dijital okuryazarlık düzeyleri; öz yeterlik, erişim olanakları ve ölçme araçlarının güvenirliği açısından ayrıntılı biçimde incelenmiştir.";
const short = (i) => P(`Kısa dolgu paragrafı ${i}. Işık, ığdır, şişe.`);
const long = (i, n = 2) => P(`Paragraf ${i}. ${Array(n).fill(S).join(" ")}`);
const filler = (n) => Array.from({ length: n }, (_, i) => short(i + 1)).join("");
const LONGCAP = "Çok uzun bir başlık: araştırma sürecinin tüm aşamalarını, veri toplama araçlarını, örneklem seçim ölçütlerini, çözümleme yöntemlerini ve bulguların uzman görüşleriyle karşılaştırılarak doğrulanmasını ayrıntılı biçimde gösteren, birden fazla satıra yayılan, asılı girinti denetimi için özellikle uzatılmış açıklama metni";
const SYM = "\\alpha \\cdot \\beta \\pm \\mu \\leq \\sigma \\geq 3 \\neq 4 \\times 2 + \\sum_{i=1}^{n} x_i + \\int_0^1 f(x)dx + \\sqrt{x}";
const rows = (n) => Array.from({ length: n }, (_, i) => [`Madde ${i + 1}`, ["A", "B", "C"][i % 3], String(10 + ((i * 7) % 50)), `${(i * 1.7 + 3).toFixed(1).replace(".", ",")}`]);
const head = ["Değişken", "Grup", "f", "%"];
let n = 0;
const F = (t) => fn(`a${++n}`, `Dipnot ${n}: ${t}`);

const c = [];
// chapter 2: adversarial block order
c.push(`<h1>Yöntem ve Bulgular</h1>`, long(1), P(`${S}${F("ilk açıklama")} ${S}`), `<h2>Şekil Sonrası Başlık</h2>`, long(2, 1));
c.push(figure(LONGCAP), `<h2>Başlık doğrudan şekil açıklamasından sonra</h2>`, long(3, 1));
c.push(`<h2>Tablo Denemeleri</h2>`, table("Tablo altında not olan tablo", head, rows(4)), note("Not: Yüzdeler sütun toplamına göre hesaplanmıştır."), `<h2>Başlık doğrudan tablo notundan sonra</h2>`, long(4, 1));
c.push(table("Notsuz tablo", head, rows(3)), `<h2>Başlık doğrudan tablodan sonra</h2>`, long(5, 1));
c.push(filler(fill));
c.push(`<h2>Denklem Denemeleri</h2>`, eq("E = mc^2"), P(`Denklemden sonra paragraf.${F("denklem sonrası")}`), eq(SYM), eq("y = \\alpha x + \\beta"), `<h3>Başlık doğrudan denklemden sonra</h3>`, eq("a^2 + b^2 = c^2"), long(6, 1));
c.push(table("Not sonrası denklem", head, rows(2)), note("Not: Kaynak: araştırmacı."), eq("F = m \\cdot a"), long(7, 1));
c.push(`<h1>Uzun Tablo ve Fotoğraf</h1>`, eq("x = \\frac{a}{b}"), long(8, 2), P(`Dipnot dolu paragraf ${F("üçüncü")}${F("dördüncü")}${F("beşinci")} ${S}`));
c.push(table(LONGCAP, head, rows(58)), note("Not: Çok sayfalı tablo notu."), `<h2>Tablo sonrası başlık</h2>`, long(9, 2));
c.push(figure("Deney düzeneğinin uzun fotoğraf açıklaması: " + LONGCAP.slice(0, 120), "photo"), `<h2>Fotoğraf sonrası başlık</h2>`, P(`Son paragraf ${F("altıncı")}${F("yedinci")}${F("sekizinci")}${F("dokuzuncu")}${F("onuncu")} ${S}`), long(10, 3));
c.push(`<h1>Sonuç Bölümü</h1>`, eq("\\mu = \\frac{1}{n}\\sum x_i"), long(11, 2), P(`Kapanış ${F("on birinci")}`));
const title = mode === "min" ? "Kısa Başlık" : "Çevrimiçi Öğrenme Ortamlarında Öğretmen Adaylarının Dijital Okuryazarlık Düzeylerinin, Öz Yeterlik Algılarının ve Erişim Olanaklarının Ayrıntılı Biçimde İncelenmesi Üzerine Karma Yöntemli Bir Araştırma Çalışması";
const overrides = { title, content: c.join("") , values: {}, sectionContent: {} };
if (mode === "min") {
  overrides.values = { PROJECT_NUMBER: "", PROJECT_FUNDER: "", CO_ADVISOR_TITLE: "", CO_ADVISOR_NAME: "", THESIS_TITLE_EN: "SHORT TITLE" };
} else {
  overrides.values = { THESIS_TITLE_EN: "EXAMINING THE DIGITAL LITERACY LEVELS, SELF-EFFICACY PERCEPTIONS AND ACCESS OPPORTUNITIES OF PRE-SERVICE TEACHERS IN ONLINE LEARNING ENVIRONMENTS: A MIXED-METHODS RESEARCH STUDY",
    DEPARTMENT_NAME: "Moleküler Biyoloji ve Genetik", DEPARTMENT_NAME_EN: "Molecular Biology and Genetics" };
}
// intro with footnotes too
overrides.sectionContent = { introduction: long(0, 2) + P(`Giriş ${fn("i1", "Giriş dipnotu 1")} ve ${fn("i2", "Giriş dipnotu 2")}. ${S}`) };
await writeFile(`${SP}/adv/ov-${rid}-${mode}-${fill}.json`, JSON.stringify(overrides));
execFileSync("node", [`${ROOT}/orchestration/tools/make-fixture.mjs`, rid, out, `${SP}/adv/ov-${rid}-${mode}-${fill}.json`], { stdio: "inherit" });
// PhD 7 jurors are already set by make-fixture for phd; force 7 (already 5+2)
