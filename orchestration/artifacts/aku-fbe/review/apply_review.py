"""Independent spec review of aku-fbe: applies the reviewer's changes to specs/aku-fbe.json in place.
Run once: python3 apply_review.py  (idempotent guard: refuses if spec already has "review")."""
import json, sys, copy

SPEC = "/home/user/TxtNote-Template-Work/orchestration/specs/aku-fbe.json"
G = "Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf"
T = "Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx"
LO = "orchestration/artifacts/aku-fbe/review/aku_template.pdf"

s = json.load(open(SPEC))
if "review" in s:
    sys.exit("already reviewed")

changes, decisions, openItems = [], [], []
rules = {r["key"]: r for r in s["rules"]}
secs = {x["id"]: x for x in s["sections"]}


def ev(src, loc, quote=None):
    e = {"source": src, "locator": loc}
    if quote:
        e["quote"] = quote
    return e


# ---------------------------------------------------------------- 1. Word layout model (brief item 8)
new_rules = [
    {"key": "wordModel.firstBaselineOffsetEm",
     "value": {"single": 0.9336, "onePointFive": 0.9336, "double": 0.9336,
               "formula": "baseline = lineBoxTop + (hhea lineGap 0.0425 + ascender 0.8911) × fontSize; the extra leading of 1.5/multiple spacing lies entirely BELOW the text (added under the descent), never above the first baseline"},
     "unit": "em", "confidence": "MEASURED", "appliesTo": ["*"],
     "evidence": [
         ev(G, "p.1 'T.C.' 14 pt, 1.5-spaced (pitch 24.12 pt), first line at the 30 mm top margin: baseline 34.59 mm = 30 + 0.9336×14 pt (4.61 mm) → 34.61"),
         ev(G, "p.4 '1. GİRİŞ' 12 pt 1.5: baseline 33.92; pp.5/9 33.96; approval/ÖZET/TEŞEKKÜR/list titles pp.34-42 33.96 → model 30 + 11.20 pt (3.95 mm) = 33.95"),
         ev(G, "p.33 inner cover: support line (12 pt, 1.5) 33.87 → 'AFYON KOCATEPE ÜNİVERSİTESİ' (14 pt, after one empty 14 pt 1.5 line) 50.38; model 33.87 + (20.7−11.20) + 24.15 + 13.07 pt = 50.35"),
         ev(LO, "LibreOffice render of the template (supporting only): first baselines 33.95 mm on pp.5,7,8,11,12,13; inner cover 34.62 (14 pt)"),
     ],
     "notes": "Refutes an ascent-only model (0.8911 em → 33.77 mm, 0.18 mm too high). For single spacing the same offset applies (a single-spaced first line has the same top part; only the part below the baseline shrinks)."},
    {"key": "wordModel.singleLineEm",
     "value": 1.1499, "unit": "em", "confidence": "MEASURED", "appliesTo": ["*"],
     "evidence": [
         ev(G, "p.32 12 pt single pitch 13.80 pt (1.15×12); pp.14-15 11 pt caption pitch 12.60 pt (1.15×11=12.65); p.4-7 12 pt 1.5 pitch alternating 20.64/20.76 (mean 20.70 = 1.5×13.80); p.33 14 pt 1.5 pitch 24.12-24.15; footer/callout 10 pt single 11.40-11.55"),
         ev("Times New Roman (msttcorefonts)", "hhea ascender 1825 + descender 443 + lineGap 87 = 2355/2048 = 1.1499 em"),
     ],
     "notes": "Word 'single' for TNR = (ascender+descender+lineGap). '1.5 lines' = 1.5 × single (20.70 pt at 12 pt, 24.15 pt at 14 pt, 17.25 pt at 10 pt). An empty paragraph takes its height from its paragraph-mark run size."},
    {"key": "wordModel.paragraphSpacing",
     "value": {"additive": True,
               "contextualSpacing": "not used (w:contextualSpacing absent from document.xml; only in an unused style)",
               "collapseWhenBothNonZero": "UNKNOWN",
               "spaceBeforeAtPageTop": "UNKNOWN",
               "blankLine": "an empty 1.5-spaced 12 pt paragraph = +20.70 pt between baselines"},
     "confidence": "MEASURED", "appliesTo": ["*"],
     "evidence": [
         ev(G, "pp.23-28 bibliography entries (before 6 pt, after 0, 1.5): entry-to-entry pitch 26.64-26.79 pt = 20.70 + 6 (space before added to the line pitch)"),
         ev(T, "#85/#87/#89 affiliation rows after=120 followed by juror rows with no before → template render (LO) pitch 26.70 pt = 20.70 + 6"),
         ev(G, "pp.4-5 paragraph → paragraph over one empty 1.5 line: 41.16-41.67 pt = 2 × 20.70"),
     ],
     "notes": "Only one-sided spacing (after XOR before) occurs in the sources, so whether Word adds or collapses after(prev)+before(next) is not demonstrated here, and no Word-rendered source page starts with a soft-broken paragraph that has space-before. The implementation must not rely on either behaviour for this target."},
]
for r in new_rules:
    s["rules"].append(r)
