"""Applies the independent spec review to orchestration/specs/aku-mbg-lisans.json (run once)."""
import json, copy

SPEC = '/home/user/TxtNote-Template-Work/orchestration/specs/aku-mbg-lisans.json'
G = 'Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_MBG_Lisans_Bitirme_Tezi_Kilavuzu_2025.pdf'
T = 'Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_MBG_Lisans_Bitirme_Tezi_Sablonu_2025.docx'
RV = 'orchestration/artifacts/aku-mbg-lisans/review/'

s = json.load(open(SPEC, encoding='utf8'))
assert 'review' not in s, 'review already applied'
rules = s['rules']
byKey = {r['key']: r for r in rules}

def ev(src, loc, quote=None):
    e = {'source': src, 'locator': loc}
    if quote:
        e['quote'] = quote
    return e

def add_rule(key, value, conf, evidence, notes='', unit=None, appliesTo=('*',)):
    r = {'key': key, 'value': value}
    if unit:
        r['unit'] = unit
    r.update({'confidence': conf, 'appliesTo': list(appliesTo), 'evidence': evidence, 'notes': notes})
    assert key not in byKey, key
    rules.append(r); byKey[key] = r

# ---------------------------------------------------------------- wordModel.*
add_rule('wordModel.firstBaselineOffsetEm',
         {'single': 0.911, '1.5': 0.911, 'measuredRangeEm': [0.906, 0.912],
          'hypothesisAscentPlusLineGapEm': 0.934,
          'formula': 'baseline = top of the line box + 0.911 em (Times New Roman), identical for single and 1.5 spacing'},
         'MEASURED',
         [ev(G, 'PDF p.6/15/16/19/20 first line (continuation line of a 1.5-spaced paragraph, pitch 7.30 mm) baseline 28.84 mm; guide top margin 24.99 mm (= its 24.99 mm left margin; p.7 table top border drawn at 24.98 mm) -> 3.85 mm = 10.91 pt = 0.909 em'),
          ev(G, 'PDF p.7 first table row (single, pitch 4.87 mm = 13.8 pt): top border 24.98-25.15 mm, baseline 29.01 mm -> 10.94 pt = 0.912 em below the border'),
          ev(G, 'PDF p.4: blank 10.56 pt line (single) baseline 106.19 -> first line of the 1.5-spaced paragraph "Bu kılavuzda belirtilen" 110.89 mm = 13.32 pt; below-model predicts 2.52 + 10.93 = 13.45 pt, extra-above model 20.35 pt'),
          ev(RV + 'guide_all_lines_incl_blank.txt', 'full per-span dump incl. blank lines')],
         'Word places the baseline 0.911 em below the line-box top for both single and "1,5 satır" lines, i.e. ascent (0.891) + about half of the hhea lineGap (0.0425). The hypothesis lineGap+ascent (0.934 em) is 0.09-0.10 mm lower at 12 pt; both are inside the 0.25 mm target, 0.911 is the measured value. LibreOffice renders 0.936 em, so LO-derived baselines of 12 pt special pages are 0.10 mm too low (corrected in sections[].layout).')
add_rule('wordModel.multipleLineSpacing.extraPlacement', 'below', 'MEASURED',
         [ev(G, 'PDF p.6/15/16/19/20: first line of a 1.5-spaced paragraph on a page sits 10.9 pt below the top margin, not 10.9+6.9 = 17.8 pt'),
          ev(G, 'PDF p.4 110.89 mm: 1.5-spaced paragraph after single-spaced blank lines starts 13.32 pt below the previous baseline (extra-above would give 20.35 pt)')],
         '"1,5 satır" (w:line=360 auto) makes the line box 1.5 x 1.15 em = 20.7 pt at 12 pt; the additional 0.5 line (6.9 pt at 12 pt, 8.05 pt at 14 pt) lies BELOW the glyphs. A 1.5-spaced line box is therefore [baseline-0.911 em, baseline+0.914 em] at 12 pt (0.239 em descent part + 0.675 em extra). Resolves the analyzer UNKNOWN word.multipleLineSpacing.placement.')
