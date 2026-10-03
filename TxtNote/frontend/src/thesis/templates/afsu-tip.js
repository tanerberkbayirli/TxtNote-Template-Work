/**
 * Afyonkarahisar Sağlık Bilimleri Üniversitesi, Tıp Fakültesi and Diş Hekimliği Fakültesi, uzmanlık tezi (Türkçe).
 *
 * Source (the only one used): "AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ TIP VE DİŞ HEKİMLİĞİ FAKÜLTELERİ UZMANLIK TEZ YAZIM KILAVUZU",
 * Temmuz 2021 (Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/). Two PDF exports of the SAME guide
 * (Tıp copy 2021-08-26, 33 pp.; DHF copy 2021-09-21, 32 pp.): the title page of both reads "TIP VE DİŞ HEKİMLİĞİ FAKÜLTELERİ", the prose is identical and
 * the DHF copy only re-exports the example appendix pages with the joint wording "TIP/DİŞ HEKİMLİĞİ FAKÜLTESİ" / "TIPTA/DİŞ HEKİMLİĞİNDE UZMANLIK TEZİ".
 * Both faculties therefore share ONE rule set; the two registry entries differ only in the faculty / degree strings (see `FACULTY`). There is no Word
 * template: the rules are prose (pp. 4-13) plus example pages (EK 1, EK 3-13). Spec: orchestration/specs/afsu-tip.json, report: orchestration/reports/afsu-tip.md.
 *
 * Nothing here is taken from afsu-lee.js / afsu-eczacilik-proje.js or any other university's template (engineering references only).
 * Evidence classes: EXPLICIT (guide prose), MEASURED (example-page geometry), INFERRED (reasoned, named), UNKNOWN (sources silent: the field is omitted).
 *
 * Word line model (Times New Roman): a single line is 1.15 em, the first baseline sits 0.9336 em below the line top and the extra leading of
 * "1,5 satır" goes below the text; the gap between two blocks is Word's max(after, before) ("collapse"), which is how the guide words every "12nk boşluk".
 */
const FONT = "Times New Roman";
const PT_TO_MM = 25.4 / 72;
const pt = (value) => value * PT_TO_MM;

/**
 * Faculty / degree wording. Tıp strings are EXPLICIT (EK 6/7/8 of the Tıp copy). The DHF strings are INFERRED: the guide only ever prints the joint
 * form "TIP/DİŞ HEKİMLİĞİ FAKÜLTESİ" and "TIPTA/DİŞ HEKİMLİĞİNDE UZMANLIK TEZİ" (EK 9, EK 14, EK 15; DHF copy also on EK 6-8) where "/" separates the two
 * faculties' alternatives; the DHF variant takes the Diş Hekimliği alternative. English faculty wording exists only for Tıp ("Faculty of Medicine", EK 12);
 * for DHF it is UNKNOWN and left to the author (no default).
 */
const FACULTY = {
  tip: { id: "tip", registryId: "afsu-tip-uzmanlik-tr-v1", instituteName: "Tıp Fakültesi", cap: "TIP FAKÜLTESİ", title: "Tıp Fakültesi", degreeCap: "TIPTA UZMANLIK TEZİ", degreeTitle: "Tıpta Uzmanlık Tezi", facultyEn: "Faculty of Medicine", displayName: "Afyonkarahisar Sağlık Bilimleri Üniversitesi · Tıp Fakültesi · Tıpta Uzmanlık Tezi" },
  dhf: { id: "dhf", registryId: "afsu-dis-hekimligi-uzmanlik-tr-v1", instituteName: "Diş Hekimliği Fakültesi", cap: "DİŞ HEKİMLİĞİ FAKÜLTESİ", title: "Diş Hekimliği Fakültesi", degreeCap: "DİŞ HEKİMLİĞİNDE UZMANLIK TEZİ", degreeTitle: "Diş Hekimliğinde Uzmanlık Tezi", facultyEn: "", displayName: "Afyonkarahisar Sağlık Bilimleri Üniversitesi · Diş Hekimliği Fakültesi · Diş Hekimliğinde Uzmanlık Tezi" },
};

/** §2.2 (EXPLICIT, p.4; EK 1 callouts): top/bottom/right 2.5 cm, left 4 cm. */
const MARGINS = { topMm: 25, bottomMm: 25, leftMm: 40, rightMm: 25 };
/** §2.2 / §2.7 (EXPLICIT) and EK 1 (MEASURED: 64.3 mm first line vs 51.8 mm text edge = 12.5 mm; headings H2-H4 start at the same position, §2.7 "alt başlıklar gövde metni ile aynı hizadan"). */
const INDENT_MM = 12.5;
/**
 * Centred special-page lines (EK 6-9, EK 11-13, all MEASURED on both guide copies: line centres 105.50-105.56 mm) centre on the SHEET (105.5 mm), not on the
 * 4 cm / 2.5 cm text block (112.5 mm), even where the example page itself has a 4 cm block (EK 11/12). Absolute boxes: x 25..186 (centre 105.5); flow blocks:
 * the same box through negative left/right indents (editor, PDF and DOCX honour them). Left-aligned lines keep the text block.
 */
const SHEET_CENTER_MM = 105.5;
const CENTER_BOX = { xMm: 25, widthMm: 2 * (SHEET_CENTER_MM - 25) };
/** Thesis-title boxes keep the earlier 145 mm wrap width (the guide gives no title wrap width: UNKNOWN), now centred on the sheet. */
const TITLE_BOX = { xMm: SHEET_CENTER_MM - 72.5, widthMm: 145 };
const SHEET_INDENT = { leftIndentMm: -(MARGINS.leftMm - 25), rightIndentMm: -(186 - (210 - MARGINS.rightMm)) };
const TITLE_INDENT = { leftIndentMm: -(MARGINS.leftMm - TITLE_BOX.xMm), rightIndentMm: 210 - MARGINS.rightMm - (TITLE_BOX.xMm + TITLE_BOX.widthMm) };
const mmToPt = (mm) => mm / PT_TO_MM;
const TEXT_TOP = MARGINS.topMm;

