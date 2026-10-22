import json, collections
P = '/home/user/TxtNote-Template-Work/orchestration/specs/aku-sagbil.json'
SRC = 'Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Saglik_Bilimleri_Enstitusu_Tez_Kilavuzu_2015.pdf'
s = json.load(open(P), object_pairs_hook=collections.OrderedDict)
R = {r['key']: r for r in s['rules']}
def ev(loc, q, src=SRC):
    return {'source': src, 'locator': loc, 'quote': q}
def rule(key, value, conf, evidence, notes='', unit=None, appliesTo=('*',), **extra):
    r = collections.OrderedDict(key=key, value=value)
    if unit: r['unit'] = unit
    r['confidence'] = conf; r['appliesTo'] = list(appliesTo); r['evidence'] = evidence; r['notes'] = notes
    r.update(extra); return r
changes = []

# ---- author choices: font family / size ----
r = R['typography.body.fontFamily']
r['authorChoice'] = {
    'allowed': ['Times New Roman', 'Bookman', 'Palatino', 'Garamond', 'Arial', 'other book (text) fonts - the list ends with "vb."'],
    'forbidden': ['handwriting / decorative fonts (Brush Script, Lucida Calligraphy, Monotype Corsiva vb.)'],
    'constraint': 'exactly one font family throughout the main text (tek tip yazı tipi)',
    'default': 'Times New Roman', 'defaultConfidence': 'INFERRED'}
r['notes'] = ('REVIEW: TNR is NOT a requirement. §1.3 lets the author choose any book font ("... Arial vb. seçilmelidir"); Şekil 2 caption says it is "Times New Roman 12 punto kullanılan bir sayfa örneği" (an example). '
              'Represent as an author choice with default TNR (all annotated examples). The template/UI must not present TNR as mandatory; validation checks the fixture\'s chosen font is genuine+embedded and used uniformly in the main text. '
              'Exception: the covers are explicitly TNR (outer cover 24 pt TNR, inner cover 10 pt TNR, §1.19) regardless of the body choice - see cover.fontFamily.')
r = R['typography.body.fontSizePt']
r['authorChoice'] = {'rangePt': [10, 14], 'dependsOn': 'chosen font ("yazı tipine göre")', 'default': 12, 'defaultConfidence': 'INFERRED'}
r['notes'] = 'REVIEW: allowed range 10-14 pt is EXPLICIT (§1.3, "yazı tipine göre" = size depends on the chosen font); 12 pt is only the example configuration (Şekil 2). Author choice, default 12.'
R['typography.body.allowedFonts']['notes'] += ' REVIEW: list is open-ended ("vb."), see typography.body.fontFamily.authorChoice.'
changes.append('typography.body.fontFamily/fontSizePt: recast as author choices (fonts: any book font, 10-14 pt), default TNR 12 INFERRED; TNR not a requirement.')

for k in ['headings.h1.fontSizePt', 'headings.h2.fontSizePt', 'headings.h3.fontSizePt']:
    R[k]['appliesTo'] = ['bodyConfig:TNR-12 (default)']
    R[k]['notes'] = (R[k].get('notes', '') + ' REVIEW: the value comes from annotations on the TNR-12 example page (Şekil 2); it is exact for the default body configuration only. '
                     'For another chosen body size the guide gives no heading size - INFERRED rule: H1 = body + 2 pt, H2/H3 = body size (keeps the example ratio); integrator must document this.').strip()
changes.append('headings.h1-h3.fontSizePt: scoped to the default TNR-12 body configuration; other body sizes INFERRED (H1 = body+2, H2/H3 = body).')

