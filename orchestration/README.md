# Tez şablonu orkestrasyonu

## Active policy 2026-10-03

This policy supersedes conflicting older rules and environment notes below. `AGENTS.md` and the user's latest source-priority decisions take precedence.

1. Official university sources are authoritative. When specified for the task, a source template's XML/example structure takes priority over prose; record both sides of disagreements. Anything not established remains `UNKNOWN`; do not invent a degree/language variant or formatting value.
2. Gate sequence: **SOURCE → SPEC → IMPLEMENTATION → REAL EXPORT → independent validation → PASS → regression check → checkpoint**. Unit tests, local self-checks, template values, or visual resemblance do not establish PASS. A self-PASS is not independent PASS.
3. Explicit geometry is exact; tolerance is measurement noise only: ≤0.5 mm by default (prefer ≤0.25 mm when reliable). Do not broaden tolerance to make output pass.
4. Generic engine extensions are in scope when a source proves a missing capability. Keep them backward compatible, deterministic where practical, tested, and regression checked. Do not add university-specific engine branches.
5. Validate exported fonts, not only requested names. A substitute font cannot satisfy an exact source requirement. Record actual font and host limitations.
6. University order is `progress.json.universityOrder`: AKÜ → AFSÜ → ADÜ → remaining universities. Do not start the next university before the current defined gate unless the orchestrator explicitly permits it.
7. At most **2 concurrent Luna workers**. Host is Windows. Microsoft Word COM only for Word-pagination/glyph-metric criteria: one owned instance, record its PID, 120 s timeout, call `Quit` in `finally`, never terminate an unknown or other-owned Word process; on timeout fall back to DOCX XML + editor PDF and record the limitation.
8. `BLOCKED` requires evidence of a real source or technical blocker. Attempts or difficulty alone do not justify it. An unresolved source identity is `UNKNOWN`, not a substitute source.
9. Keep changes narrow. Preserve prior commits and reports, update `progress.json` at checkpoints, and do not commit generated artifacts or change `Butun-Sablonlar/`.
10. Token-efficient workflow (AGENTS.md section 24A) governs sections A-E below: checker script instead of a fresh LLM validator; cached official renders; re-validate failed rows only; `specs/<target>.CONTEXT.md` context packs; batched small fixes; <=15-line worker reports.

## Why the token-efficient method exists (measured, session of 2026-10-03)

One multi-agent session burned about 2.7M tokens for few results. Causes:
- Independent validation by an LLM agent: 160-260k tokens and 7-27 min each (cold start re-reading AGENTS/briefs/spec/sources, Playwright export, Word COM PDF render that once hung 17 min, ad-hoc PyMuPDF scripts rewritten every time).
- Integrator fixes: 80-165k each. Even a one-line UI fix by a Haiku cost 55-85k because of cold-start reading.
- Targets need about 3 validate/fix rounds.
- Very long single-line JSX files are expensive to read.
- The orchestrator's own long conversation grows every turn.

Method (binding, see `AGENTS.md` section 24A): deterministic conformance checker first; independence via source-derived references, not a fresh LLM redoing everything; official reference renders cached once under `artifacts/<target>/source/`; after the first full validation re-check only failed rows + automated regression; per-target `specs/<target>.CONTEXT.md` (<=1 page) instead of re-reading AGENTS/briefs/sources; batch small fixes into one worker (Haiku mechanical, Sonnet engine/conflicts, orchestrator does one-line fixes); worker output <=15 lines; Word COM only where Word pagination/glyph metrics matter (own PID, 120 s timeout, Quit in `finally`, fall back to DOCX XML + editor PDF and record the limitation); one university or engine theme per session with a short RESUME note then a fresh session; grep / line-range reads.

### Next step (top priority)
Build the conformance checker in `orchestration/tools/` (one command: export.mjs -> optional Word render -> PyMuPDF/DOCX-XML landmark measurement of our output AND the cached official reference -> expected/actual/delta JSON + short table). Until it exists validators reuse the existing scripts in `orchestration/tools/` and earlier `validation/<target>/` attempt folders; no new ad-hoc measurement scripts.

### Scaling plan
a. Conformance checker (above).
b. DOCX->spec analyzer: auto-extract styles / sectPr / margins / fonts / spacing / numbering / header-footer from official templates as MEASURED values.
c. Harden the engine on the 3 current universities (AKU, AFSU, MCBU) as a regression corpus before adding new ones.
d. Two-tier Done: high-rejection-risk rules (margins, font face/size, line spacing, page numbering, fixed-page geometry) must be PASS by the checker; source-silent edge cases are labelled UNKNOWN and do not block. REQUIRES USER APPROVAL (product decision not yet confirmed); until approved the full Definition of Done in AGENTS.md section 28 applies.
e. Prioritise universities by user demand and template families.

### Inventory checkpoint 2026-10-03