add_rule('wordModel.lineBoxBelowBaselineEm', {'single': 0.239, '1.5': 0.914}, 'MEASURED',
         [ev(G, 'PDF p.6 table: last row baseline 213.31 -> next row border 214.37 mm = 3.0 pt (0.239 em = 2.87 pt + border)'),
          ev(G, 'footer "1" baseline 276.22 mm on 297.05 mm page with a 20.0 mm footer distance -> 0.83 mm = 0.235 em (10 pt)')],
         'single line = 1.15 em = 0.911 above + 0.239 below the baseline.')
add_rule('wordModel.inlinePictureLine',
         {'aboveBaseline': 'wp:extent cy + effectExtent t + b', 'belowBaseline': '0.239 em of the paragraph font',
          'multipleSpacingExtra': '(m-1) x 1.15 em of the paragraph font only (NOT scaled by the picture height)'},
         'INFERRED',
         [ev(T, 'docProps/app.xml <Pages>27</Pages> (saved by Word 14) and the 25 w:lastRenderedPageBreak markers: Word paginates exactly like the LibreOffice render (27 pages, ÖZET sample "ix + 16 sayfa")'),
          ev(T, 'document.xml: 1.5-spaced inline pictures 71.61 mm (Şekil 2.1 / 2.2, P268) and the 26.46 mm logo row (P1). If Word multiplied the whole picture line by 1.5 (+36 mm on the Şekil 2.2 page, +11 mm on the cover), the Şekil 2.2 page (last LO baseline 253.49) and the cover (Ay, Yıl) would overflow and Word would have written a lastRenderedPageBreak inside those pages; none exists (markers only at P29, P45, … P348 Şekil 2.2, P359 3. MATERYAL ve METOT)'),
          ev(RV + 'cover_word_model_output.txt', 'variant B (whole line scaled) puts Ay, Yıl at 274.63 mm, below the 266.99 mm text limit')],
         'Full-line scaling is rejected by Word\'s own pagination record. Residual uncertainty: whether Word adds the text-based extra (8.05 pt at 14 pt) to a picture line at all (variant A, also LibreOffice behaviour) or none (A0); A is used, A0 would move every cover line below the logos 2.84 mm up.')
add_rule('wordModel.effectExtentInLayout', True, 'INFERRED',
         [ev(T, 'P1 wp:inline extent 942975 / 944880 EMU + effectExtent r,b 9525 / 7620 EMU -> layout box 26.46 x 26.46 mm for both logos'),
          ev(T, 'LibreOffice render (ignores effectExtent): logos 26.19 / 26.25 mm, image-1 x0 32.49 mm')],
         'ECMA-376 §20.4.2.6 effectExtent is added to each edge for layout. Word model: row width 149.22 mm right-aligned to 180.0 -> image 1 visible x0 32.01 mm, image 2 visible 153.54-179.79 mm (LO: 32.49 / 153.76-180.01).')
add_rule('wordModel.paragraphSpacing',
         {'contextualSpacing': 'off for bibliography entries (demonstrated)', 'additiveAfterPlusBefore': 'not demonstrated by the sources', 'spaceBeforeAtPageTop': 'not demonstrated by the sources',
          'blankParagraphs': 'template realises every "1 satır boşluk" as an empty 1.5-spaced paragraph of the text size (20.7 pt at 12 pt, 24.15 pt at 14 pt), which also occupies space at a page top'},
         'EXPLICIT',
         [ev(G, 'PDF p.18 screenshot (Paragraf dialog): "Aynı stildeki paragrafların arasına boşluk ekleme" unchecked, Önce 6 nk, Sonra 0 nk, 1,5 satır'),
          ev(G, 'PDF p.18-22: the guide\'s own reference examples do NOT use these settings (entry-to-entry = 3 x 7.31 mm, no 6 pt), so no case with both after>0 and before>0 or with 6 pt before at a page top exists')],
         'Only contextualSpacing=false is demonstrated. Additivity and top-of-page suppression stay UNKNOWN (see unknowns). The template never combines after>0 with before>0 except caption (after 6) -> following empty paragraph (before 0).')
add_rule('wordModel.pageFit',
         'a line fits when its glyph part (baseline + 0.239 em) is above the bottom margin; the extra half line of a 1.5-spaced last line may extend into the bottom margin',
         'INFERRED',
         [ev(T, 'cover (section 1): Word keeps AFYON…Ay, Yıl on one page (no lastRenderedPageBreak before P29) although the Ay, Yıl 1.5 line box would end at 267.67 mm > 266.99 mm; its glyph part ends at 264.83 mm'),
          ev(G, 'PDF p.19-21 last baselines 269.83 mm with a 24.99 mm bottom margin (assumed equal to the measured top/left margins): glyph part 270.67 <= 272.06, full 1.5 box 273.28 > 272.06')],
         'Needed to decide page breaks exactly like Word. Also: the empty paragraph that carries the cover sectPr (P28) must not create a page of its own.')