/**
 * Example-page geometry PER GUIDE COPY (MEASURED, page-absolute baselines, orchestration/validation/afsu-tip/independent-1/src-{tip,dhf}-geom.txt). The two PDF
 * copies print DIFFERENT example geometry (CONFLICT, recorded in orchestration/specs/afsu-tip.json): each registry entry follows its OWN copy.
 * Tıp: EK 7/8 first baseline 52.96 mm, EK 9 first baseline 73.26 mm (11-line spacing steps), EK 13 title->Sayfa 7.65 mm, Sayfa->row 9.41 mm.
 * DHF: EK 7/8 first baseline 59.10 mm, EK 9 first baseline 54.07 mm (single-line steps), EK 13 title->Sayfa 6.94 mm, Sayfa->row 9.44 mm.
 * Tıp values are the ones already used (pt); DHF values are converted from the measured mm. EK 6 (dış kapak) is a schematic frame in both copies (INFERRED mapping, unchanged).
 */
const GEO = {
  tip: {
    // EK 7 (unsupported) / EK 8 (supported): baselines in pt
    head: [150.1, 163.9, 177.7],
    ek7: { dept: 205.3, title: 322.6, student: 481.3, degree: 508.9, advisorLabel: 584.8, advisor: 598.6, year: 736.6 },
    ek8: { dept: 204.9, title: 315.3, student: 432.5, degree: 460.1, advisorLabel: 536.0, advisor: 549.8, bap: 646.4, year: 736.1 },
    // EK 9: first baseline and the space after each line (pt)
    approval: { lead: 207.7, univ: 12, cap: 12, dept: 63.6, field: 12.1, advisorLine: 25.8, juryText: 41.4, jury: 0, chair: 78.3, memberGap: 62.5, onay: 11.6 },
    abstractLead: { tr: 136.0, en: 133.9 },
    toc: { titleToPageHeadingMm: 7.65, pageHeadingToRowMm: 9.41 },
  },
  dhf: {
    head: [59.10, 63.97, 68.84].map(mmToPt),
    ek7: { dept: mmToPt(78.58), title: mmToPt(105.39), student: mmToPt(139.46), degree: mmToPt(149.20), advisorLabel: mmToPt(173.55), advisor: mmToPt(178.42), year: mmToPt(263.60) },
    ek8: { dept: mmToPt(78.58), title: mmToPt(117.53), student: mmToPt(151.61), degree: mmToPt(161.36), advisorLabel: mmToPt(188.15), advisor: mmToPt(193.02), bap: mmToPt(234.39), year: mmToPt(266.01) },
    approval: { lead: mmToPt(54.07), univ: 0, cap: 0, dept: mmToPt(78.32 - 63.80) - 13.8, field: 0, advisorLine: mmToPt(102.68 - 92.93) - 13.8, juryText: mmToPt(131.89 - 102.68) - 27.6, jury: mmToPt(151.36 - 131.89) - 13.8, chair: mmToPt(175.71 - 151.36) - 13.8, memberGap: mmToPt(239.01 - 175.71) - 13.8, onay: 0 },
    abstractLead: { tr: mmToPt(48.61), en: mmToPt(44.37) },
    toc: { titleToPageHeadingMm: 6.94, pageHeadingToRowMm: 9.44 },
  },
};

const positioned = (type, value, box, style = {}, extra = {}) => ({ type, value, layoutMode: "absolute", ...box, ...extra, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, ...style } });
const positionedMeta = (field, fallback, box, style = {}, extra = {}) => ({ type: "metadata", field, fallback, layoutMode: "absolute", ...box, ...extra, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, ...style } });
/** First baseline of a positioned text box sits 0.9336 em below its top (engine text-box model, same TNR metrics as Word). */
// Measured real-export residual (editor PDF baseline minus requested baseline, own measurement on this template: 12 pt -0.7 pt; 14 pt measured below), applied so positioned lines land on the requested baselines.
const BASELINE_RESIDUAL_PT = { 12: -0.7, 14: -0.7 };
const topFromBaseline = (baselinePt, fontPt, residualPt = BASELINE_RESIDUAL_PT[fontPt] ?? 0) => pt(baselinePt - fontPt * 0.9336 - residualPt);
const lineAt = (text, baselinePt, size = 12, style = {}, extra = {}) => positioned("text", text, { ...CENTER_BOX, yMm: topFromBaseline(baselinePt, size), heightMm: pt(size * 1.4) }, { fontSizePt: size, ...style }, extra);
const metaAt = (field, fallback, baselinePt, size = 12, style = {}, extra = {}) => positionedMeta(field, fallback, { ...CENTER_BOX, yMm: topFromBaseline(baselinePt, size), heightMm: pt(size * 1.4) }, { fontSizePt: size, ...style }, extra);

const noNumber = { numbering: { enabled: false } };
const pageUnnumbered = { page: { margins: MARGINS, numbering: { enabled: false } }, body: { lineHeight: 1, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 } };
/** §2.3 (EXPLICIT): number at the bottom edge, centred. "ortada" is read as the centre of the sheet (INFERRED; the guide's own pages are centred on the sheet). Font/size/footer distance UNKNOWN (omitted). */
const romanFirst = { page: { margins: MARGINS, numbering: { enabled: true, format: "roman-lower", startAt: 1, restart: true } } };
const roman = { page: { margins: MARGINS, numbering: { enabled: true, format: "roman-lower", restart: false } } };
const arabicStart = { page: { margins: MARGINS, numbering: { enabled: true, format: "arabic", startAt: 1, restart: true } } };
const arabic = { page: { margins: MARGINS, numbering: { enabled: true, format: "arabic", restart: false } } };

