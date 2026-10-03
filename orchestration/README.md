# Tez şablonu orkestrasyonu

## Active policy 2026-10-03

This policy supersedes conflicting older rules and environment notes below. `AGENTS.md` and the user's latest source-priority decisions take precedence.

1. Official university sources are authoritative. When specified for the task, a source template's XML/example structure takes priority over prose; record both sides of disagreements. Anything not established remains `UNKNOWN`; do not invent a degree/language variant or formatting value.
2. Gate sequence: **SOURCE → SPEC → IMPLEMENTATION → REAL EXPORT → independent validation → PASS → regression check → checkpoint**. Unit tests, local self-checks, template values, or visual resemblance do not establish PASS. A self-PASS is not independent PASS.
3. Explicit geometry is exact; tolerance is measurement noise only: ≤0.5 mm by default (prefer ≤0.25 mm when reliable). Do not broaden tolerance to make output pass.
4. Generic engine extensions are in scope when a source proves a missing capability. Keep them backward compatible, deterministic where practical, tested, and regression checked. Do not add university-specific engine branches.
5. Validate exported fonts, not only requested names. A substitute font cannot satisfy an exact source requirement. Record actual font and host limitations.
6. University order is `progress.json.universityOrder`: AKÜ → AFSÜ → ADÜ → remaining universities. Do not start the next university before the current defined gate unless the orchestrator explicitly permits it.
7. At most **2 concurrent Luna workers**. The current execution host is Windows. Microsoft Word COM is available for controlled validation; use one owned instance, record its PID, call `Quit` in `finally`, and never terminate an unknown or other-owned Word process. Linux/LibreOffice instructions below are historical.
8. `BLOCKED` requires evidence of a real source or technical blocker. Attempts or difficulty alone do not justify it. An unresolved source identity is `UNKNOWN`, not a substitute source.
9. Keep changes narrow. Preserve prior commits and reports, update `progress.json` at checkpoints, and do not commit generated artifacts or change `Butun-Sablonlar/`.

### Inventory checkpoint 2026-10-03

`manifest.json` indexes 50 targets across 18 university IDs, with 17 source-present/implementable IDs and 83 variant entries (82 confirmed, one unconfirmed). The total includes confirmed AFSÜ proposal, Tıp, and DHF registry/module variants. It records 95 verified local source documents (34 PDF, 57 DOCX, 4 DOC); ten active source records plus one historical path remain unresolved and are reported as `UNKNOWN`. `progress.json` contains 50 target records across 17 universities; it is a work ledger, not a completion claim. See [`reports/source-inventory-refresh-2026-10-03.md`](reports/source-inventory-refresh-2026-10-03.md) and [`CLOSEOUT_2026-10-03.md`](CLOSEOUT_2026-10-03.md).

## Policy revision 2026-09-28 (historical; superseded where it conflicts)

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

### Tooling (historical Linux environment; not the current Windows requirements)

- The shell script, `/usr/share/fonts/...`, and LibreOffice commands describe an earlier Linux run. On the current Windows host, use the repository's Windows/browser tools and available Microsoft Word COM path; do not assume those Linux paths or fonts exist.
- `orchestration/tools/export.mjs` remains an available real-export harness when its Playwright prerequisites are configured; validate the exact generated output against source evidence.


Bu klasör, `Butun-Sablonlar/` kaynaklarını TxtNote tez motoruna (`TxtNote/frontend/src/thesis/`) aktaran uzun süreli, kesintiye dayanıklı iş akışını yönetir.

- `Butun-Sablonlar/` **salt okunurdur (source of truth)**. Hiçbir ajan oradaki bir dosyayı değiştirmez, taşımaz veya dönüştürülmüş kopyasını yanına yazmaz. Dönüştürmeler (docx→pdf, metin çıkarımı, sayfa görüntüleri) yalnız `orchestration/artifacts/<id>/` altına yazılır.
- Tek doğru durum kaynakları `manifest.json` (ne yapılacak) ve `progress.json` (ne yapıldı) dosyalarıdır.

## Dosyalar

