import json,hashlib,datetime
R='orchestration/artifacts/aku-cografya-lisans/render/'
sha=lambda f:hashlib.sha256(open(R+f,'rb').read()).hexdigest()
G='Yazim_Kilavuzu_2024.pdf'
T='Sablonu_2024.docx (Word PDF render src-word.pdf)'
C=[]
def c(id,req,src,exp,act,res,note='',tol=''):
    C.append(dict(id=id,requirement=req,source=src,expected=exp,actual=act,tolerance=tol,result=res,evidence=note))
P,F,I,CF='PASS','FAIL','INFO','CONFLICT'
c('page-size','A4','guide 2.1','210x297 mm','210.0x297.0 (all 33 pages)',P,tol='0.5mm')
c('margin-left','left 3 cm','guide 2.3','30.0','30.00 (justified lines)',P,tol='0.5mm')
c('margin-right','right 3 cm','guide 2.3','180.0','179.98-180.00',P,tol='0.5mm')
c('margin-top','top 2.5 cm; first baseline','template render p20/p24 first baseline','28.96','28.95',P,tol='0.25mm')
c('margin-bottom','bottom 2.5 cm','guide 2.3','<=272','max body baseline 270.1',P)
c('font-face','Times New Roman','guide 2.2','TimesNewRoman PS embedded','TimesNewRomanPSMT/-BoldMT/-ItalicMT; DOCX rFonts only Times New Roman',P)
c('body-size','12 pt','guide 2.2','12.0','12.0',P,tol='0.1pt')
c('line-pitch','1.5 line','guide 2.2; template pitch 7.30 mm','7.30 mm (20.7 pt)','7.30 mm',P,tol='0.2pt')
c('first-line-indent','paragraph first line (template ind firstLine 708/709)','template body paras','12.5 mm (x0 42.51)','x0 42.49',P,'guide prose ambiguous; template agrees','0.5mm')
c('para-gap','paragraph->paragraph baseline gap with 6pt before/after','template render p20: 9.40 mm = 7.30+2.10 (Word collapses before=120/after=120 to 6 pt); guide p2 self-render 9.40-9.48','9.40 mm','11.53 mm (pitch + 12 pt additive)',F,'delta +2.13 mm per paragraph boundary, cumulative. Spec assumed additive (INFERRED); Word render of official template shows 6pt. Component: engine paragraph-spacing model / spec','0.5mm')
c('heading-gap-h1','H1 -> first paragraph baseline','template p12/p20 9.40; guide 2.6 prose "1 satir bosluk (1,5)"','9.40 (template/guide self-render) vs 14.60 (prose reading)','14.60',CF,'Sources disagree; spec chose prose (INFERRED). Escalate.')
c('h1-format','H1 12pt bold caps left no indent','guide 2.8','12 B, x0 30.0','12 B, x0 30.00, uppercase',P)
c('h2-format','H2 12 bold title case','guide 2.8','12 B','12 B, x0 29.77',P)
c('page-number-pos','page number bottom centre 10pt','guide 2.3/2.7','centre 105.0, 10 pt','x-centre 104.3-105.0, 10.0 pt, baseline 283.53',P,tol='0.3mm')
c('page-number-format','roman from Ozet, arabic from Giris; cover/approval/ethics none','guide 2.7','none x3, i..viii, 1..22','identical in PDF; DOCX pgNumType lowerRoman start1 / decimal start1',P)
c('page-number-vs-template','template numbers ethics ii, Ozet iii, 12pt, baseline 278.8','template sectPr start=2','ii/iii 12pt @278.81','none/i 10pt @283.53',CF,'Guide EXPLICIT vs template; spec chose guide. Policy 2026-10-03 item1 lets template structure take priority when specified: needs orchestrator ruling.')
c('cover-top-block','cover first 4 lines baseline','template p1 (Word render)','58.94/67.44/75.95/118.59','55.86/64.38/72.90/115.50',F,'delta -3.08 mm (title line1 -3.06); name/Danisman/Yil within 0.26. Component: template cover spacer/first-line offset','0.5mm')
c('cover-seals','2 seals 26.2 mm at top margin','template p1','top 25.01, 26.19/26.25','top 25.0, 26.19/26.25; x +0.5',P,tol='0.5mm')
c('cover-fit','cover fits one page; Yil at bottom','template p1 Yil baseline 269.11','1 page','1 page with <=2-line title (Yil 268.85). With 3-line title (run1) cover overflows: stray page 2 with only the year',F,'Fixed spacers cannot absorb a longer title; source behaviour with longer titles UNKNOWN. Component: template/engine')
c('approval-page','approval page lines','template p2','29.64/35.31/55.59/75.19/82.52/89.81/111.73','29.61/35.29/55.57/75.19/82.50/89.80/111.70',P,tol='0.25mm')
c('ethics-header','ethics heading lines','template p3','28.96/36.24/50.85/58.17','28.95/36.25/50.85/58.16',P,tol='0.25mm')
c('ethics-bullet','list marker Symbol U+F02D minus (numId26)','template numbering.xml','minus glyph, text x 37.5','bullet U+2022, text x 37.50',F,'marker glyph differs; Word adds +0.32 mm per marker item, cumulative -1.85 mm. Component: template/engine list marker')
c('ethics-tail','date/signature baselines','template p3','154.92/169.53/176.85','153.07/167.67/174.96',F,'delta -1.9 mm (cumulative, see ethics-bullet)','0.5mm')
c('abstract-block','Ozet header: name gap after 2-line title','template p4 title last 52.88 -> name 67.49','gap 14.61 mm','12.17 mm; following lines -2.05 mm',F,'delta -2.4 mm. Component: template abstract header spacing','0.5mm')
c('ozet-title-size','OZET size','guide 2.8 (12pt) vs template 11.04','12 (guide)','12',CF,'recorded conflict, guide chosen')
c('tesekkur','heading->text 12.15; sign block gaps 14.61/21.94/7.28','template p6','12.15/21.94/7.28','12.17/21.9/7.30',P,tol='0.25mm')
c('toc','TOC title, Sayfa, pitch 7.30, L2 indent 35.02','template p7','28.96/33.83/41.11, L2 x 35.02','28.95/33.82/41.12, L2 x 34.99, L3 39.99, L4 45.00',P,'L3/L4 indents not in source (INFO)')
c('lot-title','tables list title','guide 4.2.10 CIZELGELER DIZINI vs template page TABLOLAR DIZINI','conflict','TABLOLAR DIZINI',CF,'recorded conflict')
c('lists-layout','list pages title/Sayfa/entry gaps','template p10/p11','28.96,33.83,41.11; 8.4 between entries','28.95,33.82,41.11; 8.39',P,tol='0.25mm')
c('symbols-layout','symbols list: template colon lines vs guide tab block','guide 2.10 vs template','conflict','tab hanging 25mm',CF,'guide implemented')
c('caption-size','captions 11pt bold label','guide 3.3','11','11.0 (docx sz22)',P,tol='0.1pt')
c('caption-position','figure caption below, table above','guide 3.3','below/above','as expected',P)
c('continued-caption','(Devami) caption on continuation','guide 3.1','Tablo 4.1 (Devami)','present; header row repeated',P)
c('figure-table-centre','figure/table centred','guide 2.3/3.1','105.0','image centre 105.0; table rules 30.1-179.9',P,tol='0.5mm')
c('table-cell-size','table cell font','guide 2.2 (8-12 allowed); template 11','8..12','12',I,'not strictly specified')
c('bib-format','bibliography hanging 1.25cm, single, 6 before 0 after','guide 4.3.6','hang 12.5, gap 4.87+2.11','hang 12.49, gap 6.98',P,'template renders 11pt/5mm/no gap: conflict recorded, guide explicit used')
c('bib-title','KAYNAKLAR numbered','guide 4 / template','N. KAYNAKLAR','7. KAYNAKLAR',P)
c('docx-sections','DOCX margins 25/30mm, hdr/ftr 12.5','template sectPr','24.994/30.004','24.994/30.004; 19 sections',P,tol='0.05mm')
c('docx-opens-in-word','exported DOCX opens in Word','real export','opens','Word COM Open fails for cog.docx/cog2.docx (earlier self-1 export opens). document.xml has invalid <undefined> element x2 around TOC field runs. Strip-test inconclusive (Word hung)',F,'export component (DOCX TOC field writer, commit d5abcfd)')
c('docx-para-vs-pdf','DOCX same paragraph rules as PDF','real export','same','DOCX before/after 120/240/534 mix; Word render not verifiable',I,'unverified')
n=lambda r:sum(1 for x in C if x['result']==r)
out=dict(target='aku-cografya-lisans',registryId='aku-cografya-lisans-tr-v1',attempt='independent-1',validatedAt=datetime.datetime.now().isoformat(),exports={f:sha(f) for f in ('cog2.pdf','cog2.docx','cog-run1.pdf','cog-run1.docx','src-word.pdf')},checks=C,counts=dict(PASS=n(P),FAIL=n(F),CONFLICT=n(CF),INFO=n(I)),verdict='FAIL')
json.dump(out,open('orchestration/validation/aku-cografya-lisans/independent-1.json','w',encoding='utf8'),ensure_ascii=False,indent=1)
print(out['counts'])
md="# Independent validation 1 - aku-cografya-lisans-tr-v1\n\nVerdict: FAIL. Counts: %s\n\nMethod: fresh real export (export.mjs, Chrome; fixture2 + default fixture run1); official template rendered with Word COM (src-word.pdf); guide read directly.\n\n## FAIL\n"%out['counts']
for x in C:
    if x['result']==F: md+="- **%s**: expected %s; actual %s. %s\n"%(x['id'],x['expected'],x['actual'],x['evidence'])
md+="\n## CONFLICT / INFO\n"
for x in C:
    if x['result'] in (CF,I): md+="- %s [%s]: %s | %s\n"%(x['id'],x['result'],x['source'],x['evidence'])
md+="\n## PASS\n"+", ".join(x['id'] for x in C if x['result']==P)+"\n\nNote: several WINWORD processes remain after failed Open attempts; PIDs were not individually recorded.\n"
open('orchestration/validation/aku-cografya-lisans/REPORT-independent-1.md','w',encoding='utf8').write(md)