// ---- dış kapak (EK 6, p.19 of the Tıp copy; "12 Punto Koyu" / "TEZİN ADI (14 Punto Koyu)" are EXPLICIT sizes, all lines bold, centred) --------------------
// The sketch is a schematic page frame (159 x 228 mm, the guide's text area, 12 pt text unscaled): ORDER, sizes, bold, centring are EXPLICIT; the vertical
// positions are the frame fractions mapped onto this template's text area (25 mm margins): INFERRED (the guide gives no distances).
const FRAME_TOP_PT = 96.3, FRAME_H_PT = 645.9;
const sketchMm = (originPt) => TEXT_TOP + ((originPt - FRAME_TOP_PT) / FRAME_H_PT) * (297 - 2 * MARGINS.topMm);
const sketchBaseline = (originPt) => sketchMm(originPt) / PT_TO_MM; // as pt from the page top
const coverLine = (text, originPt, size = 12) => positioned("text", text, { ...CENTER_BOX, yMm: topFromBaseline(sketchBaseline(originPt), size), heightMm: pt(size * 1.4) }, { fontSizePt: size });
const coverMeta = (field, fallback, originPt, size, style = {}, extra = {}) => positionedMeta(field, fallback, { ...CENTER_BOX, yMm: topFromBaseline(sketchBaseline(originPt), size), heightMm: pt(size * 1.4) }, { fontSizePt: size, ...style }, extra);

const outerCoverBlocks = (f) => [
  coverLine("T.C.", 149.3),
  coverLine("AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", 163.1),
  coverMeta("DEPARTMENT_NAME", f.cap + " …… ANABİLİM DALI", 176.9, 12, { textTransform: "uppercase" }, { prefix: f.cap + " ", suffix: " ANABİLİM DALI" }),
  // §3.1.1 (EXPLICIT): "Tezin adının tamamı büyük harflerle yazılır"; EK 6: 14 pt bold.
  { ...coverMeta("THESIS_TITLE", "TEZİN ADI", 273.5, 14, { textTransform: "uppercase" }), ...TITLE_BOX, heightMm: pt(14 * 1.15 * 4) },
  coverLine("Hazırlayan", 383.9),
  coverMeta("STUDENT_NAME", "Adı ve SOYADI", 397.7, 12),
  coverLine("Danışman", 508.1),
  positioned("text", "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}", { ...CENTER_BOX, yMm: topFromBaseline(sketchBaseline(521.9), 12), heightMm: pt(17) }),
  positioned("text", "{{YEAR}} –AFYONKARAHİSAR", { ...CENTER_BOX, yMm: topFromBaseline(sketchBaseline(728.9), 12), heightMm: pt(17) }),
];

// ---- iç kapak (§3.1.3; EK 7 without a supporting institution, EK 8 with one; page-absolute baselines of the real-size example pages, MEASURED) ------------
const innerCoverBlocks = (f) => {
  const g = GEO[f.id];
  const unsupported = { visibleWhen: { noneFilled: ["BAP_PROJECT_CODE"] } };
  const supported = { visibleWhen: { anyFilled: ["BAP_PROJECT_CODE"] } };
  const dept = (baseline, extra) => metaAt("DEPARTMENT_NAME", "…… Anabilim Dalı", baseline, 12, {}, { suffix: " Anabilim Dalı", ...extra });
  const title = (baseline, extra) => ({ ...metaAt("THESIS_TITLE", "TEZİN KONUSU", baseline, 12, { textTransform: "uppercase" }, extra), ...TITLE_BOX, heightMm: pt(12 * 1.15 * 4) });
  const advisor = (baseline, extra) => positioned("text", "{{ADVISOR_TITLE}} {{ADVISOR_NAME}}", { ...CENTER_BOX, yMm: topFromBaseline(baseline, 12), heightMm: pt(17) }, {}, extra);
  return [
    // common head (EK 7 and EK 8 differ by < 0.5 pt here)
    lineAt("T.C.", g.head[0]),
    lineAt("AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", g.head[1]),
    lineAt(f.cap, g.head[2]),
    // EK 7 (no supporting institution)
    dept(g.ek7.dept, unsupported), title(g.ek7.title, unsupported),
    metaAt("STUDENT_NAME", "Adı SOYADI", g.ek7.student, 12, {}, unsupported),
    lineAt(f.degreeCap, g.ek7.degree, 12, {}, unsupported), lineAt("Danışman", g.ek7.advisorLabel, 12, {}, unsupported), advisor(g.ek7.advisor, unsupported),
    positioned("text", "AFYONKARAHİSAR–{{YEAR}}", { ...CENTER_BOX, yMm: topFromBaseline(g.ek7.year, 12), heightMm: pt(17) }, {}, unsupported),
    // EK 8 (supported by an institution): same elements, shifted up, plus the BAP note (bold in the example)
    dept(g.ek8.dept, supported), title(g.ek8.title, supported),
    metaAt("STUDENT_NAME", "Adı SOYADI", g.ek8.student, 12, {}, supported),
    lineAt(f.degreeCap, g.ek8.degree, 12, {}, supported), lineAt("Danışman", g.ek8.advisorLabel, 12, {}, supported), advisor(g.ek8.advisor, supported),
    { ...positioned("text", "Bu çalışma; Afyonkarahisar Sağlık Bilimleri Üniversitesi Bilimsel Araştırma Projeleri Birimi tarafından {{BAP_PROJECT_CODE}} kodlu proje ile desteklenmiştir.", { ...CENTER_BOX, yMm: topFromBaseline(g.ek8.bap, 12), heightMm: pt(40) }, { align: "center" }), ...supported },
    positioned("text", "{{YEAR}}–AFYONKARAHİSAR", { ...CENTER_BOX, yMm: topFromBaseline(g.ek8.year, 12), heightMm: pt(17) }, {}, supported),
  ];
};

