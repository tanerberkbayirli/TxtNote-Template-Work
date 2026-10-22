import json, collections
ROOT = '/home/user/TxtNote-Template-Work/'
G = 'Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf'
T = 'Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx'
MM_PER_PT = 25.4 / 72
SL = 1.15  # Word single line of Times New Roman, em (verified: 13.8 pt pitch at 12 pt single, 20.7 pt at 1.5)
BL = round(12 * SL * 1.5, 2)  # one empty 1.5-spaced 12 pt line = 20.7 pt

def ev(src, loc, quote=None):
    e = {'source': G if src == 'G' else (T if src == 'T' else src), 'locator': loc}
    if quote: e['quote'] = quote
    return e

rules = []
def R(key, value, conf, evidence, unit=None, applies=None, notes=''):
    r = {'key': key, 'value': value}
    if unit: r['unit'] = unit
    r['confidence'] = conf
    r['appliesTo'] = applies or ['*']
    r['evidence'] = evidence
    if notes: r['notes'] = notes
    rules.append(r)

# ---------------- page ----------------
R('page.size', 'A4', 'EXPLICIT', [ev('G', 'p.5 §2.1', 'Tezler, A4 boyutlarında (21 cm x 29.7 cm)'), ev('T', 'word/document.xml sectPr#1..#4 w:pgSz w=11904|11906 h=16838')])
R('page.widthMm', 210, 'EXPLICIT', [ev('G', 'p.5 §2.1', '21 cm x 29.7 cm'), ev('T', 'sectPr w:pgSz w:w=11906 (s3) / 11904 (s1,s2,s4 = 209.97 mm)')], 'mm', notes='Template sections 1,2,4 use 11904 twips (209.97 mm), section 3 uses 11906 (210.0 mm); difference 0.03 mm is noise. Guide PDF page is 209.97 x 297.01 mm.')
R('page.heightMm', 297, 'EXPLICIT', [ev('G', 'p.5 §2.1', '29.7 cm'), ev('T', 'sectPr w:pgSz w:h=16838 (297.04 mm)')], 'mm')
R('page.orientation', 'portrait', 'EXPLICIT', [ev('G', 'p.12 §3.1', 'Sayfaya yatay olarak yerleştirilecek şekil, çizelge ve resimler tezin sağ tarafından okunabilecek şekilde düzenlenmelidir')], notes='Landscape only for individual wide figures/tables; page number stays bottom centre.')
for side in ('top', 'bottom', 'left', 'right'):
    R(f'page.margins.{side}Mm', 30, 'EXPLICIT', [ev('G', 'p.5 §2.3', 'Yazımda sayfa kenarlarından 3 cm boşluk bırakılmalıdır.'), ev('T', f'word/document.xml sectPr#1..#4 w:pgMar w:{side}="1701" (30.01 mm)')], 'mm',
      notes=('Guide body pages measure text from x=30.02 mm; first baseline 33.87-33.96 mm = 30 mm + TNR ascent (corroborates top 30).' if side in ('left', 'top') else
             ('Guide own pages justify to x=181.09 mm (right margin 28.9 mm) - guide document deviates from its own 3 cm rule; explicit text + template XML decide 30 mm (see conflicts).' if side == 'right' else '')))
R('page.gutterMm', 0, 'TEMPLATE', [ev('T', 'sectPr w:pgMar w:gutter="0"')], 'mm')
R('page.mirrorMargins', False, 'TEMPLATE', [ev('T', 'word/settings.xml: no w:mirrorMargins, no w:evenAndOddHeaders')])
R('printing.duplex', False, 'EXPLICIT', [ev('G', 'p.5 §2.2', 'Kâğıdın yalnızca bir yüzü kullanılmalıdır.')])
R('paper.weight', '70-100 g/m², beyaz birinci hamur', 'EXPLICIT', [ev('G', 'p.5 §2.1', '70 ile 100 gram ağırlığında “birinci hamur” olarak bilinen beyaz kağıda')])
R('page.header.content', 'none', 'TEMPLATE', [ev('T', 'word/_rels/document.xml.rels: no header parts; sectPr has only footerReference')])
R('page.header.distanceMm', 12.5, 'TEMPLATE', [ev('T', 'sectPr w:pgMar w:header="709" (s1-s3), "708" (s4)')], 'mm', notes='No header content exists; value only matters for DOCX parity.')
R('page.footer.distanceMm', 12.5, 'TEMPLATE', [ev('T', 'sectPr w:pgMar w:footer="709" (12.51 mm, s1-s3) / "708" (12.49 mm, s4)')], 'mm')
R('page.footer.content', 'PAGE field only, centered, style Altbilgi (Normal → Times New Roman 10 pt, single)', 'TEMPLATE', [ev('T', 'word/footer3.xml (roman, s3), word/footer4.xml (arabic, s4): one paragraph jc=center with PAGE field; footer1/footer2 (s1,s2) empty')])
R('page.sectionBreaks', 'new page between parts; no blank filler pages', 'INFERRED', [ev('T', 'sectPr#2..#4 w:type="oddPage"'), ev('G', 'p.5 §2.2', 'Kâğıdın yalnızca bir yüzü kullanılmalıdır.')], notes='Template uses oddPage section breaks (Word may insert blank pages); single-sided printing is explicit, so blank filler pages are not required. See conflicts.')

# ---------------- pagination ----------------
R('pagination.position', 'bottom', 'EXPLICIT', [ev('G', 'p.6 §2.7', 'Sayfa numaraları parantez ve çizgi kullanmadan sayfanın alt orta kısmına yazılmalıdır.'), ev('G', 'p.5 §2.3', 'alt bilgi bölümünde sayfa numarası ortalanarak')])
R('pagination.align', 'center', 'EXPLICIT', [ev('G', 'p.6 §2.7', 'sayfanın alt orta kısmına'), ev('T', 'footer3.xml/footer4.xml w:jc="center"')])
R('pagination.decoration', 'number only, no parentheses or dashes', 'EXPLICIT', [ev('G', 'p.6 §2.7', 'parantez ve çizgi kullanmadan')])
R('pagination.font', {'fontFamily': 'Times New Roman', 'fontSizePt': 10}, 'EXPLICIT', [ev('G', 'p.7 §2.7', '(Times New Roman olarak 10 Punto)'), ev('T', 'footer style Altbilgi basedOn Normal (no w:sz → 10 pt); Normal rFonts Times New Roman')])
R('pagination.distanceFromEdgeMm', 12.5, 'TEMPLATE', [ev('T', 'sectPr w:footer="709"/"708"')], 'mm', notes='Footer bottom 12.5 mm above the page edge. Single-line 10 pt footer ⇒ page-number baseline ≈ 297.0 − 12.5 − 0.76 (TNR descent) = 283.7 mm from top (INFERRED). The guide PDF itself prints numbers at baseline 279.65 mm (pp.33-43, footer with an extra empty paragraph, cf. template footer5.xml) and 276.18 mm (pp.2-32); see conflicts.')
R('pagination.baselineMm', 283.7, 'INFERRED', [ev('T', 'footer4.xml single paragraph + w:footer=708'), ev('G', 'p.36-43 page number baseline 279.65 mm = 297.01−12.5−4.06(empty 10 pt line)−0.76 → same 12.5 mm model with a 2-paragraph footer')], 'mm', notes='Model validated on the guide: a 2-paragraph 10 pt footer at 12.5 mm predicts 279.71 mm, measured 279.65 mm.')
R('pagination.coverPages', 'Dış Kapak, İç Kapak, Onay Sayfası, Bilimsel Etik Bildirim Sayfası: not numbered and not counted (roman restarts at i on ÖZET)', 'EXPLICIT', [ev('G', 'p.6-7 §2.7', 'Dış Kapak, İç kapak, Onay sayfası ve Bilimsel Etik Bildirim sayfası numaralandırılmaz.'), ev('T', 'sectPr#1 footer1 empty, sectPr#2 footer2 empty, sectPr#3 w:pgNumType fmt=lowerRoman start=1'), ev('G', 'p.39 Örnek 8', 'ÖZET ... i')])
R('pagination.front.format', 'roman-lower', 'EXPLICIT', [ev('G', 'p.7 §2.7', '“i, ii, iii, iv, v, vi, ...” şeklinde küçük Romen rakamları ile'), ev('T', 'sectPr#3 w:pgNumType w:fmt="lowerRoman" w:start="1"')])
R('pagination.front.startsAt(section)', {'section': 'abstract-tr', 'value': 1}, 'EXPLICIT', [ev('G', 'p.7 §2.7', 'Özet, Abstract, Teşekkür, İçindekiler Dizini ... küçük Romen'), ev('T', 'sectPr#3 start=1 (section begins with ÖZET)')])
R('pagination.main.format', 'arabic', 'EXPLICIT', [ev('G', 'p.7 §2.7', 'Giriş bölümüyle başlayan tez metni sayfaları ise “1, 2, 3, ...”'), ev('T', 'sectPr#4 w:pgNumType w:start="1" (decimal)')])
R('pagination.main.startsAt(section)', {'section': 'introduction', 'value': 1}, 'EXPLICIT', [ev('G', 'p.7 §2.7'), ev('T', 'sectPr#4 start=1; first paragraph "1. GİRİŞ"')])
R('pagination.appendix', 'arabic, continuing after KAYNAKLAR (and ÖZGEÇMİŞ)', 'EXPLICIT', [ev('G', 'p.26 §4.3.8', 'Ekler bölümünün sayfa numaraları, kaynaklar bölümünün bitişini izleyen sayfa numarası ile devam etmelidir.')])
R('pagination.firstPageOfChapterVisible', True, 'TEMPLATE', [ev('T', 'sectPr#4 has no w:titlePg → default footer (with PAGE) on every page incl. chapter starts'), ev('G', 'p.4 "1. GİRİŞ" page shows number 1')])
R('pagination.landscapePages', 'page number stays at bottom centre as on portrait pages', 'EXPLICIT', [ev('G', 'p.12 §3.1', 'sayfa numarası önceki sayfalarda bulunduğu yerde (alt ortada) olmalıdır')])

# ---------------- typography ----------------
R('typography.body.fontFamily', 'Times New Roman', 'EXPLICIT', [ev('G', 'p.5 §2.2', 'Tezdeki tüm metinler için yazı karakteri “Times New Roman”'), ev('T', 'styles.xml Normal w:rFonts ascii/hAnsi="Times New Roman"')])
R('typography.body.fontSizePt', 12, 'EXPLICIT', [ev('G', 'p.5 §2.2', 'karakter büyüklüğü “İç Kapak” hariç tezin tamamında 12 punto olmalıdır'), ev('T', 'body runs w:sz=24 (Normal style itself has no w:sz = 10 pt; size is direct formatting)')], 'pt')
R('typography.body.minFontSizePt.tablesFormulas', 8, 'EXPLICIT', [ev('G', 'p.5 §2.2', 'geniş veya uzun çizelgelerde ve formüllerde en küçük 8 punto kullanılabilir')], 'pt')
R('typography.body.lineSpacing', '1.5', 'EXPLICIT', [ev('G', 'p.5-6 §2.4', 'tezin tamamının yazımında 1,5 satır aralığı kullanılmalıdır'), ev('T', 'body paragraphs w:spacing w:line="360" w:lineRule="auto"'), ev('G', 'pp.4-7 measured baseline pitch 20.64-20.78 pt (Word 1.5 × 13.8 = 20.7 pt)')], notes='Word "1,5 satır": pitch 20.7 pt for TNR 12 (singleLineEm 1.15).')
R('typography.body.linePitchPt', 20.7, 'MEASURED', [ev('G', 'p.5 lines 2.2 block: 20.66/20.75/20.64 pt')], 'pt')
R('typography.body.align', 'justify', 'EXPLICIT', [ev('G', 'p.5 §2.3', 'tüm metin satırları “iki yana yaslı” olacak şekilde'), ev('T', 'body paragraphs w:jc="both"')])
R('typography.paragraph.firstLineIndentMm', 0, 'EXPLICIT', [ev('G', 'p.5 §2.4', 'paragraf başları sayfanın sol çerçeve kenarından ve boşluk bırakılmadan başlamalıdır'), ev('T', 'body paragraphs have no w:ind'), ev('G', 'pp.4-7 every paragraph first line x0=30.02 mm')], 'mm')
R('typography.paragraph.spaceBeforePt', 0, 'TEMPLATE', [ev('T', 'body paragraphs: no w:before; blank line is an empty paragraph')], 'pt')
R('typography.paragraph.blankLineBetween', True, 'EXPLICIT', [ev('G', 'p.6 §2.4', 'Alt bölüm başlıkları ile paragraflardan önce ve sonra 1 satır boşluk (1,5 aralıklı) bırakılmalıdır.'), ev('T', 'red "(Bir boşluk)" empty paragraphs (12 pt, line=360) between paragraphs, e.g. #357,#362,#366')])
R('typography.paragraph.spaceAfterPt', BL, 'INFERRED', [ev('G', 'p.6 §2.4', '1 satır boşluk (1,5 aralıklı)'), ev('G', 'pp.4-7 paragraph-to-paragraph baseline gap 41.39-41.41 pt = 2 × 20.7')], 'pt', notes='One empty 1.5-spaced 12 pt line (20.7 pt) expressed as space after; not added again before headings (headings spaceBefore 0).')
R('typography.widowOrphan', 'no single line at top or bottom of a page', 'EXPLICIT', [ev('G', 'p.6 §2.4', 'sayfanın başında veya sonunda tek başına bir satır bırakılmamalıdır.')], notes='Template Normal style sets w:widowControl w:val="0" (disabled) - contradicts the guide; guide wins.')
R('typography.quotations', 'verbatim quotations in double quotes “…” with citation; no separate block style', 'EXPLICIT', [ev('G', 'p.6 §2.5', 'alıntı açıkça görülebilecek şekilde tırnak içinde “……” yazılmalı')])
R('typography.hyphenation', 'UNKNOWN', 'UNKNOWN', [ev('T', 'settings.xml has no w:autoHyphenation'), ev('G', 'silent')])
R('typography.lineSpacing.model', {'mode': 'word', 'singleLineEm': 1.15}, 'MEASURED', [ev('G', 'p.32 single-spaced 12 pt pitch 13.80 pt; p.5 1.5-spaced pitch 20.7 pt; p.33 14 pt 1.5-spaced pitch 24.12-24.15 pt')])

# ---------------- headings ----------------
hev = [ev('G', 'p.7 §2.8', 'Tüm bölüm başlıkları, yazımda kullanılan punto (12 punto) ile ve koyu olarak')]
R('headings.levels', 4, 'EXPLICIT', [ev('G', 'p.7 §2.8', 'Dördüncü dereceden daha ileri derecede alt bölüm başlığı kullanılmamalıdır.')])
for lvl in (1, 2, 3, 4):
    R(f'headings.h{lvl}.fontFamily', 'Times New Roman', 'EXPLICIT', [ev('G', 'p.5 §2.2')])
    R(f'headings.h{lvl}.fontSizePt', 12, 'EXPLICIT', hev, 'pt')
    R(f'headings.h{lvl}.bold', True, 'EXPLICIT', hev)
    R(f'headings.h{lvl}.italic', False, 'TEMPLATE', [ev('T', 'Balk2/Balk3/Balk4/Balk5 styles, no w:i')])
    R(f'headings.h{lvl}.align', 'left', 'EXPLICIT', [ev('G', 'p.7 §2.8', 'Tüm bölüm başlıkları sayfanın sol çerçeve kenarından ve boşluk bırakılmadan numaralandırılmalıdır.'), ev('G', 'p.20 §4.3.1', 'başlık sola yaslı olmalıdır'), ev('T', {1: 'style Balk2 (used for chapters) w:jc=left', 2: 'style Balk3 basedOn Balk2 (left)', 3: 'style Balk4 basedOn Normal (left)', 4: 'style Balk5 basedOn Normal (left)'}[lvl])])
    R(f'headings.h{lvl}.indentMm', 0, 'EXPLICIT', [ev('G', 'p.5 §2.4', 'Bölüm ve alt bölüm başlıkları ... sol çerçeve kenarından ve boşluk bırakılmadan başlamalıdır')], 'mm')
    R(f'headings.h{lvl}.lineSpacing', '1.5', 'TEMPLATE', [ev('T', f'heading paragraphs level {lvl}: w:spacing w:line="360" w:lineRule="auto" (direct)')])
    R(f'headings.h{lvl}.spaceBeforePt', 0, 'TEMPLATE', [ev('T', 'heading paragraphs: w:before="0" direct (Balk4/Balk5 style before=200 overridden); the blank line before a heading is the preceding paragraph\'s blank line')], 'pt', notes='Effective gap before a heading = one blank 1.5 line (provided by previous paragraph spaceAfter 20.7 pt). Guide p.5: paragraph→heading baseline pitch 41.64 pt.')
    R(f'headings.h{lvl}.spaceAfterPt', BL, 'EXPLICIT', [ev('G', 'p.6 §2.6', 'Tezin ana başlıkları, alt bölüm başlıkları ve bunları izleyen ilk paragraf arasında 1 satır boşluk (1,5 aralıklı)'), ev('T', 'red "(Bir boşluk)" paragraph after headings (#357, #362, #364)'), ev('G', 'p.5 heading→paragraph baseline pitch 41.16-41.22 pt')], 'pt')
    R(f'headings.h{lvl}.keepWithNext', True, 'TEMPLATE', [ev('T', 'Balk4/Balk5 styles w:keepNext; general rule no lone line (p.6)')])