s['rules'].append(rule('cover.fontFamily', 'Times New Roman', 'EXPLICIT',
    [ev('pdf p.14 §1.19', 'üç satır halinde ortalanarak, 24 punto Times New Roman fontu kullanarak'),
     ev('pdf p.14 §1.19', 'İç kapak ... 10 punto Times New Roman fontu kullanarak'),
     ev('pdf p.17 Şekil 8', "'Times 10 p Koyu', 'Times 14 - 18 p Koyu'")],
    'Outer-cover and inner-cover texts are TNR independent of the body-font choice (inner-cover title/other lines: Şekil 8 annotation "Times").',
    appliesTo=['outer-cover', 'inner-cover']))
changes.append('added cover.fontFamily = TNR (EXPLICIT §1.19) independent of body choice.')

# ---- page number alignment ----
r = R['pagination.align']
r['authorChoice'] = {'allowed': ['center', 'right'], 'default': 'right', 'defaultConfidence': 'INFERRED',
    'geometry': {'right': 'number x1 = 185.0 mm (text-block right edge) - EXPLICIT anchor', 'center': 'text-block centre x = 112.5 mm (Word header centre tab) - INFERRED; page centre 105 mm is the other reading'}}
r['notes'] = ('REVIEW: both positions are EXPLICITLY allowed (§1.8). Default proposed: right, because it is the only position whose anchor the text defines ("metin bloğu sağ kenar hizası"); '
              '"ortaya" is ambiguous (page centre 105 mm vs text-block centre 112.5 mm). Engine already has pageNumberAlignment (schema.d.ts) so both are representable. Vertical distance from the top edge is UNKNOWN; validator can only require the number to lie inside the top margin (baseline < 30 mm).')
changes.append('pagination.align: author choice {center,right}; proposed default right (x1 = 185 mm); centre geometry ambiguity recorded.')

# ---- paragraph indent / gap ----
r = R['typography.paragraph.firstLineIndentMm']
r['authorChoice'] = {'rangeMm': [5, 10], 'optional': True, 'default': 10, 'defaultConfidence': 'EXPLICIT (Şekil 2 annotation "7 Karakter (veya 1 cm)")'}
r['notes'] = (r.get('notes', '') + ' REVIEW: §1.5 "0,5 - 1,0 cm kadar içerden başlatılabilir" (may) - indent is optional and its size a 5-10 mm choice; default 10 mm from the figure annotation.').strip()
for k in ['typography.paragraph.spaceBetweenPt', 'typography.paragraph.spaceAfterPt']:
    R[k]['notes'] = (R[k].get('notes', '') + ' REVIEW: §1.7 makes this conditional ("... içerden başlatılıyor ise paragraf aralığı için en az 2 tam aralık") and a minimum ("en az"); 24 pt is the value for the default indented configuration. Paragraph gap for a non-indented configuration is UNKNOWN.').strip()
changes.append('paragraph indent: optional 5-10 mm choice (default 10); 24 pt gap is a minimum, conditional on indentation.')

# ---- H2 after ----
r = R['headings.h2.spaceAfterPt']
r['notes'] = ("REVIEW: the analyzer's '1,5 aralık (18 p) after 1.1.' reading is wrong: in Şekil 2 that bracket sits between body lines 2 and 3 of the first paragraph (y ≈ 238-250 pt, baselines ≈ 233/254) - it labels the 1.5 body line spacing, not a heading gap. "
              'Measured 1.1.-heading baseline to first body baseline ≈ 49 pt (raster) is consistent with 24 pt, not 18 pt. No conflict.')
changes.append("headings.h2.spaceAfterPt: conflict 'Space after H2' dissolved - Şekil 2's '1,5 aralık (18 p)' labels body line spacing.")

# ---- H1->H2 adjacency ----
s['rules'].append(rule('headings.h1ToH2.gapPt', 36, 'EXPLICIT',
    [ev('pdf p.8 Şekil 2', "single '3 aralık (36 p)' bracket between '1. GİRİŞ' and '1.1. Köpeğin Evrimi'"),
     ev('pdf p.7 §1.7', 'bunlara ait başlıklardan sonra 3 tam aralık ... İkinci ve üçüncü dereceden bölüm başlıklarından önce 3')],
    'One 36 pt gap (not 36+36) when an H2 directly follows an H1. Raster check: GİRİŞ baseline ≈ 96.5 pt, 1.1. baseline ≈ 163.5 pt → 67 pt, consistent with a single 36 pt gap (additive 72 pt would give ≈ 94 pt). Implement explicitly in both PDF and DOCX (do not rely on CSS margin collapsing; Word adds after+before).', unit='pt'))
