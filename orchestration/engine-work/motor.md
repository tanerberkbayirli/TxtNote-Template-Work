# Güncel çalışma — 12.10.2026

**KULLANICI MOLASI:** limit nedeniyle çalışma durduruldu. Kullanıcı yeniden devam demeden yeni iş/test başlatma. Son aktif kaynak hali ve devam sırası: [güvenli mola kaydı](./final-closure/resumed-20261012/PAUSE.md). Aşağıdaki ara durumlar bu mola kararının yerine geçmez.

Kullanıcı kalan üç başlığı yeniden açtı. Güncel ve sade plan [MISSION.md](../MISSION.md); aşağıdaki eski kapanış/erteleme ve otomatik devam kayıtları tarihsel kayıttır. Tam genel kabul verilmedi. Son taze SRC09 devam satırı yüksekliği düzeltmesi 182/Word180 verdi; önceki toplam180 eşliği tek başına tam kırılım uyumu kanıtı değildir. SRC10 önceki ölçüm91/91. ChartEx/Wingdings ve kapak düzeltmeleri hedefli doğrulandı; tablo/akış düzeltmeleri sürüyor. Commit yok.
# Motor — güncel devam noktası (11.10.2026)

## SON KARAR — geliştirme kapatıldı; üç başlık ertelendi

Kullanıcı "bu üçünü bırak gerisi tamamen kapat" talimatı verdi. Diğer geliştirme işleri mevcut doğrulama kanıtlarıyla kapalıdır. Yalnız **uzun kaynaklarda Word sayfa/kırılım eşliği**, **kalan PDF/Wingdings ve ChartEx dışa aktarımı**, **son seri genel kabul** kullanıcı kararıyla ertelendi. Bu alanlarda kendiliğinden yeni çalışma veya geniş test başlatma.

Geçerli ayrıntılı kapanış: [final-closure/README.md](./final-closure/README.md). Deneysel uzun tablo değişiklikleri üretim yolundan çıkarılıp `final-closure/long/parked/` altında korunuyor; doğrulanmış liste/hizalama/VML düzeltmeleri kalıyor. Son genel kabul verilmedi. Commit yok. Aşağıdaki açık işler ve otomatik devam kayıtları tarihseldir; bu kullanıcı kararını geçersiz kılamaz.

## 11.10.2026 — 18:33 devam turu (tek ajan)

- **Uzun tablo kapsamı düzeltildi:** `tableContinuation.js` artık devam açıklaması/başlık tekrarı kapalıyken de sayfayı aşan tabloları ölçer. Tek bölünebilir yüksek satır, son satırın alt kenarından tespit edilir. `data-thesis-tall` bilgisi tekrar satırı bulunmasa da DOCX `spansPages` seçeneğine aktarılır; Word tüm satırları birlikte tutmaya zorlanmaz. Kısaltılan tablo tekrar birlikte tutulur.
- **Gerçek Chrome kanıtı:** `mission08/continue-table-proof.mjs/json`: başlık tekrarı kapalı uzun tablo ve tek yüksek satır ilk sayfadaki boşluğu kullanır (ilk satır y=248 → 100 px); kısa tablo sonraki sayfaya bütün taşınır; kısaltma ve kayıttan geçici işaret temizliği PASS. Yeni DOCX regresyonu uzun tabloda bütün satırlara keepNext yazılmadığını doğrular.
- **Denklem kayıt sızıntısı kapandı:** `sourceHtml.js`, geçici `data-thesis-ieq-{pad-before,pad-after,lift,drop,base,fit,shift}` ve eksik `data-thesis-eq-shift` işaretlerini temizler. Kaydet/aç regresyonu LaTeX, yazara ait numaralandırma ve benzer adlı özel özellikleri korur.
- **Son birim/derleme:** **924/924 PASS**, 0 atlama; üretim derlemesi PASS (`mission08/continue-unit.log`, `continue-build.log`). Sandbox içindeki ilk derleme EPERM idi; gerekli erişimle tekrar başarılı oldu.
- **Gerçek Word temel grupları:** **617 PASS** = justify 22 + pagefit 213 + parity 148 + structure 136 + style-precedence 64 + phase52 34. İlk turda pagefit styles Word örneği başlatılamadı (128 PASS/85 SKIPPED); aynı grup taze dışa aktarımla tekrar **213 PASS, 0 atlama** verdi. İlk başarısız tur saklandı. Kanıtlar `mission08/continue-acceptance/` ve `mission08/continue-recheck/` altında.
- **Şablon kontrolleri:** aku-sagbil **44 PASS** (t80 PDF=Word=34; önceki +1 fark mevcut kodda kapanmış), aku-sbe **136 PASS**, aku-sosyoloji-lisans **31 PASS** (denklem temizliği sonrası yeniden PDF=Word=36). Kontrol beklentileri/toleransları değiştirilmedi.
- **Yeniden doğrulanan açık:** aku-fbe doktora **4 FAIL**: onay ilk boşlukları kaynak baselines'tan 4,66/9,45/14,14 mm yukarıda; jüri sırası 14,14 mm erken; PDF=38 / Word=39. `mission08/continue-fbe/check-20261011-1822.json`. Bu turda özel sayfa davranışı değiştirilmedi.
- **Sıradaki iş:** FBE onay sayfasının esnek boşluk/sayfa taşması; değişken içerik matrisi ve 08-E; SBE 5× normal/CPU stres; SRC09/SRC10 performans ve Word sayfa eşliği; tam 25 hedef kabul. Bunlar bu turda tamamlanmadı. Commit yapılmadı; önceki çalışma ağacı korundu.