add_rule('wordModel.sectionStartParity',
         'sections start on the next page; no blank pages are inserted', 'TEMPLATE',
         [ev(T, 'sectPr#1..#4 w:type evenPage/oddPage/oddPage/oddPage, each later section restarting page numbers at 1 (pgNumType start=1) -> the first page of every section is odd-numbered, so Word inserts no blank page; docProps Pages=27 = LibreOffice 27 pages'),
          ev(G, 'PDF p.4 §2.2', 'Kâğıdın yalnızca bir yüzü kullanılmalıdır.')],
         'Implement plain next-page section starts; do not emulate odd/even parity (it would add blank pages that neither source shows).')
add_rule('wordModel.footerBaselineMm', 283.65, 'INFERRED',
         [ev(T, 'sectPr footer=709 tw (12.51 mm); footer paragraph style Altbilgi -> Normal, 10 pt (docDefaults), single')],
         'baseline = 297.0 - 12.51 - 0.239 x 10 pt (0.84 mm) = 283.65 mm; the analyzer\'s descent-only value 283.73 differs by 0.08 mm (both inside tolerance; pagenum-baseline check kept at 283.73 ± 0.5).', unit='mm')

# ---------------------------------------------------------------- other new rules
add_rule('captions.table.keepWithNext', True, 'TEMPLATE',
         [ev(T, 'styles.xml Balk6 (used by every Çizelge caption P252/P325/P346): w:keepNext, w:keepLines')],
         'Table caption must stay on the same page as the first table row. Figure/picture captions (Normal, after=120) carry no keep flag.')
add_rule('printing.fromWordFile', 'print the thesis from the Word (.docx) file, not from a PDF conversion', 'EXPLICIT',
         [ev(G, 'PDF p.23 §4.15', 'çıktı alınırken .pdf formatına dönüştürülmeden WORD formatında çıktı alınmalıdır !')],
         'The DOCX export is the print master; the PDF export must match it (validator should compare both).')
add_rule('submission.similarityMaxPercent', 30, 'EXPLICIT',
         [ev(G, 'PDF p.23 §4.16', '“İntihal Raporu” neticesinde benzerlik oranı %30’nin üzerinde olan öğrenciler ... %30 ve altına düşürmeli')],
         'Process requirement, not a layout rule (not implementable/measurable in the editor).', unit='%')

# ---------------------------------------------------------------- amend existing rules
byKey['pagination.baselineMm']['notes'] = (byKey['pagination.baselineMm'].get('notes', '') +
    ' Review: Word model (wordModel.footerBaselineMm) gives 283.65 mm; difference 0.08 mm, kept.').strip()
byKey['typography.widowOrphanControl']['notes'] = (byKey['typography.widowOrphanControl'].get('notes', '') +
    ' Review: the guide sentence is exactly Word\'s widow/orphan control (no single line of a paragraph alone at the top or bottom of a page); newer explicit text overrides the template Normal widowControl=0. The template itself contradicts its own guide here, so this is not a TEMPLATE value.').strip()
cm = byKey['cover.margins']
cm['notes'] = (cm.get('notes', '') + ' Review decision: keep 10.02 mm for the İç Kapak only. The guide\'s 3 cm is generic ("Yazımda sayfa kenarlarından"), the template is the only official design of this page, and with a 30 mm top margin the official cover no longer fits one page (Word model: Ay, Yıl baseline 263.65 + 19.99 = 283.6 mm > 266.99 mm), so applying 3 cm would require inventing a different cover.').strip()
cl = byKey['cover.logos']
cl['notes'] = (cl.get('notes', '') + ' Review (Word model, effectExtent included): layout boxes 26.46 x 26.46 mm, row right-aligned; visible image 1 x0 32.01 (LO 32.49), image 2 153.54-179.79 (LO 153.76-180.01); both tops at 10.02 mm, bottoms 36.21 / 36.27, row baseline 36.48 mm.').strip()