changes.append('added headings.h1ToH2.gapPt = 36 (single gap, Şekil 2).')

# ---- bibliography ----
r = R['bibliography.fontSizePt']
r['authorChoice'] = {'allowed': ['body - 1 pt', 'body - 2 pt'], 'absoluteRangePt': [7, 12], 'default': 11, 'defaultConfidence': 'INFERRED (body 12 - 1)'}
r['notes'] = ('REVIEW decision: §2.4 (specific, mandatory "yazılmalı") wins over §1.3 (general, permissive "seçilebilir", shared with table/figure text). With the default 12 pt body: 11 (default) or 10 pt. '
              '8-9 pt is only compatible when the body is 10 pt, so it is not a separate requirement. Şekil 17 (Palatino) line pitch ≈ 12.8 pt also fits ≈ 11 pt.')
r = R['bibliography.spaceAfterPt']
r['notes'] = ('REVIEW decision: 18 pt. The guide defines its own unit in figure annotations ("1,5 aralık (18 p)", Şekil 3/14) and uses "paragraf aralığı ... 2 tam aralık" = 24 p for body paragraphs, so "paragraf aralığı 1,5" = 18 pt under the same unit (explicit text > example geometry). '
              'Şekil 17 shows only ≈ 6-7 pt extra (entry-to-entry baseline ≈ 1.5 x line pitch) - recorded as an example deviation, not averaged.')
r = R['bibliography.titleSpaceAfterPt']
r['evidence'].append(ev('pdf p.29 Şekil 17 (raster, ≈ 2.18 px/pt from the 145 mm block)', "title baseline → first entry baseline ≈ 71 px ≈ 32.6 pt ≈ 13.8 (single line) + 18 pt; 36 pt would give ≈ 50 pt"))
r['notes'] = (r.get('notes', '') + ' REVIEW: §2.4 (specific) overrides §1.7 (3 aralık); the example geometry agrees with 18 pt.').strip()
changes.append('bibliography: size = body-1/-2 choice (default 11); entry gap 18 pt decided; title-after 18 pt corroborated by Şekil 17 geometry.')

# ---- abstract ----
R['abstract.lineSpacing']['notes'] = (R['abstract.lineSpacing'].get('notes', '') + ' REVIEW decision: single (explicit, specific §2.3). Şekil 14/15 drawn at 1.5 are example geometry and lose under the policy order.').strip()
R['abstract.titleToThesisTitlePt']['notes'] = (R['abstract.titleToThesisTitlePt'].get('notes', '') + ' REVIEW: §2.3 (specific) and the Şekil 14 annotation "2 aralık (24 p)" agree; §1.7\'s general 3 aralık does not apply to ÖZET/SUMMARY.').strip()
s['rules'].append(rule('abstract.paragraphs', 'UNKNOWN (example shows first paragraph flush, later ones indented, blank gap between)', 'UNKNOWN',
    [ev('pdf p.25 Şekil 14', 'paragraphs 2-3 start indented, separated by a blank gap; text drawn 1.5-spaced (overridden by §2.3)')],
    'Paragraph indent/gap inside ÖZET not stated; suggest same indent/gap rule as body (INFERRED) with single line spacing.'))