| Yol | İçerik | Yazan |
|---|---|---|
| `manifest.json` | Güncel yerel kaynak envanteri, target/variant kayıtları ve unresolved-source durumları; 2026-10-03 itibarıyla 50 target ve 95 verified local source documents | Orchestrator; source/path changes require evidence in `reports/` |
| `progress.json` | Target başına `analysis / implementation / validation / attempts / status`; 2026-10-03 itibarıyla 50 target / 17 universities | Yalnız Orchestrator |
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
  - H1–H5 başlık kuralları; heading sequence seçenekleri arabic/roman yanında lower/upper alphabetic ve Turkish ordinal formatlarını destekler.
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
  - Metadata içerik doğrulaması: advisory `minItems` (validation blocks export değildir).
  - `derived: "totalPages"`

## Bilinen kısıtlar

Analyzer bu kısıtlara karşı spec yazar; Integrator bunları sessizce aşmaz.

1. **Tek/çift sayfa (ayna) margin ve cilt payı ayrımı yok.** Header/footer ilk sayfa dışında tek/çift ayrımı yapmaz.
2. **Sayfa numarası biçimi arabic/roman ile sınırlı; heading sequence biçimi daha geniştir.** Heading sequence için arabic, roman, lower/upper alphabetic ve Turkish ordinal kullanılabilir. Bölüm başlıkları ve sayfa numarası formatları aynı özellik değildir.
3. **Özel sayfalar temel block modelini kullanır;** text, metadata, image, spacer, separator ve group desteklenir. Group içinde border/frame (PDF/editor/Word) ve absolute/anchored yerleşimli leaf block'lar mevcuttur. `docxContentFrame` ayrıca tam DOCX içerik çerçevesi konumlandırır. Bu yetenekler her tür tablolu/akışlı özel sayfa davranışı bulunduğu anlamına gelmez; gereksinime göre gerçek export ile doğrulanır.
4. **PDF fonts**: the current path can embed exact system Times New Roman, Arial, Calibri, and Cambria Math faces when available and embeddable. Tinos is bundled as a default/fallback and is not a compliant substitute for Times New Roman. Verify actual PDF font programs and glyph coverage; see `TxtNote/frontend/src/thesis/README.md`.
5. **Layout PDF tarayıcı DOM'u gerektirir.** Editörün sayfaladığı DOM gerekir (`buildThesisLayoutPdf`). Node'daki `buildThesisPdf` yalnız fallback'tir ve index sayfa numaralarını boş bırakır. Gerçek PDF doğrulaması Playwright + Chromium ile uygulama üzerinden yapılır.
6. **Kaynakça yalnız stil ve hanging indent'tir.** Atıf stili (APA vb.) uygulanmaz, yalnız belgelenir (`citationStyle`).
7. **Metadata içerik kuralları sınırlı advisory `minItems` doğrulamasıdır.** Uyarı/error listesine yazılır, ancak kaydetmeyi veya export'u engellemez.
8. **Engine additions**: this older no-extension rule is revoked by the active policy above. A source-proven capability gap may be implemented generically and regression-tested.
9. **Şablonlar yalnız veridir.** Editör veya motor kodunda üniversiteye özel dal olmaz.

## Durum değerleri

- `analysis`: `PENDING | IN_PROGRESS | DONE | FAILED`
- `implementation`: `PENDING | IN_PROGRESS | DONE | FAILED`
- `validation`: `PENDING | IN_PROGRESS | PASS | FAIL`; `PASS_WITH_GAPS` is historical and is not a terminal completion gate.
- `status` (target geneli): `PENDING | ANALYZED | IMPLEMENTED | IN_PROGRESS | COMPLETE | FAIL | BLOCKED`
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

### A) ANALYSIS (historical workflow; active concurrency limit is 2 Luna workers)

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
- **Engine kodu**: This is a historical restriction and is superseded by the active policy: implement a source-proven generic capability gap, with tests and regression checks.

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
| Explicit geometry | ≤0.5 mm maximum; prefer ≤0.25 mm where reliable |
| Font face | Exact requested face; inspect exported font program and glyph coverage |
| Font size | ±0.1 pt (measurement tolerance only) |
| Line pitch | ±0.2 pt (measurement tolerance only) |