# ---------------------------------------------------------------- sections: cover absolute baselines (Word model, variant A)
cover_word = {'AFYON KOCATEPE ÜNİVERSİTESİ': 45.00, 'FEN EDEBİYAT FAKÜLTESİ': 53.51, 'MOLEKÜLER BİYOLOJİ ve GENETİK BÖLÜMÜ': 62.03,
              'BİTİRME TEZİ': 104.63, '{{THESIS_TITLE}}': 138.70, '{{STUDENT_NAME}}': 169.94, 'Danışman': 195.50,
              '{{ADVISOR_TITLE}} {{ADVISOR_NAME}}': 204.01, '{{SUBMISSION_MONTH}}, {{SUBMISSION_YEAR}}': 263.65}
secs = {x['id']: x for x in s['sections']}
ic = secs['inner-cover']
for item in ic['layout']:
    t = item.get('text')
    if t in cover_word:
        item['baselineMmLibreOffice'] = item.get('baselineMm')
        item['baselineMm'] = cover_word[t]
        item['confidence'] = 'INFERRED'
    if item.get('kind') == 'image':
        item['imagesWordModel'] = [{'wMm': 26.19, 'hMm': 26.19, 'x0Mm': 32.01, 'y0Mm': 10.02},
                                   {'wMm': 26.25, 'hMm': 26.25, 'x0Mm': 153.54, 'y0Mm': 10.02}]
        item['rowBaselineMm'] = 36.48
        item['rowLineBoxMm'] = [10.02, 40.50]
    if t == '{{THESIS_TITLE}}':
        item['continuationBaselineMm'] = 147.22
ic['notes'] = ('Review: baselineMm recomputed from document.xml with the Word model (wordModel.*: 0.911 em first-baseline offset, extra half line below, picture line = 26.46 mm + 0.239 em + 8.05 pt, effectExtent included) -> uniformly 1.26-1.27 mm below the LibreOffice render (kept as baselineMmLibreOffice). '
               'Reproduce with orchestration/artifacts/aku-mbg-lisans/review/cover_word_model.py (variant A, 0.911 em). Title "(Devam)" 2nd line 147.22. Residual risk: picture-line extra A vs A0 (all lines below the logos 2.84 mm higher under A0). ' + ic.get('notes', ''))

SHIFT_SECTIONS = ['ethics-declaration', 'abstract', 'english-abstract', 'acknowledgements', 'table-of-contents',
                  'list-of-symbols', 'list-of-figures', 'list-of-tables', 'list-of-pictures']
for sid in SHIFT_SECTIONS:
    sec = secs[sid]
    for item in sec.get('layout', []) or []:
        if isinstance(item.get('baselineMm'), (int, float)):
            item['baselineMmLibreOffice'] = item['baselineMm']
            item['baselineMm'] = round(item['baselineMm'] - 0.10, 2)
    sec['notes'] = ('Review: baselineMm = LibreOffice value - 0.10 mm (Word first-baseline offset 0.911 em vs LO 0.936 em at 12 pt; pitch identical, extra half line below in both). ' + (sec.get('notes') or '')).strip()
# specific fixes
for item in secs['table-of-contents']['layout']:
    if item.get('text') == 'Sayfa':
        item['baselineMm'] = 41.16
        item['notes'] = 'Word model: title 33.86 + 20.7 pt (7.30 mm) = 41.16; LibreOffice 38.03 is an LO mis-render of the Balk1 title paragraph.'
    if item.get('text') == 'İÇİNDEKİLER DİZİNİ':
        item['align'] = 'center'
for item in secs['ethics-declaration']['layout']:
    if item.get('text') == '{{STUDENT_NAME}}' and item.get('kind') == 'metadata':
        item['baselineMm'] = 178.70
        item['sizePt'] = 12
        item['notes'] = (item.get('notes', '') + ' Review: at the decided 12 pt the single-spaced name line follows the 1.5-spaced İmza line by 20.7 pt -> 171.40 + 7.30 = 178.70 mm (LO 178.15 is the 10 pt accident).').strip()
for item in secs['list-of-symbols']['layout']:
    if item.get('text') == 'SİMGELER ve KISALTMALAR DİZİNİ':
        item['align'] = 'left'
        item['confidence'] = 'TEMPLATE'