# ---- captions: first-line position ----
s['rules'].append(rule('captions.firstLineIndentMm', 10, 'MEASURED',
    [ev('pdf p.9 Şekil 3 (raster ≈ 3.37 px/mm)', "'Şekil 3.1.' and 'Tablo 3.1.' start ≈ 12.6-12.9 mm right of the block edge, same x as the indented body paragraph 'İncelenen ırklarda' (≈ 12.6 mm); continuation lines hang at ≈ 25.6 mm under the caption text")],
    'Low confidence (raster ±3 mm). Captions in the example start at the paragraph-indent position, with hanging continuation under the caption text. Text only says "ana metin gibi bloklama tarzında". Integrator decision: caption first line at the paragraph indent (10 mm) vs flush left; list entries (Şekil 12/13) start flush left.', unit='mm'))
changes.append('added captions.firstLineIndentMm (MEASURED-low): example captions start at the paragraph indent.')

# ---- footnote separator ----
R['footnotes.separator']['notes'] = (R['footnotes.separator'].get('notes', '') + ' REVIEW: Şekil 3 draws the rule ≈ 36 % of the block (≈ 52 mm ≈ Word\'s default 2-inch separator); the text "sayfanın ortasına kadar" wins → 40 → 105 mm (65 mm). If "ortası" were read as text-block centre it would be 72.5 mm; page centre is the literal reading.').strip()

# ---- lists ----
for k in ['lists.figures.title', 'lists.tables.title', 'lists.symbols.title']:
    R[k]['notes'] = (R[k].get('notes', '') + ' REVIEW decision: printed titles follow the examples; "... Dizini" is descriptive (the guide likewise writes "“İÇİNDEKİLER” dizini" while the printed title is İÇİNDEKİLER), and Şekil 10 TOC rows read "Simgeler ve Kısaltmalar / Şekiller / Tablolar".').strip()
R['lists.tables.title']['authorChoice'] = {'allowed': ['TABLOLAR', 'ÇİZELGELER'], 'followsCaptionLabel': True, 'default': 'TABLOLAR', 'defaultConfidence': 'MEASURED (Şekil 13)', 'note': 'ÇİZELGELER is INFERRED (label choice Çizelge)'}
R['captions.table.label']['authorChoice'] = {'allowed': ['Tablo', 'Çizelge'], 'default': 'Tablo', 'defaultConfidence': 'EXPLICIT (§1.16 example "Tablo 4. Devam." + every figure)'}
R['captions.table.label']['notes'] = (R['captions.table.label'].get('notes', '') + ' REVIEW: Şekil 5 explicitly offers both ("Çizelge 1.1 ... veya Tablo 1.1"): author choice, default Tablo; the list title and "Devam" caption follow the chosen label.').strip()
s['rules'].append(rule('lists.figures.titleSpaceAfterPt', 36, 'INFERRED',
    [ev('pdf p.7 §1.7', 'önsöz, içindekiler, simgeler ve kısaltmalar dizini ... başlıklardan sonra 3 tam aralık (lists of figures/tables not named)')],
    'Not stated for ŞEKİLLER/TABLOLAR; by analogy with the other front-matter indexes. Şekil 12/13 are zoomed crops and cannot confirm.', unit='pt', appliesTo=['list-of-figures', 'list-of-tables']))

# ---- citations / order / inner cover / TOC ----
R['citations.style']['notes'] = ('REVIEW decision: implement the author-date format the guide spells out itself (§1.12 in-text forms, §2.4 list format: SURNAME, I. (year). ...). '
    'The "Harvard" (Sunuş) vs "APA" (§2.4) label does not change any rule the engine applies; no confirmation needed for implementation. ') + R['citations.style'].get('notes', '')
R['structure.order']['notes'] = (R['structure.order'].get('notes', '') + ' REVIEW: İçindekiler before Önsöz per §2.1 (the dedicated ordered structure list) and §1.20 i-vi, and the guide\'s own booklet (İÇİNDEKİLER ii, ÖNSÖZ iii). '
    'Counter-evidence the analyzer did not cite: §1.7 and §1.8 enumerate "önsöz, içindekiler, simgeler..." (Önsöz first) and Şekil 10 page labels (Önsöz iii, İçindekiler iv). §1.7/§1.8 are lists for a spacing/numbering rule ("gibi"), not ordering statements, so §2.1 stays decisive; still flagged for institute confirmation.').strip()