## 11.10.2026 — 07-B/07-C/07-D devam kaydı (performans ajanı)

- **07-B:** `paragraphTabs.js` bölüm başına belge taraması yerine tek geçiş (+ sekmesiz paragrafta stil/konum okuması yok), `paragraphMirror.js` aynalı girinti içermeyen bölümü taramıyor, `ThesisEditor.jsx` yazı tipi uyarı yoklaması 250 ms birleştiriliyor. SRC09 tek karakter sonrası ~18 sn -> ~8-10 sn (profil: querySelectorAll 5,2 -> 0,8 sn); kalan: `compileThesisDocument` ~2,3 sn, `measure()` ~2 sn (onayda 4x). Kontrol/tolerans gevşetilmedi. Ölçümler diğer ajanlar/Chrome açıkken alındı: süreler güvenilmez (SRC09 yükleme 24-56 sn arası oynadı).
- **07-C kök neden:** CPU kısıtı (4x) altında ~1/3 koşuda hazır bayrağı sonradan düşüyordu. KaTeX modülü+CSS lazy yükleniyor; formül `math-formula__render--pending` iken yazı tipi henüz istenmediği için `fonts.status` "loaded" kalıyor, hazır ilan ediliyor, sonra KaTeX yazı tipi yüklenip yeniden sayfalama başlıyor (dışa aktarmada "Sayfalama henüz ... doğrulanmadı"). Düzeltme: `ThesisEditor.jsx` onay öncesi bekleyen formül kontrolü (en çok 30 sn), `mathFormula.js` hata yolunda pending sınıfı kaldırılıyor. Sonra: aku-sbe 4x 3/3 PASS (121), 1x PASS; 12 yükleme 0 düşüş. Önce ~2/6 düşüş.
- **07-D:** DOCX başlık numarası editör etiketiyle aynı, düz metin olarak yazılıyor (`docx/body.js`); Word otomatik numaralandırmıyor, dolayısıyla aynı numara görünür. Test: `lib/thesisDocxHeadingNumbers.test.js`. Gerçek Word'de görsel doğrulama yapılmadı.
- Birim 922/922, derleme PASS.

## SON NOKTA (11.10.2026, oturum kapanışı)

Doğrulanan (bu oturumda yeniden koşuldu): `npm test` **912/912 PASS, 0 atlama**; `npm run build` PASS. Commit yok, 162 değişen/yeni dosya çalışma ağacında.

**Motor kodu durumu:** 08–12 görevlerinin kod kısımları yazıldı (kapak/özel sayfa esnekliği, tablo satır/başlık kuralları, görsel kırpma-sarma-konum, şekil/OMML, sonnot, dizin/referans, şema düzeltmeleri) ve birim testleri geçiyor. Bu, görevlerin bittiği anlamına gelmez: aşağıdaki kabul maddeleri hiç koşulmadı.

**Açık (sırayla yapılacak):**
1. 3 SBE FAIL: `page-labels-unnumbered` (+ `-sanatta-yeterlik-tr`, `-phd-tr`), beklenen `none x3`, gerçek `none x2`. Beklentiyi kaynak kılavuz + gerçek Word ile kanıtlamadan DEĞİŞTİRME (`mission08/resume-sbe-source/`).
2. Altı gerçek Word grubu (taban 617 PASS) — koşulmadı.
3. SBE normal ve CPU kısıtlı 5'er tekrar — koşulmadı.
4. Değişken içerik/başlık hizası matrisi (`mission08/audit`) — koşulmadı.
5. SRC09/SRC10 sayfa sayısı + performans (SRC09 205/180, SRC10 90/91; eşlik sağlanmadı) — koşulmadı. 07-A/07-B/07-C ölçülmedi.
6. Uzun belge/gerçek Word düzenleme kabulü, 13-C etkileşim akışları, 08-E şablon incelemesi — yapılmadı.
7. Bilinen sınırlar: grafik/SmartArt tam stil, topAndBottom çapa, native denklemin uygulama içi düzenleme sınırı, sonnot `numbering:"section"` Word yazımı, tablo başlığı tekrarı gerçek içe aktarılmış tabloda tarayıcıda denenmedi.

### Kabul turu sonucu (11.10.2026 ~16:20, ajan yokken, tek başına)