changes.append("Added wordModel.firstBaselineOffsetEm (0.9336 em = lineGap+ascent, extra 1.5 leading below; verified on guide pp.1,4,5,33 and LO render), wordModel.singleLineEm (1.1499), wordModel.paragraphSpacing (additive for one-sided spacing; collapse and page-top suppression UNKNOWN).")

m = rules["typography.lineSpacing.model"]
m["notes"] = (m.get("notes", "") + " Reviewer: confirmed; see wordModel.* rules for the first-baseline offset (lineGap+ascent) and the placement of the extra 1.5 leading below the text.").strip()

pb = rules["pagination.baselineMm"]
pb["evidence"].append(ev(LO, "LibreOffice render of the template (supporting): page-number baselines 283.72 mm on pp.7-13 and 14+ (single-paragraph footers, 10 pt)"))
pb["notes"] = pb.get("notes", "") + " Reviewer: model = 297 − 12.5 (footer bottom) − 0.2163×10 pt descent (0.76 mm) = 283.74; LO render 283.72 agrees."
changes.append("pagination.baselineMm 283.7: added LO render corroboration (283.72 mm).")

# ---------------------------------------------------------------- 2. missed explicit requirements
more = [
    {"key": "typography.punctuationSpacing", "value": "no space before punctuation, one space after", "confidence": "EXPLICIT", "appliesTo": ["*"],
     "evidence": [ev(G, "p.5 §2.2", "Yazımda noktalama işaretlerinden önce boşluk bırakılmamalı, sonra ise bir karakterlik boşluk bırakılmalıdır.")]},
    {"key": "typography.numbers", "value": {"decimalSeparator": ",", "thousandsGrouping": "groups of three separated by one space (8 245 354), no dot/comma"},
     "confidence": "EXPLICIT", "appliesTo": ["*"],
     "evidence": [ev(G, "p.11 §2.12", "Ondalıklı sayılar yazılırken virgül kullanılmalı ... üçerli gruplandırma yapılıp bu gruplar arasında bir karakter boşluk")],
     "notes": "Content rule (author responsibility); the guide's own examples elsewhere use decimal points (e.g. p.14 table), so it is not auto-checkable."},
    {"key": "figures.placement", "value": "on the page of first reference or the next page; always referenced in the text", "confidence": "EXPLICIT", "appliesTo": ["*"],
     "evidence": [ev(G, "p.12 §3.1", "Şekil, çizelge ve resimler metinde ilk değinildiği sayfada veya bir sonrakinde yer almalıdır.")]},
    {"key": "equations.inlineVariablesItalic", "value": True, "confidence": "EXPLICIT", "appliesTo": ["*"],
     "evidence": [ev(G, "p.10", "Cümle içinde yazılan denklemlere numara verilmez ve değişken olarak kullanılan harfler italik olarak yazılmalıdır.")]},
    {"key": "headings.chapterStartsNewPage.sections", "value": "Onay, Etik, Özet, Abstract, Teşekkür, all Dizin pages, every chapter, Kaynaklar, Özgeçmiş, Ekler (and each EK n.)",
     "confidence": "EXPLICIT", "appliesTo": ["*"],
     "evidence": [ev(G, "p.6 §2.6", "... gibi tezin tüm ana başlık içeren bölümleri daima yeni bir sayfadan başlamalıdır."), ev(G, "p.28-29 §4.3.8", "her biri ayrı bir sayfadan başlayacak şekilde")]},
]
s["rules"].extend(more)
changes.append("Added missed EXPLICIT rules: typography.punctuationSpacing, typography.numbers, figures.placement, equations.inlineVariablesItalic, headings.chapterStartsNewPage.sections.")

