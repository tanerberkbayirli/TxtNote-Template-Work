# Tez şablonu orkestrasyonu

## Policy revision 2026-09-28

This section supersedes every conflicting rule further below (older rules stay for history).

1. **Source documents are the only source of truth.** Pipeline per target: SOURCE → normalized spec → TxtNote implementation → REAL TxtNote export → independent measurement → PASS. "Looks correct", unit tests or template values are not validation.
2. **Exact values.** A documented value (e.g. 35 mm) is implemented exactly. Validation tolerance is only measurement noise: explicit dimensions FAIL above **0.5 mm** (target ≤ 0.25 mm where measurable); font size ±0.1 pt; line pitch ±0.2 pt. Older tolerances (±1 mm margins, ±2 mm blocks, ±5 % spacing) are revoked.
3. **UNKNOWN over invention.** A rule the sources do not establish is recorded `UNKNOWN`; values are never copied from another university. Word defaults in a DOCX are not university requirements unless the template itself carries them (then confidence `TEMPLATE`).
4. **Engine extension is allowed** (old constraint 8 revoked) when a verified source requirement cannot be represented: generic, backward-compatible, tested, regression-checked. No university-specific branches in engine/editor code.
5. **Fonts are real requirements.** Tinos/Liberation/Helvetica substitution is not PASS for a Times New Roman / Arial requirement. The export must embed the genuine font (verified from the PDF font program), otherwise the check FAILs or the target is BLOCKED with evidence. `PASS_WITH_GAPS` is not a terminal success state for a requirement the engine can be extended to meet.
6. **Universities strictly one at a time** in `progress.json.universityOrder`; a university is complete only after its FINAL GATE (all targets PASS or evidenced BLOCKED).
7. **Attempts**: `maxAttempts` is a checkpoint for re-evaluation, not an automatic BLOCKED. BLOCKED only for genuinely impossible requirements, documented in `failures/<target-id>.md`.
8. **Independent validation** by a validator context without the integrator's conversation; it tries to disprove correctness using the official source, the spec and the real exported PDF/DOCX.