R['innerCover.header']['notes'] = (R['innerCover.header'].get('notes', '') + ' REVIEW decision: "T.C." - the text quotes the exact string for both covers and the outer-cover example (Şekil 6) prints "T. C."; Şekil 8\'s "TÜRKİYE CUMHURİYETİ" is example content. No confirmation needed.').strip()
s['rules'].append(rule('toc.includesItself', True, 'MEASURED',
    [ev('pdf p.20 Şekil 10', "'İçindekiler ........ iv'"), ev('pdf p.19 §1.20 ii', 'Ön kapak dışındaki tüm özel sayfalar ... eksiksiz olarak gösterilmelidir')],
    'The TOC lists its own page. İç Kapak is not listed: §1.20 ii itself says "Şekil 10\'daki örneğe uygun olmalıdır", and Şekil 10 starts at Kabul ve Onay.'))
s['rules'].append(rule('toc.separateAppendices', 'listed at the end of the TOC', 'EXPLICIT',
    [ev('pdf p.19 §1.20 ii', 'Tezden ayrı olarak sunulması gerekli ekler var ise bunlarda dizinin sonunda gösterilmelidir')], 'Missed by the analyzer.'))
changes.append('added toc.includesItself, toc.separateAppendices (missed EXPLICIT), lists.figures.titleSpaceAfterPt (INFERRED 36), abstract.paragraphs (UNKNOWN).')

# ---- approval / master jury ----
r = R['approval.juryCount']
r['notes'] = (r.get('notes', '') + ' REVIEW: master\'s count remains UNKNOWN in the source (only a 5-member PhD example). Proposed representation (no invented number): reuse the Şekil 9 grid - chair row centred + 2-column member rows; member rows optional (visibleWhen anyFilled) so a 3-member jury renders chair + one 2-column row. '
              'Whether "Raportör" exists for master\'s is UNKNOWN (label it "Üye" unless the institute confirms). The director signature block uses placeholders, not the fixed name "Prof.Dr. Zehra BOZKURT".').strip()
changes.append('approval: master jury left UNKNOWN; proposed optional-row representation of the Şekil 9 grid.')

# ---- Word model ----
s['rules'].append(rule('wordModel.firstBaselineOffsetEm', {'single': 0.9335, '1.5': None}, 'MEASURED',
    [ev('guide_body_lines.txt page 7 (vector Word 2007 text)', "first line '1.6. Anlatım' TNR-Bold 12 pt baseline 33.96 mm → 3.96 mm below a 30 mm top = 11.22 pt = 0.935 em", src='orchestration/artifacts/aku-sagbil/source/guide_body_lines.txt'),
     ev('guide_body_lines.txt page 5', "first line '1. BİÇİM STANDARTLARI' TNR-Bold 15.96 pt baseline 35.27 mm → 5.27 mm = 14.94 pt = 0.936 em", src='orchestration/artifacts/aku-sagbil/source/guide_body_lines.txt')],
    'Single spacing: Word baseline = top + (lineGap 0.0425 + ascent 0.891) em = 0.9335 em - confirmed to ±0.01 mm at two font sizes, assuming the booklet top margin is 30 mm (its left margin measures 40.01 mm, i.e. the booklet uses the thesis margins). 1.5-line spacing: no vector 1.5-spaced text in this source → UNKNOWN here (raster Şekil 2 cannot resolve 0.5 mm).'))