R('headings.h1.numbering', {'format': '{1}.', 'suffix': ' ', 'example': '1. GİRİŞ'}, 'EXPLICIT', [ev('G', 'p.16 §4', '1. GİRİŞ 2. LİTERATÜR BİLGİLERİ ... 6. KAYNAKLAR'), ev('T', '#356 "1. GİRİŞ" (typed number, style Balk2)'), ev('G', 'p.39 Örnek 8', '1. GİRİŞ / 2. LİTERATÜR BİLGİLERİ')])
R('headings.h2.numbering', {'format': '{1}.{2}', 'suffix': ' ', 'example': '2.1 İkinci Dereceden Başlık'}, 'EXPLICIT', [ev('G', 'p.39 Örnek 8', '2.1 Kanser'), ev('T', '#363 "2.1 İkinci Dereceden Başlık" (Balk3)')], notes='No trailing period after level 2-4 numbers.')
R('headings.h3.numbering', {'format': '{1}.{2}.{3}', 'suffix': ' ', 'example': '2.2.1 Üçüncü Dereceden Başlık'}, 'EXPLICIT', [ev('G', 'p.39', '2.1.1 Endoplazmik Retikulum Stresi'), ev('T', '#373 (Balk3 style!) / #415 (Balk4)')])
R('headings.h4.numbering', {'format': '{1}.{2}.{3}.{4}', 'suffix': ' ', 'example': '2.3.1.1 Dördüncü Dereceden Başlık'}, 'EXPLICIT', [ev('G', 'p.39', '2.1.2.1 PERK Yolağı'), ev('T', '#424 (Balk5)')])
R('headings.h1.caps', 'ALL CAPS, but conjunctions ve/veya/ile in lower case (e.g. "MATERYAL ve METOT")', 'EXPLICIT', [ev('G', 'p.7 §2.8', 'birinci derece bölüm başlıkları BÜYÜK HARF ile ... eğer “ve/veya/ile” gibi bağlaçlar varsa, bunlar küçük harflerle yazılmalıdır'), ev('T', '#432 "3. MATERYAL ve METOT", #622 "5. TARTIŞMA ve SONUÇ"')], notes='A blanket CSS/Word uppercase transform would violate this; text must be typed as required (textTransform none).')
R('headings.h2.caps', 'Title Case (İlk Harfleri Büyük), conjunctions lower case', 'EXPLICIT', [ev('G', 'p.7 §2.8', 'ikinci derecede alt bölüm başlıkları ise kelime(ler)nin İlk Harfleri Büyük, diğerleri küçük')])
R('headings.h3.caps', 'Title Case (as in template/guide examples)', 'INFERRED', [ev('T', '#373 "2.2.1 Üçüncü Dereceden Başlık"'), ev('G', 'p.39 "2.1.1 Endoplazmik Retikulum Stresi"')], notes='Guide states case only for levels 1-2.')
R('headings.h4.caps', 'Title Case (as in template/guide examples)', 'INFERRED', [ev('T', '#424 "2.3.1.1 Dördüncü Dereceden Başlık"')])
R('headings.h1.pageBreakBefore', True, 'EXPLICIT', [ev('G', 'p.6 §2.6', 'tezin tüm ana başlık içeren bölümleri daima yeni bir sayfadan başlamalıdır'), ev('G', 'p.7 §2.8', 'Her ana bölüm ... sayfa başından başlamalıdır')])
R('headings.h1.firstBaselineMm', 33.92, 'MEASURED', [ev('G', 'p.4 "1. GİRİŞ" baseline 33.92 mm, x0 30.02')], 'mm')
R('headings.frontMatterTitles', {'align': 'center', 'bold': True, 'fontSizePt': 12, 'caps': True, 'lineSpacing': '1.5', 'numbered': False}, 'TEMPLATE', [ev('T', 'style Balk1 (basedOn AralkYok: jc=center, b, sz=24) used for ÖZET, ABSTRACT, TEŞEKKÜR, İÇİNDEKİLER DİZİNİ, SİMGELER ve KISALTMALAR DİZİNİ, ŞEKİLLER/ÇİZELGELER/RESİMLER DİZİNİ; ÖZGEÇMİŞ (#671) and EKLER (#703) are Normal centered bold 12'), ev('G', 'p.19 §4.2.7', 'İçindekiler başlığı, sayfa ortalanarak, büyük harflerle ve koyu yazılmalıdır')])

# ---------------- captions ----------------
cap_ev = [ev('G', 'p.13 §3.3', 'Şekil, çizelge ve resimlerin başlık ve açıklamalarının yazımında 1 aralık ve 11 punto kullanılmalı ve bunlar iki yana yaslı olacak şekilde, ilk satırdan sonraki satırlar ilk satıra göre hizalı (asılı) olarak yazılmalıdır.')]
for kind, label, pos, tev in (('figure', 'Şekil', 'below', '#413 Normal jc=both ind hanging=851 after=120, runs sz=22, "Şekil 2.1" bold'), ('table', 'Çizelge', 'above', '#381/#478/#516 style Balk6 (keepNext) before=0 after=120 hanging≈label width, runs sz=22, "Çizelge 2.1" bold'), ('photo', 'Resim', 'below', '#610 before=120 after=120 hanging=992; #619 hanging=993, "Resim 4.1" bold')):
    R(f'captions.{kind}.label', label, 'EXPLICIT', [ev('G', 'p.13 §3.2', f'{label} 1.1 ……'), ev('T', tev)])
    R(f'captions.{kind}.position', pos, 'EXPLICIT', [ev('G', 'p.12 §3', 'Şekil ve resimlerde başlık şekil ve resimlerin altlarına, çizelgelerde ise başlık çizelgenin üstüne yazılmalıdır.')])
    R(f'captions.{kind}.numbering', {'scope': 'chapter', 'format': '{chapter}.{n}', 'sequence': 'arabic'}, 'EXPLICIT', [ev('G', 'p.13 §3.2', 'Numaralar ilk bölümden başlayarak birbirini takip eder şekilde, bölüm numarasıyla birlikte verilmelidir. Örnek: Şekil 1.1 ………, Şekil 1.2')])
    R(f'captions.{kind}.separator', ' ', 'MEASURED', [ev('G', 'p.14 "Şekil 3.1 Şekil başlıklarının ..." / "Çizelge 3.1 Farklı ..."'), ev('T', tev)], notes='No period or colon after the number; a single space.')
    R(f'captions.{kind}.fontSizePt', 11, 'EXPLICIT', cap_ev + [ev('G', 'p.14 measured 11.04 pt')], 'pt')
    R(f'captions.{kind}.labelBold', True, 'MEASURED', [ev('G', 'p.14/p.15 label span Times New Roman,Bold 11.04, text regular'), ev('T', tev)], notes='Label and number bold, caption text regular.')
    R(f'captions.{kind}.lineSpacing', 'single', 'EXPLICIT', cap_ev + [ev('G', 'p.14 caption line pitch 12.61 pt (11 × 1.15)')])
    R(f'captions.{kind}.align', 'justify', 'EXPLICIT', cap_ev)
    R(f'captions.{kind}.hangingIndent', 'continuation lines aligned with the first character of the caption text (hanging = width of "<label> <number> ")', 'EXPLICIT', cap_ev + [ev('G', 'p.14 continuation x0 46.53 (Şekil 3.1, +16.51 mm), 49.54 (Çizelge 3.1, +19.52 mm); p.15 47.51 (Resim 3.1)'), ev('T', 'callout #381: "... açıklamaları II. satıra taşıyorsa, II. satır üst satıra hizalanmalı."')])
    R(f'captions.{kind}.continued', '"<label> <n.n> (Devam) <same title>" on following page(s)', 'EXPLICIT', [ev('G', 'p.12 §3.1', 'Çizelge 3.1 (Devam) Türkiye’de yıllara göre hazır beton kullanımı.'), ev('T', '#585 "Çizelge 4.1 (Devam) ..."')])
R('captions.table.spaceBeforePt', 0, 'TEMPLATE', [ev('T', 'Balk6 caption paragraphs w:before="0"')], 'pt', notes='Preceded by a blank 1.5 line from the previous paragraph (general rule).')
R('captions.table.spaceAfterPt', 6, 'TEMPLATE', [ev('T', 'Balk6 caption paragraphs w:after="120"'), ev('G', 'p.14 last caption baseline 165.17 → table top rule 168.26 mm = 1.0 mm line rest + 2.1 mm (6 pt) ✓')], 'pt')
R('captions.figure.spaceBeforePt', 0, 'TEMPLATE', [ev('T', '#413/#422 no w:before')], 'pt')
R('captions.figure.spaceAfterPt', 6, 'TEMPLATE', [ev('T', '#413/#422 w:after="120"')], 'pt')
R('captions.figure.gapImageBottomToCaptionBaselineMm', 5.96, 'MEASURED', [ev('G', 'p.14 image bottom 129.10 mm → caption baseline 135.06 mm; p.15 identical (129.10 → 135.06)')], 'mm')
R('captions.photo.spaceBeforePt', 6, 'TEMPLATE', [ev('T', '#610 w:before="120" w:after="120"')], 'pt', notes='#619 has no spacing - template inconsistent; figure-like spacing (0/6) is an acceptable alternative (needs confirmation).')
R('captions.source', 'source cited at end of caption: "(Yazar Yıl)"', 'EXPLICIT', [ev('G', 'p.8 §2.9 table', 'Şekil 2.1 Zemin taşıma gücü … (TSE 1997).')])
R('figures.align', 'center', 'EXPLICIT', [ev('G', 'p.5 §2.3', 'Şekil, çizelge ve resimler ise “ortalı” olarak sayfaya yerleştirilmelidir.'), ev('T', '#412/#421/#609 jc=center')])
R('figures.maxWidth', 'within text area (150 mm); as wide as possible', 'EXPLICIT', [ev('G', 'p.13 §3.3', 'genişlikleri mümkün olduğunca sayfa genişliğini kaplayacak şekilde'), ev('G', 'p.12 §3.1', 'sayfa kenarlarında bırakılması gerekli boşluklar kesinlikle aşılmamalıdır')])
R('figures.paragraphLineSpacing', 'single', 'MEASURED', [ev('G', 'p.14/15 image box directly followed by caption (5.96 mm)'), ev('T', '#609/#617 image paragraphs without w:line (single); #412/#421 carry line=360')], notes='Template inconsistent; guide geometry shows single.')
R('figures.oversize', 'larger than A4 → folded to A4 in EKLER', 'EXPLICIT', [ev('G', 'p.12 §3.1', 'A4 ebadından büyük ise, A4 ebadında katlanmış olarak EKLER bölümünde verilmeli')])
R('tables.align', 'center', 'EXPLICIT', [ev('G', 'p.5 §2.3'), ev('T', 'tblPr w:jc="center" on all content tables')])
R('tables.fontSizePt', 12, 'EXPLICIT', [ev('G', 'p.5 §2.2', '12 punto ... Ancak geniş veya uzun çizelgelerde ... en küçük 8 punto'), ev('T', 'cell runs w:sz=24')], 'pt', notes='Guide example table (p.14) uses 10/9 pt (a wide table - allowed ≥ 8 pt).')
R('tables.lineSpacing', 'single', 'TEMPLATE', [ev('T', 'cell paragraphs Normal, no w:spacing')])
R('tables.borders', 'horizontal rules only: top of table, below header row, bottom of table; single 0.5 pt; no vertical rules', 'TEMPLATE', [ev('T', 'tables #382/#479/#517/#586 tcBorders top/bottom single sz=4, left/right nil'), ev('G', 'p.14 three rules at y 168.26 / 180.41 / 228.59 mm, 0.17 mm thick, no verticals')])
R('tables.headerBold', True, 'TEMPLATE', [ev('T', 'row 0 runs w:b')])
R('tables.notes', {'position': 'below table', 'fontSizePt': 10, 'lineSpacing': 'single', 'spaceBeforePt': 6, 'spaceAfterPt': 6, 'align': 'justify', 'hanging': 'block (continuation aligned with first line start)'}, 'EXPLICIT', [ev('G', 'p.13 §3.3', 'Çizelgeler ile ilgili açıklama ... çizelgelerin altında, 10 punto büyüklüğünde ve 1 satır aralıklı olmalıdır ... birinci satır başı aynı hizada başlamalı, blok yazım'), ev('T', '#406/#496/#584 w:before=120 w:after=120 jc=both, runs without w:sz (Normal = 10 pt)')], notes='Spacing 6/6 pt is TEMPLATE.')
R('equations.font', {'fontFamily': 'Cambria Math', 'fontSizePt': 12}, 'EXPLICIT', [ev('G', 'p.9 §2.10', 'denklem editörü kullanılarak Cambria Math fontu (12 punto)')])
R('equations.align', 'center (equation), number flush right at text edge', 'EXPLICIT', [ev('G', 'p.9 §2.10', 'metin bloğuna ortalı olarak hizalanmalı ... denklemin bulunduğu satırın en sağına yazılır'), ev('T', '#508 right tab pos=8502 (149.98 mm); callout #503 "sayfaya ortalı ve numaraları sağa yaslı"')])
R('equations.numbering', '({chapter}.{n}), sub-equations (1.1a), (1.1b); in-sentence equations unnumbered', 'EXPLICIT', [ev('G', 'p.9 §2.10', 'birinci bölümde (1.1), (1.2), ikinci bölümde (2.1) ... (1.1a) ve (1.1b)'), ev('G', 'p.10', 'Cümle içinde yazılan denklemlere numara verilmez')])
R('equations.spacing', 'one blank 1.5 line before and after', 'EXPLICIT', [ev('G', 'p.9 §2.10', 'denklemlerden önce-sonra 1 satır boşluk (1,5 satır aralıklı) bırakılmalıdır')])
R('equations.reference', 'in-text reference "denklem (2.1)" lower-case d/f', 'EXPLICIT', [ev('G', 'p.9', 'Metin içerisinde denklem ya da formüle atıf yapılırken “d” ya da “f” harfi büyük yazılmaz.')])