# ---------------------------------------------------------------- 3. list-of-figures hanging indent (wrong flat 16 mm)
h = rules["lists.hangingIndentMm"]
h["value"] = "labelWidth"
h["unit"] = None
h["confidence"] = "EXPLICIT"
h["templateValuesMm"] = {"figures": [16.0, 16.3], "tables": 21.0, "photos": 16.0}
h["evidence"] = [
    ev(T, "#311 callout", "Şekiller, Çizelgeler ve Resimler Dizininde; eğer açıklamalar II. satıra taşıyorsa, II. satır üst satıra hizalanmalı."),
    ev(T, "#307 hanging=907 (16.0 mm), #308/#309 924 (16.3 mm) Şekil; #321/#322 hanging=1191 (21.0 mm) Çizelge; #351 907 Resim"),
    ev(T, "image2.jpg 'Asılı 1,6 cm' — its preview row is a 'Şekil 2.1' entry, i.e. 1.6 cm = width of 'Şekil n.n '"),
    ev(G, "p.41 continuation x0 47.04 (Şekil, +17.0 mm); p.42 51.02 (Çizelge, +21.0 mm)"),
    ev(LO, "template render continuation x0 46.34 (Şekil) / 51.05 (Çizelge)"),
]
h["notes"] = "Reviewer: the analyzer's flat 16.0 mm is only the Şekil value; Çizelge rows use 21.0 mm in both the template XML and the guide. Rule = hanging equal to the width of '<label> <n.n> ' (bold)."
changes.append("lists.hangingIndentMm: 16.0 mm (flat) → 'labelWidth' (EXPLICIT callout #311; template 16.0/16.3 mm Şekil/Resim, 21.0 mm Çizelge; guide p.41/42 agrees).")

# ---------------------------------------------------------------- 4. conflicts: decisions
def conflict(topic_prefix):
    for c in s["conflicts"]:
        if c["topic"].startswith(topic_prefix):
            return c
    raise KeyError(topic_prefix)

c = conflict("Order of Anahtar Kelimeler")
c["reviewDecision"] = ("FLIPPED by reviewer: keywords first, then the year/pages line. Policy order puts explicit guide text above template XML and example geometry; "
                       "p.18 §4.2.5 states the order explicitly ('Özet/Abstract metninden sonra 1 satır aralığı ... Anahtar Kelimeler ... Ardından yine 1 satır aralığı bırakılarak ... yıl ve sayfa sayısı'); "
                       "the '(Örnek 5 ve 6)' reference is attached to the format of the year line. The analyzer's choice (template + example order) contradicts the policy. Kept needsConfirmation because 2 official artifacts show the other order.")
c["decision"] = "Keywords → one empty 1.5 line → year/pages line (explicit guide text). needsConfirmation."
c["needsConfirmation"] = True
decisions.append("ÖZET/ABSTRACT: keywords BEFORE the 'YIL, x + n sayfa' line (explicit text p.18 beats template/example) — flipped, still needsConfirmation.")
for sid in ("abstract-tr", "abstract-en"):
    L = secs[sid]["layout"]
    year, kw = L[14], L[16]
    assert "DEFENSE_YEAR" in year["text"] and ("KEYWORDS" in kw["text"])
    kw2, year2 = copy.deepcopy(kw), copy.deepcopy(year)
    kw2["baselineMm"] = 141.07
    kw2["notes"] = (kw2.get("notes", "") + " Reviewer: moved before the year line (p.18 §4.2.5 explicit order); baseline = one empty 1.5 line after the last text line (141.07 for the example's one-line text).").strip()
    kw2["confidence"] = "EXPLICIT"
    year2["baselineMm"] = None
    year2["notes"] = (year2.get("notes", "") + " Reviewer: after the keywords + one empty 1.5 line (+41.4 pt from the last keyword line); position depends on keyword line count.").strip()
    L[14], L[16] = kw2, year2
for mc in s["measurableChecks"]:
    if mc["id"] == "abstract-tail":
        mc["what"] = "last text line → \"Anahtar Kelimeler:\"/\"Keywords:\" → \"YIL, x + n sayfa\" (bold); each step +41.4 pt from the previous block's last baseline"
        mc["notes"] = "Order per explicit guide text p.18 (reviewer decision, needsConfirmation)."