// ---- kabul ve onay sayfası (§3.1.4, EK 9, real-size page). Flow layout: every baseline step of the example (MEASURED) becomes the space-after of the single line above it
// (step - 13.8 pt), the first baseline (207.7 pt) a lead spacer, so a long thesis title that wraps pushes the lines below instead of overprinting them. -----------------------
const approvalBlocks = (f) => {
  const a = GEO[f.id].approval;
  const line = (value, after, style = {}, extra = {}) => ({ type: "text", value, ...extra, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: after, firstLineIndentMm: 0, ...style } });
  const meta = (field, fallback, after, prefix, style = {}, extra = {}) => ({ type: "metadata", field, fallback, prefix, ...extra, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: after, firstLineIndentMm: 0, ...style } });
  const bold = { fontWeight: 700, align: "center", ...SHEET_INDENT };
  const centred = { align: "center", ...SHEET_INDENT };
  const cell = (value, align) => ({ type: "group", widthPercent: 50, blocks: [line(value, 0, { align })] });
  return [
    headerLead(a.lead),
    line("AFYONKARAHİSAR SAĞLIK BİLİMLERİ ÜNİVERSİTESİ", a.univ, bold),
    line(f.cap, a.cap, bold),
    meta("DEPARTMENT_NAME", "…… ANABİLİM DALI", a.dept, "", { ...bold, textTransform: "uppercase" }, { suffix: " ANABİLİM DALI" }),
    meta("THESIS_TITLE", "……..", a.field, "Tez Başlığı: "),
    meta("STUDENT_NAME", "…………….", a.field, "Tez Hazırlayan: "),
    meta("DEFENSE_DATE", "………………", a.field, "Tez Kabul Tarihi: "),
    line("Tez Danışmanı: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}", a.advisorLine),
    line("İş bu çalışma jürimiz tarafından {{DEPARTMENT_NAME}} ANABİLİM DALI’NDA " + f.degreeCap + " olarak kabul edilmiştir.", a.juryText, { align: "justify" }),
    line("JÜRİ:", a.jury),
    line("Başkan", a.chair, centred),
    { type: "group", direction: "row", gapMm: 0, style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 }, blocks: [cell("Üye", "left"), cell("Üye", "right")] },
    // Üye -> ONAY gap as a real spacer (a row group's own space-after is not applied by the PDF/DOCX writers).
    { type: "spacer", heightMm: pt(a.memberGap) },
    line("ONAY", a.onay, centred),
    line("DEKAN", 0, centred),
  ];
};

// ---- özet / abstract header (EK 11 / EK 12 real-size page; MEASURED baseline steps become the space-after of each single line) ---------------------------
const bodyHeaderLine = (text, after, extra = {}) => ({ type: "text", value: text, ...extra, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: after, firstLineIndentMm: 0, ...SHEET_INDENT } });
const bodyHeaderMeta = (field, fallback, after, extra = {}) => ({ type: "metadata", field, fallback, ...extra, style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: after, firstLineIndentMm: 0, ...SHEET_INDENT } });
// First baseline of each example is at 136.0 pt (TR) / 133.9 pt (EN) from the page top: spacer = baseline - top margin - 0.9336 em.
const headerLead = (baselinePt) => ({ type: "spacer", heightMm: pt(baselinePt) - TEXT_TOP - pt(12 * 0.9336) });
const abstractTrHeader = (f) => [
  headerLead(GEO[f.id].abstractLead.tr),
  { ...bodyHeaderMeta("THESIS_TITLE", "TEZİN BAŞLIĞI", 18.8), style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 18.8, firstLineIndentMm: 0, textTransform: "uppercase", ...TITLE_INDENT } },
  bodyHeaderLine("{{STUDENT_TITLE}} {{STUDENT_NAME}}", 18.9),
  bodyHeaderLine("Afyonkarahisar Sağlık Bilimleri Üniversitesi", 0),
  bodyHeaderLine(f.title + " {{DEPARTMENT_NAME}} Anabilim Dalı " + f.degreeTitle, 0),
  bodyHeaderLine("{{THESIS_DATE_TEXT}}", 0),
  bodyHeaderLine("Danışman: {{ADVISOR_TITLE}} {{ADVISOR_NAME}}", 12),
  bodyHeaderLine("ÖZET", 18.8),
];
const abstractEnHeader = (f) => [
  headerLead(GEO[f.id].abstractLead.en),
  { ...bodyHeaderMeta("THESIS_TITLE_EN", "TITLE OF THESIS", 27.6), style: { ...bodyHeaderMeta("x", "", 27.6).style, ...TITLE_INDENT } },
  bodyHeaderMeta("STUDENT_NAME_EN", "Student Name Surname", 0),
  bodyHeaderLine("Afyonkarahisar University of Health Sciences", 0),
  bodyHeaderLine("{{FACULTY_EN}} Department of {{DEPARTMENT_NAME_EN}} Thesis", 0),
  bodyHeaderLine("{{THESIS_DATE_EN}}", 0),
  bodyHeaderLine("Supervisor: {{ADVISOR_TITLE_EN}} {{ADVISOR_NAME}}", 20.7),
  bodyHeaderLine("ABSTRACT", 16.8),
];

// ---- typography -----------------------------------------------------------------------------------------------------
/**
 * H1 (§2.5, §2.6, §2.7, EK 1): 14 pt bold, capitals, centred, new page, 12 nk to the text, numbered "1." (EK 1 "1. GİRİŞ", EK 13 "1.GİRİŞ ve AMAÇ").
 * Space before is 0: the heading starts the page at the 2.5 cm margin (EK 1: top callout 2.5 cm).
 */