# ---------------- footnotes / citations / bibliography ----------------
R('footnotes.fontSizePt', 'UNKNOWN', 'UNKNOWN', [ev('G', 'silent (only p.25 "dipnot olarak verilemeyecek kadar uzun açıklamalar")'), ev('T', 'styles.xml DipnotMetni basedOn Normal (10 pt) - Word built-in style, no footnotes used (footnotes.xml separators only)')], notes='Author-year citation system; footnotes not regulated. If used, 10 pt is only a template style default.')
R('citations.style', 'author-year (Soyadı Yıl), AKÜ FBE rules: "ve" for two authors, "vd." for more, chronological order separated by commas, a/b for same year; internet sources as (İnt. Kyn. n)', 'EXPLICIT', [ev('G', 'p.7-8 §2.9', 'Tez içinde kaynak gösterme “Yazar(lar)ın Soyad(lar)ı ve Yıl” sistemine göre yapılmalıdır.')])
R('bibliography.title', 'KAYNAKLAR (numbered as the last chapter, e.g. "6. KAYNAKLAR")', 'EXPLICIT', [ev('G', 'p.16 §4', '6. KAYNAKLAR'), ev('T', '#627 "6. KAYNAKLAR" style Balk2 (chapter heading)'), ev('G', 'p.39', '6. KAYNAKLAR ..... 43')])
R('bibliography.fontSizePt', 12, 'TEMPLATE', [ev('T', '#629.. runs w:sz=24')], 'pt')
R('bibliography.lineSpacing', '1.5', 'EXPLICIT', [ev('G', 'p.22 §4.3.6', 'Satır aralıkları 1.5 satır olarak uygulanmalıdır.'), ev('T', '#629.. w:line="360"')])
R('bibliography.hangingIndentMm', 12.5, 'EXPLICIT', [ev('G', 'p.22 §4.3.6', '(varsa) 2. ve daha sonraki satırlar Asılı 1.25 cm girintili'), ev('T', '#629.. w:ind w:left="709" w:hanging="709" (12.51 mm)'), ev('G', 'p.23 continuation x0 42.51 mm (=30.02+12.49)')], 'mm')
R('bibliography.align', 'justify', 'EXPLICIT', [ev('G', 'p.22', '1. Satırdan itibaren hizalama “iki yana yaslı”'), ev('T', 'w:jc="both"')])
R('bibliography.spaceBeforePt', 6, 'EXPLICIT', [ev('G', 'p.22', 'satır öncesinde 6 nk'), ev('T', 'w:before="120"'), ev('G', 'p.23 entry-to-entry pitch 26.62-26.76 pt = 20.7 + 6')], 'pt')
R('bibliography.spaceAfterPt', 0, 'EXPLICIT', [ev('G', 'p.22', 'satır sonrasında 0 nk'), ev('T', 'no w:after')], 'pt')
R('bibliography.blankLineBetween', False, 'EXPLICIT', [ev('G', 'p.21', 'Kaynaklar boşluk bırakılmadan ard arda yazılmalıdır.')])
R('bibliography.order', 'alphabetical by first author surname; same author chronological; same year a, b…; up to 6 authors then "vd."; internet sources last under unnumbered bold subheading "İnternet Kaynakları", numbered "1-", with access date GG.AA.YYYY', 'EXPLICIT', [ev('G', 'p.21 §4.3.6'), ev('G', 'p.7-8 §2.9'), ev('G', 'p.28 m) İnternet Kaynakları'), ev('T', '#660 "İnternet Kaynakları" bold, before=120, line=360; #662-663 numbering "%1-"')])

# ---------------- TOC / lists ----------------
R('toc.title', 'İÇİNDEKİLER DİZİNİ', 'EXPLICIT', [ev('G', 'p.17 §4.1 item 8', 'İçindekiler Dizini'), ev('T', '#200 Balk1 "İÇİNDEKİLER DİZİNİ"'), ev('G', 'p.39 title')])
R('toc.pageNumberHeading', {'text': 'Sayfa', 'bold': True, 'align': 'right', 'position': 'line directly below the title'}, 'EXPLICIT', [ev('G', 'p.19 §4.2.7', '“Sayfa” yazısı başlığın hemen altında koyu ve sağa yaslı olarak yazılmalıdır'), ev('T', '#201 jc=right b "Sayfa"')])
R('toc.levels', [1, 2, 3, 4], 'EXPLICIT', [ev('G', 'p.19 §4.2.7', 'Tez metninde yer alan bütün bölüm ve alt bölüm başlıkları, özgeçmiş ve (varsa) ekler içindekiler dizininde eksiksiz'), ev('T', '#202 TOC \\o "1-5"')])
R('toc.entries', 'front sections (ÖZET, ABSTRACT, TEŞEKKÜR, İÇİNDEKİLER DİZİNİ itself, SİMGELER ve KISALTMALAR DİZİNİ, ŞEKİLLER/ÇİZELGELER/RESİMLER DİZİNİ) with roman numbers, chapters and subheadings, n. KAYNAKLAR, ÖZGEÇMİŞ, EKLER', 'EXPLICIT', [ev('G', 'p.39 Örnek 8'), ev('T', '#202-#242')])
R('toc.entryText', 'identical to the heading as written (no case change)', 'EXPLICIT', [ev('G', 'p.19', 'Tezde kullanılan her başlık, içindekiler dizininde hiçbir değişiklik olmaksızın aynen yer almalıdır.')])
R('toc.leader', 'dots', 'TEMPLATE', [ev('T', 'styles T1-T5 w:tab right leader=dot pos=8494'), ev('G', 'p.39 dotted leaders')])
R('toc.pageNumberRightEdgeMm', 179.84, 'TEMPLATE', [ev('T', 'T1-T5 right tab pos=8494 twips = 149.84 mm from left margin'), ev('G', 'p.39 page-number x1 179.73-179.90 mm')], 'mm')
R('toc.lineSpacing', '1.5', 'TEMPLATE', [ev('T', '#202-#242 w:line="360" w:after="0"'), ev('G', 'p.39 pitch 20.64 pt')])
R('toc.spaceAfterPt', 0, 'TEMPLATE', [ev('T', '#202-#242 w:after="0" (style T1 after=120 overridden)')], 'pt')
R('toc.indentPerLevelMm', 5.0, 'TEMPLATE', [ev('T', 'T3 ind left 284 (5.01 mm), T4 567 (10.0 mm), T5 851 (15.01 mm); chapter entries (T2) and front entries (T1) at 0'), ev('G', 'p.39 x0 29.97 / 34.96 / 39.95 / 44.95 mm')], 'mm', notes='Level 1 (chapters and front/back titles) 0 mm, level 2 5 mm, level 3 10 mm, level 4 15 mm.')
R('toc.bold', False, 'MEASURED', [ev('G', 'p.39 entries TimesNewRomanPSMT (regular)'), ev('T', 'T1-T5 no w:b')])
R('toc.wrappedLines', 'continuation aligned with the entry text after the number (hanging)', 'EXPLICIT', [ev('T', 'callout #245: "İçindekiler Dizininde; eğer açıklamalar II. satıra taşıyorsa, II. satır üst satıra hizalanmalı."'), ev('G', 'p.39 "4.1 MTT..." continuation x0 41.98 (entry text start)')])
R('lists.figures.title', 'ŞEKİLLER DİZİNİ', 'EXPLICIT', [ev('G', 'p.19 §4.2.9'), ev('T', '#305')])
R('lists.tables.title', 'ÇİZELGELER DİZİNİ', 'EXPLICIT', [ev('G', 'p.19 §4.2.10'), ev('T', '#318')])
R('lists.photos.title', 'RESİMLER DİZİNİ', 'EXPLICIT', [ev('G', 'p.19-20 §4.2.11'), ev('T', '#349')])
R('lists.pageNumberHeading', {'text': 'Sayfa', 'bold': True, 'align': 'right'}, 'EXPLICIT', [ev('G', 'p.19 §4.2.9-4.2.11', '“Sayfa” yazısı başlığın hemen altında koyu ve sağa yaslı')])
R('lists.titleOnFirstPageOnly', True, 'EXPLICIT', [ev('G', 'p.19', 'eğer dizin bir sayfadan uzun ise ikinci ve diğer sayfalara başlık yazılmamalıdır')])
R('lists.entryFormat', '"<label> <n.n> <caption text>" + dot leader + page; label and number bold', 'MEASURED', [ev('G', 'p.41/42 first span bold (Şekil 2.1), text regular'), ev('T', '#307.. runs rStyle=Kpr b for label')])
R('lists.leader', 'dots', 'TEMPLATE', [ev('T', 'ekillerTablosu w:tab right leader=dot pos=8494')])
R('lists.lineSpacing', 'single', 'TEMPLATE', [ev('T', 'image2.jpg (instruction screenshot after #316 "Şekiller, Çizelgeler ve Resimler Dizininde aşağıdaki ayarlar uygulanmalı"): Hizalama Soldan, Asılı 1,6 cm, Önce 0 nk, Sonra 6 nk, Satır aralığı Tek')], notes='CONFLICT: template sample entries (#307..) and guide p.41/42 are 1.5-spaced with 0 after; see conflicts (needsConfirmation).')
R('lists.spaceAfterPt', 6, 'TEMPLATE', [ev('T', 'image2.jpg "Sonra: 6 nk"')], 'pt', notes='CONFLICT with sample entries/guide (0 pt).')
R('lists.align', 'left', 'TEMPLATE', [ev('T', 'image2.jpg "Hizalama: Soldan"')])
R('lists.hangingIndentMm', 16.0, 'TEMPLATE', [ev('T', 'image2.jpg "Asılı 1,6 cm"; #307/#320/#351 hanging=907 (16.0 mm)')], 'mm', notes='Generalised rule (callout #311): continuation aligned with caption text; guide p.41/42 continuations at +17.02 mm (Şekil) and +21.0 mm (Çizelge) = label width.')
R('lists.symbols.title', 'SİMGELER ve KISALTMALAR DİZİNİ', 'EXPLICIT', [ev('G', 'p.10 §2.11', '“SİMGELER ve KISALTMALAR DİZİNİ” sayfasında'), ev('T', '#246')])
R('lists.symbols.structure', 'subheadings "Simgeler" then "Kısaltmalar" (bold, at margin); entries at margin, definitions aligned by a tab stop in a block; abbreviations alphabetical', 'EXPLICIT', [ev('G', 'p.10 §2.11', 'Simgeler sayfanın sol çerçeve kenarından ... Simgelerin tanım veya açıklamalarının başlangıcı alt alta gelecek şekilde sekme tuşu ile'), ev('T', 'table #248 grid 2196/6301 twips; callout #304 "Kısaltmalar bölümü alfabetik sırada olmalıdır."')])
R('lists.symbols.lineSpacing', 'single', 'EXPLICIT', [ev('G', 'p.10', 'Simgeler ve Kısaltmalar Dizini 1 satır aralıklı olarak hazırlanmalıdır.'), ev('G', 'p.40 pitch 13.80 pt')])
R('lists.symbols.definitionColumnMm', 40.69, 'MEASURED', [ev('G', 'p.40 definitions x0 70.71 mm = margin + 40.69 mm'), ev('T', 'column 1 width 2196 twips = 38.74 mm + cell margin 1.9 mm')], 'mm')

# ---------------- abstracts ----------------
R('abstract.keywords.count', {'min': 4, 'max': 6}, 'EXPLICIT', [ev('G', 'p.18 §4.2.5', 'anahtar kelime sayısı 4-6 arası olmalıdır'), ev('T', 'callout #139')])
R('abstract.keywords.label', {'tr': 'Anahtar Kelimeler:', 'en': 'Keywords:'}, 'EXPLICIT', [ev('G', 'p.36/37'), ev('T', '#138/#175 label bold')])
R('abstract.keywords.hanging', 'continuation lines aligned after the label (hanging 37.52 mm TR / 25.51 mm EN)', 'TEMPLATE', [ev('T', '#138 ind left=2127 hanging=2127; #175 left=1446 hanging=1446; callout #138 "II. satır üst satıra hizalanmış olmalı"')])
R('abstract.lineSpacing', '1.5', 'TEMPLATE', [ev('T', '#127-#138 line=360; image1.jpg (after #145): Önce 0 nk, Sonra 0 nk, 1,5 satır'), ev('G', 'p.36 pitches 20.64-20.78 pt')])
R('abstract.maxWords', 'UNKNOWN', 'UNKNOWN', [ev('G', 'silent'), ev('T', 'silent')])
R('abstract.pageCountLine', '"<YIL>, <last roman page> + <arabic pages incl. appendices> sayfa" / "... pages", bold', 'EXPLICIT', [ev('G', 'p.36 "2020, vi + 52 sayfa"; p.37 "2020, vi + 52 pages"'), ev('T', '#136 "2019, ix + 16(*) sayfa" + callout #130 "(*) Giriş bölümünden sonraki sayfaları (ekler dahil) kapsar"'), ev('G', 'p.18 §4.2.5', 'tez savunmasının yapıldığı yıl ve sayfa sayısı formata uygun biçimde')])
R('abstract.degreeLabel', {'master': {'tr': 'Yüksek Lisans Tezi', 'en': 'M.Sc. Thesis'}, 'phd': {'tr': 'Doktora Tezi', 'en': 'Ph.D. Thesis'}}, 'EXPLICIT', [ev('G', 'p.18 §4.2.5', 'Yüksek Lisans için, “M.Sc. Thesis”, Doktora için, “Ph.D. Thesis”'), ev('T', '#122, #159')])
R('abstract.englishTitles', {'Prof. Dr.': 'Prof.', 'Doç. Dr.': 'Assoc. Prof.', 'Dr. Öğr. Üyesi': 'Asst. Prof.'}, 'EXPLICIT', [ev('G', 'p.37 callout'), ev('T', 'callout #170')])

# ---------------- other ----------------
R('appendices.title', 'EKLER (centered, bold, 12 pt, 1.5)', 'TEMPLATE', [ev('T', '#703 Normal jc=center b sz=24 line=360'), ev('G', 'p.25 §4.3.8')])
R('appendices.itemLabel', '"EK 1. <Başlık>", "EK 2. ..." — "EK n." bold, title regular; each appendix on a new page; continuation "EK 2. (Devam) <Başlık>"', 'EXPLICIT', [ev('G', 'p.25-26 §4.3.8', '“EK 1., EK 2., EK 3.,...” şeklinde her biri ayrı bir sayfadan başlayacak şekilde'), ev('T', '#704 "EK 1." bold; #735, #767 "EK 2. (Devam)"; callout #769')])
R('appendices.inToc', 'EKLER listed as one level-1 entry; individual EK entries UNKNOWN', 'MEASURED', [ev('G', 'p.39 "EKLER ..... 63"'), ev('T', '#242 "EKLER"')])
R('cv.title', 'ÖZGEÇMİŞ (centered, bold, unnumbered, in TOC)', 'EXPLICIT', [ev('G', 'p.28 §4.3.7'), ev('T', '#671 jc=center b'), ev('G', 'p.39 "ÖZGEÇMİŞ ..... 62"')])
R('cv.required', 'required for both master and PhD', 'EXPLICIT', [ev('G', 'p.28 §4.3.7', 'Tezi hazırlayan Yüksek Lisans veya Doktora öğrencisi ÖZGEÇMİŞ başlığı altında kısa özgeçmişini ... vermelidir')])
R('cv.layout', 'labels at margin; colon at 50.0 mm from margin (default 1.25 cm tabs); education rows indented 12.5 mm; 1.5 spacing; publications written by bibliography rules', 'MEASURED', [ev('G', 'p.43 colons x0 80.07 mm (+50.05), education labels x0 42.51 (+12.49)'), ev('T', '#673.. tabs 1430 + default 708 → 2832 twips (49.96 mm); #679 ind left 709')])
R('binding', 'defense copy spiral-bound; final: ≥7 copies bound with the official FBE cover bought from the university book sales office; 2 CDs', 'EXPLICIT', [ev('G', 'p.17 §4.2.1', 'Afyon Kocatepe Üniversitesi kitap satış biriminden sağlanacak tez kapakları ile ciltlenmelidir'), ev('G', 'p.29-30 §4.4')])
R('output', 'print from Word, not from PDF', 'EXPLICIT', [ev('G', 'p.26', 'çıktı alınırken .PDF formatına dönüştürülmeden WORD formatında çıktı alınmalıdır !!!')], notes='Process instruction; affects fidelity expectations of DOCX export.')