s['rules'].append(rule('wordModel.singleLinePitchEm', 1.15, 'MEASURED',
    [ev('guide_body_lines.txt page 5 §1.2/§1.4', 'TNR 12 consecutive baselines 95.27/100.14, 220.59/225.50 mm → 4.87-4.91 mm ≈ 13.8 pt', src='orchestration/artifacts/aku-sagbil/source/guide_body_lines.txt')],
    'Word single line of TNR = 1.15 em. A line containing a font with larger ascent/descent grows (Lucida Calligraphy line in §1.3: 5.46 mm).'))
s['rules'].append(rule('wordModel.paragraphSpacing', None, 'UNKNOWN',
    [ev('pdf p.5-7 (booklet)', 'booklet separates paragraphs with empty paragraphs, not spacing; examples are raster')],
    'Additive vs collapsed space, contextualSpacing and top-of-page suppression cannot be demonstrated from this source. Only fact: Şekil 2 shows one 36 pt gap between an H1 and a following H2 (see headings.h1ToH2.gapPt).'))
changes.append('added wordModel.firstBaselineOffsetEm (single 0.9335 em, MEASURED on guide vector text; 1.5 UNKNOWN), wordModel.singleLinePitchEm 1.15, wordModel.paragraphSpacing UNKNOWN.')

# ---- conflicts ----
C = {c['topic']: c for c in s['conflicts']}
def dec(topic, text, nc):
    C[topic]['decision'] = text; C[topic]['needsConfirmation'] = nc
dec('Citation system name', 'REVIEW: implement the author-date rules the guide itself spells out (§1.12, §2.4); the Harvard/APA label changes nothing implementable. Resolved.', False)
C['Order of Önsöz and İçindekiler']['sources'].append({'path': SRC, 'locator': 'pdf p.7 §1.7 / §1.8', 'value': "lists 'önsöz, içindekiler, simgeler ...' (Önsöz first) - lists for a spacing/numbering rule"})
dec('Order of Önsöz and İçindekiler', 'REVIEW: İçindekiler before Önsöz (§2.1 ordered structure list + §1.20 order + booklet). §1.7/§1.8 enumerations and Şekil 10 page labels point the other way; implement İçindekiler→Önsöz, keep for institute confirmation (non-blocking).', True)
dec('Inner cover first line', "REVIEW: 'T.C.' - explicit quoted string in §1.19 for both covers; outer-cover example prints 'T. C.'. Resolved.", False)
dec('Abstract line spacing', 'REVIEW: single (explicit specific text beats example geometry). Resolved.', False)
dec('Space after front/back-matter titles', 'REVIEW: ÖNSÖZ/İÇİNDEKİLER/SİMGELER 36 pt (§1.7); ÖZET/SUMMARY 24 pt to thesis title then 18 pt (§2.3 + Şekil 14 annotations agree); KAYNAKLAR 18 pt (§2.4, Şekil 17 geometry ≈ 18 pt); ŞEKİLLER/TABLOLAR 36 pt INFERRED. Resolved (specific > general).', False)
dec('Space after H2', "REVIEW: not a conflict - Şekil 2's '1,5 aralık (18 p)' labels body line spacing (between body lines 2-3), not the gap after '1.1.'. 24 pt.", False)
dec('Bibliography font size', 'REVIEW: §2.4 (specific, mandatory) → body −1 or −2 pt (author choice, default 11 pt with a 12 pt body). §1.3 8-9 pt is permissive/general. Resolved.', False)
dec('Bibliography entry spacing', "REVIEW: 18 pt - the guide's own unit ('1,5 aralık (18 p)') applied to explicit text; Şekil 17's ≈ 6-7 pt is example geometry (policy: text > example; never average). Resolved; deviation documented.", False)
dec('Printed titles of the lists', "REVIEW: example titles (ŞEKİLLER, TABLOLAR/ÇİZELGELER per label choice, SİMGELER ve KISALTMALAR); 'Dizini' is descriptive as in '“İÇİNDEKİLER” dizini'. Resolved.", False)
dec('Table label', 'REVIEW: explicit author choice (Şekil 5 "... veya ..."), default Tablo; list title and Devam caption follow the choice. Resolved (engine needs a template choice).', False)
dec('İç kapak in the TOC', "REVIEW: excluded - §1.20 ii itself requires conformity with Şekil 10, which starts at Kabul ve Onay. Resolved.", False)
s['conflicts'].append({'topic': 'Footnote separator length', 'sources': [
    {'path': SRC, 'locator': 'pdf p.10 §1.11', 'value': 'soldan sağa sayfanın ortasına kadar (40 → 105 mm = 65 mm)'},
    {'path': SRC, 'locator': 'pdf p.9 Şekil 3 (raster)', 'value': '≈ 36 % of the block ≈ 52 mm (Word default separator)'}],
    'decision': 'REVIEW: 65 mm (explicit text).', 'needsConfirmation': False})