# move ÖZGEÇMİŞ before EKLER (template TOC order KAYNAKLAR 14, ÖZGEÇMİŞ 17, EKLER 18)
order = [x['id'] for x in s['sections']]
cv = s['sections'].pop(order.index('curriculum-vitae'))
s['sections'].insert([x['id'] for x in s['sections']].index('appendices'), cv)
cv['notes'] = ('Review decision: optional, disabled by default; if enabled it is placed after KAYNAKLAR and before EKLER (template TOC P165-P167: 6. KAYNAKLAR 14, ÖZGEÇMİŞ 17, EKLER 18), TOC entry unnumbered level 1 (style T1). Guide §4.1 (the explicit ordered list) omits it; §4.4 only says the TOC must list it when present. Page layout UNKNOWN (no sample in either source). ' + cv.get('notes', ''))
cv['inToc'] = True
outer = secs['outer-cover']
outer['notes'] = ('Review: UNKNOWN confirmed. Guide §4.1 lists "Dış Kapak" and §2.6 says it is unnumbered; §2.2 limits 14 pt to the İç Kapak, so the single template cover (callout "Sadece bu sayfada 14 punto") is the İç Kapak. Neither source shows a Dış Kapak; spiral binding (§4.16) and PDF submission (§2.1) do not define one. Proposed: do not generate a Dış Kapak (never duplicate/invent); report the page as source-blocked. Missing: a Dış Kapak sample or statement from the department. ' + outer.get('notes', ''))

# ---------------------------------------------------------------- conflicts
conf = {c['topic']: c for c in s['conflicts']}
def decide(topic, decision, needs):
    c = conf[topic]
    c['decisionReview'] = decision
    c['needsConfirmation'] = needs
decide('dizin-title-alignment', 'Confirmed: centred. Guide §4.4/4.6/4.7/4.8 are explicit and newer (2025-05-13 vs 2025-02-27); the template titles are plain Balk1 (jc=both from the style, no direct jc) i.e. an unedited style, not a design decision.', False)
decide('symbols-title-alignment', 'Left (template), per policy: the guide is silent for this title and the official template XML decides unstated values. Analogy with the other Dizin titles is INFERRED and not allowed to override the template. Impact small (one title line).', False)
decide('abstract-order', 'Confirmed: guide order (text, blank, Anahtar Kelimeler, blank, year + pages); explicit, newer and more specific (§4.2).', False)
decide('cover-top-margin', 'Keep 10.02 mm for the İç Kapak section only (30 mm elsewhere). The template is the only official design of that page; the guide rule is generic; with 30 mm the official cover no longer fits on one page (Word model Ay, Yıl 283.6 mm > 266.99 mm), so the guide value would force an invented layout.', False)
decide('cv-presence', 'Optional section, disabled by default; position after KAYNAKLAR and before EKLER (template TOC order); unnumbered level-1 TOC entry. Layout stays UNKNOWN.', True)
decide('outer-vs-inner-cover', 'Template page = İç Kapak (guide §2.2 14 pt rule + template callout). Dış Kapak layout UNKNOWN: do not generate it; missing evidence = a Dış Kapak sample/statement.', True)
decide('cover-title-line-spacing', 'A wrapped title is one paragraph and keeps that paragraph\'s spacing: cover 1.5 (24.15 pt pitch), ÖZET/ABSTRACT single (13.8 pt pitch). The template "(Devam)" paragraphs are samples of a second line and are themselves inconsistent (cover single, ÖZET 1.5, ABSTRACT single), so they cannot define a rule.', True)
s['conflicts'].append({
    'topic': 'section-start-parity',
    'sources': [{'path': T, 'locator': 'sectPr#1..#4 w:type evenPage/oddPage', 'value': 'odd/even page section starts'},
                {'path': G, 'locator': 'PDF p.4 §2.2', 'value': 'one-sided printing'}],
    'decision': 'No conflict in effect: every later section restarts numbering at 1, so its first page is odd and Word inserts no blank page (Pages=27 = LO). Implement plain next-page starts.',
    'needsConfirmation': False})
s['conflicts'].append({
    'topic': 'inner-cover-absolute-geometry',
    'sources': [{'path': RV + 'cover_word_model_output.txt', 'locator': 'variant A 0.911 em', 'value': 'AFYON baseline 45.00 mm'},
                {'path': 'orchestration/artifacts/aku-mbg-lisans/source/template_render_geometry.json', 'locator': 'page 1', 'value': 'AFYON baseline 43.73 mm (LibreOffice)'}],
    'decision': 'Use the Word-model values (renderer evidence is supporting only; the XML + measured Word line model is primary). LO differs by a constant 1.26 mm because it ignores effectExtent and uses a 0.936 em first-baseline offset.',
    'needsConfirmation': False})