# ---------------- sections ----------------
def L(kind, text, sizePt=12, bold=False, align='center', baselineMm=None, lineSpacing='1.5', confidence='MEASURED', evidence=None, **kw):
    d = {'kind': kind, 'text': text, 'font': 'Times New Roman', 'sizePt': sizePt, 'bold': bold, 'italic': False, 'align': align, 'lineSpacing': lineSpacing}
    if baselineMm is not None: d['baselineMm'] = baselineMm
    d.update(kw)
    d['confidence'] = confidence
    if evidence: d['evidence'] = evidence
    return d

front_num = {'counted': True, 'visible': True, 'format': 'roman-lower', 'startAt': None}
main_num = {'counted': True, 'visible': True, 'format': 'arabic', 'startAt': None}
none_num = {'counted': False, 'visible': False, 'format': 'none', 'startAt': None}

p32 = 'p.32 Örnek 1 (illustration; box drawn at x 57.71-154.37, y 209.47-274.11)'
outer_layout = [
    {'kind': 'box', 'text': 'text area of the printed cover', 'xLeftMm': 55.0, 'xRightMm': 155.0, 'yTopMm': 210.0, 'heightMm': 65.0, 'confidence': 'EXPLICIT', 'evidence': [ev('G', 'p.32 dimension arrows', '21 cm (top → box), 5.5 cm (left), 5.5 cm (right), 6.5 cm (box height)')], 'notes': 'Dimensions refer to the physical cover (21 × 29.7). The dotted box is illustrative; whether a border is printed is UNKNOWN (template cover has none).'},
    L('metadata', '{{THESIS_TITLE}} (line 1)', bold=True, lineSpacing='single', baselineMm=215.53, spaceBeforePt=0, xCenterMm=105.0, evidence=[ev('G', p32 + ' baseline 215.00 relative to box top 209.47 → +5.53 mm'), ev('T', '#36 NormalWeb b, before=0')], notes='caps as typed (example upper case)'),
    L('metadata', '{{THESIS_TITLE}} (continuation lines)', bold=True, lineSpacing='single', spaceBeforePt=0, evidence=[ev('G', p32 + ' pitch 13.80 pt'), ev('T', '#37')]),
    L('metadata', '{{DEGREE_UPPER}} (YÜKSEK LİSANS TEZİ | DOKTORA TEZİ)', lineSpacing='single', spaceBeforePt=6, evidence=[ev('G', p32 + ' pitch 19.56 pt'), ev('T', '#38 before=120')]),
    L('metadata', '{{STUDENT_NAME}} (Adı SOYADI)', lineSpacing='single', spaceBeforePt=6, evidence=[ev('G', p32 + ' pitch 19.81'), ev('T', '#39')]),
    L('text', 'Danışman', lineSpacing='single', spaceBeforePt=6, evidence=[ev('G', p32 + ' pitch 19.79'), ev('T', '#40')]),
    L('metadata', '{{ADVISOR_TITLE}} {{ADVISOR_NAME}}', lineSpacing='single', spaceBeforePt=0, evidence=[ev('G', p32 + ' pitch 13.80'), ev('T', '#41')]),
    L('text', 'İkinci Danışman (only if co-advisor)', lineSpacing='single', spaceBeforePt=6, visibleWhen={'anyFilled': ['CO_ADVISOR_NAME']}, evidence=[ev('G', p32 + ' red "Varsa, yazılacak"'), ev('T', '#42 red')]),
    L('metadata', '{{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}', lineSpacing='single', spaceBeforePt=0, visibleWhen={'anyFilled': ['CO_ADVISOR_NAME']}, evidence=[ev('T', '#43')]),
    L('metadata', '{{DEPARTMENT_NAME_UPPER}} ANABİLİM DALI', lineSpacing='single', spaceBeforePt=6, evidence=[ev('G', p32 + ' pitch 19.81'), ev('T', '#44')]),
    L('metadata', '{{DEFENSE_MONTH}} {{DEFENSE_YEAR}} (Ay Yıl of the defense)', lineSpacing='single', spaceBeforePt=6, evidence=[ev('G', p32 + ' pitch 20.15; callout "Savunmanın yapıldığı tarih dikkate alınmalı"'), ev('T', '#45')]),
]
inner_ev = 'p.33 Örnek 2'
inner_layout = [
    L('text', 'Bu tez çalışması {{PROJECT_NUMBER}} numaralı proje ile {{PROJECT_FUNDER}} tarafından desteklenmiştir.', 12, False, baselineMm=33.87, visibleWhen={'anyFilled': ['PROJECT_NUMBER']}, evidence=[ev('G', inner_ev + ' baseline 33.87'), ev('T', '#46 sz=24 line=360'), ev('G', 'p.17 §4.2.2', 'iç kapağın üst kısmında verilmelidir')], notes='Optional. Whether its line slot is kept when absent is UNKNOWN.'),
    L('spacer', '1 empty line 14 pt @1.5 (24.15 pt)', 14, evidence=[ev('T', '#47 pmark sz=28 line=360')]),
    L('text', 'AFYON KOCATEPE ÜNİVERSİTESİ', 14, True, baselineMm=50.38, xCenterMm=105.0, evidence=[ev('G', inner_ev + ' baseline 50.38'), ev('T', '#48')]),
    L('text', 'FEN BİLİMLERİ ENSTİTÜSÜ', 14, True, baselineMm=58.94, evidence=[ev('G', inner_ev + ' 58.94'), ev('T', '#49')]),
    L('spacer', '3 empty lines 14 pt @1.5', 14, evidence=[ev('T', '#50-#52')]),
    L('metadata', '{{DEGREE_UPPER}}', 14, True, baselineMm=93.02, evidence=[ev('G', inner_ev + ' 93.02'), ev('T', '#53')]),
    L('spacer', '3 empty lines 14 pt @1.5', 14, evidence=[ev('T', '#54-#56')]),
    L('metadata', '{{THESIS_TITLE}} (each line 14 pt bold @1.5)', 14, True, baselineMm=127.10, evidence=[ev('G', inner_ev + ' 127.10, second line 135.61 (pitch 24.12 pt)'), ev('T', '#57 line=360; #58 has no w:spacing (single) - see conflicts')]),
    L('spacer', '2 empty lines 14 pt @1.5', 14, evidence=[ev('T', '#59-#60')]),
    L('metadata', '{{STUDENT_NAME}}', 14, True, baselineMm=161.15, evidence=[ev('G', inner_ev + ' 161.15 (for a 2-line title)'), ev('T', '#61')]),
    L('spacer', '2 empty lines 14 pt @1.5', 14, evidence=[ev('T', '#62-#63')]),
    L('text', 'Danışman', 14, True, baselineMm=186.71, evidence=[ev('G', inner_ev + ' 186.71'), ev('T', '#64')]),
    L('metadata', '{{ADVISOR_TITLE}} {{ADVISOR_NAME}}', 14, True, baselineMm=195.22, evidence=[ev('G', inner_ev + ' 195.22'), ev('T', '#65')]),
    L('spacer', '1 empty line 14 pt @1.5', 14, evidence=[ev('T', '#66')]),
    L('text', 'İkinci Danışman', 14, True, baselineMm=212.28, visibleWhen={'anyFilled': ['CO_ADVISOR_NAME']}, evidence=[ev('G', inner_ev + ' 212.28 red "Varsa, yazılacak"'), ev('T', '#67')]),
    L('metadata', '{{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}', 14, True, baselineMm=220.80, visibleWhen={'anyFilled': ['CO_ADVISOR_NAME']}, evidence=[ev('T', '#68')]),
    L('spacer', '2 empty lines 14 pt @1.5', 14, evidence=[ev('T', '#69-#70')]),
    L('metadata', '{{DEPARTMENT_NAME_UPPER}} ANABİLİM DALI', 14, True, baselineMm=246.37, evidence=[ev('G', inner_ev + ' 246.37'), ev('T', '#71')]),
    L('spacer', '1 empty line 14 pt @1.5', 14, evidence=[ev('T', '#72')]),
    L('metadata', '{{DEFENSE_MONTH}} {{DEFENSE_YEAR}}', 14, True, baselineMm=263.39, evidence=[ev('G', inner_ev + ' 263.39'), ev('T', '#73')]),
]
appr = 'p.34 Örnek 3'
def juror_rows():
    rows = []
    y = 114.19
    for i, role in enumerate(['Başkan', 'Üye', 'Üye', 'Üye', 'Üye', 'Üye', 'Üye']):
        rows.append({'kind': 'signatureRow', 'text': f'{role} | : {{{{JURY_{i+1}_TITLE_NAME}}}}', 'font': 'Times New Roman', 'sizePt': 12, 'labelBold': True, 'valueBold': False,
                     'labelXLeftMm': 42.49, 'colonXLeftMm': 67.47, 'lineSpacing': 'single', 'baselineMm': round(y, 2) if i < 5 else None,
                     'visibleWhen': None if i < 3 else {'anyFilled': [f'JURY_{i+1}_TITLE_NAME']},
                     'confidence': 'INFERRED', 'evidence': [ev('T', '#84 "\\tBaşkan\\t: ..." / #86 ind firstLine=708 "Üye\\t\\t: ..." no w:spacing (single); default tabs 708 twips'), ev('G', appr + f' label x0 42.51, colon x0 67.54; guide baseline {[114.19,127.10,140.01,152.89,165.80,None,None][i]}')],
                     'notes': 'Rows 6-7 only for PhD juries of 7 (with second advisor). Baselines predicted from template XML (single 13.8 pt + affiliation line 20.7 pt + 6 pt after = 40.5 pt per juror); guide example pitch is 36.6 pt (see conflicts).'})
        rows.append({'kind': 'signatureRow', 'text': '{{JURY_n_AFFILIATION}} (Üniversite adı, Fakültesi) … …… İmza ……', 'font': 'Times New Roman', 'sizePt': 12, 'bold': False,
                     'xLeftMm': 69.6, 'signatureRightMm': 176.2, 'lineSpacing': '1.5', 'spaceAfterPt': 6, 'baselineMm': round(y + 13.8 * MM_PER_PT, 2) if i < 5 else None,
                     'confidence': 'INFERRED', 'evidence': [ev('T', '#85 "\\t\\t\\t  Üniversite adı, Fakültesi <spaces> …… İmza ……" line=360 after=120; İmza runs bold grey BFBFBF'), ev('G', appr + ' affiliation baselines 119.78/132.69/145.61/158.52/171.39')]})
        y += (13.8 + 20.7 + 6) * MM_PER_PT
    return rows