c = conflict("Inner cover")
c["reviewDecision"] = ("Resolved (no confirmation needed): the thesis title is one metadata field → one paragraph whose formatting is the template's title paragraph #57 (14 pt bold, line=360). "
                       "A wrapped title then has 1.5 spacing on every line, which is exactly the guide example (p.33 pitch 24.12/72.40 pt). #58 is a sample continuation paragraph, not a separate rule; template and guide are therefore consistent.")
c["needsConfirmation"] = False
decisions.append("Inner cover title lines all 1.5 (title = one paragraph formatted like template #57; matches guide p.33) — resolved.")

c = conflict("TEŞEKKÜR")
c["reviewDecision"] = "Resolved by policy: guide text silent → template XML (#195/#196 two explicit '(Bir boşluk)' markers) beats example geometry (p.38 one blank). Signature name baseline = last text baseline + 62.1 pt."
c["needsConfirmation"] = False
decisions.append("TEŞEKKÜR: 2 empty 1.5 lines before the signature (template markers) — resolved by policy.")

c = conflict("Approval page: institute-director")
c["reviewDecision"] = ("Resolved by policy: guide text silent → template order (dots / name / 'Enstitü Müdürü'). The name is a PLACEHOLDER: the guide example prints '(Ünvanı Adı ve SOYADI)' and the template value "
                       "'Prof. Dr. Bekir YALÇIN' is sample content of a 2019 file; it must be a user-editable field (INSTITUTE_DIRECTOR), never hard-coded, and validators must not check its text.")
c["needsConfirmation"] = False
decisions.append("Approval director block: template order dots → name → 'Enstitü Müdürü'; name = editable placeholder (not a requirement) — resolved.")

c = conflict("Approval page: juror row pitch")
c["reviewDecision"] = ("Resolved by policy: text silent → template XML. Independently confirmed by the LibreOffice render of the template: juror pitch 26.70+13.80 = 40.50 pt (14.29 mm), "
                       "director-block internal spacing identical to the analyzer's XML computation (LO values uniformly +0.62 mm because LO draws the table 0.62 mm lower; Word geometry of the same table in the guide gives box top 189.04 mm). Box 150 mm wide (8505 twips).")
c["needsConfirmation"] = False
decisions.append("Approval juror pitch 14.29 mm and 150 mm box (template), box top 189.0 — resolved; LO render confirms the relative positions.")

c = conflict("List of figures/tables line spacing")
c["reviewDecision"] = ("Resolved: the screenshot is an explicit instruction inside the official template ('... Dizininde aşağıdaki ayarlar uygulanmalı' = must be applied): single, 0 before, 6 pt after, left. "
                       "Explicit instruction > template sample-paragraph XML > guide example geometry. Hanging indent is label width (see lists.hangingIndentMm), not a flat 1.6 cm.")
c["needsConfirmation"] = False
decisions.append("Lists of figures/tables/photos: single, 6 pt after, left, hanging = label width — resolved (explicit template instruction).")

c = conflict("Position of ÖZGEÇMİŞ")
c["sources"].append({"path": G, "locator": "p.29 §4.3.8", "value": "“Ekler bölümünün sayfa numaraları, kaynaklar bölümünün bitişini izleyen sayfa numarası ile devam etmelidir” (implies EKLER directly after KAYNAKLAR)"})
c["reviewDecision"] = ("Kept ÖZGEÇMİŞ → EKLER, needsConfirmation. Explicit texts contradict each other (p.16 + p.28 'en son sayfa' + p.29 EK numbering continues from KAYNAKLAR vs the §4.1 ordered list), "
                       "so the tie is broken by the template order and the TOC example (p.39: ÖZGEÇMİŞ 62, EKLER 63). The analyzer missed the p.29 sentence, which strengthens the other reading.")
c["needsConfirmation"] = True
decisions.append("ÖZGEÇMİŞ before EKLER kept (template + §4.1 list + TOC example), still needsConfirmation (p.16/p.28/p.29 texts say CV last).")