`manifest.json` indexes 50 targets across 18 university IDs, with 17 source-present/implementable IDs and 83 variant entries (82 confirmed, one unconfirmed). The total includes confirmed AFSÜ proposal, Tıp, and DHF registry/module variants. It records 95 verified local source documents (34 PDF, 57 DOCX, 4 DOC); ten active source records plus one historical path remain unresolved and are reported as `UNKNOWN`. `progress.json` contains 50 target records across 17 universities; it is a work ledger, not a completion claim. See [`reports/source-inventory-refresh-2026-10-03.md`](reports/source-inventory-refresh-2026-10-03.md) and [`CLOSEOUT_2026-10-03.md`](CLOSEOUT_2026-10-03.md).

## Policy revision 2026-09-28

This section supersedes every conflicting rule further below (older rules stay for history).

1. **Source documents are the only source of truth.** Pipeline per target: SOURCE → normalized spec → TxtNote implementation → REAL TxtNote export → independent measurement → PASS. "Looks correct", unit tests or template values are not validation.
2. **Exact values.** A documented value (e.g. 35 mm) is implemented exactly. Validation tolerance is only measurement noise: explicit dimensions FAIL above **0.5 mm** (target ≤ 0.25 mm where measurable); font size ±0.1 pt; line pitch ±0.2 pt. Older tolerances (±1 mm margins, ±2 mm blocks, ±5 % spacing) are revoked.
3. **UNKNOWN over invention.** A rule the sources do not establish is recorded `UNKNOWN`; values are never copied from another university. Word defaults in a DOCX are not university requirements unless the template itself carries them (then confidence `TEMPLATE`).
4. **Engine extension is allowed** (old constraint 8 revoked) when a verified source requirement cannot be represented: generic, backward-compatible, tested, regression-checked. No university-specific branches in engine/editor code.
5. **Fonts are real requirements.** Tinos/Liberation/Helvetica substitution is not PASS for a Times New Roman / Arial requirement. The export must embed the genuine font (verified from the PDF font program), otherwise the check FAILs or the target is BLOCKED with evidence. `PASS_WITH_GAPS` is not a terminal success state for a requirement the engine can be extended to meet.
6. **Universities strictly one at a time** in `progress.json.universityOrder`; a university is complete only after its FINAL GATE (all targets PASS or evidenced BLOCKED).
7. **Attempts**: `maxAttempts` is a checkpoint for re-evaluation, not an automatic BLOCKED. BLOCKED only for genuinely impossible requirements, documented in `failures/<target-id>.md`.
8. **Independent validation**: kaynak-türevli referansa karşı conformance checker; LLM yalnız başarısız/çelişkili satırları yorumlar (bölüm C).