const H1 = { fontFamily: FONT, fontSizePt: 14, fontWeight: 700, align: "center", lineHeight: 1, textTransform: "uppercase", pageBreakBefore: true, keepWithNext: true, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 12, numbering: { enabled: true, format: "{1}.", sequence: "arabic" } };
/**
 * H2-H4 (§2.5-§2.7, EK 1): 12 pt bold, left at the first-line indent position, 12 nk before and after (EK 1 MEASURED: heading-to-heading 25.8 pt = 13.8 + 12,
 * body-to-heading 32.9 pt = 20.7 + 12). Case: §2.6 prose says "her kelimenin ilk harfi büyük" for H2-H4, but EK 1 (H2) and EK 13 (H2) print the second level in
 * capitals; the official example wins for H2 (CONFLICT recorded), H3/H4 follow the prose (EK 1 / EK 13 H3 are title case).
 */
const sub = (format, style = {}) => ({ fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "left", lineHeight: 1, keepWithNext: true, firstLineIndentMm: INDENT_MM, spaceBeforePt: 12, spaceAfterPt: 12, ...style, numbering: { enabled: true, format, sequence: "arabic" } });
/** Unnumbered front-matter title (TEŞEKKÜR, İÇİNDEKİLER, KISALTMALAR, dizinler): examples EK 10/11/13 print 12 pt bold centred (the prose would say 14 pt: CONFLICT). */
const FRONT_TITLE = { fontFamily: FONT, fontSizePt: 12, fontWeight: 700, align: "center", lineHeight: 1, textTransform: "uppercase", pageBreakBefore: true, keepWithNext: true, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 12, ...SHEET_INDENT, ...noNumber };

const BODY = { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "justify", lineHeight: 1.5, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: INDENT_MM };
/** Captions (EK 3-5): bold label + regular text, 12 pt TNR, single spacing (§2.7 "şekil altı yazıları ve tabloların açıklamaları ... 1 satır"). Tablo/Şekil number: EK 4/5 "Tablo 1." / "Şekil 2." (sequential); EK 3 prints "Tablo 1.1:" / "Şekil 1.4:" (CONFLICT). */
const caption = (label, position, extra = {}) => ({
  label, position, numbering: { scope: "document", format: "{n}", sequence: "arabic" }, labelFormat: "{label} {number}.", labelStyle: { fontWeight: 700 },
  style: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, align: "left", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0 }, ...extra,
});