c = conflict("Section breaks")
c["reviewDecision"] = "Resolved: 'Kâğıdın yalnızca bir yüzü kullanılmalıdır' (p.5, explicit) makes odd/even placement meaningless; the oddPage/evenPage section types are Word artefacts. Plain new-page breaks, no blank filler pages (the LO render inserted none either)."
c["needsConfirmation"] = False
decisions.append("Section breaks: plain new page, no filler pages — resolved (single-sided printing).")

for c in s["conflicts"]:
    if c["topic"].startswith("Right margin"):
        c["reviewDecision"] = "Agreed: 30 mm (explicit + template). The guide's own body text ends at 181.09 mm and is not an example page."
    if c["topic"].startswith("Page-number vertical position"):
        c["reviewDecision"] = "Agreed: 283.7 mm (template footers + Word model; LO render 283.72). Guide 279.65 = same model + one empty 10 pt footer paragraph (footer5.xml pattern)."

# ---------------------------------------------------------------- 5. outer cover
oc = secs["outer-cover"]
oc["reviewDecision"] = ("Outer cover IS exported as physical page 1 (not numbered, not counted): guide §4.1 lists 'Dış Kapak (Örnek 1)' as item 1 of the thesis order, §2.7 lists it among the unnumbered pages, "
                        "and the template carries it as page 1 of section 1 (the inner cover follows by natural flow, lastRenderedPageBreak before #46). It is printed onto the purchased FBE cover (§4.2.1), "
                        "so its text must stay inside the EXPLICIT printed area x 55-155 mm, y 210-275 mm (p.32 dimension arrows). The template's mock-up page is NOT authoritative for position: "
                        "LO renders its title at baseline 208.42 mm (line top ≈ 204.5 mm, above the 210 mm box).")
for l in oc["layout"]:
    if l.get("baselineMm") == 215.53:
        l["confidence"] = "INFERRED"
        l["notes"] = (l.get("notes", "") + " Reviewer: the p.32 figure is a scaled mock-up (page frame 203×290 mm drawn, 21 cm arrow = 205.05 mm, scale 0.976) with unscaled 12 pt text; "
                      "the text block (with co-advisor) sits 1.58 mm below the drawn box top and 1.8 mm above its bottom, i.e. vertically centred. 215.53 = top anchoring at that inset; "
                      "whether the block is top-anchored or centred when optional lines are absent is UNKNOWN. The binding check is containment in the box.").strip()
changes.append("Outer cover: decided it is exported as unnumbered page 1; first-baseline 215.53 downgraded MEASURED→INFERRED (scaled illustration; containment in 55-155 × 210-275 mm is the binding check).")
decisions.append("Outer cover = exported page 1, uncounted/unnumbered, text confined to 55–155 × 210–275 mm (explicit p.32); template mock-up position (208.4 mm) rejected.")

# ---------------------------------------------------------------- 6. placeholders
if "INSTITUTE_DIRECTOR" in s["placeholders"]:
    s["placeholders"]["INSTITUTE_DIRECTOR"]["format"] = ("Ünvanı Adı SOYADI; editable, required on the approval page. The template value 'Prof. Dr. Bekir YALÇIN' may be offered only as an editable prefill "
                                                        "(2019 sample content, possibly outdated); the guide example shows the placeholder '(Ünvanı Adı ve SOYADI)'. Not validated.")
changes.append("Placeholder INSTITUTE_DIRECTOR: marked as editable placeholder, not a requirement.")

# ---------------------------------------------------------------- 7. measurable checks
for mc in s["measurableChecks"]:
    if mc["id"] == "margin-top":
        mc["what"] = "first baseline of a body page minus (lineGap+ascent) of TNR 12 = 11.20 pt = 3.95 mm (wordModel.firstBaselineOffsetEm)"
        mc["notes"] = "equivalently first baseline = 33.95 mm (guide 33.92-33.96); the analyzer's ascent-only offset (3.77 mm) was wrong"
    if mc["id"] == "heading-gap-before":
        mc["sourceRule"] = "typography.paragraph.blankLineBetween"
    if mc["id"] == "lists-rows":
        mc["notes"] = "Reviewer: resolved (explicit template instruction image2.jpg); guide example p.41/42 shows 20.7 pt."