approval_layout = [
    L('text', 'TEZ ONAY SAYFASI', 12, True, baselineMm=33.96, evidence=[ev('G', appr + ' 33.96, centre 104.91'), ev('T', '#77 b sz=24 jc=center line=360 (inside table cell)')]),
    L('spacer', '1 empty line 12 pt @1.5', evidence=[ev('T', '#78')]),
    L('text', '{{STUDENT_NAME}} tarafından hazırlanan “{{THESIS_TITLE}}” adlı tez çalışması lisansüstü eğitim ve öğretim yönetmeliğinin ilgili maddeleri uyarınca {{DEFENSE_DATE}} tarihinde aşağıdaki jüri tarafından **{{DECISION}}** (oy birliği / oy çokluğu) ile Afyon Kocatepe Üniversitesi Fen Bilimleri Enstitüsü **{{DEPARTMENT_NAME}} Anabilim Dalı’nda {{DEGREE_UPPER}}** olarak kabul edilmiştir.', 12, False, 'justify', baselineMm=48.48, xLeftMm=30.0, xRightMm=176.2,
      evidence=[ev('G', appr + ' first line 48.48, pitch 20.7'), ev('T', '#79 jc=both line=360; bold runs "oy birliği", "oy çokluğu", "Anabilim Dalı Adı Anabilim Dalı’nda YÜKSEK LİSANS TEZİ / DOKTORA TEZİ"; cell width 8505 twips − 2×108 margins → text 30.0-176.2 mm')], notes='Mixed bold runs (** marks). Guide example text right edge 179.7 mm (wider table).'),
    L('spacer', '1 empty line 12 pt @1.5', evidence=[ev('T', '#80')]),
    {'kind': 'signatureRow', 'text': 'Danışman | : {{ADVISOR_TITLE}} {{ADVISOR_NAME}}', 'font': 'Times New Roman', 'sizePt': 12, 'labelBold': True, 'valueBold': False, 'labelXLeftMm': 30.0, 'colonXLeftMm': 67.47, 'lineSpacing': '1.5', 'baselineMm': 92.30, 'confidence': 'MEASURED', 'evidence': [ev('G', appr + ' 92.30, colon x0 67.54'), ev('T', '#81 "Danışman\\t\\t: ..." label bold, value regular')]},
    {'kind': 'signatureRow', 'text': 'İkinci Danışman | : {{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}', 'font': 'Times New Roman', 'sizePt': 12, 'labelBold': True, 'valueBold': False, 'labelXLeftMm': 30.0, 'colonXLeftMm': 67.47, 'lineSpacing': '1.5', 'baselineMm': 99.59, 'visibleWhen': {'anyFilled': ['CO_ADVISOR_NAME']}, 'confidence': 'MEASURED', 'evidence': [ev('G', appr + ' 99.59 (red, "Varsa, yazılacak")'), ev('T', '#82')], 'notes': 'Whether the row slot is kept when absent is UNKNOWN.'},
    L('spacer', '1 empty line 12 pt @1.5', evidence=[ev('T', '#83')]),
] + juror_rows() + [
    {'kind': 'rule', 'text': 'double box around the institute approval block: thick-thin small gap 3 pt border (top/left thickThin, bottom/right thinThick)', 'yTopMm': 189.01, 'xLeftMm': 27.3, 'xRightMm': 178.1, 'yBottomMm': 262.8, 'confidence': 'TEMPLATE',
     'evidence': [ev('T', 'table #76 row 0 w:trHeight=9014 (atLeast, 159.0 mm) → row 1 top at 30.0+159.0=189.0 mm; row 1 tcBorders thickThinSmallGap/thinThickSmallGap sz=24; tcW 8505 (150.0 mm), outdented by 108-twip cell margin (compat mode 14)'), ev('G', appr + ' box outer edges x 27.31-181.39, y 189.04-265.22 (double line: thin 0.26 mm + gap + thick 1.06 mm)')],
     'notes': 'Top edge agrees (189.0 vs 189.04; border drawn below the row boundary). Left outer edge 27.3 mm (cell edge 28.1 = margin − 108-twip cell margin; same construction as guide p.34). Right cell edge 178.1 mm (INFERRED ±1 mm). Width/bottom follow the template (guide box is 154.1 mm wide, bottom 265.22). yBottom INFERRED from content.'},
    L('text', 'Afyon Kocatepe Üniversitesi', baselineMm=199.39, confidence='INFERRED', evidence=[ev('T', '#94 empty single line (13.8 pt) then #95 line=360; border ≈1.6 mm'), ev('G', appr + ' 201.80 (guide box starts with a 1.5 empty line)')]),
    L('text', 'Fen Bilimleri Enstitüsü Yönetim Kurulu’nun', baselineMm=206.69, confidence='INFERRED', evidence=[ev('T', '#96'), ev('G', appr + ' 209.08')]),
    L('text', '…… / …… / ……… tarih ve', baselineMm=213.99, confidence='INFERRED', evidence=[ev('T', '#97'), ev('G', appr + ' 216.40')]),
    L('text', '……………. sayılı kararıyla onaylanmıştır.', baselineMm=221.29, confidence='INFERRED', evidence=[ev('T', '#98'), ev('G', appr + ' 223.68')]),
    L('spacer', '2 empty lines 12 pt @1.5', evidence=[ev('T', '#99-#100'), ev('G', appr + ' 62.05 pt = 3 × 20.7')]),
    L('text', '……………………………….', baselineMm=243.19, confidence='INFERRED', evidence=[ev('T', '#101'), ev('G', appr + ' 245.57')]),
    L('metadata', '{{INSTITUTE_DIRECTOR}} (template: "Prof. Dr. Bekir YALÇIN")', baselineMm=250.49, confidence='TEMPLATE', evidence=[ev('T', '#102 "Prof. Dr. Bekir YALÇIN"'), ev('G', appr + ' 260.18 "(Ünvanı Adı ve SOYADI)" placed BELOW "Enstitü Müdürü"')], notes='Order name → title follows the newer template; see conflicts.'),
    L('text', 'Enstitü Müdürü', baselineMm=257.79, confidence='INFERRED', evidence=[ev('T', '#103'), ev('G', appr + ' 252.89')]),
]
eth = 'p.35 Örnek 4'
ethics_layout = [
    L('text', 'BİLİMSEL ETİK BİLDİRİM SAYFASI', 12, True, baselineMm=33.96, evidence=[ev('G', eth + ' 33.96'), ev('T', '#105')]),
    L('text', 'Afyon Kocatepe Üniversitesi', 12, True, baselineMm=41.24, evidence=[ev('G', eth + ' 41.24'), ev('T', '#106')]),
    L('spacer', '1 empty line 12 pt @1.5', evidence=[ev('T', '#107')]),
    L('text', 'Fen Bilimleri Enstitüsü, tez yazım kurallarına uygun olarak hazırladığım bu tez çalışmasında;', 12, True, 'justify', baselineMm=55.84, firstLineIndentMm=12.49, evidence=[ev('G', eth + ' 55.84, first line x0 42.51'), ev('T', '#108 ind firstLine=708, b')]),
    L('text', '- Tez içindeki bütün bilgi ve belgeleri akademik kurallar çerçevesinde elde ettiğimi,\n- Görsel, işitsel ve yazılı tüm bilgi ve sonuçları bilimsel ahlak kurallarına uygun olarak sunduğumu,\n- Başkalarının eserlerinden yararlanılması durumunda ilgili eserlere bilimsel normlara uygun olarak atıfta bulunduğumu,\n- Atıfta bulunduğum eserlerin tümünü kaynak olarak gösterdiğimi,\n- Kullanılan verilerde herhangi bir tahrifat yapmadığımı,\n- Ve bu tezin herhangi bir bölümünü bu üniversite veya başka bir üniversitede başka bir tez çalışması olarak sunmadığımı', 12, False, 'justify', baselineMm=70.37,
      bulletXLeftMm=30.02, textXLeftMm=37.52, evidence=[ev('G', eth + ' dash x0 30.02, text x0 37.56, first 70.37, last 128.80'), ev('T', '#109-#114 ListeParagraf numId 26 ind left=425 hanging=425 (7.5 mm), bullet glyph Symbol F02D (dash)')]),
    L('text', 'beyan ederim.', 12, True, 'left', baselineMm=136.20, evidence=[ev('G', eth + ' 136.20'), ev('T', '#115 b')]),
    L('spacer', '1 empty line', evidence=[ev('T', '#116')]),
    L('metadata', '{{SIGN_DATE}} (GG / AA / YYYY)', 12, True, 'right', baselineMm=150.82, xRightMm=180.0, evidence=[ev('G', eth + ' 150.82, x1 181.14'), ev('T', '#117 jc=right b')]),
    L('spacer', '1 empty line', evidence=[ev('T', '#118')]),
    L('text', 'İmza (grey BFBFBF placeholder for the handwritten signature)', 12, True, 'left', baselineMm=165.38, xLeftMm=167.4, color='BFBFBF', confidence='TEMPLATE', evidence=[ev('T', '#119 ind left=7080 firstLine=708 → 137.4 mm from margin; color BFBFBF'), ev('G', eth + ' 165.38, x0 160.69')]),
    L('metadata', '{{STUDENT_NAME}} (Öğrencinin Adı ve SOYADI)', 12, True, 'right', baselineMm=172.70, xRightMm=180.0, evidence=[ev('G', eth + ' 172.70, x1 181.14'), ev('T', '#120 style Balk1 (!) jc=right')], notes='Template uses Heading 1 style here (would enter a Word TOC) - template defect; render as plain bold right-aligned line, not in TOC.'),
]
def abs_layout(lang):
    pe = 'p.36 Örnek 5' if lang == 'tr' else 'p.37 Örnek 6'
    t = (lambda tr, en: tr if lang == 'tr' else en)
    return [
        L('text', t('ÖZET', 'ABSTRACT'), 12, True, baselineMm=33.96, evidence=[ev('G', pe + ' 33.96'), ev('T', t('#121', '#158') + ' Balk1')]),
        L('metadata', t('{{DEGREE_TR}} (Yüksek Lisans Tezi | Doktora Tezi)', '{{DEGREE_EN}} (M.Sc. Thesis | Ph.D. Thesis)'), 12, False, baselineMm=41.16, evidence=[ev('G', pe + ' 41.16'), ev('T', t('#122', '#159'))]),
        L('spacer', '1 empty line 12 pt @1.5', evidence=[ev('T', t('#123', '#160'))]),
        L('metadata', t('{{THESIS_TITLE}} (upper case, regular, single-spaced between title lines)', '{{THESIS_TITLE_EN}} (upper case, regular, single-spaced)'), 12, False, baselineMm=55.72, lineSpacing='single (last title line 1.5)', evidence=[ev('G', pe + ' 55.72 / 60.63 (pitch 13.92 pt)'), ev('T', t('#124 no spacing, #125 line=360', '#161/#162 single'))]),
        L('spacer', '1 empty line 12 pt @1.5', evidence=[ev('T', t('#126', '#163'))]),
        L('metadata', t('{{STUDENT_NAME}}', '{{STUDENT_NAME}} (Name SURNAME)'), baselineMm=75.23, evidence=[ev('G', pe + ' 75.23')]),
        L('text', t('Afyon Kocatepe Üniversitesi', 'Afyon Kocatepe University'), baselineMm=82.56, evidence=[ev('G', pe + ' 82.56')]),
        L('text', t('Fen Bilimleri Enstitüsü', 'Graduate School of Natural and Applied Sciences'), baselineMm=89.85, evidence=[ev('G', pe + ' 89.85')]),
        L('metadata', t('{{DEPARTMENT_NAME}} Anabilim Dalı', 'Department of {{DEPARTMENT_NAME_EN}}'), baselineMm=97.17, evidence=[ev('G', pe + ' 97.17')]),
        L('metadata', t('**Danışman:** {{ADVISOR_TITLE}} {{ADVISOR_NAME}}', '**Supervisor:** {{ADVISOR_TITLE_EN}} {{ADVISOR_NAME}}'), baselineMm=104.45, evidence=[ev('G', pe + ' 104.45 label bold'), ev('T', t('#131', '#168') + ' label run bold, value regular')]),
        L('metadata', t('**İkinci Danışman:** {{CO_ADVISOR_TITLE}} {{CO_ADVISOR_NAME}}', '**Co-Supervisor:** {{CO_ADVISOR_TITLE_EN}} {{CO_ADVISOR_NAME}}'), baselineMm=111.78, visibleWhen={'anyFilled': ['CO_ADVISOR_NAME']}, evidence=[ev('G', pe + ' 111.78 red')]),
        L('spacer', '1 empty line 12 pt @1.5', evidence=[ev('T', t('#133', '#170'))]),
        L('text', t('<abstract text: justified, 1.5, no indent, blank line between paragraphs>', '<abstract text>'), 12, False, 'justify', baselineMm=126.38, xLeftMm=30.0, evidence=[ev('G', pe + ' 126.38 x0 30.02'), ev('T', t('#134', '#171'))]),
        L('spacer', '1 empty line 12 pt @1.5', evidence=[ev('T', t('#135', '#172'))]),
        L('metadata', t('{{DEFENSE_YEAR}}, {{FRONT_PAGES_ROMAN}} + {{MAIN_PAGES}} sayfa', '{{DEFENSE_YEAR}}, {{FRONT_PAGES_ROMAN}} + {{MAIN_PAGES}} pages'), 12, True, 'left', baselineMm=141.07, evidence=[ev('G', pe + ' 141.07 (1 blank after text)'), ev('T', t('#136', '#173') + ' bold')], notes='Offsets after the abstract text are relative to its last line (+41.4 pt per line+blank).'),
        L('spacer', '1 empty line 12 pt @1.5', evidence=[ev('T', t('#137', '#174'))]),
        L('metadata', t('**Anahtar Kelimeler:** {{KEYWORDS}}', '**Keywords:** {{KEYWORDS_EN}}'), 12, False, 'justify', baselineMm=155.60, hangingIndentMm=t(37.52, 25.51), evidence=[ev('G', pe + ' 155.60'), ev('T', t('#138 ind left=2127 hanging=2127', '#175 ind left=1446 hanging=1446'))]),
    ]
tes = 'p.38 Örnek 7'
ack_layout = [
    L('text', 'TEŞEKKÜR', 12, True, baselineMm=33.96, evidence=[ev('G', tes + ' 33.96'), ev('T', '#190 Balk1')]),
    L('spacer', '1 empty line', evidence=[ev('T', '#191')]),
    L('text', '<acknowledgement paragraphs: justified, 1.5, no indent, one blank line between>', 12, False, 'justify', baselineMm=48.48, evidence=[ev('G', tes + ' first line 48.48'), ev('T', '#192-#194')], notes='BAP-funded theses must state the project number here (p.18 §4.2.6).'),
    L('spacer', '2 empty lines 12 pt @1.5 (template); guide example shows 1', evidence=[ev('T', '#195, #196 "(Bir boşluk)" ×2'), ev('G', tes + ' last text 92.30 → name 106.91 = 41.41 pt (one blank)')], confidence='TEMPLATE'),
    L('metadata', '{{STUDENT_NAME}}', 12, False, 'right', xRightMm=180.0, evidence=[ev('G', tes + ' x1 181.14'), ev('T', '#197 jc=right')], notes='Baseline = last text baseline + 62.1 pt (template, 2 blanks) [guide: +41.4 pt].'),
    L('metadata', 'Afyonkarahisar {{YEAR}}', 12, False, 'right', xRightMm=180.0, evidence=[ev('G', tes + ' "Afyonkarahisar Yıl" +20.64 pt'), ev('T', '#198 "Afyonkarahisar 2020" (hard-coded 2020 = the flagged 2020 statement → placeholder)')]),
]
toc_layout = [
    L('text', 'İÇİNDEKİLER DİZİNİ', 12, True, baselineMm=33.87, evidence=[ev('G', 'p.39 33.87'), ev('T', '#200 Balk1')]),
    L('text', 'Sayfa', 12, True, 'right', baselineMm=41.23, xRightMm=180.0, evidence=[ev('G', 'p.39 41.23 x1 181.10'), ev('T', '#201 jc=right b')]),
    L('text', '<entries 1.5 spaced, dot leader, number right at 179.84 mm; level indents 0/5/10/15 mm>', 12, False, 'left', baselineMm=48.43, evidence=[ev('G', 'p.39 first entry 48.43, pitch 20.64'), ev('T', '#202.. T1-T5')]),
]
list_layout = lambda title, pg: [
    L('text', title, 12, True, baselineMm=33.96, evidence=[ev('G', f'p.{pg} 33.96')]),
    L('text', 'Sayfa', 12, True, 'right', baselineMm=41.24, xRightMm=180.0, evidence=[ev('G', f'p.{pg} 41.24 x1 180.11'), ev('T', '#306 / #319 / #350')]),
    L('text', '<entries: bold label+number, caption text, dot leader, page; hanging to text; single + 6 pt after (template screenshot) [guide example: 1.5, 0 after]>', 12, False, 'left', baselineMm=48.48, confidence='TEMPLATE', evidence=[ev('G', f'p.{pg} first entry 48.48'), ev('T', 'image2.jpg')]),
]
sym_layout = [
    L('text', 'SİMGELER ve KISALTMALAR DİZİNİ', 12, True, baselineMm=33.92, evidence=[ev('G', 'p.40 33.92'), ev('T', '#246 Balk1')]),
    L('spacer', '1 empty line 12 pt @1.5 (template); guide example gap 34.44 pt suggests a single-spaced blank', evidence=[ev('T', '#247 "(Bir boşluk)" line=360'), ev('G', 'p.40 title → "Simgeler" 34.44 pt')], confidence='TEMPLATE'),
    L('text', 'Simgeler', 12, True, 'left', xLeftMm=30.0, lineSpacing='single', evidence=[ev('G', 'p.40 46.07 x0 31.97 (table cell inset)')], notes='Baseline = 33.92 + 41.4 pt → 48.53 mm per template [guide 46.07].'),
    L('text', '<symbol TAB definition rows, single spaced; definitions at margin+40.69 mm>', 12, False, 'left', lineSpacing='single', evidence=[ev('G', 'p.40 pitch 13.80 pt, definitions x0 70.71')]),
    L('text', 'Kısaltmalar (after one empty single line)', 12, True, 'left', lineSpacing='single', evidence=[ev('G', 'p.40 gap 27.84 pt'), ev('T', 'row 12 empty paragraph + "Kısaltmalar"')]),
]
cv_layout = [
    L('text', 'ÖZGEÇMİŞ', 12, True, baselineMm=33.96, evidence=[ev('G', 'p.43 33.96'), ev('T', '#671 jc=center b')]),
    L('spacer', '1 empty line', evidence=[ev('T', '#672')]),
    L('text', 'Adı Soyadı / Doğum Yeri ve Tarihi / Yabancı Dili / İletişim (Telefon / e-posta) : … (colon at margin+50 mm)', 12, False, 'left', baselineMm=48.48, evidence=[ev('G', 'p.43 48.48, colon x0 80.07')]),
    L('text', 'Eğitim Durumu (Kurum ve Yıl): Lise / Lisans / Yüksek Lisans / Doktora rows indented 12.5 mm', evidence=[ev('G', 'p.43 x0 42.51')], align='left', bold=False),
    L('text', 'Çalıştığı Kurum/Kurumlar ve Yıl / Yayınları (SCI ve diğer) / Diğer konular', align='left', bold=False, evidence=[ev('G', 'p.43')]),
    L('text', 'NOT: Yayınların yazımı, kaynaklar dizininin oluşturulmasında uygulanan kurallara göre yapılmalıdır. (instruction)', align='justify', bold=True, evidence=[ev('G', 'p.43 bold, "NOT" underlined'), ev('T', '#700')], notes='Instruction line; printing it is UNKNOWN (template keeps it as body text).'),
]
sections = [
    {'id': 'outer-cover', 'kind': 'outerCover', 'title': 'DIŞ KAPAK', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': none_num, 'inToc': False, 'startsNewPage': True, 'layout': outer_layout,
     'evidence': [ev('G', 'p.32 Örnek 1'), ev('G', 'p.17 §4.2.1', 'kitap satış biriminden sağlanacak tez kapakları ile ciltlenmelidir'), ev('T', '#0-#45 (NormalWeb 12 pt, single, centered; 35 empty lines then text)')],
     'notes': 'Printed on the official purchased cover (text in a 100 × 65 mm area 21 cm from the top). Template mock-up page starts the text at ≈ 205 mm on a 30 mm-margin page. Typography: TNR 12 centered; title bold (EXPLICIT callout p.32 "TIMES NEW ROMAN YAZI KARAKTERİ VE 12 PUNTO KULLANILARAK ORTALI").'},
    {'id': 'inner-cover', 'kind': 'innerCover', 'title': 'İÇ KAPAK', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': none_num, 'inToc': False, 'startsNewPage': True, 'layout': inner_layout,
     'evidence': [ev('G', 'p.33 Örnek 2'), ev('G', 'p.17 §4.2.2', 'Sadece bu sayfada yukarıda belirtilen destek yazısı hariç 14 punto-koyu olarak kullanılmalıdır'), ev('T', '#46-#74')]},
    {'id': 'approval', 'kind': 'approval', 'title': 'TEZ ONAY SAYFASI', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': none_num, 'inToc': False, 'startsNewPage': True, 'layout': approval_layout,
     'evidence': [ev('G', 'p.34 Örnek 3'), ev('G', 'p.17 §4.2.3', 'Örnek 3, jürideki üye sayısının 5 olduğu kabul edilerek hazırlanmıştır. Bu bölüm düzenlenirken jürideki üye sayısı dikkate alınmalıdır'), ev('T', 'table #76 (#77-#103)')]},
    {'id': 'ethics', 'kind': 'ethicsDeclaration', 'title': 'BİLİMSEL ETİK BİLDİRİM SAYFASI', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': none_num, 'inToc': False, 'startsNewPage': True, 'layout': ethics_layout,
     'evidence': [ev('G', 'p.35 Örnek 4'), ev('G', 'p.18 §4.2.4', 'imzalı olarak yer verilmelidir'), ev('T', '#105-#120')]},
    {'id': 'abstract-tr', 'kind': 'abstract', 'title': 'ÖZET', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': dict(front_num, startAt=1), 'inToc': True, 'startsNewPage': True, 'layout': abs_layout('tr'),
     'evidence': [ev('G', 'p.36 Örnek 5'), ev('G', 'p.18 §4.2.5'), ev('T', '#121-#157, sectPr#3 lowerRoman start=1')]},
    {'id': 'abstract-en', 'kind': 'englishAbstract', 'title': 'ABSTRACT', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': front_num, 'inToc': True, 'startsNewPage': True, 'layout': abs_layout('en'),
     'evidence': [ev('G', 'p.37 Örnek 6'), ev('T', '#158-#178')]},
    {'id': 'acknowledgements', 'kind': 'acknowledgements', 'title': 'TEŞEKKÜR', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': front_num, 'inToc': True, 'startsNewPage': True, 'layout': ack_layout,
     'evidence': [ev('G', 'p.38 Örnek 7'), ev('G', 'p.18 §4.2.6'), ev('T', '#190-#199')]},
    {'id': 'toc', 'kind': 'tableOfContents', 'title': 'İÇİNDEKİLER DİZİNİ', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': front_num, 'inToc': True, 'startsNewPage': True, 'layout': toc_layout,
     'evidence': [ev('G', 'p.39 Örnek 8'), ev('G', 'p.19 §4.2.7'), ev('T', '#200-#245')]},
    {'id': 'symbols', 'kind': 'listOfSymbols', 'title': 'SİMGELER ve KISALTMALAR DİZİNİ', 'required': 'conditional', 'appliesTo': ['*'], 'pageNumbering': front_num, 'inToc': True, 'startsNewPage': True, 'layout': sym_layout,
     'evidence': [ev('G', 'p.40 Örnek 9'), ev('G', 'p.7 §2.7', '(varsa) Simgeler ve Kısaltmalar Dizini'), ev('T', '#246-#304')]},
    {'id': 'list-figures', 'kind': 'listOfFigures', 'title': 'ŞEKİLLER DİZİNİ', 'required': 'conditional', 'appliesTo': ['*'], 'pageNumbering': front_num, 'inToc': True, 'startsNewPage': True, 'layout': list_layout('ŞEKİLLER DİZİNİ', 41),
     'evidence': [ev('G', 'p.41 Örnek 10'), ev('T', '#305-#317')], 'notes': 'Conditional on figures existing (INFERRED).'},
    {'id': 'list-tables', 'kind': 'listOfTables', 'title': 'ÇİZELGELER DİZİNİ', 'required': 'conditional', 'appliesTo': ['*'], 'pageNumbering': front_num, 'inToc': True, 'startsNewPage': True, 'layout': list_layout('ÇİZELGELER DİZİNİ', 42),
     'evidence': [ev('G', 'p.42 Örnek 11'), ev('T', '#318-#348')]},
    {'id': 'list-photos', 'kind': 'custom', 'title': 'RESİMLER DİZİNİ', 'required': 'conditional', 'appliesTo': ['*'], 'pageNumbering': front_num, 'inToc': True, 'startsNewPage': True, 'layout': list_layout('RESİMLER DİZİNİ', 42),
     'evidence': [ev('G', 'p.19-20 §4.2.11'), ev('T', '#349-#355 (list of "Resim" captions; "Sayfa" via tab 7930)')], 'notes': 'No guide example page; same rules as the other lists.'},
    {'id': 'introduction', 'kind': 'introduction', 'title': '1. GİRİŞ', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': dict(main_num, startAt=1), 'inToc': True, 'startsNewPage': True,
     'evidence': [ev('G', 'p.20 §4.3.1', '“1. GİRİŞ” başlığı altında yazılmalıdır'), ev('T', '#356, sectPr#4 start=1')]},
    {'id': 'main', 'kind': 'mainContent', 'title': '2. LİTERATÜR BİLGİLERİ, 3. MATERYAL ve METOT, 4. BULGULAR, 5. TARTIŞMA ve SONUÇ (numbered chapters)', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': main_num, 'inToc': True, 'startsNewPage': True,
     'evidence': [ev('G', 'p.16 §4', 'Giriş, Literatür Bilgileri, Sonuç ve Kaynaklar bölümleri dışındaki bölüm başlıkları anabilim dalı tarafından belirlenebilir'), ev('T', '#361-#625')], 'notes': 'LİTERATÜR BİLGİLERİ and a Sonuç chapter are mandatory; MATERYAL ve METOT / BULGULAR may be renamed; "Tartışma ve Sonuç" may be combined or "Sonuç ve Öneriler".'},
    {'id': 'bibliography', 'kind': 'bibliography', 'title': 'n. KAYNAKLAR (next chapter number)', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': main_num, 'inToc': True, 'startsNewPage': True,
     'evidence': [ev('G', 'p.16 §4 "6. KAYNAKLAR"; p.21-28 §4.3.6'), ev('T', '#627 "6. KAYNAKLAR" (Balk2), entries #629-#663')]},
    {'id': 'cv', 'kind': 'curriculumVitae', 'title': 'ÖZGEÇMİŞ', 'required': 'required', 'appliesTo': ['*'], 'pageNumbering': main_num, 'inToc': True, 'startsNewPage': True, 'layout': cv_layout,
     'evidence': [ev('G', 'p.43 Örnek 12; p.28 §4.3.7'), ev('T', '#671-#700')]},
    {'id': 'appendices', 'kind': 'appendices', 'title': 'EKLER', 'required': 'optional', 'appliesTo': ['*'], 'pageNumbering': main_num, 'inToc': True, 'startsNewPage': True,
     'evidence': [ev('G', 'p.17 §4.1 item 16 "Ekler (varsa)"; p.25-26 §4.3.8'), ev('T', '#703-#782')], 'notes': 'Placed after ÖZGEÇMİŞ (template + guide list/TOC example); see conflicts.'},
]