Confidence levels in specs: `EXPLICIT` (stated in guide text), `TEMPLATE` (read from an official DOCX template's XML/styles), `MEASURED` (measured on an official example page / PDF geometry), `INFERRED` (reasoned, must say why), `UNKNOWN`.

### Tooling

- `orchestration/tools/export.mjs` gerçek export koşumudur (Playwright + Chrome); çıktı kaynak kanıtına karşı ölçülür. Word COM yalnız Word-bağımlı kriterlerde (kural: bölüm C).

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
9. **Şablonlar yalnız veridir.** Editör veya motor kodunda üniversiteye özel dal olmaz.

## Durum değerleri

- `analysis`: `PENDING | IN_PROGRESS | DONE | FAILED`
- `implementation`: `PENDING | IN_PROGRESS | DONE | FAILED`
- `validation`: `PENDING | IN_PROGRESS | PASS | FAIL`; `PASS_WITH_GAPS` is historical and is not a terminal completion gate.
- `status` (target geneli): `PENDING | ANALYZED | IMPLEMENTED | IN_PROGRESS | COMPLETE | FAIL | BLOCKED`
- `attempts`: implementation→validation döngüsü sayısı; `maxAttempts` = 3.

## Çalışma stratejisi

### 0) Ortam
Windows host; kurulu araçlar: PyMuPDF, python-docx, Playwright (`orchestration/tools/node_modules`), Chrome, LibreOffice, Word COM. Dönüştürmeler yalnız `orchestration/artifacts/<id>/source/` altına yazılır. Dev server ve export komutları `orchestration/tools/devserver.sh`, `make-fixture.mjs`, `export.mjs` (bkz. `AKU_DEPT_WORKER_BRIEF.md`).

### A) ANALYSIS
- **Seçim**: `progress.json` içinde `analysis != DONE` target'lar; sıra `priority`, sonra manifest sırası. Bir oturumda tek üniversite.
- **Context**: target'ın `manifest.json` kaydı (`sourceFiles` + `supplementarySources`), `schema.d.ts`, `thesis/README.md`, referans şablon desen. Atanan kaynak bir kez okunur (DOCX için önce DOCX->spec analyzer / XML çıkarımı); başka target'ların kaynakları açılmaz; `TxtNote/` ve `Butun-Sablonlar/` değiştirilmez.
- **Çıktı**: `specs/<id>.json` (şema `ANALYZER_BRIEF.md`'de), `reports/<id>.md` ve <=1 sayfalık `specs/<id>.CONTEXT.md` (kaynak dosya+konum, anahtar değerler, açık çelişki/kararlar, durum, komutlar). Sonraki işçiler AGENTS.md/brief/kaynakların tamamı yerine CONTEXT.md'yi okur.
- **Kanıt kuralı**: Her kural en az bir `evidence` (dosya + sayfa/paragraf/XML konumu + kısa alıntı) taşır; kanıtsız kural spec'e girmez; sessiz kaynak `conflicts` / `openQuestions` altında UNKNOWN. DOCX sayısal değerleri öncelikle XML'den (`w:pgMar`, `w:spacing`, `w:ind`, `w:rFonts`, `w:sz`).
- **Orchestrator** her analyzer sonrası `analysis=DONE` (veya `FAILED` + `lastError`), `specPath`, `reportPath` yazar.


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
- **Engine kodu**: kaynakla kanıtlanmış generic bir yetenek eksikliği generic, opt-in, testli ve regresyon kontrollü olarak implement edilir.

### C) VALIDATION: checker + independent interpretation
- **Bağımsızlık**: Implementasyonu yapan ajan kendi işine PASS veremez. Bağımsızlık, çıktının kaynak-türevli referansla (resmi DOCX/DOC render'ı, çıkarılmış XML değerleri, spec) bir script tarafından karşılaştırılmasıyla sağlanır; implementasyon ajanının açıklamalarına güvenilmez.
- **Conformance checker** (`orchestration/tools/`, tek komut): gerçek export (`export.mjs`) -> gerekirse Word render -> PyMuPDF / DOCX-XML ölçümü, hem bizim çıktıda hem önbellekteki resmi referansta -> expected/actual/delta JSON + kısa tablo. Ölçülenler: PDF sayfa boyutu, margin, font adı/boyutu, satır aralığı, sayfa numarası konum/format, başlık hizası, özel sayfa blok konumları; DOCX `w:pgMar`, `w:rFonts`, `w:sz`, `w:spacing`, `w:ind`, `w:pgNumType`, section kırılımları. Checker yoksa mevcut `orchestration/tools/` script'leri ve önceki `validation/<id>/` denemeleri kullanılır; yeni ad-hoc ölçüm script'i yazılmaz, paylaşılan araç genişletilir.
- **LLM yorumlayıcı** yalnız checker çıktısını, spec'i ve başarısız/çelişkili satırların kaynak konumlarını okur; çıktısı <=15 satır.
- **Resmi referans render'ları** kaynak başına bir kez üretilip `artifacts/<id>/source/` altında önbelleğe alınır; deneme başına yeniden render edilmez.
- **Word COM** yalnız Word sayfalaması/glif metriğine bağlı kriterlerde; kendi instance'ı, PID kaydı, 120 sn timeout, `finally` içinde `Quit`. Timeout'ta DOCX XML + editör PDF'ine dönülür ve sınırlama kaydedilir.
- **Görsel kontrol** yalnız destekleyicidir; tek başına PASS gerekçesi olamaz.
- **Toleranslar** (spec aksini söylemedikçe):

| Ölçü | Tolerans |
|---|---|
| Explicit geometry | ≤0.5 mm maximum; prefer ≤0.25 mm where reliable |
| Font face | Exact requested face; inspect exported font program and glyph coverage |
| Font size | ±0.1 pt (measurement tolerance only) |
| Line pitch | ±0.2 pt (measurement tolerance only) |

- **Çıktı**: `validation/<id>/attempt-<n>.json` (her check: expected / actual / pass) ve kısa `.md`. Gate sonucu PASS veya FAIL; `PASS_WITH_GAPS` kaynak-destekli bir gereksinimi kapatmaz.

### D) RETRY
- **FAIL**: `failures/<id>/attempt-<n>.md` (başarısız check'ler, beklenen değerler) Integrator'a döner. Düzeltme -> yeniden export -> checker yalnız başarısız check'ler + otomatik regresyon koşusu için yeniden çalışır. Dokunulmayan PASS maddeleri elle yeniden ölçülmez.
- **Deneme sayısı** her implementation->validation döngüsünde 1 artar; limite ulaşmak tek başına BLOCKED gerekçesi değildir.
- **PASS olmadan tamamlanma yok**: independent PASS olmadan target `COMPLETE` olmaz.
- **BLOCKED**: Yalnız desteklenen bir kaynak veya teknik engel işi gerçekten önlüyorsa; eksik kanıt/teknik sınır `failures/<id>/BLOCKED.md` içinde belirtilir. Yararlı implementasyon otomatik revert edilmez.

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