# ---------------------------------------------------------------- unknowns
s['unknowns'] = [u for u in s['unknowns'] if u['key'] != 'word.multipleLineSpacing.placement']
for u in s['unknowns']:
    if u['key'] == 'inner-cover.logoLine.height':
        u['why'] = ('Narrowed by review: full-line scaling of 1.5-spaced picture lines is rejected by Word\'s pagination record (docProps Pages=27, lastRenderedPageBreak positions). Remaining: whether Word adds the text-based 0.5-line extra (8.05 pt) to the logo row (variant A, used) or nothing (A0): cover lines below the logos would be 2.84 mm higher under A0. Only a Microsoft Word render of the template can settle it.')
s['unknowns'].append({'key': 'wordModel.paragraphSpacing.additive/topOfPage', 'why': 'No source page shows after>0 followed by before>0, or a 6 pt space-before paragraph at a page top rendered by Word (the guide\'s own bibliography examples do not use the 6 nk setting).'})

# ---------------------------------------------------------------- measurable checks
mc = {c['id']: c for c in s['measurableChecks']}
mc['margin-top'].update({'what': 'DOCX w:pgMar top 1701 tw on body sections; PDF: first baseline on a body page whose first line is 12 pt text = 30.0 mm + 0.911 em (10.93 pt) = 33.86 mm',
                         'expected': 33.86, 'tolerance': 0.25, 'sourceRule': 'page.margins.topMm + wordModel.firstBaselineOffsetEm'})
mc['margin-bottom'].update({'what': 'DOCX w:pgMar bottom 1701 tw; PDF: max over body pages of (last 12 pt baseline + 0.239 em = 1.01 mm) <= 267.0 mm, i.e. last baseline <= 265.99 mm; and a page is only broken when the next line would violate this',
                            'expected': 265.99, 'sourceRule': 'page.margins.bottomMm + wordModel.pageFit'})
mc['cover-center']['sourceRule'] = 'cover.fontSizePt'
mc['cover-logos'].update({'what': 'logo boxes 26.19x26.19 mm and 26.25x26.25 mm, tops 10.02 mm; image-1 x0 32.01, image-2 x1 179.79 (Word model incl. effectExtent; LO 32.49 / 180.01)',
                          'expected': [32.01, 179.79, 10.02], 'sourceRule': 'cover.logos + wordModel.effectExtentInLayout'})