placeholders = {
    'THESIS_TITLE': {'label': 'Tez başlığı (Türkçe)', 'usedOn': ['outer-cover', 'inner-cover', 'approval', 'abstract-tr'], 'format': 'BÜYÜK HARF on covers/ÖZET'},
    'THESIS_TITLE_EN': {'label': 'Title of thesis (English)', 'usedOn': ['abstract-en'], 'format': 'UPPER CASE'},
    'STUDENT_NAME': {'label': 'Öğrencinin Adı SOYADI', 'usedOn': ['outer-cover', 'inner-cover', 'approval', 'ethics', 'abstract-tr', 'abstract-en', 'acknowledgements'], 'format': 'Adı SOYADI'},
    'DEGREE_UPPER': {'label': 'YÜKSEK LİSANS TEZİ | DOKTORA TEZİ', 'usedOn': ['outer-cover', 'inner-cover', 'approval'], 'format': 'derived from degreeType'},
    'DEGREE_TR': {'label': 'Yüksek Lisans Tezi | Doktora Tezi', 'usedOn': ['abstract-tr'], 'format': 'derived from degreeType'},
    'DEGREE_EN': {'label': 'M.Sc. Thesis | Ph.D. Thesis', 'usedOn': ['abstract-en'], 'format': 'derived from degreeType'},
    'DEPARTMENT_NAME': {'label': 'Anabilim Dalı', 'usedOn': ['approval', 'abstract-tr'], 'format': 'Title Case'},
    'DEPARTMENT_NAME_UPPER': {'label': 'ANABİLİM DALI (upper case)', 'usedOn': ['outer-cover', 'inner-cover'], 'format': 'derived: upper-case of DEPARTMENT_NAME (Turkish locale)'},
    'DEPARTMENT_NAME_EN': {'label': 'Department (English)', 'usedOn': ['abstract-en']},
    'ADVISOR_TITLE': {'label': 'Danışman unvanı', 'usedOn': ['outer-cover', 'inner-cover', 'approval', 'abstract-tr'], 'format': 'Prof. Dr. | Doç. Dr. | Dr. Öğr. Üyesi'},
    'ADVISOR_TITLE_EN': {'label': 'Supervisor title (English)', 'usedOn': ['abstract-en'], 'format': 'Prof. | Assoc. Prof. | Asst. Prof.'},
    'ADVISOR_NAME': {'label': 'Danışman Adı SOYADI', 'usedOn': ['outer-cover', 'inner-cover', 'approval', 'abstract-tr', 'abstract-en']},
    'CO_ADVISOR_TITLE': {'label': 'İkinci danışman unvanı (varsa)', 'usedOn': ['outer-cover', 'inner-cover', 'approval', 'abstract-tr']},
    'CO_ADVISOR_TITLE_EN': {'label': 'Co-supervisor title (English)', 'usedOn': ['abstract-en']},
    'CO_ADVISOR_NAME': {'label': 'İkinci danışman Adı SOYADI (varsa)', 'usedOn': ['outer-cover', 'inner-cover', 'approval', 'abstract-tr', 'abstract-en']},
    'DEFENSE_MONTH': {'label': 'Savunma ayı', 'usedOn': ['outer-cover', 'inner-cover'], 'format': 'Türkçe ay adı (Ay Yıl)'},
    'DEFENSE_YEAR': {'label': 'Savunma yılı', 'usedOn': ['outer-cover', 'inner-cover', 'abstract-tr', 'abstract-en']},
    'DEFENSE_DATE': {'label': 'Savunma tarihi', 'usedOn': ['approval'], 'format': 'GG / AA / YYYY'},
    'DECISION': {'label': 'oy birliği | oy çokluğu', 'usedOn': ['approval']},
    'JURY_1_TITLE_NAME': {'label': 'Jüri Başkanı (Ünvanı Adı SOYADI)', 'usedOn': ['approval']},
    'JURY_n_TITLE_NAME': {'label': 'Jüri Üyesi 2..7', 'usedOn': ['approval'], 'format': 'rows 2-5 in example; 6-7 for PhD with second advisor'},
    'JURY_n_AFFILIATION': {'label': 'Üniversite adı, Fakültesi', 'usedOn': ['approval']},
    'INSTITUTE_DIRECTOR': {'label': 'Enstitü Müdürü (Ünvanı Adı SOYADI)', 'usedOn': ['approval'], 'format': 'template default "Prof. Dr. Bekir YALÇIN" (may be outdated)'},
    'SIGN_DATE': {'label': 'Etik beyan tarihi', 'usedOn': ['ethics'], 'format': 'GG / AA / YYYY'},
    'PROJECT_NUMBER': {'label': 'Destekleyen proje numarası (varsa)', 'usedOn': ['inner-cover', 'acknowledgements']},
    'PROJECT_FUNDER': {'label': 'Destekleyen kuruluş (varsa)', 'usedOn': ['inner-cover']},
    'KEYWORDS': {'label': 'Anahtar Kelimeler (4-6, virgülle)', 'usedOn': ['abstract-tr']},
    'KEYWORDS_EN': {'label': 'Keywords (4-6)', 'usedOn': ['abstract-en']},
    'FRONT_PAGES_ROMAN': {'label': 'Last roman page label (e.g. vi)', 'usedOn': ['abstract-tr', 'abstract-en'], 'format': 'derived from layout'},
    'MAIN_PAGES': {'label': 'Arabic pages from GİRİŞ to the end incl. appendices', 'usedOn': ['abstract-tr', 'abstract-en'], 'format': 'derived from layout'},
    'YEAR': {'label': 'Yıl', 'usedOn': ['acknowledgements']},
    'CITY': {'label': 'Şehir', 'usedOn': ['acknowledgements'], 'format': 'Afyonkarahisar (fixed in template/guide)'},
}

variants = [
    {'registryId': 'aku-fbe-master-tr-v1', 'degreeType': 'master', 'language': 'tr', 'confirmed': True,
     'evidence': G + '#p.4 §1 ("Yüksek Lisans ve Doktora Tezleri"); ' + T + '#document.xml #38/#53 "YÜKSEK LİSANS TEZİ / DOKTORA TEZİ", callout #6 "YL-DR TEZLERİ"',
     'differences': ['Degree strings: "YÜKSEK LİSANS TEZİ" (covers, approval), "Yüksek Lisans Tezi" (ÖZET), "M.Sc. Thesis" (ABSTRACT)', 'Jury size not specified for master (example page drawn with 5); number of juror rows is data']},
    {'registryId': 'aku-fbe-phd-tr-v1', 'degreeType': 'phd', 'language': 'tr', 'confirmed': True,
     'evidence': G + '#p.4 §1; p.34 callout ("Doktora savunmasında; eğer ikinci danışman varsa, toplam 7 jüri üyesi"); ' + T + '#callout #93',
     'differences': ['Degree strings: "DOKTORA TEZİ", "Doktora Tezi", "Ph.D. Thesis"', 'Approval page: 7 jurors when a second advisor exists (explicit), else as appointed']},
]