const base = (f) => ({
  schemaVersion: 1,
  templateVersion: "1.0.0",
  id: f.registryId,
  universityId: "afsu",
  universityName: "Afyonkarahisar Sağlık Bilimleri Üniversitesi",
  instituteId: f.id,
  instituteName: f.instituteName,
  degreeType: "specialization",
  language: "tr",
  status: "official",
  displayName: f.displayName,
  source: {
    type: "official",
    url: "https://tip.afsu.edu.tr/yonergeler-2/",
    documentName: "AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf and AFSU_Dis_Hekimligi_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf (Tıp ve Diş Hekimliği Fakülteleri Uzmanlık Tez Yazım Kılavuzu, Temmuz 2021)",
    revisionDate: "Temmuz 2021 (cover); PDF creation 2021-08-26 (Tıp copy) and 2021-09-21 (DHF copy)",
    verifiedAt: "2026-10-03",
    notes: [
      "Tek kılavuz: Tıp ve Diş Hekimliği Fakülteleri ortak uzmanlık tez yazım kılavuzu (kapak: 'TIP VE DİŞ HEKİMLİĞİ FAKÜLTELERİ'). İki PDF aynı kılavuzun iki dışa aktarımıdır; gövde metni aynıdır, DHF kopyası yalnız ek örnek sayfalarını ortak ifade 'TIP/DİŞ HEKİMLİĞİ FAKÜLTESİ' ile yeniden üretmiştir. Yazı kuralları (proza) tek kümedir; iki kayıt fakülte/derece metinleri ile ÖRNEK SAYFA GEOMETRİSİ bakımından ayrışır: iki kopyanın EK 7/8/9/11/12/13 dikey ölçüleri FARKLIDIR (ÇELİŞKİ, ör. EK 7 öğrenci adı Tıp 169,78 mm / DHF 139,46 mm; EK 9 ONAY Tıp 248,81 / DHF 239,01 mm) ve her kayıt KENDİ kopyasının örneklerini izler (GEO.tip / GEO.dhf). DHF kopyasının EK 6 şeması aynı çerçevede olduğundan dış kapak iki kayıtta aynıdır (INFERRED eşleme). DHF metinleri '/' ayracının Diş Hekimliği seçeneği olarak çözümlendi (INFERRED); DHF için İngilizce fakülte adı UNKNOWN (alan boş, yazar doldurur).",
      "Sayfa (EXPLICIT §2.2, EK 1): A4, tek yüz, üst/alt/sağ 2,5 cm, sol 4 cm; metin iki yana yaslı, ana metin 1,5 satır, her paragraf 1,25 cm girintili (EK 1 ölçümü 12,5 mm). Üst/alt bilgi uzaklığı UNKNOWN (belirtilmemiş).",
      "Yazı (EXPLICIT §2.5): Times New Roman 12 punto; ana başlıklar yeni sayfa, 14 punto; ana ve alt başlıklar koyu. H1 büyük harf ve ortalı; H2-H4 metinle aynı hizadan (12,5 mm), başlıktan sonra ve bölüm sonu ile sonraki alt başlık arasında 12 nk (§2.7, EK 1). ÇELİŞKİ: §2.6 'her kelimenin ilk harfi büyük' der, EK 1 ve EK 13 örneklerinde H2 büyük harfle yazılmıştır: örnek uygulandı (H2 büyük harf), H3/H4 düzyazı gibi.",
      "Başlıklar: Tez, kılavuza göre H1-H4 numaralıdır; dördüncü dereceden ileri başlıklar numarasız, içindekilerde yok, 12 punto normal, paragraf başında 1 tab içeriden, ilk kelime büyük harfli ve ':' ile devam eden satır başı başlıktır (§2.6): motor yalnız H1-H4 sunar, beşinci düzey MOTOR AÇIĞI (rapora bakın). Ön kısım başlıkları (TEŞEKKÜR, İÇİNDEKİLER, ÖZET...) örneklerde 12 punto koyu ortalı (EK 10, 11, 13), düzyazı 14 punto der (§2.5/2.7): örnek uygulandı (ÇELİŞKİ).",
      "Sayfa numaraları (EXPLICIT §2.3, §3.1): alt kenar ortada; ön kısım (iç kapaktan girişe) küçük Roma, metin ve arka kısım Arap rakamıyla. Dış kapak ve boş sayfa numarasız (§3.1.2); iç kapak 'i', kabul/onay 'ii', teşekkür 'iii', özet 'iv', abstract 'v', içindekiler 'vi' (düzyazı). ÇELİŞKİ: §3.1 listesi ve EK 13 içindekiler örneği 'Bilimsel Etiğe Uygunluk Sayfası'nı (iç kapaktan sonra) sayar ve Roma dizisini bir kaydırır (ii etik, iii kabul...); kılavuzda bu sayfanın metni/örneği YOKTUR (EK listesinde sayfa yok): sayfa üretilmedi, numaralandırma düzyazı (§3.1.4-3.1.8) gibi. Çözülmesi gerekir.",
      "İçindekiler (EK 13, MEASURED): başlık ortalı 12 punto koyu, sağda altı çizili 'Sayfa', noktalı kılavuz, satır adımı 24,7 pt, H2 girintisi 5,0 mm, H3 12,5 mm; liste ön kısım sayfalarını (İÇ KAPAK, BİLİMSEL ETİĞE UYGUNLUK, KABUL VE ONAY, TEŞEKKÜR, ÖZET, ABSTRACT, İÇİNDEKİLER, KISALTMALAR, TABLOLAR DİZİNİ, ŞEKİLLER DİZİNİ) ve '7.KAYNAKLAR' (numaralı) ile 'EKLER' (numarasız) satırlarını içerir. FARK (motor): EK 13'te EKLER satırının sayfa numarası yoktur, dışa aktarım ise EKLER satırına sayfa numarası yazar (motor, başlık satırı için numarasız TOC satırı seçeneği sunmaz). Başlık/Sayfa/ilk satır mesafeleri kopyaya göre ölçüldü (Tıp 7,65 + 9,41 mm; DHF 6,94 + 9,44 mm). Merkezli özel sayfa satırları sayfa merkezine (105,5 mm) ortalıdır (ölçüm).",
      "Özet/Abstract (EXPLICIT §3.1.6-3.1.7): bir sayfayı geçmez, 1 satır aralık, 3-5 anahtar kelime (alfabetik, baş harf büyük); başlık, yazar, üniversite, anabilim dalı, yıl, danışman başlık bloğunda (EK 11/12 ölçümü). İlk satır girintisi: EK 11'de 10,5 mm ölçüldü, düzyazı/EK 1/EK 10 12,5 mm der (ÇELİŞKİ: 12,5 mm uygulandı). Anahtar kelime öncesi 'bir satır atlanarak' (düzyazı) örnekte yok (örnek uygulandı). Örnekteki özet sayfası farklı kenar boşluğundadır (39,5 mm); düzyazı kenar boşluğu uygulandı.",
      "Kaynaklar (EXPLICIT §3.3.1, §2.7): Vancouver, metinde geçiş sırasına göre numara (parantez veya üst simge, tutarlı) — MOTOR AÇIĞI: citationStyle 'Vancouver' yalnız etikettir, motor atıfları geçiş sırasına göre numaralamaz ve kaynakçayı numaralamaz (yazar elle numaralar); dizin 1 satır aralık, kaynaklar arasında 6 nk; kaynaklar yayımlandıkları dilde. Punto ve hizalama UNKNOWN (genel 12 punto kuralı). Tablo/şekil: görsel ve açıklaması ile üst-alt metin 12 nk, açıklama–nesne 6 nk, tablo altı not 10 punto tek aralık (§2.11); tablo açıklaması üstte, şekil açıklaması altta; grafik ve resimler şekil sayılır. Dipnot/alıntı tek aralık (§2.7); dipnot punto UNKNOWN (genel 12 punto kuralı uygulandı, INFERRED).",
      "UNKNOWN / üretilmeyenler: Bilimsel etik sayfası (metin yok), tablo kenarlık stili (EK 3 ızgara, EK 4 yalnız üst/alt çizgi), teşekkür sayfasındaki imza/tarih satırları (yazar yazar), sayfa numarası yazı tipi/boyutu, üst/alt bilgi uzaklığı, kapak ve iç kapakta dikey mesafeler (dış kapak örneği şematik çerçevedir: EXPLICIT yalnız sıra, punto, koyu, ortalı; dikey konum INFERRED). Sırt yazısı (§5.2, 12 punto, cilt sırtı) ayrı basılı çıktıdır, motor kapsamı dışı (rapor).",
    ],
  },
  page: {
    size: "A4", widthMm: 210, heightMm: 297, orientation: "portrait",
    margins: MARGINS,
    numbering: { enabled: true, position: "bottom", align: "center", centerOnPage: true, format: "roman-lower", startAt: 1, restart: false },
  },
  typography: {
    body: BODY,
    paragraph: { firstLineIndentMm: INDENT_MM, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.5, align: "justify" },
    headings: {
      "1": H1,
      "2": sub("{1}.{2}.", { textTransform: "uppercase" }),
      "3": sub("{1}.{2}.{3}.", { textTransform: "capitalize", textTransformExceptions: ["ve", "veya", "ile"] }),
      "4": sub("{1}.{2}.{3}.{4}.", { textTransform: "capitalize", textTransformExceptions: ["ve", "veya", "ile"] }),
    },
    footnotes: { placement: "pageBottom", fontFamily: FONT, fontSizePt: 12, lineHeight: 1, lineSpacing: { rule: "auto", value: 1, singleLineEm: 1.15 } },
    lineSpacing: { mode: "word", singleLineEm: 1.15, baseline: "word", paragraphSpacing: "collapse" },
    paragraphStyles: {
      // §2.11: additional explanation under a table: 10 pt, single spacing.
      tableNote: { fontFamily: FONT, fontSizePt: 10, lineHeight: 1, firstLineIndentMm: 0, align: "left", spaceBeforePt: 0, spaceAfterPt: 0 },
      // §2.7: quotations single spaced (no indent or size is specified).
      blockQuote: { lineHeight: 1 },
    },
  },
  placeholders: {
    THESIS_TITLE: { label: "Tezin adı", type: "text", required: true },
    THESIS_TITLE_EN: { label: "Thesis title (English)", type: "text", required: true },
    STUDENT_NAME: { label: "Adı SOYADI", type: "text", required: true },
    STUDENT_NAME_EN: { label: "Student Name Surname (English)", type: "text", required: true },
    STUDENT_TITLE: { label: "Özet sayfasında ad soyadın önündeki unvan (örnek: Araştırma Görevlisi)", type: "text", defaultValue: "Araştırma Görevlisi" },
    DEPARTMENT_NAME: { label: "Anabilim dalı adı (yalnız adı; sonuna ‘Anabilim Dalı’ eklemeyin)", type: "text", required: true },
    DEPARTMENT_NAME_EN: { label: "Department name (English)", type: "text", required: true },
    FACULTY_EN: f.facultyEn ? { label: "Faculty (English)", type: "text", defaultValue: f.facultyEn, required: true } : { label: "Faculty (English; the guide gives no wording for this faculty)", type: "text", required: true },
    ADVISOR_TITLE: { label: "Danışman unvanı", type: "text", required: true },
    ADVISOR_NAME: { label: "Danışman adı SOYADI", type: "text", required: true },
    ADVISOR_TITLE_EN: { label: "Supervisor academic title (English)", type: "text", required: true },
    YEAR: { label: "Yıl (kapak)", type: "number", required: true },
    THESIS_DATE_TEXT: { label: "Özet sayfasındaki tarih (ay ve yıl; örnek: Mayıs 2021)", type: "text", required: true },
    THESIS_DATE_EN: { label: "Date on the abstract page (month and year; example: May 2021)", type: "text", required: true },
    DEFENSE_DATE: { label: "Tez kabul tarihi", type: "text" },
    BAP_PROJECT_CODE: { label: "Destekleyen BAP proje kodu (kurum desteği varsa; iç kapak EK 8 düzeni)", type: "text", defaultValue: "" },
    KEYWORDS: { label: "Anahtar kelimeler (3-5, alfabetik, virgülle)", type: "text", required: true },
    KEYWORDS_EN: { label: "Key words (3-5, alphabetical, comma-separated)", type: "text", required: true },
  },
  validation: {
    KEYWORDS: { minItems: 3, separator: ",", severity: "warning", message: "Anahtar kelime sayısı 3-5 olmalıdır (§3.1.6)." },
    KEYWORDS_EN: { minItems: 3, separator: ",", severity: "warning", message: "Key words must be 3-5 and correspond to the Turkish keywords (§3.1.6)." },
  },
  tables: caption("Tablo", "above", { spacingAfterPt: 6, captionAlignment: "left", align: "center", cellStyle: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1, firstLineIndentMm: 0 } }),
  figures: caption("Şekil", "below", { spacingBeforePt: 6, captionAlignment: "left", align: "center", box: { align: "center", spaceBeforePt: 12, spaceAfterPt: 12 } }),
  bibliography: { heading: "KAYNAKLAR", style: { fontFamily: FONT, fontSizePt: 12, lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 6, firstLineIndentMm: 0 }, citationStyle: "Vancouver" },
  toc: { heading: "İÇİNDEKİLER", levels: [1, 2, 3, 4], showPageNumbers: true },
  equations: { numbering: { scope: "chapter", format: "({chapter}.{n})" } },
});