new_checks = [
    {'id': 'cover-baselines', 'appliesTo': ['inner-cover'], 'what': 'absolute baselines (mm from top) of AFYON, FEN, MOLEKÜLER…BÖLÜMÜ, BİTİRME TEZİ, title line 1 (1-line title), student, Danışman, advisor, Ay-Yıl (Word model, variant A)',
     'expected': [45.00, 53.51, 62.03, 104.63, 138.70, 169.94, 195.50, 204.01, 263.65], 'unit': 'mm', 'tolerance': 0.5, 'sourceRule': 'cover.lineSpacing + wordModel.*'},
    {'id': 'special-page-first-baseline', 'appliesTo': ['ethics-declaration', 'abstract', 'english-abstract', 'acknowledgements', 'table-of-contents', 'list-of-symbols', 'list-of-figures', 'list-of-tables', 'list-of-pictures'],
     'what': 'baseline of the title line of each special/front page', 'expected': 33.86, 'unit': 'mm', 'tolerance': 0.25, 'sourceRule': 'wordModel.firstBaselineOffsetEm'},
    {'id': 'no-blank-pages', 'appliesTo': ['*'], 'what': 'no empty pages between sections (cover -> ethics -> ÖZET -> … -> GİRİŞ); page count = content pages', 'expected': True, 'unit': None, 'tolerance': None, 'sourceRule': 'wordModel.sectionStartParity'},
    {'id': 'widow-orphan', 'appliesTo': ['*'], 'what': 'no page starts with the last line of a multi-line body paragraph and no page ends with the first line of a multi-line body paragraph', 'expected': True, 'unit': None, 'tolerance': None, 'sourceRule': 'typography.widowOrphanControl'},
    {'id': 'heading-keep-with-next', 'appliesTo': ['*'], 'what': 'no H2-H4 heading is the last text line of a page', 'expected': True, 'unit': None, 'tolerance': None, 'sourceRule': 'headings.keepWithNext'},
    {'id': 'table-caption-keep', 'appliesTo': ['*'], 'what': 'every Çizelge caption is on the same page as the first row of its table', 'expected': True, 'unit': None, 'tolerance': None, 'sourceRule': 'captions.table.keepWithNext'},
    {'id': 'lists-sayfa', 'appliesTo': ['list-of-figures', 'list-of-tables', 'list-of-pictures'], 'what': "'Sayfa' bold 12 pt, right edge 180.0 mm, one 1.5 line (7.30 mm) below the title baseline; no title/Sayfa on continuation pages", 'expected': 180.0, 'unit': 'mm', 'tolerance': 0.5, 'sourceRule': 'lists.figures.pageNumberHeading'},
    {'id': 'lists-entry-format', 'appliesTo': ['list-of-figures', 'list-of-tables', 'list-of-pictures'], 'what': 'entries: bold label "Şekil|Çizelge|Resim n.m", regular caption text, dot leader, page number right at 179.85 mm, continuation lines hanging under the text', 'expected': 179.85, 'unit': 'mm', 'tolerance': 0.5, 'sourceRule': 'lists.figures.entryStyle'},
    {'id': 'keywords-hanging', 'appliesTo': ['abstract', 'english-abstract'], 'what': 'x0 of keyword continuation lines: ÖZET 30.0+37.52 = 67.52 mm, ABSTRACT 30.0+22.0 = 52.0 mm; label bold', 'expected': [67.52, 52.0], 'unit': 'mm', 'tolerance': 0.5, 'sourceRule': 'abstract.keywords.hangingIndentMm'},
    {'id': 'abstract-graduation-thesis', 'appliesTo': ['english-abstract'], 'what': "second line of ABSTRACT page reads 'Graduation Thesis'; ÖZET second line 'Bitirme Tezi'", 'expected': True, 'unit': None, 'tolerance': None, 'sourceRule': 'abstract.structure.en'},
    {'id': 'ack-signature', 'appliesTo': ['acknowledgements'], 'what': 'student name and "Afyonkarahisar YYYY" right-aligned (x1 180.0) after 2 empty 1.5 lines; TEŞEKKÜR fits one page', 'expected': 180.0, 'unit': 'mm', 'tolerance': 0.5, 'sourceRule': 'acknowledgements.signature'},
    {'id': 'ethics-name-size', 'appliesTo': ['ethics-declaration'], 'what': 'student name on the ethics page 12 pt, right-aligned to 180.0, baseline 178.70 mm', 'expected': 12, 'unit': 'pt', 'tolerance': 0.1, 'sourceRule': 'typography.body.fontSizePt'},
    {'id': 'table-notes', 'appliesTo': ['*'], 'what': 'table note paragraphs below the table: 10 pt, single (11.5 pt pitch), 6 pt before and after, justified', 'expected': 10, 'unit': 'pt', 'tolerance': 0.1, 'sourceRule': 'tables.notes'},
    {'id': 'table-rules', 'appliesTo': ['*'], 'what': 'tables have exactly three horizontal 0.5 pt rules (top, below header, bottom) and no vertical rules', 'expected': 3, 'unit': None, 'tolerance': None, 'sourceRule': 'tables.borders'},
    {'id': 'equation-number', 'appliesTo': ['*'], 'what': 'display equation centred on 105.0 mm, number "(c.n)" right-aligned at 180.0 mm on the same baseline, Cambria Math 12 pt', 'expected': [105.0, 180.0], 'unit': 'mm', 'tolerance': 0.5, 'sourceRule': 'equations'},
    {'id': 'bib-internet', 'appliesTo': ['bibliography'], 'what': "after the alphabetical list: bold unnumbered 'İnternet Kaynakları' line, then entries '1- URL, GG.AA.YYYY', '2- …'", 'expected': True, 'unit': None, 'tolerance': None, 'sourceRule': 'bibliography.internetSources'},
    {'id': 'appendix-new-page', 'appliesTo': ['appendices'], 'what': "each 'EK n.' starts a new page; arabic numbering continues after KAYNAKLAR", 'expected': True, 'unit': None, 'tolerance': None, 'sourceRule': 'appendices.titles'},
    {'id': 'docx-print-master', 'appliesTo': ['*'], 'what': 'DOCX export reproduces the PDF export pagination (same page count and page-start texts)', 'expected': True, 'unit': None, 'tolerance': None, 'sourceRule': 'printing.fromWordFile'},
]
for c in new_checks:
    assert c['id'] not in mc