conflicts = [
    {'topic': 'Right margin', 'sources': [{'path': G, 'locator': 'p.5 §2.3 text', 'value': '3 cm'}, {'path': T, 'locator': 'sectPr w:right=1701', 'value': '30.0 mm'}, {'path': G, 'locator': 'pp.4-43 measured justified line ends x=181.09 mm', 'value': '28.9 mm (guide document itself)'}],
     'decision': '30 mm: explicit guide text and the template XML agree; the guide PDF\'s own layout is not an example page and deviates.', 'needsConfirmation': False},
    {'topic': 'Page-number vertical position', 'sources': [{'path': T, 'locator': 'footer3/footer4 (1 paragraph) + w:footer=709/708', 'value': 'baseline ≈ 283.7 mm'}, {'path': G, 'locator': 'pp.33-43 page numbers', 'value': 'baseline 279.65 mm (footer with an extra empty paragraph, cf. template footer5.xml)'}, {'path': G, 'locator': 'pp.2-32 page numbers', 'value': 'baseline 276.18 mm'}],
     'decision': 'Template footers actually used by the thesis sections (footer3/4, single paragraph, 12.5 mm) win; guide pages only show the guide document\'s own footer. Guide text fixes only bottom-centre + TNR 10.', 'needsConfirmation': False},
    {'topic': 'Order of Anahtar Kelimeler and "yıl, sayfa" line in ÖZET/ABSTRACT', 'sources': [{'path': G, 'locator': 'p.18 §4.2.5 text', 'value': 'text → blank → Anahtar Kelimeler → blank → year, pages'}, {'path': G, 'locator': 'p.36/37 Örnek 5-6', 'value': 'text → year, pages → Anahtar Kelimeler'}, {'path': T, 'locator': '#134-#138, #171-#175', 'value': 'text → year, pages → Anahtar Kelimeler'}],
     'decision': 'year/pages line before keywords (newer template + the guide\'s own example page agree against the guide sentence).', 'needsConfirmation': True},
    {'topic': 'Inner cover: line spacing of the 2nd title line', 'sources': [{'path': T, 'locator': '#58 "TEZ BAŞLIĞI (Devam)" no w:spacing (single)', 'value': 'single'}, {'path': G, 'locator': 'p.33 pitch TEZ BAŞLIĞI → (Devam) → name: 24.12 / 72.40 pt', 'value': '1.5 on every line'}],
     'decision': 'All inner-cover lines 1.5 (guide example; the template paragraph is the only one of 29 on the page missing line=360 - formatting accident). Template-literal rendering would lift all lines below by 2.84 mm.', 'needsConfirmation': True},
    {'topic': 'TEŞEKKÜR: blank lines before the signature', 'sources': [{'path': T, 'locator': '#195, #196 two "(Bir boşluk)"', 'value': '2 blank lines'}, {'path': G, 'locator': 'p.38 92.30 → 106.91 mm (41.41 pt)', 'value': '1 blank line'}],
     'decision': 'Template (newer, explicit markers): 2 blank 1.5 lines (signature +62.1 pt below last text line).', 'needsConfirmation': True},
    {'topic': 'Approval page: institute-director block order', 'sources': [{'path': G, 'locator': 'p.34', 'value': 'dots / Enstitü Müdürü / (Ünvanı Adı ve SOYADI)'}, {'path': T, 'locator': '#101-#103', 'value': 'dots / Prof. Dr. Bekir YALÇIN / Enstitü Müdürü'}],
     'decision': 'Template order (name above title), name as a placeholder with the template value as default.', 'needsConfirmation': True},
    {'topic': 'Approval page: juror row pitch and box geometry', 'sources': [{'path': T, 'locator': '#84-#93 (juror line single + affiliation line 1.5 + 6 pt after); table 8505 twips; box top 189.0 by trHeight 9014', 'value': 'pitch 40.5 pt (14.29 mm); box x 28.1-178.1, content starts with a single empty line'}, {'path': G, 'locator': 'p.34', 'value': 'pitch 36.6 pt (12.91 mm); box x 27.31-181.39, y 189.04-265.22; box content starts with a 1.5 empty line'}],
     'decision': 'Template XML (newer, specific). Box top 189.0 agrees in both. Predicted template baselines are INFERRED (Word 1.5 line model validated on guide body pages); confirm with a Word render of the template.', 'needsConfirmation': True},
    {'topic': 'Approval page: bold values', 'sources': [{'path': G, 'locator': 'p.34', 'value': 'names after colon bold'}, {'path': T, 'locator': '#81-#92 value runs without w:b', 'value': 'labels bold, values regular'}],
     'decision': 'Template: labels bold, values regular.', 'needsConfirmation': False},
    {'topic': 'List of figures/tables line spacing and spacing after', 'sources': [{'path': T, 'locator': 'image2.jpg instruction screenshot (after #316)', 'value': 'single, 0 before, 6 pt after, left, hanging 1.6 cm'}, {'path': T, 'locator': '#307-#322 sample entries (ekillerTablosu + direct after=0, style line=360)', 'value': '1.5, 0 after'}, {'path': G, 'locator': 'p.41/42 pitch 20.52-20.75 pt', 'value': '1.5, 0 after'}],
     'decision': 'Explicit instruction screenshot of the newest source (single, 6 pt after, left). Guide text is silent on list spacing.', 'needsConfirmation': True},
    {'topic': 'SİMGELER ve KISALTMALAR DİZİNİ: blank after title', 'sources': [{'path': T, 'locator': '#247 (Bir boşluk) line=360', 'value': '1.5 blank (title→Simgeler 41.4 pt)'}, {'path': G, 'locator': 'p.40', 'value': '34.44 pt (single blank)'}],
     'decision': 'Template (1.5 blank, consistent with the general blank-line rule).', 'needsConfirmation': False},
    {'topic': 'Chapter heading → first paragraph gap', 'sources': [{'path': G, 'locator': 'p.6 §2.6 text', 'value': '1 blank 1.5 line (41.4 pt pitch)'}, {'path': G, 'locator': 'p.4 "1. GİRİŞ" → text 34.30 pt', 'value': 'single blank'}, {'path': T, 'locator': '#357 (Bir boşluk) line=360', 'value': '1.5 blank'}],
     'decision': 'Explicit text + template: one 1.5 blank line.', 'needsConfirmation': False},
    {'topic': 'Position of ÖZGEÇMİŞ vs EKLER', 'sources': [{'path': G, 'locator': 'p.16 §4 / p.28 §4.3.7', 'value': 'Özgeçmiş at the very end ("tezin en son sayfasında")'}, {'path': G, 'locator': 'p.17 §4.1 order list', 'value': '15. Özgeçmiş, 16. Ekler (varsa)'}, {'path': T, 'locator': '#671 ÖZGEÇMİŞ before #703 EKLER; TOC #241/#242', 'value': 'Özgeçmiş then Ekler'}],
     'decision': 'ÖZGEÇMİŞ before EKLER (ordered list + template + TOC example).', 'needsConfirmation': True},
    {'topic': 'Widow/orphan control', 'sources': [{'path': G, 'locator': 'p.6 §2.4', 'value': 'no lone line at top/bottom'}, {'path': T, 'locator': 'styles.xml Normal w:widowControl w:val="0"', 'value': 'disabled'}],
     'decision': 'Guide (explicit requirement); template style default is not a requirement.', 'needsConfirmation': False},
    {'topic': 'Section breaks', 'sources': [{'path': T, 'locator': 'sectPr#2-#4 w:type="oddPage"', 'value': 'odd-page breaks (Word may add blank pages)'}, {'path': G, 'locator': 'p.5 §2.2', 'value': 'single-sided printing'}],
     'decision': 'Plain new-page breaks, no blank filler pages.', 'needsConfirmation': True},
    {'topic': 'Guide 2020 vs template 2025 (flag guide-template-version-gap)', 'sources': [{'path': G, 'locator': 'p.4 "Bu kılavuz, Ocak 2020’den itibaren geçerlidir"; PDF modDate 2020-12-14', 'value': '2020'}, {'path': T, 'locator': 'docProps/core.xml created/modified 2025-01-23, revision 2, TotalTime 1 min; content: "Afyonkarahisar 2020" (#198), "2019, ix + 16 sayfa" (#136), lastPrinted 2019-12-09, callout #6 "LİSANSÜSTÜ TEZ YAZIM KILAVUZUNA GÖRE HAZIRLANMIŞTIR"', 'value': '2025 file, 2019/2020 content'}],
     'decision': 'The 2025 template is a re-save of the 2020-era template built for this guide; both are the same rule generation. Explicit guide sentences win where stated; template XML decides unstated geometry; where the guide\'s example page and the template differ, the template is preferred as the newer distribution but flagged. Hard-coded years/names in the template are placeholders.', 'needsConfirmation': False},
]

unknowns = [
    {'key': 'footnotes.*', 'why': 'Guide silent (author-year citations); template has only the Word default footnote style (10 pt).'},
    {'key': 'abstract.maxWords', 'why': 'No word/page limit in guide or template.'},
    {'key': 'typography.hyphenation', 'why': 'Not mentioned; template has no auto-hyphenation setting.'},
    {'key': 'outer-cover.border', 'why': 'Dotted box on p.32 is an illustration of the printed area; the template cover has no border.'},
    {'key': 'outer-cover.firstBaselineWithinBox', 'why': 'Only the illustration (title baseline 5.53 mm below the box top) - text-box inset of the real cover print is not specified.'},
    {'key': 'inner-cover.projectLineSlotWhenAbsent', 'why': 'Whether the empty slot of the optional "Bu tez çalışması … desteklenmiştir." line is kept is not stated.'},
    {'key': 'approval.coAdvisorRowSlotWhenAbsent', 'why': 'Not stated whether the İkinci Danışman row space is kept.'},
    {'key': 'approval.masterJurySize', 'why': 'Only "5 (example)" and "PhD with 2nd advisor: 7" are given.'},
    {'key': 'signaturePlaceholders.print', 'why': 'Grey (BFBFBF) "İmza" / "…… İmza ……" hints: printing in grey vs leaving blank for the handwritten signature is not stated.'},
    {'key': 'appendices.individualTocEntries', 'why': 'TOC example lists only "EKLER".'},
    {'key': 'cv.noteLine', 'why': '"NOT: Yayınların yazımı ..." is an instruction; whether it is printed is not stated.'},
    {'key': 'lists.photos.examplePage', 'why': 'No guide example for RESİMLER DİZİNİ (rules stated by analogy).'},
    {'key': 'renderedTemplateGeometry', 'why': 'LibreOffice Writer component is not installed in this environment (soffice reports "source file could not be loaded" even for a trivial DOCX), so the template could not be rendered; template-based positions are computed from XML with the Word line model.'},
]

engineGaps = [
    {'requirement': 'Page-number font size 10 pt while body is 12 pt', 'evidence': G + ' p.7 §2.7 "(Times New Roman olarak 10 Punto)"', 'whyEngineCannot': 'schema.d.ts NumberingRule has only enabled/position/align/format/startAt/restart - no font/size for page chrome', 'suggestedGenericCapability': 'NumberingRule.style?: Partial<TextStyle> (fontFamily, fontSizePt) used by editor chrome, PDF and DOCX footer'},
    {'requirement': 'Uppercase level-1 headings with lower-case conjunctions ("MATERYAL ve METOT")', 'evidence': G + ' p.7 §2.8', 'whyEngineCannot': 'TextStyle.textTransform "uppercase" transforms everything; matchHeadingTransform copies it to TOC', 'suggestedGenericCapability': 'Use textTransform "none" (author types case) - or a textTransform exception list (e.g. lowercaseWords: ["ve","veya","ile"]); validation warning for non-uppercase H1'},
    {'requirement': 'Third caption kind "Resim" (photographs) with own chapter-based counter and own list "RESİMLER DİZİNİ"', 'evidence': G + ' p.13 §3.2 / p.19-20 §4.2.11; ' + T + ' #610, #349', 'whyEngineCannot': 'ThesisTemplate has only tables/figures CaptionRule; GeneratedIndexRule.kind is toc|figures|tables', 'suggestedGenericCapability': 'captions: Record<kind, CaptionRule> with user-selectable kind per image, generatedIndex.kind = caption kind id'},
    {'requirement': 'Caption hanging indent equal to label width ("Şekil 2.1 " → continuation aligned to text)', 'evidence': G + ' p.13 §3.3; p.14 continuation x0 +16.5 mm', 'whyEngineCannot': 'CaptionRule.style (TextStyle) has firstLineIndentMm/leftIndentMm only; no "hang to label" mode', 'suggestedGenericCapability': 'CaptionRule.hangingToLabel: true (measure label run width) - same for list-of-figures/TOC rows (GeneratedIndexRule.hangingToNumber)'},
    {'requirement': 'Caption label+number bold, caption text regular; same in lists of figures/tables (label bold)', 'evidence': G + ' p.14, p.41-42', 'whyEngineCannot': 'CaptionRule.style applies to the whole caption; GeneratedIndexRule.style to whole rows', 'suggestedGenericCapability': 'CaptionRule.labelStyle?: Partial<TextStyle>; GeneratedIndexRule.labelStyle'},
    {'requirement': 'Continued tables/figures: "Çizelge 3.1 (Devam) <title>" repeated on the next page', 'evidence': G + ' p.12 §3.1; ' + T + ' #585', 'whyEngineCannot': 'No caption repetition on table fragments', 'suggestedGenericCapability': 'CaptionRule.continuation: { suffix: "(Devam)" } rendered above split table fragments'},
    {'requirement': 'Three-rule tables (top, under header, bottom; no verticals) centered', 'evidence': T + ' tables #382/#479/#517; ' + G + ' p.14', 'whyEngineCannot': 'CaptionRule.cellStyle covers typography only; no border model', 'suggestedGenericCapability': 'tables.borders: { preset: "horizontalRules", widthPt: 0.5 }'},
    {'requirement': 'Table notes below table in 10 pt single spacing', 'evidence': G + ' p.13 §3.3', 'whyEngineCannot': 'No table-note element/style', 'suggestedGenericCapability': 'tables.noteStyle: Partial<TextStyle> for a note paragraph attached below the table'},
    {'requirement': 'Equation numbering "(chapter.n)" flush right, Cambria Math centered', 'evidence': G + ' p.9 §2.10', 'whyEngineCannot': 'schema has no equations rule', 'suggestedGenericCapability': 'equations: { numbering: {scope, format}, numberAlign: "right", style }'},
    {'requirement': 'Bibliography title numbered as the next chapter ("6. KAYNAKLAR")', 'evidence': G + ' p.16; ' + T + ' #627', 'whyEngineCannot': 'bibliography.heading is static text; section titles are unnumbered', 'suggestedGenericCapability': 'section.titleNumbering: "continueH1" (title rendered/listed as numbered level-1 heading)'},
    {'requirement': 'Mixed bold runs inside one special-page text block (approval sentence; "Danışman:" label bold + value regular; "Anahtar Kelimeler:" bold label)', 'evidence': T + ' #79, #131, #138', 'whyEngineCannot': 'SpecialPageBlock text/metadata carry a single style', 'suggestedGenericCapability': 'text block value with inline markup (**bold**) or block.runs[] with per-run style'},
    {'requirement': 'Hanging indent in special blocks (keywords continuation aligned after label; ethics dash list hanging 7.5 mm)', 'evidence': T + ' #138 left=hanging=2127, #109 left=hanging=425', 'whyEngineCannot': 'Unclear whether negative firstLineIndentMm with leftIndentMm is supported by specialPages/DOCX writers', 'suggestedGenericCapability': 'TextStyle.hangingIndentMm (or verified negative firstLineIndentMm) in blocks, PDF and DOCX'},
    {'requirement': 'Double (thick-thin, 3 pt) bordered box around the institute approval block, fixed top at 189 mm', 'evidence': T + ' table #76 row1 tcBorders thickThinSmallGap sz=24; trHeight 9014', 'whyEngineCannot': 'SpecialPageBlock has separator (single line) and group, but no box border or absolute/min-height positioning', 'suggestedGenericCapability': 'group.border: { style: "single|double|thickThin", widthPt, paddingMm } and group.minHeightMm / absolute yTopMm'},
    {'requirement': 'Grey signature placeholders ("İmza", colour BFBFBF)', 'evidence': T + ' #85, #119', 'whyEngineCannot': 'TextStyle has no color', 'suggestedGenericCapability': 'TextStyle.color (hex), DOCX w:color / PDF fill colour'},
    {'requirement': 'Variable-length jury list (5 or 7 rows)', 'evidence': G + ' p.17 §4.2.3; p.34 callout', 'whyEngineCannot': 'No repeated blocks; can be emulated with 7 fixed rows each visibleWhen anyFilled', 'suggestedGenericCapability': 'none required (use visibleWhen per row); optional repeat block over a list field'},
    {'requirement': 'Abstract page-count line "YIL, <last roman> + <arabic count> sayfa"', 'evidence': G + ' p.36; ' + T + ' #136 + callout #130', 'whyEngineCannot': 'PlaceholderDefinition.derived supports only "totalPages"', 'suggestedGenericCapability': 'derived: "frontLastLabel" | "mainPageCount" (pages from a given section to end)'},
    {'requirement': 'Figure/table/photo list rows: single spacing + 6 pt after while TOC rows are 1.5 + 0', 'evidence': T + ' image2.jpg', 'whyEngineCannot': 'Supported via generatedIndex.style per section (lineHeight, spaceAfterPt) - no gap if used', 'suggestedGenericCapability': 'n/a'},
    {'requirement': 'Landscape pages for wide figures/tables with the page number still bottom-centre of the portrait page', 'evidence': G + ' p.12 §3.1', 'whyEngineCannot': 'PageRule.orientation is per template/section; no per-object landscape page', 'suggestedGenericCapability': 'section/page-level orientation override with portrait chrome'},
    {'requirement': 'Outer cover text confined to a 100 × 65 mm area 21 cm from the top', 'evidence': G + ' p.32', 'whyEngineCannot': 'Representable with section overrides.page.margins {top 210 (+inset), left 55, right 55, bottom 22} - no gap', 'suggestedGenericCapability': 'n/a'},
]

def mc(id, what, expected, unit, rule, tol=0.5, applies=None, **kw):
    d = {'id': id, 'appliesTo': applies or ['*'], 'what': what, 'expected': expected, 'unit': unit, 'tolerance': tol, 'sourceRule': rule}
    d.update(kw)
    return d