s["measurableChecks"].extend([
    {"id": "first-baseline-model", "appliesTo": ["*"], "what": "first baseline of every page whose first line sits at the top margin: 30 + 0.9336 × fontSize (12 pt → 33.95 mm, 14 pt → 34.61 mm) regardless of line spacing",
     "expected": {"12pt": 33.95, "14pt": 34.61}, "unit": "mm", "tolerance": 0.25, "sourceRule": "wordModel.firstBaselineOffsetEm"},
    {"id": "lists-hanging", "appliesTo": ["*"], "what": "list-of-figures/tables/photos continuation line x0 = x of the first character after '<label> <n.n> '",
     "expected": "labelWidth (≈46.0-47.0 mm Şekil/Resim, ≈51.0 mm Çizelge)", "unit": "mm", "tolerance": 0.5, "sourceRule": "lists.hangingIndentMm"},
    {"id": "caption-image-gap", "appliesTo": ["*"], "what": "figure/photo: image bottom → first caption baseline", "expected": 5.96, "unit": "mm", "tolerance": 0.5,
     "sourceRule": "captions.figure.gapImageBottomToCaptionBaselineMm"},
    {"id": "outer-cover-page", "appliesTo": ["*"], "what": "physical page 1 is the outer cover: no page number; every text line box within x 55-155 mm, y 210-275 mm; lines centred on x = 105 mm",
     "expected": {"x": [55, 155], "y": [210, 275]}, "unit": "mm", "tolerance": 0.25, "sourceRule": "sections.outer-cover.layout"},
])
changes.append("measurableChecks: fixed margin-top model (3.95 mm, not 3.77), heading-gap-before sourceRule; added first-baseline-model, lists-hanging, caption-image-gap, outer-cover-page.")

# ---------------------------------------------------------------- 8. unknowns / variants
s["unknowns"] = [u for u in s["unknowns"] if u["key"] != "renderedTemplateGeometry"]
s["unknowns"].extend([
    {"key": "variants.foreignLanguageThesis", "why": "p.6 §2.5 allows a thesis 'Türkiye Türkçesi veya yabancı bir dilde', but no layout differences (order of ÖZET/ABSTRACT, English section titles, caption labels) are given; no English variant can be specified."},
    {"key": "wordModel.spaceBeforeAtPageTop", "why": "No Word-rendered source page starts with a soft-broken paragraph that has space-before (e.g. a bibliography entry), so suppression at the page top is not demonstrated."},
    {"key": "wordModel.spacingCollapse", "why": "No source case with both after(prev) and before(next) non-zero."},
    {"key": "outer-cover.verticalAnchor", "why": "Whether the cover text is top-anchored (215.53 mm) or vertically centred in the 65 mm area when the optional co-advisor lines are absent (≈ +5.9 mm) is not stated."},
])
for v in s["variants"]:
    v.setdefault("differences", []).append("Language: the guide permits a thesis written in a foreign language (p.6 §2.5) but gives no separate layout; only Turkish-language variants are specifiable (see unknowns).")
changes.append("Unknowns: removed 'renderedTemplateGeometry' (template rendered with LibreOffice into review/); added foreign-language thesis, page-top space-before, spacing collapse, outer-cover vertical anchor.")

openItems = [
    "ÖZET/ABSTRACT keywords-vs-year order (guide text vs guide example + template) — institute confirmation recommended.",
    "ÖZGEÇMİŞ vs EKLER order (p.16/p.28/p.29 vs §4.1 list + TOC example + template).",
    "Outer cover vertical anchoring when optional lines are absent; whether a border is printed.",
    "Master's jury size; optional-line slot retention (project line, co-advisor rows); grey 'İmza' hints; CV 'NOT:' line; individual EK entries in TOC.",
    "Footnotes, abstract word limit, hyphenation remain UNKNOWN (not blocking).",
]

s["reviewedAt"] = "2026-09-28"
s["review"] = {"reviewer": "independent", "changes": changes, "decisionsProposed": decisions, "openItems": openItems,
               "renderEvidence": "orchestration/artifacts/aku-fbe/review/aku_template.pdf (LibreOffice 33 pages; supporting evidence only — LO misplaces some page breaks and table offsets by ~0.6 mm, but line pitches, footer baseline 283.72 mm and relative approval-page geometry match the analyzer's Word-model computations)"}

json.dump(s, open(SPEC, "w"), ensure_ascii=False, indent=1)
print("ok", len(s["rules"]), "rules", len(s["measurableChecks"]), "checks")