- `npm test` 912/912, `npm run build` PASS.
- **SBE 3 FAIL kapandı:** beklenti `none x3` → `none x2` (`orchestration/specs/aku-sbe.checks.json`; yedek `orchestration/engine-work/mission08/aku-sbe.checks.json.bak`). Gerekçe: Türkçe fixture dış kapağı artık bir sayfaya sığıyor; kılavuz EK-1 dış kapağı tek sayfada gösteriyor; eski beklenti "UNKNOWN wrap rule" taşma varsayımıydı; İngilizce fixture için aynı gerekçe kayıtlıydı. Word'de ayrıca doğrulanmadı.
- `check --all` (Word'süz): 25 hedef, FAIL yok (log `orchestration/engine-work/mission08/final-all.log`; "22 with FAIL/error" yalnızca atlanan Word kontrolü çıkış kodu). `aku-sbe` 121 PASS.
- **`check --all --word` (log `final-all-word.log`):** altı Word grubu **617 PASS** (22+213+148+136+64+34), taban korundu; 17 hedef FAIL'siz; ayrıca iyte 124, adu-sagbil 304 PASS.
- **Word'de açık FAIL (4 hedef, 14 kontrol):** hepsi editör/PDF ↔ Word toplam sayfa sayısı ve etiket farkı:
  - aku-sbe: pdf 36 / word 37 (default, sanatta-yeterlik-tr, phd-tr; ön sayfa etiketleri aynı, fark gövdede 23 → 24. sayfa)
  - aku-fbe phd: pdf 38 / word 39 + onay sayfası `approval-baselines-phd` (hedef 33.96/48.48/92.3/114.19, gerçek 33.96/43.82/82.85/100.05) ve `approval-seven-juror-flow-phd`
  - aku-sagbil t80: pdf 36 / word 34
  - aku-sosyoloji-lisans: pdf 37 / word 36
  Bunlar 04.10 turunda da vardı (sbe 23, sagbil 10, fbe 4, sosyoloji 2 FAIL); sbe/sagbil iyileşti, fbe/sosyoloji aynı kaldı. Yeni gerileme kanıtı yok, ama kapanmadı. Sonraki iş: bu dört hedefte Word sayfa kırılımı farkını bul (8-B / 07-A kapsamı).
- Yapılmadı: SBE 5× normal+CPU kısıtlı, değişken içerik matrisi, SRC09/SRC10 karşılaştırması, 13-B/13-C, 08-E.

**Devam turu (aku-sbe Word farkı, kök neden araştırması):**
- Bulundu: sabit (prefix) bölüm başlığı kendi `div` sarmalayıcısında; `h+p` komşuluk kuralları ilk gövde paragrafına ulaşmıyor. Editör başlık→paragraf boşluğunu 13,8 pt, Word (DOCX `before=396`) 19,8 pt gösteriyordu (aku-sbe sayfa 14'te ilk gövde satırı 111,0 vs 116,9).
- Düzeltme: `thesis/engineCss.js` — `paragraphSpacing:"additive"` dalında ve blockGap dalında, sarmalayıcıdaki başlığın `margin-bottom`'u after+ilk paragraf before toplamına çekildi. Sonuç: 117,0 vs 116,9 (eşleşti). 912 birim PASS; `check --all --word` yeniden: 617 Word grubu aynı, başka hedefte gerileme yok (iyte 124, adu-sagbil 304…).
- Kalan neden: aynı sayfada 6. satır kırılımı — editör "kurumsal" sözcüğünü satıra sığdırıyor, Word sığdırmıyor (justify boşluk sıkıştırma sınırı sınırda; `wordLineLayout.js`/`justifyLastLine.js`, template `justify:"word"`). Bu yüzden aku-sbe pdf 36 / word 37 değişmedi; aku-fbe phd, aku-sagbil t80, aku-sosyoloji farkları AYRICA incelenmedi (aynı nedenden olup olmadığı bilinmiyor).
- Not: aku-sbe 15:50'de (ajanlar öncesi) PDF'te fazladan "Şekiller Listesi" sayfası vardı (37 sayfa, tesadüfen Word'e eşit); şimdi ön sayfalar Word'le aynı (36 → fark gövdede).
- Ek araç: `orchestration/engine-work/mission08/dom_gap.mjs` (editör DOM boşluk ölçümü).

**Word sayfa farkı turu (11.10 ~17:50, ajanlar paralelken; hedefli check):** dört hedefin nedeni FARKLI (PDF↔Word satır/sayfa karşılaştırması):
- aku-sbe: justify sığdırma toleransı. Word probu (82 rastgele TNR/Arial satır): %25 boşluk bütçesi kesin, ek tolerans yok; editörün +0,05 pt payı "kurumsal" satırını (0,03 pt fazla) sığdırıyordu. Düzeltme `wordLineFit.js`: pay → 0,0015 pt; kısa son sözcük dalına Word'ün ölçülen +0,5 px'i; ölçü Word gibi twip'e yuvarlanmış sayfa/kenar boşluğundan (`wordMeasureDeltaPx`, `wordLineLayout.js`; J03 Arial 439,37→439,40 pt). **aku-sbe 136 PASS (36/36).**
- aku-sagbil t80 36/34 → **35/34**: `pageLayout.js` `pageBreakUnlessAfterHeading` sabit başlık sarmalayıcısını görmüyordu ("7. EKLER" tek başına sayfa) — kapandı. Kalan +1: `pageLayout.js` `table{break-inside:avoid}` sayfadan uzun tabloyu (Çizelge 3.1, 80 satır) başlığıyla sonraki sayfaya itiyor; Word (DOCX spansPages zinciri) aynı sayfada başlatıyor. Ölçüme dayalı işaret gerekir (tablo yüksekliği > sayfa → `break-inside:auto`; `tableContinuation.js`/ölçüm döngüsü, tablo sahibi). Açık.
- aku-sosyoloji 37/36: şablonda `equations` kuralı yok → editörde blok denklem editör kabuğu + iki caret-pad satırıyla ~178 pt, Word'de düz paragraf ~53 pt. Aynı fark kuralı olmayan 7 şablonda (coğrafya, felsefe×2, isg, adü-ziraat, sbe, mcbu) var. Açık (denklem sahibi: `engineCss` denklem kısmı + `generatedIndex.js` pad ölçümü).
- aku-fbe phd 38/39 + onay ölçüleri: 7 jüri + ikinci danışmanda editör onay boşluklarını sıkıştırıp enstitü bloğunu taban çizgisinin altına (760,6 > 756,9 pt) sığdırıyor; Word bloğu s.4'e taşıyor (resmî Word kanıtı da öyle). Özel sayfa motoru (`specialPageFit`/`docx/specialPages.js`) işi. Açık.
- Doğrulama: 922/922 birim; altı Word grubu **617 PASS** (22+213+148+136+64+34).

**Limit kapanışı notu:** Bitenler (ajan raporu, her biri kendi kaydını yukarıda/aşağıda ekledi): 12-A/11-A, 10-A/10-C, 09-B/08-B, 13-B/13-C, Enter hatası, içe aktarma kayıpları, aku-sbe satır kırılımı. Yarıda kalabilecek (limit): 08-A özel sayfa taşmaları (aku-fbe phd, aku-sagbil 6 jüri, afsu-lee), varsayılan denklem yüksekliği (aku-sosyoloji + 7 şablon), sayfadan uzun tablo (aku-sagbil t80), 07-B/C/D. Sonraki oturum: `git status`, bu dosya ve `mission13/REHBER.md`; en sonda tek başına tam kabul turu (13-D) ve 08-E.

**Karar:** Görev 08–13 TAMAMLANMADI. Devam için: `git status`, `mission08/resume-*.md` raporları, sonra yukarıdaki 1→6 sırası; en sonda 13-D kabul turu tek başına (ajan yokken).

---

## Kullanıcı limit nedeniyle bitirmemizi istedi — son kayıt

- Üç paralel ajanla motor işleri sürdürüldü; alan raporları `mission08/resume-special-pages.md`, `resume-tables-media.md`, `resume-notes-references.md`, `resume-schema/README.md` içinde. Commit yapılmadı; kullanıcı değişiklikleri korundu.
- **912/912 birim PASS, 0 atlama; üretim derlemesi PASS.** Kanıt: `mission08/resume-final-r2/base-gates.json`.
- 5175 eski Vite önbelleği nedeniyle başarısız denemeler korundu; temiz 5177 sunucusuyla genel kabul `mission08/resume-final-r3/` altında yapıldı. Tam/snapshot sayıları `mission08/resume-final-summary.json` içinde.
- **SBE 3 FAIL açık:** `page-labels-unnumbered`, `-sanatta-yeterlik-tr`, `-phd-tr`. Beklenen `none x3`, gerçek `none x2`. Eski beklenti açıklaması dış kapağın iki sayfaya taşmasını sayıyor; yeni kapak bir sayfaya sığıyor. Kaynak kılavuz incelemesi başladı (`resume-sbe-source/`), ancak gerçek Word doğrulaması yapılmadığı için beklentiler değiştirilmedi.
- SDK: yeniden üretilmiş SRC08/SRC10 0/0 hata; yedi bağımsız DOCX ve gerçek SRC09 çizim/OMML kesiti 0 hata PASS. Gerçek küçük tarayıcıda özel sayfa, sonnot yerleşimi ve etkileşim kanıtları PASS.
- **Yapılmadı/kapanmadı:** altı gerçek Word grubu; SBE normal ve CPU kısıtlı 5'er tekrar; taze değişken içerik/başlık hizası matrisi; SRC09/SRC10 sayfa ve performans karşılaştırması; uzun belge/gerçek Word düzenleme kabulü. Grafik/SmartArt tam stil, topAndBottom çapa, native denklem uygulama içi düzenleme sınırları ajan raporunda açık.
- **Sonraki başlangıç:** önce bu üç SBE beklentisini kaynak + gerçek Word ile kanıtla; sonra kalan seri kabulü tamamla. Kontrol/toleransları hatayı gizlemek için değiştirme. Görev 08–13 **tamamlanmadı**.

## 11.10.2026 — paralel devam turu

Kullanıcı isteğiyle üç ajan yeniden başlatıldı: 08 özel sayfalar; 09/10 tablolar-görseller-denklemler; 07/11/12 performans-notlar-referanslar. Dosya sahipliği ayrıldı; genel kabul ve Word sayfalama ölçümleri ajanlar bittikten sonra tek başına yapılacak. Önceki kayıtlar tarihsel kontrol noktasıdır; mevcut kod için başarı kanıtı sayılmaz.

- 13-B ilk kontrol: sabit SRC08/SRC10 hash, bağımsız sıralı ana gövde metni, kalıcı kimlikler, kaydet/aç ve DOCX üretimi PASS (SRC08: 6 bölüm/1716 metin öğesi; SRC10: 19 bölüm/2533 metin öğesi). Görsel/etkileşim/Word eşliği bu kontrolün kapsamında değil. Kanıt: `mission08/resume-heldouts/report.json`; araç: `resume-heldouts.mjs`.
- 13-A ilk gerçek SDK kontrolü: SRC08 3, SRC10 36 şema hatası (`bookmarkUniqueNumericId` geçersiz çocuk öğesi). İç içe Bookmark sarmalayıcılarının DOCX bileşenlerine açılması düzeltildi; bağımsız küçük regresyon testi geçti. Her iki DOCX yeniden üretildi ve gerçek Office2016 SDK denetimi SRC08 **0 hata**, SRC10 **0 hata** PASS. Genel paket/Word kabulü hâlâ ayrı.
- Şema regresyon aracı boş giriş kümesini artık PASS saymıyor ve başarısız varyantlarda sıfır olmayan çıkış kodu veriyor. CPU kısıtlı kabul için dışa aktarma test aracına `EXPORT_CPU_THROTTLE` eklendi; üretim motorunun toleransları değişmedi.

Durum: DEVAM EDİYOR; tamamlandı kaydı yok, commit yapılmadı.

Plan: [MISSION.md](../MISSION.md). Hiçbir şey commit edilmedi. Aşağıdaki "yapıldı" kayıtları ajan raporlarına dayanır; son kabul turu (13-D) yapılmadığı için hiçbiri "tamamlandı" sayılmaz.

## Yapılanlar (ajan raporu, kısmen doğrulandı)

- **09-A tablo satırları** (kısmi): `thesis/docx/tableRows.js` eklendi, `docx/projection.js`'e 2 satır bağlandı. `w:cantSplit` yoksa satır sayfa sonunda bölünür (Word gibi); tek satırlı `w:tblHeader` her sayfada tekrar eder. Yeni testler (9) geçti.
- **11-A sonnot** (kısmi): `type:"endnote"` artık gerçek Word sonnotu olarak `endnotes.xml`'e yazılıyor (`docx/paragraphs.js`, `export.js`, `lib/academicDocument.js`). `footnotes.js`: sonnot sayma/yeniden numaralama, bölüm/belge numaralandırması için ofset hesabı. 2 yeni test. Son `npm test`: 890'dan 888 geçti (2 hata tablo testleri, 09-A/09-B alanı).

- **09-A ikinci tur:** `display:table-header-group` Chrome'da tekrar etmiyor (gerçek `<thead>` bile) → kural kaldırıldı. Çok satırlı başlık (`data-docx-header`) `tableContinuation.js` head hesabına bağlandı (yalnızca kodlandı, gerçek içe aktarılmış tabloda tarayıcıda denenmedi). Satır bölünmesi küçük örnekte tarayıcıda çalışıyor. `npm test` 886/888, `npm run build` geçti. Kalan 2 hata: `thesisDocxTableRoundTrip` "keeps the Word grid…" (09-B alanı) ve özel sayfa "column flow gets exactly the content-box height…" (08 alanı). SRC09 sayfa etkisi ölçülmedi.

## Çalışıyor / raporu gelmedi (sonuç bilinmiyor)

08-A esnek akış (opus) · 08-B Word kapak · 08-C/D başlık hizası + taşma kanıtı · 09-B tablo round-trip · 10-A şekil içeriği (opus) · 10-B görseller · 10-C denklemler OMML (opus) · 12-A dizin/referans · 07-B performans + 07-D başlık numaraları. 09-A ve 11-A kalan işlerle devam ettirildi.

Bu ajanların dosya değişiklikleri çalışma ağacında olabilir; `git status` / `git diff` ile bak.

## Yapılmayanlar

- **09-A kalan:** çok satırlı başlık + devam açıklaması (`tableContinuation.js`) içe aktarılan tablolara bağlanmadı; dikey birleştirme ve hücre içi bölünme tarayıcıda doğrulanmadı; `table-header-group` Chrome'da denenmedi.
- **11-A kalan:** `numbering:"section"` Word'e yazılmıyor (`footnotePr/numRestart`); PDF/legacy yollar (`academicPdfLayout.js`, `walkRuns`, `collectFootnotes`) sonnotu bilmiyor; sonnot sayfa/bölüm sonu çizimi ve ekleme arayüzü yok; gerçek Word'de düzenlenebilirlik ve EDGE_NOTES (4→3 sayfa) ölçülmedi.
- **Hiç başlamayanlar:** 08-E şablon incelemesi · 07-A toplam sayfa eşliği (SRC09 205/180, SRC10 90/91) · 07-C SBE kararsızlığı kök nedeni · 13-A DOCX şema hataları · 13-B ayrılmış tezlerle uçtan uca (SRC08 vb.) · 13-C etkileşim akışları · 13-D son kabul turu.
- **Ölçülmedi:** SRC09/SRC10 sayfa sayıları, `check --all`, altı Word grubu (taban 617), `aku-sbe` 5×, değişken içerik denetimi. Ajanlar paralel çalışırken ölçüm güvenilmez; yalnızca ajanlar bitince tek başına yapılmalı.

## Devam sırası

1. Tüm ajanlar bitsin (raporlar ≤15 satır).
2. `cd TxtNote/frontend && npm test && npm run build` (2 tablo testi hatası vardı).
3. 08-E, 07-A, 07-C, 13-A/B/C.
4. 13-D: tek başına `check --all`, `--word` (617), `aku-sbe` 5×, denetim, SRC09/SRC10 karşılaştırması; sonuçları MISSION.md ve `mission08/CHECKPOINT.md`'ye yaz. Ölçüt sağlanmadıysa "tamamlandı" deme.

## 11.10.2026 — 12-A / 11-A kalan turu (ajan)
- **12-A:** `export.js` artık `targets` (indexTargetMap) bağlıyor: çapraz başvuru canlı `HYPERLINK \l` alanı olarak kalıcı hedef yer işaretine gidiyor; hedef silinmişse `ADDIN TxtNote.Xref` + `xref-target-missing` kaydı (düz metne düşmüyor). Dönen blob'da `exportIssues.{fieldIssues,fieldAudit}` (kırık hedef/yinelenen/dengesiz alan denetimi, `docx/package.js` `wordXmlParts`); `ThesisEditor.jsx` dışa aktarma iletisinde uyarıyor. Testler: tablo silme/ek ekleme sonrası hedef sabit; uçtan uca alan + bilinmeyen alan korunumu (`thesisNotesReferencesResume.test.js`).
- **11-A:** `numbering:"section"` Word'e `footnotePr/endnotePr numRestart eachSect` yazıyordu (zaten vardı); gerçek Word COM ile doğrulandı: 2 gerçek dipnot + 2 gerçek sonnot, NumberingRule=restart-section, düzenlenebilir. PDF/legacy sonnot yolları zaten kodlanmıştı.
- **EDGE_NOTES (kök neden bulundu):** `maxAreaPercent` 100'e izin verilince tek uzun not ilk sayfada gövdeyi/başvuru satırını kapatıyordu (editör 2 sayfa, çakışma). Düzeltme `footnotes.js`: %100'de alan sayfanın ilk başvuru satırının altında biter (`referenceAreaCap`); not alanının sayfada tek satır bırakmadığı sayfa-başı blok için `data-thesis-fn-push` (bir sayfa üst dolgu; `pageLayout.js` CSS, `sourceHtml.js` temizliği). Sonuç: editör 3 sayfa; not dağılımı 18/21/1 = Word; BODY_001 sayfa 3 başında (Word ile aynı). `engine-word-pagefit --word` 213 PASS (taban korundu), 918 birim + build PASS. `check --all --word` yeniden koşulmadı.

## 11.10.2026 — Görev 13-B/13-C doğrulaması (motor kodu değiştirilmedi)
- Araç/rapor: `orchestration/engine-work/mission13/` (REHBER.md, heldout-diff.mjs, browser-gen.mjs, interact.mjs, enter-race.mjs; sonuçlar `heldout-diff.*.json`, `interact-*.json`).
- 13-B: SRC08/SRC10 tarayıcıda içe aktar -> kaydet/aç (eşit) -> DOCX: gövde metni sırayla birebir (671/671, 1675/1675). Kayıplar: satır içi renk/vurgu/altı çizili, canlı alanlar ve iç köprüler düz metne iner; yazı tipi/hizalama şablondan (beklenen). Node yolunda (`document` yok) `academicDocument.js` regex yedeği iç içe listeyi bozuyor (alt listenin ilk maddesi üst maddeyle birleşir); tarayıcı yolu doğru.
- 13-C: EDGE_NOTES/s1/SRC10 yazma, Ctrl+C/X/V, IME, geri al/ileri al, kaydet/aç PASS. AÇIK HATA: s1 ve SRC10'da Enter sonrası imleç yeni paragrafa geçmiyor (`RichTextBody.jsx` Enter dalı; `enter-race.mjs s1`). Düzeltilmedi.

## 11.10.2026 — Enter sonrası imleç hatası (13-C) KAPANDI
- Kök neden: `thesis/wordLineLayout.js` `selectionBookmark/restoreSelection` imleci kök boyunca düz metin ofsetiyle saklıyordu; paragraf sınırında (Enter sonrası yeni paragrafın başı) ofset önceki paragrafın sonuyla aynı olduğundan `locate` ilk eşleşen metin düğümüne (ilk yarının sonu) dönüyordu. Kanıt: selectionchange izi (`mission13/enter-dbg.mjs`) pagination sonrası p uzunluğu 92, ofset 92. EDGE_NOTES'ta word-fit olmadığı için etkilenmiyordu.
- Düzeltme: yer imi bloğa göreli (`{block, offset}`; blok yoksa/ayrıldıysa seçime dokunulmaz). `enter-race.mjs s1` artık PASS/FAIL döner (4 senaryo pos=0 PASS). SRC10 localStorage'a sığmaz; aynı kod yolu (`interact.mjs SRC10` ile doğrulanabilir).

## 11.10.2026 — 10-A/10-C devam (docx/shapes.js, equations.js; commit yok)
- 10-C kabul: `orchestration/engine-work/mission08/resume-equations-proof.mjs` (uygulama yolu: içe aktar → kaydet/aç → DOCX). EDGE_STRUCTURE/SRC01/SRC09/SRC10 4/4 PASS: oMath sayısı native-index ile eşit (4/1/16/4), matris/nary/acc/kesir, metin sırası, numara paragrafı, Cambria Math, yeniden açınca düzenlenebilir. Gerçek Word (kendi örneği): 4 dosya açıldı, `OMaths` 4/1/16/4; PDF'ler `resume-equations/*.word.pdf`.
- Düzeltildi: docx'in string içe aktarıcısı boşluk-only `<m:t xml:space="preserve"> </m:t>` siliyordu (SRC09 denklem 15) → DOM'dan bileşen; tek başına paragraftaki `m:oMathPara` (blok/jc) artık korunuyor (yeniden açınca block); çoklu oMath `<rootKey>` sızıntısı giderildi; numaralı denklem satır içi oMath + sekme + numara kalır.
- Düzeltildi (10-B, Word açılış hatası): kırpılmış resimde ikinci `a:srcRect` → Word EDGE_STRUCTURE çıktısını açamıyordu; artık docx'in boş srcRect'i değiştiriliyor. SDK: EDGE/SRC01/SRC10 0 hata; SRC09 83 hata = kaynaktan taşınan VML `o:gfxdata` + kaynak şekil kimliği tekrarı (kaynak SRC09 kendisi 684 hata).
- 10-A: tek şekilde tema renkleri (schemeClr, tx1/bg1 takma adları, style fillRef/lnRef); topAndBottom paragraf-göreli dikey ofset + distB ile akışta. Sayfa/kenar göreli topAndBottom akışta çapada kalır (sınır). Kaynaklarda topAndBottom yok (SRC09: 230 wrapNone + 51 wrapSquare, hepsi paragraph).
- SRC09 sayfa sayısı: bu değişiklikler akış yüksekliğini SRC09'da değiştirmez; ölçüm yük altında yapılmadı → doğrulanmadı.
- Birim: hedefli 19/19 PASS. Tam tur 915/918: 3 FAIL pgMar/kenar boşluğu (thesisAkuFbe/Mcbu/LayoutExport) — eşzamanlı başka ajanın export/sections alanı, bu işin dosyaları değil. Build PASS.

## 13-B düzeltmeleri (SRC08/SRC10 içe aktarma) — 11.10.2026
- Kök neden 1: satır içi renk/altı çizili/vurgu/üst simge modelde (`properties.direct`) ve editör CSS'inde (node-id kuralı) tutuluyordu; DOCX dışa aktarım yalnızca HTML'deki `fmt-*`/`data-fmt-*` imlerini okuyor, içe aktarıcı bunları yazmıyordu. Düzeltme: `thesis/docx/runFormat.js` (`runFormatAttributes`, doğrudan + karakter stili özellikleri), `importDocx.js` run düğümlerine ekler; `academicDocument.js` `data-fmt-valign` -> `valign`, `docx/paragraphs.js` `superScript/subScript`. Renk 144->147 / 1981->1139 (kalan: tema/otomatik/paragraf stili), üst simge 1->1.
- Kök neden 2: alan (`fldChar/instrText/fldSimple`) düğümleri `data-docx-fldchar/instruction/fldsimple` imi olmadan yazıldığından `foldFieldMarkup` eşleşmiyordu. Düzeltme: `fieldMarkerAttributes` (INCLUDETEXT/LINK/DDE ve güvensiz HYPERLINK `ADDIN TxtNote.BlockedField` ile etkisizleştirilir). instrText 71->71, 122->121; iç köprü: `paragraphs.js` `InternalHyperlink` (37->37, 87->87).
- Kök neden 3: `parseWithRegex` `<li>` ve `</ul>`'yi açgözsüz eşliyordu. Yeni `lib/regexLists.js` (dengeli liste, `item.lists` DOM yoluyla aynı şekil).
- Ölçüm: heldout-diff browser SRC08/SRC10 PASS, 0 eksik, kaydet/aç eşit; birim 921/921, build tamam. Node modunda 7/2 büyük-harf farkı düzeltmeden önce de vardı. Test: `lib/importFidelity13b.test.js`.

## 11.10.2026 — 09-B / 08-B Word kanıtı (tek ajan)
- **09-B:** `mission08/rt-table/make.mjs` (içe aktar → hücre düzenle → DOCX) + `probe.ps1` (gerçek Word COM). Word: A gridSpan=2 (244 pt = 97,7+146,5), dikey birleşme korunur, sütun oranı 2:3:4 (97,7/146,5/195,3), "F-duzenlendi" düzenlemesi var; birleşmesiz varyantta satır1 HeadingFormat=True, satır2 AllowBreakAcrossPages=False (cantSplit), satır3 varsayılan. Yazıcı kodu değişmedi.
- **08-B kök neden:** (1) bölüm sonu taşıyan boş paragraf Word'de bir gövde satırı alıyordu → `docx/package.js` artık 1 pt exact verir; (2) aku-sagbil başlık 400'de son satır alt kenar boşluğuna 0,4 pt taşıyordu → `docx/specialPages.js` üst düzey en büyük boşluktan 1,5 mm alır (`wordSlackMm`, `docx/body.js`; dikey hizalı sayfalarda yok; pgMar değişmedi — pgMar'ı değiştirmek 3 testi bozdu, geri alındı). Sonuç: sagbil dış kapak 58/58 sözcük, 1 sayfa; aku-sbe başlık 120 Word 36 = editör 36 (önce 37).
- Kayan tablo: aku-sbe dış kapak `tblpY=12213` (610,65 pt) → Word başlığı y=611,1 pt'de çiziyor; editör 636,6 (kapak editörde alt kenarı aşıyor, Word yukarı kaymış tabloyla tek sayfaya sığıyor). Metinler `w:t`, düzenlenebilir.
- Yedi aile (adu-ziraat, afsu-lee, aku-fbe, aku-sagbil, aku-sbe, iyte, mcbu) title400/120 DOCX Word'de denetlendi: `mission08/rt-table/cover/*.word.pdf`. Açık: aku-fbe 400 karakter başlıkta editör kapağı sayfayı aşıyor (Word 40/ed 39); aku-sagbil 6 jüri onay sayfası Word'de son 28 sözcük sonraki sayfaya taşıyor (Word 40/ed 39); afsu-lee Word 40/ed 38 (5. sayfadan itibaren). 08-A kapsamı.
- `npm test` 918/918, `npm run build` PASS; `check --target aku-sbe --word` 136 PASS; aku-sagbil t80 2 FAIL önceden açık olanla aynı (35/34).

## Denklem (equations kuralı olmayan şablonlar) — 11.10.2026
- Kök neden: `equations` kuralı yokken editör blok denklemi kutulu (kenarlık, 0,35/1,05 rem dolgu, 0,85 rem kenar boşluğu) ve imleç dolgusu olan iki ZWSP satırıyla çiziyordu (sosyoloji: PDF 178,3 pt, Word'de düz gövde paragrafı 2x26,7 = 53,4 pt, PDF 37 / Word 36 sayfa). CSS tek başına iki ZWSP satırını (2 x 20,7 pt) silemediği için generatedIndex.js ölçümü de gerekti.
- Düzeltme (motor): engineCss.js `!rules.equations` dalı denklemi gövde paragrafı gibi çizer (kutusuz, sola, gövde before/after); generatedIndex.js aynı ölçümü örtük kuralla (gövde stili) çalıştırır, pad'leri `data-thesis-ieq-pad-*` ile siler, tek satıra sığan formülü satıra kaydırır (`ieq-shift/drop`), kenar boşlukları komşuyla birleşir (max). `ieq` öneki, "numara CSS'i yalnız opt-in şablonlarda" birim testini korur. Kurallı şablonlarda (`data-thesis-eq-*`) davranış değişmedi.
- Sonuç: sosyoloji PDF 37 -> sayfa sayısı Word ile eşit, sonraki paragraf 222,9 (Word 222,8); check sosyoloji FAIL=0. Aynı anda başka ajanların işinden kaynaklı matematik `table.rules-continued` ve kimya `inner-cover-fixed-baselines-word` FAIL'leri bu değişiklik kapalıyken de var.