checks = [
    mc('page-size', 'page width × height', [210, 297], 'mm', 'page.size'),
    mc('margin-left', 'x0 of body lines (left/justified, no indent) on arabic pages', 30.0, 'mm', 'page.margins.leftMm'),
    mc('margin-right', 'x1 of justified non-final body lines', 180.0, 'mm', 'page.margins.rightMm'),
    mc('margin-top', 'first baseline of a body page minus TNR 12 ascent (10.69 pt = 3.77 mm)', 30.0, 'mm', 'page.margins.topMm', notes='equivalently first baseline ≈ 33.87-33.96 mm'),
    mc('margin-bottom', 'lowest body baseline + descent must be ≤ 297 − 30 mm', 267.0, 'mm', 'page.margins.bottomMm', comparison='<='),
    mc('body-font', 'body text font program embedded', 'Times New Roman', None, 'typography.body.fontFamily', tol=None),
    mc('body-size', 'body span size', 12, 'pt', 'typography.body.fontSizePt', tol=0.1),
    mc('body-pitch', 'baseline pitch between consecutive lines of one paragraph', 20.7, 'pt', 'typography.body.lineSpacing', tol=0.2),
    mc('body-indent', 'first line of paragraph x0 − margin', 0, 'mm', 'typography.paragraph.firstLineIndentMm'),
    mc('para-gap', 'baseline pitch from last line of a paragraph to first line of the next paragraph', 41.4, 'pt', 'typography.paragraph.spaceAfterPt', tol=0.2),
    mc('body-align', 'non-final lines end at 180.0 mm (justified)', 'justify', None, 'typography.body.align', tol=None),
    mc('h1-style', 'chapter heading: TNR 12 bold, x0 30.0, top of new page, first baseline ≈ 33.9 mm', {'sizePt': 12, 'bold': True, 'x0Mm': 30.0, 'baselineMm': 33.92}, 'mixed', 'headings.h1.*'),
    mc('h1-number', 'chapter heading text starts "<n>. " (e.g. "1. GİRİŞ")', '^\\d+\\. ', 'regex', 'headings.h1.numbering', tol=None),
    mc('h2-number', 'level-2 heading starts "<n>.<m> " without trailing period', '^\\d+\\.\\d+ ', 'regex', 'headings.h2.numbering', tol=None),
    mc('h3-number', 'level-3 heading format', '^\\d+\\.\\d+\\.\\d+ ', 'regex', 'headings.h3.numbering', tol=None),
    mc('h4-number', 'level-4 heading format', '^\\d+\\.\\d+\\.\\d+\\.\\d+ ', 'regex', 'headings.h4.numbering', tol=None),
    mc('h2-h4-style', 'levels 2-4: TNR 12 bold, left at 30.0 mm, not italic', {'sizePt': 12, 'bold': True, 'x0Mm': 30.0}, 'mixed', 'headings.h2.*'),
    mc('heading-gap-after', 'heading baseline → next paragraph first baseline', 41.4, 'pt', 'headings.h1.spaceAfterPt', tol=0.2),
    mc('heading-gap-before', 'last line of paragraph → following heading baseline', 41.4, 'pt', 'headings.h2.spaceBeforePt', tol=0.2),
    mc('pagenum-pos', 'page number horizontally centred on the text area', 105.0, 'mm', 'pagination.align', notes='centre of number glyph box'),
    mc('pagenum-baseline', 'page-number baseline from top', 283.7, 'mm', 'pagination.baselineMm'),
    mc('pagenum-size', 'page-number font', {'font': 'Times New Roman', 'sizePt': 10}, 'pt', 'pagination.font', tol=0.1),
    mc('pagenum-cover-none', 'no page number on outer cover, inner cover, approval, ethics pages', None, None, 'pagination.coverPages', tol=None),
    mc('pagenum-front', 'ÖZET page shows "i"; following front pages ii, iii…', 'i', None, 'pagination.front.format', tol=None),
    mc('pagenum-main', '"1. GİRİŞ" page shows "1"; arabic continues through KAYNAKLAR, ÖZGEÇMİŞ, EKLER', '1', None, 'pagination.main.format', tol=None),
    mc('inner-cover-lines', 'inner cover baselines (14 pt bold centred): AKÜ 50.38, FBE 58.94, degree 93.02, title 127.10/135.61, name 161.15, Danışman 186.71, advisor 195.22, dept 246.37 (with co-advisor rows at 212.28/220.80), Ay Yıl 263.39', [50.38, 58.94, 93.02, 127.10, 135.61, 161.15, 186.71, 195.22, 212.28, 220.80, 246.37, 263.39], 'mm', 'sections.inner-cover.layout', notes='for a 2-line title and a co-advisor; centred at x 105.0'),
    mc('inner-cover-size', 'all inner-cover lines except the project line are 14 pt bold', 14, 'pt', 'sections.inner-cover.layout', tol=0.1),
    mc('outer-cover-box', 'outer-cover text inside x 55-155 mm, y 210-275 mm; title first baseline ≈ 215.5 mm; lines TNR 12 centred on x=105', {'x': [55, 155], 'y': [210, 275], 'firstBaselineMm': 215.53}, 'mm', 'sections.outer-cover.layout'),
    mc('approval-title', 'TEZ ONAY SAYFASI bold centred baseline', 33.96, 'mm', 'sections.approval.layout'),
    mc('approval-text', 'approval sentence first baseline, x0', {'baselineMm': 48.48, 'x0Mm': 30.0}, 'mm', 'sections.approval.layout'),
    mc('approval-advisor', 'Danışman row baseline; colon x0', {'baselineMm': 92.30, 'colonX0Mm': 67.47}, 'mm', 'sections.approval.layout'),
    mc('approval-jury', 'Başkan baseline 114.19, label x0 42.49, colon x0 67.47; subsequent jurors every 14.29 mm (template)', {'firstBaselineMm': 114.19, 'labelX0Mm': 42.49, 'colonX0Mm': 67.47, 'pitchMm': 14.29}, 'mm', 'sections.approval.layout'),
    mc('approval-box', 'double-border box top edge', 189.0, 'mm', 'sections.approval.layout'),
    mc('ethics-lines', 'ethics page baselines: title 33.96, AKÜ 41.24, intro 55.84 (first-line indent 12.5 mm), first dash item 70.37, "beyan ederim." 136.20, date 150.82 (right), name 172.70 (right)', [33.96, 41.24, 55.84, 70.37, 136.20, 150.82, 172.70], 'mm', 'sections.ethics.layout'),
    mc('abstract-lines', 'ÖZET/ABSTRACT header baselines: title 33.96, degree 41.16, thesis title 55.72 (+13.8 pt per extra title line), name 75.23, univ 82.56, institute 89.85, dept 97.17, advisor 104.45, (co-advisor 111.78), text 126.38', [33.96, 41.16, 55.72, 75.23, 82.56, 89.85, 97.17, 104.45, 111.78, 126.38], 'mm', 'sections.abstract-tr.layout', notes='for a 2-line title with co-advisor'),
    mc('abstract-tail', 'last text line → "YIL, x + n sayfa" (bold) → "Anahtar Kelimeler:" each +41.4 pt', 41.4, 'pt', 'sections.abstract-tr.layout', tol=0.2),
    mc('ack-signature', 'TEŞEKKÜR: last text baseline → student name (right-aligned to 180 mm)', 62.1, 'pt', 'sections.acknowledgements.layout', tol=0.2),
    mc('frontmatter-titles', 'ÖZET, ABSTRACT, TEŞEKKÜR, İÇİNDEKİLER DİZİNİ, list titles: centred bold 12 pt, baseline ≈ 33.9-33.96 mm', 33.96, 'mm', 'headings.frontMatterTitles'),
    mc('toc-sayfa', '"Sayfa" bold right-aligned, baseline one 1.5 line below the title', {'baselineMm': 41.23, 'x1Mm': 180.0}, 'mm', 'toc.pageNumberHeading'),
    mc('toc-leader', 'TOC rows have dot leaders; page numbers right-aligned at x1 ≈ 179.84 mm', 179.84, 'mm', 'toc.pageNumberRightEdgeMm'),
    mc('toc-indent', 'TOC entry x0 per level (1..4)', [30.0, 35.0, 40.0, 45.0], 'mm', 'toc.indentPerLevelMm'),
    mc('toc-pitch', 'TOC row pitch', 20.7, 'pt', 'toc.lineSpacing', tol=0.2),
    mc('lists-rows', 'list of figures/tables row pitch (single + 6 pt after)', 19.8, 'pt', 'lists.lineSpacing', tol=0.2, notes='needsConfirmation: guide example 20.7 pt'),
    mc('caption-size', 'caption spans 11 pt; label+number bold; text regular', 11, 'pt', 'captions.figure.fontSizePt', tol=0.1),
    mc('caption-pitch', 'caption line pitch (single 11 pt)', 12.65, 'pt', 'captions.figure.lineSpacing', tol=0.2),
    mc('caption-hanging', 'caption continuation x0 = x of first caption-text character after "<label> <n.n> "', 'label width', 'mm', 'captions.figure.hangingIndent'),
    mc('caption-position', 'table caption above table (caption last baseline + 3.1 mm = top rule); figure caption below image (image bottom + 5.96 mm = caption baseline)', {'tableRuleGapMm': 3.09, 'figureGapMm': 5.96}, 'mm', 'captions.table.spaceAfterPt'),
    mc('caption-format', 'caption text matches "^(Şekil|Çizelge|Resim) \\d+\\.\\d+ "', '^(Şekil|Çizelge|Resim) \\d+\\.\\d+ ', 'regex', 'captions.figure.numbering', tol=None),
    mc('table-rules', 'table drawn with 3 horizontal rules (top, below header, bottom), no vertical rules', 3, 'count', 'tables.borders', tol=0),
    mc('bib-hanging', 'bibliography continuation lines x0', 42.5, 'mm', 'bibliography.hangingIndentMm'),
    mc('bib-pitch', 'bibliography: within entry 20.7 pt; entry to entry 26.7 pt', {'within': 20.7, 'between': 26.7}, 'pt', 'bibliography.spaceBeforePt', tol=0.2),
    mc('bib-title', 'bibliography heading printed as numbered chapter "<n>. KAYNAKLAR" at top of new page', '^\\d+\\. KAYNAKLAR$', 'regex', 'bibliography.title', tol=None),
    mc('cv-title', 'ÖZGEÇMİŞ centred bold, unnumbered, listed in TOC', 'ÖZGEÇMİŞ', None, 'cv.title', tol=None),
    mc('order', 'section order', ['DIŞ KAPAK', 'İÇ KAPAK', 'TEZ ONAY SAYFASI', 'BİLİMSEL ETİK BİLDİRİM SAYFASI', 'ÖZET', 'ABSTRACT', 'TEŞEKKÜR', 'İÇİNDEKİLER DİZİNİ', 'SİMGELER ve KISALTMALAR DİZİNİ', 'ŞEKİLLER DİZİNİ', 'ÇİZELGELER DİZİNİ', 'RESİMLER DİZİNİ', '1. GİRİŞ', '…', 'n. KAYNAKLAR', 'ÖZGEÇMİŞ', 'EKLER'], None, 'sections', tol=None),
    mc('degree-strings', 'degree strings per variant', {'aku-fbe-master-tr-v1': ['YÜKSEK LİSANS TEZİ', 'Yüksek Lisans Tezi', 'M.Sc. Thesis'], 'aku-fbe-phd-tr-v1': ['DOKTORA TEZİ', 'Doktora Tezi', 'Ph.D. Thesis']}, None, 'abstract.degreeLabel', tol=None),
]

# ---------------- source geometry ----------------
geo = json.load(open(ROOT + 'orchestration/artifacts/aku-fbe/source/guide_geometry.json'))
what = {5: 'Guide body page (rules corroboration)', 4: 'Chapter start page "1. GİRİŞ"', 14: 'Caption examples (Şekil / Çizelge)', 15: 'Caption example (Resim)', 23: 'Bibliography examples', 32: 'Örnek 1 Dış Kapak (illustration)', 33: 'Örnek 2 İç Kapak', 34: 'Örnek 3 Onay Sayfası', 35: 'Örnek 4 Etik Sayfa', 36: 'Örnek 5 Özet', 37: 'Örnek 6 Abstract', 38: 'Örnek 7 Teşekkür', 39: 'Örnek 8 İçindekiler Dizini', 40: 'Örnek 9 Simgeler ve Kısaltmalar Dizini', 41: 'Örnek 10 Şekiller Dizini', 42: 'Örnek 11 Çizelgeler Dizini', 43: 'Örnek 12 Özgeçmiş'}
sg = []
for pno, w in what.items():
    pg = geo[pno - 1]
    lines = []
    for l in sorted(pg['lines'], key=lambda l: (l['baselineMm'], l['x0Mm'])):
        ann = (l['baselineMm'] < 22 and l['x0Mm'] < 15) or (l['sizePt'] < 10.5 and l['baselineMm'] < 272) or l['font'].startswith('Calibri') or (pno == 34 and l['sizePt'] > 13.5)
        d = {'text': l['text'][:80], 'font': l['font'], 'sizePt': l['sizePt'], 'bold': l['bold'], 'x0Mm': l['x0Mm'], 'x1Mm': l['x1Mm'], 'baselineMm': l['baselineMm']}
        if l['color']: d['color'] = '%06X' % l['color']
        if ann: d['annotation'] = True
        lines.append(d)
    drs = [d for d in pg['drawings'] if d.get('color') != [1.0, 0.0, 0.0] and d.get('fill') != [1.0, 1.0, 1.0]]
    sg.append({'source': G, 'page': pno, 'what': w, 'pageSizeMm': pg['pageSizeMm'], 'lines': lines, 'images': [{k: i[k] for k in ('x0Mm', 'y0Mm', 'wMm', 'hMm')} for i in pg['images']], 'drawings': drs[:40],
               'notes': 'annotation=true marks example labels (ÖRNEK n), red callouts and dimension labels - not part of the required page.'})

spec = {
    'id': 'aku-fbe', 'schemaVersion': 2, 'analyzedAt': '2026-09-28',
    'university': 'Afyon Kocatepe Üniversitesi', 'unit': 'Fen Bilimleri Enstitüsü (institute)',
    'sources': [
        {'path': G, 'role': 'primary', 'type': 'guide', 'version': '2020 (valid from January 2020; PDF created 2019-12-07, modified 2020-12-14, Microsoft Word 2010)', 'pages': 43},
        {'path': T, 'role': 'primary', 'type': 'template', 'version': '2025 file (docProps created/modified 2025-01-23, revision 2); content of the 2019/2020 template generation', 'pages': 33},
    ],
    'sourcePriority': [
        {'path': G, 'why': 'Explicit rule sentences (margins, fonts, spacing, numbering, captions, bibliography, order) win wherever they state something.'},
        {'path': T, 'why': 'Newer distribution (2025) and XML-exact: decides every value the guide does not state (footer distance, TOC tabs/indents, caption spacing, table borders, special-page structure) and wins over the guide\'s example-page geometry where they differ (flagged needsConfirmation).'},
        {'path': G + ' (example pages 29-40)', 'why': 'Measured corroboration; used for positions where the template agrees structurally; wins over isolated template formatting accidents (inner cover #58).'},
    ],
    'variants': variants,
    'rules': rules,
    'sections': sections,
    'placeholders': placeholders,
    'sourceGeometry': sg,
    'conflicts': conflicts,
    'unknowns': unknowns,
    'engineGaps': engineGaps,
    'measurableChecks': checks,
}
json.dump(spec, open(ROOT + 'orchestration/specs/aku-fbe.json', 'w'), ensure_ascii=False, indent=1)
c = collections.Counter(r['confidence'] for r in rules)
print('rules', len(rules), dict(c), 'sections', len(sections), 'checks', len(checks), 'conflicts', len(conflicts), 'gaps', len(engineGaps), 'unknowns', len(unknowns))