- **Çıktı**: `validation/<id>/attempt-<n>.json` (her check: expected / actual / pass) ve `.md` özet. Tam gate sonucu PASS veya FAIL olur; `PASS_WITH_GAPS` does not close a source-backed requirement.

### D) RETRY

- **FAIL durumunda**: `failures/<id>/attempt-<n>.md` (başarısız check'ler ve beklenen değerler) Integrator'a döner. Döngü şöyledir: düzeltme → yeniden export → **yeni** bağımsız Validator.
- **Deneme sayısı**: Her implementation→validation döngüsünde `attempts` 1 artar; limite ulaşmak tek başına BLOCKED gerekçesi değildir.
- **PASS olmadan tamamlanma yok**: independent PASS olmadan target `COMPLETE` olmaz.
- **BLOCKED**: Yalnız desteklenen bir kaynak veya teknik engel işi gerçekten önlüyorsa kullanılır. Eksik kanıt/teknik sınır `failures/<id>/BLOCKED.md` içinde belirtilir. Deneme sayısı, süre veya zorluk tek başına BLOCKED gerekçesi değildir; yararlı implementasyon otomatik revert edilmez.

### E) CHECKPOINT / devam etme

- **Her adım sonunda** `progress.json` güncellenir (`updatedAt`, `currentTarget`) ve commit edilir. Yarım adım işaretlenmez: önce çıktı dosyası yazılır, sonra durum güncellenir.
- **Oturum kesildiğinde veya context sıkıştırıldığında** yeniden başlama protokolü:
  1. `progress.json`'u oku; `COMPLETE` target'ları açma. `BLOCKED` kayıtlarını yalnız engel kanıtı değiştiğinde yeniden değerlendir.
  2. `IN_PROGRESS` kalan adımı yeniden başlat. Çıktı dosyası varsa geçerliliğini kontrol et; yoksa ilgili adımı PENDING'e çek.
  3. `analysis=DONE` durumu için `specs/<id>.json` dosyasının var ve geçerli JSON olması şarttır; aksi halde analiz yeniden yapılır.
  4. `implementation=DONE` durumu için progress'teki commit'in git geçmişinde olması şarttır.
- **Manifest değişikliği**: Manifest yalnız kanıta dayalı olarak değişir (ör. analiz bir varyantın var olmadığını gösterirse). Değişiklik `reports/<id>.md` dosyasında gerekçelendirilir.

## Özel notlar

- **`mcbu-lee`** (`EXISTING_REVIEW`): Mevcut `mcbu.js` farklı bir PDF'ten üretildi. Analiz, yeni DOCX kılavuza göre bir fark raporu çıkarır. Değişiklik gerekiyorsa yeni `-v2` id'leri açılır; v1 korunur.
- **Doğrulanmamış varyant**: `ieu-lee` phd-tr kaynakta doğrulanmadı (`confirmed: false`). Analiz kanıtlamazsa registry'ye girmez.
- **Analizde teyit edilecek belgeler**: `dpu-lee` EN eki, `ieu-lee` hukuk ek açıklamaları ve `iyte-lee` makale-tez yönergesi. Bunlardan ayrı bir varyant çıkıp çıkmayacağı analizde teyit edilir. Varsayılan: hayır.
- **Güncelliği şüpheli kaynaklar**: `outdated-source` işaretli target'lar (aku-sagbil 2015, usak-insaat-lisans 2009, iyte-lee 2019). Şablon `source.notes` içinde bu belirtilir.
- **Source availability update (2026-10-03)**: İzmir Demokrasi Üniversitesi LEE TR/EN guide filenames were found locally and `idu-lee` is indexed as `ANALYSIS_PENDING`; no degree variants or rules are inferred yet. İzmir Tınaztepe still has no local guide file. Aydın Adnan Menderes was not re-inventoried in this refresh and is not an active target; do not use the old no-source note as current evidence.
- **Dışlanan dosya**: `…Thesis_Template_EN_2025-09-04.docx.download` geçerli kaynak değildir. Gerçek `.docx` ile MD5'i aynıdır.