Confidence levels in specs: `EXPLICIT` (stated in guide text), `TEMPLATE` (read from an official DOCX template's XML/styles), `MEASURED` (measured on an official example page / PDF geometry), `INFERRED` (reasoned, must say why), `UNKNOWN`.

### Tooling (this environment)

- `orchestration/tools/devserver.sh start` — Vite dev server of `TxtNote/frontend` on 127.0.0.1:5175.
- `orchestration/tools/export.mjs <fixture.json> <outPrefix>` — seeds a deterministic thesis note into the real `ThesisEditor` (tests/thesis.html), waits for the editor's own pagination loop to settle, presses the editor's **PDF** and **Word** buttons and saves the downloads (+ `.layout.json`). Chromium runs with `--enable-blink-features=MulticolColumnWrapping` (paged layout) and the `local-fonts` permission (genuine system fonts embedded by the browser export path).
- Genuine Microsoft Core Fonts (Times New Roman, Arial, …) are installed under `/usr/share/fonts/truetype/msttcorefonts/` (not committed). PyMuPDF + python-docx for measurement; LibreOffice (`soffice`) for DOCX/DOC → PDF of sources (artifacts only).


Bu klasör, `Butun-Sablonlar/` kaynaklarını TxtNote tez motoruna (`TxtNote/frontend/src/thesis/`) aktaran uzun süreli, kesintiye dayanıklı iş akışını yönetir.

- `Butun-Sablonlar/` **salt okunurdur (source of truth)**. Hiçbir ajan oradaki bir dosyayı değiştirmez, taşımaz veya dönüştürülmüş kopyasını yanına yazmaz. Dönüştürmeler (docx→pdf, metin çıkarımı, sayfa görüntüleri) yalnız `orchestration/artifacts/<id>/` altına yazılır.
- Tek doğru durum kaynakları `manifest.json` (ne yapılacak) ve `progress.json` (ne yapıldı) dosyalarıdır.

## Dosyalar

| Yol | İçerik | Yazan |
|---|---|---|
| `manifest.json` | Kaynak envanteri (74 geçerli kaynak), 32 target, 71 registry varyantı, dışlanan dosya, kaynağı olmayan üniversiteler | Plan aşaması; sonradan yalnız Orchestrator, gerekçesi `reports/` altında yazılarak |
| `progress.json` | Target başına `analysis / implementation / validation / attempts / status` | Yalnız Orchestrator |
| `specs/<id>.json` | Makine tarafından okunabilir kural spesifikasyonu | Analyzer |
| `reports/<id>.md` | İnsan tarafından okunabilir analiz raporu, açık sorular, kaynak çelişkileri | Analyzer |
| `validation/<id>/attempt-<n>.json` + `.md` | Bağımsız doğrulama sonucu ve ölçümler | Validator |
| `failures/<id>/attempt-<n>.md` | FAIL gerekçesi, Integrator için düzeltme listesi | Validator (Orchestrator kopyalar) |
| `artifacts/<id>/` | Dönüştürülmüş kaynaklar, export edilen PDF/DOCX, ölçüm çıktıları | Analyzer / Integrator / Validator |

## Temel kavramlar: target ve variant

Mevcut motora göre birimler şöyle:

- **Target**: bir üniversite + enstitü/fakülte/program. Her target için tek bir veri modülü var: `templates/<id>.js`. Analiz, implementasyon, validation ve retry target düzeyinde yürür.
- **Variant**: bir registry girdisi, yani `degreeType × language [+ selectors]`. `registry.js` her girdiyi `universityId / instituteId / degreeType / language` ile eşler ve yüklenen şablonun bu alanlarla birebir aynı olmasını şart koşar. Bu yüzden her derece/dil ayrı bir registry id'si gerektirir. Bunlar aynı modülden named export olarak çıkar (`mcbu.js` → `mcbuMaster`, `mcbuPhd` deseni).
- **Ayrı variant OLMAYANLAR**:
  - **İkinci danışmanlı sürümler**: `visibleWhen: { anyFilled: [...] }` ile çözülür.
  - **Aynı kılavuzun DOC/PDF kopyaları**: DOC özgün kaynaktır, PDF ölçüm referansıdır.
  - **Destekleyici belgeler**: atıf rehberleri ve ek yönergeler (`role: supplementary`).
- **Ayrı target olanlar**: yalnız kendine ait ayrı bir şablon belgesi olan program. Örnek: `yasar-lee-hukuk`, `selectors: { program: "law" }` ile ve `yasar-lee`'ye bağımlı.
- **Registry id biçimi**: `<targetId>-<master|phd|undergrad|specialization>-<tr|en>-v1`. Kural değişirse yeni id (`-v2`) açılır. Eski modül mevcut notlar için yüklenebilir kalır.

## Mevcut motorun desteklediği özellikler

Kaynak: `schema.d.ts`, `engine.js`, `validation.js`, `specialPages.js`, `README.md` ve `src/lib/thesis*.test.js`.

- **Sayfa**: A4 ölçüleri; tek bir margin seti. Section `overrides.page` ile margin ve numaralandırma değişebilir.
- **Numaralandırma**: arabic, roman-lower ve roman-upper; konum top/bottom; hizalama left/center/right; `startAt` ve `restart` desteklenir.
- **Header/footer**: düz metin; ilk sayfada gizleme (`firstPage: omit`) desteklenir.
- **Tipografi**:
  - `body` ve `paragraph` stilleri; `firstLineIndentMm`, spaceBefore/After (pt).
  - `lineHeight` ve `lineSpacing: { mode: "word", singleLineEm }` (Word "n satır").
  - `textTransform` ve `keepWithNext`.
  - H1–H4 başlık kuralları ve numara formatları.
- **Section modları**: `editable`, `static` ve `generated`. Ayrıca şunlar desteklenir:
  - `status: required | optional | disabled`
  - `order`
  - `visibleWhen` (equals / notEquals / in)
  - `standalone: false`
  - `tocEntry`
- **Özel sayfalar** (`blocks`): text, metadata, image, spacer, separator ve group (row/column, en fazla 4 seviye iç içe). Blok düzeyinde `visibleWhen.anyFilled` kullanılabilir.
- **Tablo/şekil açıklamaları**:
  - Konum above/below; numaralandırma kapsamı document veya chapter.
  - `captionAlignment: auto` ve `cellStyle`.
  - `captionNumberingChoices`
- **Dizinler**: TOC ve şekil/tablo listeleri. Leader (dots/none), `pageHeading` ve `matchHeadingTransform` desteklenir.
- **Diğer**:
  - Sayfa altı dipnotlar: font, separator, `maxAreaPercent`.
  - Kaynakça: stil ve `hangingIndentMm`.
  - Metadata doğrulaması: yalnız `minItems`.
  - `derived: "totalPages"`

## Bilinen kısıtlar

Analyzer bu kısıtlara karşı spec yazar; Integrator bunları sessizce aşmaz.

1. **Tek/çift sayfa (ayna) margin ve cilt payı ayrımı yok.** Header/footer ilk sayfa dışında tek/çift ayrımı yapmaz.
2. **Numara formatı yalnız arabic ve roman.** Harf dizisi (EK-A, a, b) için başlık `numbering.format` string'i ve `sequence` davranışı analizde test edilmeli. Desteklenmiyorsa bu `engineGap` olarak raporlanır.
3. **Özel sayfalarda tablo, çerçeve (border box) veya mutlak konumlandırma yok.** Düzen spacer ve group ile yapılır. Jüri/onay imza tabloları `row` group ile modellenir. Çerçeveli kapaklar desteklenmez.
4. **PDF fontları**: Times New Roman için Tinos (metrik uyumlu) kullanılır. Arial isteyen şablonlarda Latin-1 dışı (Türkçe) kelimeler serif ile çizilir. Arial/Calibri zorunlu kılavuzlar bu nedenle `engineGap: font` alır ve bu, PDF font doğrulamasını FAIL yapmaz. DOCX'te font adı doğru yazılmak zorundadır.
5. **Layout PDF tarayıcı DOM'u gerektirir.** Editörün sayfaladığı DOM gerekir (`buildThesisLayoutPdf`). Node'daki `buildThesisPdf` yalnız fallback'tir ve index sayfa numaralarını boş bırakır. Gerçek PDF doğrulaması Playwright + Chromium ile uygulama üzerinden yapılır.
6. **Kaynakça yalnız stil ve hanging indent'tir.** Atıf stili (APA vb.) uygulanmaz, yalnız belgelenir (`citationStyle`).
7. **Metadata doğrulaması yalnız `minItems` ile yapılır.** Uyarı niteliğindedir; kaydetmeyi veya export'u engellemez.
8. **Yeni şema alanı gerektiren bir kural implementasyon kapsamı değildir.** Bu tür kurallar `engineGaps` listesine yazılır. Motor genişletmesi ayrı, kullanıcı onaylı bir görevdir. Bir target yalnız engine gap yüzünden BLOCKED olmaz; gap belgelenmiş, geri kalan kurallar PASS ise target `PASS_WITH_GAPS` olur.
9. **Şablonlar yalnız veridir.** Editör veya motor kodunda üniversiteye özel dal olmaz.

## Durum değerleri

- `analysis`: `PENDING | IN_PROGRESS | DONE | FAILED`
- `implementation`: `PENDING | IN_PROGRESS | DONE | FAILED`
- `validation`: `PENDING | IN_PROGRESS | PASS | PASS_WITH_GAPS | FAIL`
- `status` (target geneli): `PENDING | ANALYZED | IMPLEMENTED | COMPLETE | BLOCKED`
- `attempts`: implementation→validation döngüsü sayısı; `maxAttempts` = 3.

## Çalışma stratejisi

### 0) Ortam hazırlığı (bir kez)

```bash
cd TxtNote/frontend && npm ci          # node_modules şu an yok
pip install pymupdf python-docx        # PDF/DOCX ölçümü için; şu an kurulu değil
# LibreOffice (soffice) ve Chromium (/opt/pw-browsers) mevcut
```

Kaynak dönüştürme örneği (yalnız artifacts'a yazılır):

```bash
soffice --headless --convert-to pdf --outdir orchestration/artifacts/<id>/source "<Butun-Sablonlar/...docx>"
```

### A) ANALYSIS: en fazla 5 izole subagent, paralel

- **Seçim**: `progress.json` içinde `analysis != DONE` olan target'lar alınır. Sıra `priority` (1 → 3), sonra manifest sırasıdır.
- **Verilen context**:
  - target'ın `manifest.json` kaydı: `sourceFiles` + `supplementarySources`;
  - `schema.d.ts`, `thesis/README.md`, `templates/mcbu.js` (referans desen), `templates/generic.js`.
- **Yasaklar**: Başka target'ların kaynaklarını açmak yasaktır. Production code (`TxtNote/`) ve `Butun-Sablonlar/` değiştirilemez.
- **Çıktı `specs/<id>.json`**:

```jsonc
{
  "id": "deu-fbe", "schemaVersion": 1, "analyzedAt": "YYYY-MM-DD",
  "sourcePriority": ["<path> (neden)", "..."],          // çelişkide hangisi kazanır
  "variants": [{ "registryId": "...", "degreeType": "...", "language": "...", "confirmed": true, "evidence": "<path>#p12" }],
  "rules": [
    { "key": "page.margins.leftMm", "value": 40, "unit": "mm",
      "evidence": [{ "source": "<path>", "locator": "s. 7 §2.1 | docx sectPr w:pgMar", "quote": "Sol kenar 4 cm" }],
      "confidence": "explicit | measured | inferred", "appliesTo": ["*"] }
  ],
  "sections": [ /* sıra, tür, zorunluluk, numaralandırma, blok düzeni ölçüleri, kanıtlı */ ],
  "placeholders": { },
  "conflicts": [ { "topic": "...", "sources": [...], "decision": "...", "needsConfirmation": true } ],
  "engineGaps": [ { "rule": "...", "reason": "...", "workaround": "..." } ],
  "measurableChecks": [ { "id": "margin-left", "what": "body metni x0", "expected": 113.39, "unit": "pt", "tolerance": 1 } ]
}
```

- **Kanıt kuralı**: Her kural en az bir `evidence` (dosya + sayfa/paragraf/XML konumu + kısa alıntı) taşır. Kanıtı olmayan kural spec'e girmez. Kaynak sessizse bu `conflicts` / `openQuestions` içinde belirtilir. DOCX şablonlarında sayısal değerler öncelikle XML'den okunur (`w:pgMar`, `w:spacing`, `w:ind`, `w:rFonts`, `w:sz`).
- **`reports/<id>.md`**: özet, varyant kararı, kaynak önceliği, çelişkiler, engine gap'ler, açık sorular.
- **Orchestrator** her analyzer bittiğinde `analysis=DONE` (veya `FAILED` + `lastError`), `specPath` ve `reportPath` değerlerini yazar.

### B) IMPLEMENTATION: tek Integrator, sırayla

- **Paralel yazma yasak**: Production code'a aynı anda yalnız bir Integrator yazar.
- **Sıra**: `analysis=DONE` olan target'lar; önce `dependencies`i tamamlanmış olanlar, sonra priority.
- **Her target için adımlar**:
  1. `templates/<id>.js` veri modülünü yaz. Tüm varyantlar named export olur; ortak kurallar tek `base` nesnesinde tutulur.
  2. `registry.js`'ye varyant başına bir descriptor ekle (`displayName` dahil).
  3. `source` alanı: `type: "official"`, `documentName` = kaynak dosya adları, `revisionDate`, `verifiedAt`.
  4. Target başına bir test ekle (`src/lib/thesis<Id>.test.js`): şablon doğrulaması, registry eşleşmesi ve spec'teki ölçülebilir değerlerin şablonda olduğu kontrol edilir.
  5. Çalıştır: `node --test src/lib/*.test.js` (frontend'de) ve `npm run build`.
  6. Varyant başına örnek bir tez export et: DOCX (`buildThesisDocx`) ve layout PDF (Playwright ile uygulamadan). Çıktılar `artifacts/<id>/export/<registryId>.{pdf,docx}` altına yazılır.
  7. Tek bir commit at: `thesis(<id>): ...`. Commit hash'i progress'e yazılır, `implementation=DONE`.
- **Engine kodu**: Değiştirilmez (bkz. kısıt 8). Gerekirse durulur ve kullanıcıya sorulur.

### C) VALIDATION: bağımsız Validator

- **Bağımsızlık**: Implementasyonu yapan ajan kendi işine PASS veremez. Validator, Integrator'un konuşma geçmişi olmadan başlatılır.
- **Validator'ın girdisi**: yalnız SOURCE + `specs/<id>.json` + gerçek export çıktıları. Integrator'un açıklamalarına güvenmez.
- **Programatik ölçümler**:
  - **PDF (PyMuPDF)**: sayfa boyutu; ilk/son metin satırının x/y'si (margin); font adı ve boyutu; satır aralığı (ardışık baseline farkı); sayfa numarası konumu ve formatı (roman/arabic geçişi); başlık hizası; özel sayfa blok y-konumları.
  - **DOCX (python-docx / XML)**: `w:pgMar`, `w:rFonts`, `w:sz`, `w:spacing`, `w:ind`, bölüm numaralandırması (`w:pgNumType`), section kırılımları.
  - **Kaynak ile yan yana karşılaştırma**: Kaynak DOCX `soffice` ile PDF'e çevrilir ve aynı ölçümler iki tarafa uygulanır.
- **Görsel kontrol**: Sayfa görüntüsü karşılaştırması yalnız destekleyicidir; tek başına PASS gerekçesi olamaz.
- **Toleranslar** (spec aksini söylemedikçe):

| Ölçü | Tolerans |
|---|---|
| Margin | ±1 mm |
| Font boyutu | ±0.25 pt |
| Satır aralığı | ±5 % |
| Blok konumu | ±2 mm |

- **Çıktı**: `validation/<id>/attempt-<n>.json` (her check: expected / actual / pass) ve `.md` özet. Sonuç PASS, `PASS_WITH_GAPS` (yalnız `engineGaps` kaynaklı sapmalar) veya FAIL olur.

### D) RETRY

- **FAIL durumunda**: `failures/<id>/attempt-<n>.md` (başarısız check'ler ve beklenen değerler) Integrator'a döner. Döngü şöyledir: düzeltme → yeniden export → **yeni** bağımsız Validator.
- **Deneme sayısı**: Her implementation→validation döngüsünde `attempts` 1 artar.
- **PASS olmadan tamamlanma yok**: PASS (veya `PASS_WITH_GAPS`) olmadan target `COMPLETE` olmaz.
- **BLOCKED**: `attempts >= maxAttempts` (3) olursa target BLOCKED olur. Başarısız check sayısı iki ardışık denemede azalmıyorsa da BLOCKED olur. Gerekçe `failures/<id>/BLOCKED.md` dosyasına yazılır, sonraki target'a geçilir. Başarısız varyantın registry girdisi eklenmiş kalmaz: BLOCKED bir target'ın değişiklikleri revert edilir.

### E) CHECKPOINT / devam etme

- **Her adım sonunda** `progress.json` güncellenir (`updatedAt`, `currentTarget`) ve commit edilir. Yarım adım işaretlenmez: önce çıktı dosyası yazılır, sonra durum güncellenir.
- **Oturum kesildiğinde veya context sıkıştırıldığında** yeniden başlama protokolü:
  1. `progress.json`'u oku; `COMPLETE` ve `BLOCKED` target'lara dokunma.
  2. `IN_PROGRESS` kalan adımı yeniden başlat. Çıktı dosyası varsa ve geçerliyse DONE say. Yoksa PENDING'e çek.
  3. `analysis=DONE` durumu için `specs/<id>.json` dosyasının var ve geçerli JSON olması şarttır; aksi halde analiz yeniden yapılır.
  4. `implementation=DONE` durumu için progress'teki commit'in git geçmişinde olması şarttır.
- **Manifest değişikliği**: Manifest yalnız kanıta dayalı olarak değişir (ör. analiz bir varyantın var olmadığını gösterirse). Değişiklik `reports/<id>.md` dosyasında gerekçelendirilir.

## Özel notlar

- **`mcbu-lee`** (`EXISTING_REVIEW`): Mevcut `mcbu.js` farklı bir PDF'ten üretildi. Analiz, yeni DOCX kılavuza göre bir fark raporu çıkarır. Değişiklik gerekiyorsa yeni `-v2` id'leri açılır; v1 korunur.
- **Doğrulanmamış varyant**: `ieu-lee` phd-tr kaynakta doğrulanmadı (`confirmed: false`). Analiz kanıtlamazsa registry'ye girmez.
- **Analizde teyit edilecek belgeler**: `dpu-lee` EN eki, `ieu-lee` hukuk ek açıklamaları ve `iyte-lee` makale-tez yönergesi. Bunlardan ayrı bir varyant çıkıp çıkmayacağı analizde teyit edilir. Varsayılan: hayır.
- **Güncelliği şüpheli kaynaklar**: `outdated-source` işaretli target'lar (aku-sagbil 2015, usak-insaat-lisans 2009, iyte-lee 2019). Şablon `source.notes` içinde bu belirtilir.
- **Kapsam dışı üniversiteler**: Aydın Adnan Menderes, İzmir Demokrasi ve İzmir Tınaztepe'de yerel kaynak yok. Bu üniversiteler implementasyon listesinde yer almaz.
- **Dışlanan dosya**: `…Thesis_Template_EN_2025-09-04.docx.download` geçerli kaynak değildir. Gerçek `.docx` ile MD5'i aynıdır.