s['conflicts'].append({'topic': 'Body font / size: example vs rule', 'sources': [
    {'path': SRC, 'locator': 'pdf p.5 §1.3', 'value': 'any book font (TNR, Bookman, Palatino, Garamond, Arial vb.), 10-14 pt'},
    {'path': SRC, 'locator': 'pdf p.8 Şekil 2 caption', 'value': 'an example page using TNR 12'}],
    'decision': 'REVIEW: author choice; TNR 12 is the default configuration only. Heading sizes (14/12) exact only for that configuration.', 'needsConfirmation': False})
changes.append('conflicts: 11 needsConfirmation flags cleared with decisions; added footnote-separator and body-font conflicts; only version/date and Önsöz order remain flagged (non-blocking).')

# ---- unknowns ----
s['unknowns'].append({'key': 'headings.h*.fontSizePt for non-default body sizes', 'why': 'only annotated for the TNR-12 example'})
s['unknowns'].append({'key': 'wordModel.firstBaselineOffsetEm for 1.5 spacing; wordModel.paragraphSpacing', 'why': 'no vector 1.5-spaced text or spacing-based paragraphs in the source'})
s['unknowns'].append({'key': 'approval Raportör role for master', 'why': 'PhD example only'})

# ---- measurable checks ----
M = {m['id']: m for m in s['measurableChecks']}
M['body-font']['expected'] = "fixture's chosen body font (default Times New Roman), genuine program embedded, one family across main text"
M['body-font']['what'] = 'body span font program; uniform across main-text spans (author choice from typography.body.fontFamily.authorChoice)'
M['body-size']['what'] = 'body span size = fixture choice (default 12), must lie in 10-14'
M['body-pitch']['what'] += ' - value for the default TNR-12 configuration (Word 1.5 lines = 1.5 x 1.15 em)'
M['h1-style']['what'] += ' [default TNR-12 configuration]'
M['h2-h3-style']['what'] += ' [default TNR-12 configuration]'
M['pagenum-position']['what'] = 'page number inside the top margin (baseline < 30 mm); default choice right: x1 = 185.0 mm; if the centre choice is configured: centre x = 112.5 mm; plain numerals'
M['pagenum-position']['expected'] = {'position': 'top', 'defaultAlign': 'right', 'x1Mm': 185.0}
M['bib-format']['what'] = 'KAYNAKLAR bold centred caps, line top at 38.47 mm; first entry baseline = title baseline + title line + 18 pt; entries single spaced, size = body−1 (default 11 pt), justified'
new_checks = [
    ('bib-entry-gap', 'extra space between bibliography entries (last baseline → next first baseline minus single pitch of the bib size)', 18, 'pt', 0.2, 'bibliography.spaceAfterPt'),
    ('bib-size', 'bibliography entry span size (default body 12 − 1)', 11, 'pt', 0.1, 'bibliography.fontSizePt'),
    ('h1-h2-gap', 'H1 directly followed by H2: one 36 pt gap (not 72) in PDF and DOCX', 36, 'pt', 0.2, 'headings.h1ToH2.gapPt'),
    ('front-title-after', 'ÖNSÖZ / İÇİNDEKİLER / SİMGELER ve KISALTMALAR title → first content line: 36 pt extra', 36, 'pt', 0.2, 'preface.titleSpaceAfterPt'),
    ('abstract-gaps', 'ÖZET/SUMMARY: title → thesis title 24 pt; thesis title → text 18 pt; text → keyword line 18 pt; text single spaced', [24, 18, 18], 'pt', 0.2, 'abstract.titleToThesisTitlePt'),
    ('caption-gaps', 'figure → caption 12 pt; table caption → table 12 pt; 18 pt before/after the figure/table unit', [12, 18], 'pt', 0.2, 'captions.spacing.captionToObjectPt'),
    ('footnote-separator', 'separator rule x0 = 40.0 mm, x1 = 105.0 mm; 24 pt below the last text line', {'x0Mm': 40.0, 'x1Mm': 105.0, 'spaceBeforePt': 24}, 'mixed', 0.5, 'footnotes.separator'),
    ('cover-font', 'inner-cover (and outer-cover) text font program = Times New Roman regardless of body-font choice', 'Times New Roman', 'name', 0, 'cover.fontFamily'),
    ('para-indent-choice', 'first-line indent of non-first paragraphs = configured choice in 5-10 mm (default 10 → x0 = 50.0 mm)', 50.0, 'mm', 0.5, 'typography.paragraph.firstLineIndentMm'),
]
for i, w, e, u, t, sr in new_checks:
    s['measurableChecks'].append(collections.OrderedDict(id=i, appliesTo=['*'], what=w, expected=e, unit=u, tolerance=t, sourceRule=sr))