s['measurableChecks'] += new_checks

# ---------------------------------------------------------------- review block
s['reviewedAt'] = '2026-09-28'
s['review'] = {
    'reviewer': 'independent',
    'changes': [
        'Added wordModel.* rules measured on the Word-2010 guide PDF: first baseline 0.911 em below the line top for single and 1.5 spacing; the extra half line of "1,5 satır" goes BELOW the text (resolves the analyzer UNKNOWN); line box below baseline 0.239 em (single) / 0.914 em (1.5); page fit uses the glyph part.',
        'Rejected full 1.5 scaling of inline-picture lines using Word\'s own pagination record in the template (docProps Pages=27, w:lastRenderedPageBreak positions); effectExtent included in inline layout.',
        'Inner cover: recomputed absolute baselines from document.xml (AFYON 45.00 … Ay, Yıl 263.65 mm, logos x0 32.01 / x1 179.79) and replaced the relative-only cover checks with absolute ones (cover-baselines, cover-logos). LO values kept as baselineMmLibreOffice.',
        'Other special pages: baselines shifted -0.10 mm to the Word first-baseline offset; TOC "Sayfa" 41.16 (LO mis-render); ethics name 12 pt at 178.70; TOC title align centre, SİMGELER title left.',
        'ÖZGEÇMİŞ section moved before EKLER (template TOC order).',
        'New rules: captions.table.keepWithNext (Balk6 keepNext), wordModel.sectionStartParity (oddPage/evenPage breaks insert no blank pages because numbering restarts at 1), printing.fromWordFile (§4.15), submission.similarityMaxPercent (§4.16), wordModel.footerBaselineMm 283.65.',
        'measurableChecks: margin-top now absolute (33.86 mm, ±0.25), margin-bottom 265.99 mm; +18 checks (cover-baselines, special-page-first-baseline, no-blank-pages, widow-orphan, heading/table-caption keep, lists-sayfa, lists-entry-format, keywords-hanging, Graduation Thesis, ack-signature, ethics-name-size, table-notes, table-rules, equation-number, bib-internet, appendix-new-page, docx-print-master).'],
    'decisionsProposed': [
        'dizin-title-alignment: centred (guide explicit, newer).',
        'symbols-title-alignment: left (template decides what the guide leaves unstated).',
        'abstract-order: guide order (keywords before year + pages).',
        'cover-top-margin: 10.02 mm on the İç Kapak only; 3 cm would not fit the official cover on one page.',
        'widow-control: on (guide explicit; template Normal widowControl=0 overridden).',
        'guide (2025-05-13) vs template (2025-02-27): guide text wins where explicit; template XML fills every value the guide leaves open; the guide\'s own page geometry (25 mm margins) is not normative but IS valid evidence for Word\'s line model.',
        'section-start-parity: plain next-page section starts, no blank pages.',
        'ÖZGEÇMİŞ: optional, off by default, between KAYNAKLAR and EKLER; layout UNKNOWN.',
        'Dış Kapak: not generated (no source layout); report as source-blocked.',
        'cover-title-line-spacing: wrapped title keeps its paragraph spacing (cover 1.5, ÖZET/ABSTRACT single).'],
    'openItems': [
        'Dış Kapak layout UNKNOWN (blocks only that page; needs a department sample).',
        'Inline-picture line extra (variant A 8.05 pt vs A0 none): cover lines below the logos may be 2.84 mm higher in real Word; only a Microsoft Word render of the template settles it.',
        'ÖZGEÇMİŞ page layout UNKNOWN (title/TOC entry only).',
        'wordModel.paragraphSpacing additivity and space-before at a page top not demonstrated (affects bibliography entries at a page top: 6 pt).',
        'Footnote typography and abstract length limits remain UNKNOWN (sources silent).'],
}
json.dump(s, open(SPEC, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
open(SPEC, 'a').write('\n')
print('ok', len(s['rules']), 'rules', len(s['measurableChecks']), 'checks', len(s['conflicts']), 'conflicts', len(s['unknowns']), 'unknowns')