/**
 * EK 13 (MEASURED per guide copy, GEO.*.toc): "İÇİNDEKİLER" baseline -> "Sayfa" baseline and "Sayfa" -> first row baseline. The title is a 12 pt single line
 * (13.8 pt pitch) whose space-after sets the first distance; the "Sayfa" line's own line height sets the second (pitch = lineHeight x 13.8 pt, extra leading below).
 */
const SINGLE_LINE_PT = 12 * 1.15;
const tocTitleAfterPt = (f) => Math.round((mmToPt(GEO[f.id].toc.titleToPageHeadingMm) - SINGLE_LINE_PT) * 100) / 100;
const tocSayfaLineHeight = (f) => Math.round((mmToPt(GEO[f.id].toc.pageHeadingToRowMm) / SINGLE_LINE_PT) * 10000) / 10000;
const tocRows = { fontFamily: FONT, fontSizePt: 12, lineHeight: 1.79, spaceBeforePt: 0, spaceAfterPt: 0, align: "left", firstLineIndentMm: 0 };
const sections = (f) => [
  { id: "outer-cover", type: "outerCover", title: "DIŞ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "none", overrides: pageUnnumbered, blocks: outerCoverBlocks(f) },
  { id: "blank-page", type: "custom", title: "BOŞ SAYFA", status: "required", group: "cover", mode: "static", tocEntry: "none", overrides: pageUnnumbered, blocks: [{ type: "spacer", heightMm: 1 }] },
  { id: "inner-cover", type: "innerCover", title: "İÇ KAPAK", status: "required", group: "cover", mode: "static", tocEntry: "title", overrides: { ...romanFirst, body: pageUnnumbered.body }, blocks: innerCoverBlocks(f) },
  { id: "approval", type: "approval", title: "KABUL VE ONAY SAYFASI", status: "required", group: "front", mode: "static", tocEntry: "title", overrides: { ...roman, body: pageUnnumbered.body }, blocks: approvalBlocks(f) },
  { id: "acknowledgements", type: "acknowledgements", title: "TEŞEKKÜR", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title", overrides: { ...roman, headings: { "1": FRONT_TITLE } } },
  { id: "abstract-header", type: "abstract", title: "ÖZET", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: true, tocEntry: "title", overrides: { ...roman, body: pageUnnumbered.body }, blocks: abstractTrHeader(f) },
  { id: "abstract-tr", type: "abstract", title: "Özet metni", status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false, overrides: { ...roman, body: { ...BODY, lineHeight: 1 }, paragraph: { lineHeight: 1, firstLineIndentMm: INDENT_MM, spaceBeforePt: 0, spaceAfterPt: 0 } } },
  { id: "abstract-tr-footer", type: "abstract", title: "Anahtar kelimeler", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false, overrides: { ...roman, body: { ...BODY, lineHeight: 1, align: "left", firstLineIndentMm: INDENT_MM } }, blocks: [{ type: "text", value: "**Anahtar kelimeler:** {{KEYWORDS}}", markup: "inline", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: INDENT_MM } }] },
  { id: "abstract-en-header", type: "englishAbstract", title: "ABSTRACT", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: true, tocEntry: "title", overrides: { ...roman, body: pageUnnumbered.body }, blocks: abstractEnHeader(f) },
  { id: "abstract-en", type: "englishAbstract", title: "Abstract text", status: "required", group: "front", mode: "editable", pageBreakBefore: false, showTitle: false, overrides: { ...roman, body: { ...BODY, lineHeight: 1 }, paragraph: { lineHeight: 1, firstLineIndentMm: INDENT_MM, spaceBeforePt: 0, spaceAfterPt: 0 } } },
  { id: "abstract-en-footer", type: "englishAbstract", title: "Key words", status: "required", group: "front", mode: "static", standalone: false, pageBreakBefore: false, overrides: { ...roman, body: { ...BODY, lineHeight: 1, align: "left", firstLineIndentMm: INDENT_MM } }, blocks: [{ type: "text", value: "**Key words:** {{KEYWORDS_EN}}", markup: "inline", style: { fontFamily: FONT, fontSizePt: 12, align: "justify", lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: INDENT_MM } }] },
  { id: "toc", type: "tableOfContents", title: "İÇİNDEKİLER", status: "required", group: "front", mode: "generated", tocEntry: "title",
    generatedIndex: { kind: "toc", title: "İÇİNDEKİLER", levels: [1, 2, 3, 4], includePageNumbers: true, leader: "dots", pageHeading: "Sayfa", pageHeadingStyle: { fontFamily: FONT, fontSizePt: 12, fontWeight: 400, decoration: "underline", align: "right", lineHeight: tocSayfaLineHeight(f) }, matchHeadingTransform: true, style: tocRows,
      levelStyles: { "1": { leftIndentMm: 0 }, "2": { leftIndentMm: 5.0 }, "3": { leftIndentMm: 12.5 } } },
    overrides: { ...roman, headings: { "1": { ...FRONT_TITLE, spaceAfterPt: tocTitleAfterPt(f) } } } },
  { id: "abbreviations", type: "listOfAbbreviations", title: "KISALTMALAR", status: "optional", group: "front", mode: "editable", showTitle: true, tocEntry: "title", overrides: { ...roman, headings: { "1": FRONT_TITLE } } },
  { id: "index-tables", type: "listOfTables", title: "TABLOLAR DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title", generatedIndex: { kind: "tables", leader: "dots", pageHeading: "Sayfa", style: tocRows }, overrides: { ...roman, headings: { "1": FRONT_TITLE } } },
  { id: "index-figures", type: "listOfFigures", title: "ŞEKİLLER DİZİNİ", status: "required", group: "front", mode: "generated", tocEntry: "title", generatedIndex: { kind: "figures", leader: "dots", pageHeading: "Sayfa", style: tocRows }, overrides: { ...roman, headings: { "1": FRONT_TITLE } } },
  // Giriş ve Amaç ... Sonuç ve Öneriler are the author's Heading 1 chapters (EK 13: 1.GİRİŞ ve AMAÇ ... 6.SONUÇ ve ÖNERİLER); KAYNAKLAR continues the numbering (EK 13: 7.KAYNAKLAR); Arabic numbering restarts at 1 on the first chapter page (§2.3).
  { id: "main", type: "mainContent", title: "Bölümler", status: "required", group: "body", mode: "editable", tocEntry: "headings", overrides: { ...arabicStart } },
  { id: "bibliography", type: "bibliography", title: "KAYNAKLAR", status: "required", group: "back", mode: "editable", showTitle: true, tocEntry: "title", titleNumbering: "continueH1", overrides: { ...arabic } },
  // §3.3.2: "EKLER" bold, capitals, centred, 2.5 cm below the top edge (= the top margin); each ek on its own page as "EK-1: ...".
  { id: "appendices", type: "appendices", title: "EKLER", status: "optional", group: "back", mode: "editable", showTitle: true, tocEntry: "title", overrides: { ...arabic, headings: { "1": { ...H1, ...noNumber }, "2": { ...sub("EK-{2}:"), textTransform: "none", pageBreakBefore: true, pageBreakUnlessAfterHeading: true, align: "left", firstLineIndentMm: 0, spaceBeforePt: 0 } } } },
];

const variant = (f) => ({ ...base(f), sections: sections(f) });
export const afsuTipUzmanlik = variant(FACULTY.tip);
export const afsuDisHekimligiUzmanlik = variant(FACULTY.dhf);
export default afsuTipUzmanlik;