changes.append('measurableChecks: body font/size/pitch/headings tied to the default choice; +9 checks (bib gap/size, H1-H2 gap, front-title-after, abstract gaps, caption gaps, footnote separator, cover font, indent choice).')

s['reviewedAt'] = '2026-09-28'
s['review'] = {'reviewer': 'independent', 'changes': changes,
  'decisionsProposed': [
    'Body font/size: author choice (any book font, 10-14 pt), default TNR 12 (INFERRED); covers always TNR (EXPLICIT).',
    'Page number: top; author choice centre/right; default right (x1 185 mm).',
    'Citation: guide-specified author-date format; Harvard/APA label irrelevant.',
    'Front order: İçindekiler before Önsöz (§2.1) - still flagged.',
    'Inner cover first line: T.C.',
    'Abstract text: single spacing; ÖZET gaps 24/18/18.',
    'Title-after gaps: ÖNSÖZ/İÇİNDEKİLER/SİMGELER 36, ÖZET 24, KAYNAKLAR 18, ŞEKİLLER/TABLOLAR 36 (INFERRED).',
    'Bibliography: size body−1 (11) or body−2; entry gap 18 pt.',
    'Table label: choice Tablo (default)/Çizelge; list title follows.',
    'List titles: ŞEKİLLER / TABLOLAR / SİMGELER ve KISALTMALAR.',
    'İç Kapak not in TOC; TOC lists itself.',
    'Footnote separator 65 mm (to page centre).',
    "Master's approval: Şekil 9 grid with optional member rows; count UNKNOWN."],
  'openItems': [
    'Guide currency (2009 vs 2015) - institute confirmation.',
    'Page-number vertical distance / font (UNKNOWN; validator can only require it inside the top margin).',
    'H1 space before; front-matter title font size; caption/footnote exact sizes (choose, document as non-source).',
    "Master's jury count and Raportör label.",
    'Caption first-line indent (example suggests paragraph indent; MEASURED-low).',
    'Heading sizes for non-default body sizes (INFERRED body+2 / body).',
    'Engine: templateChoices mechanism for font/size/indent/label/alignment choices (engineGap #4).']}
json.dump(s, open(P, 'w'), ensure_ascii=False, indent=1)
print('\n'.join(changes))
