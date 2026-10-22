# Bekleyen işler envanteri — 16 Ekim 2026

## 18 Ekim kayıt uzlaştırması — güncel okuma

Genel editör düzeninin dört işi [kapanış raporunda](GENEL_DUZEN_2026-10-18.md) tamamlandı. Güncel açık motor kapsamı SRC09 metin kapsamı/şekil-grafik ayrıntıları, SRC10 s.57/s.75, performans ve nihai seri kabuldür. SRC09 11 açılış farkı, 206 sayfalık çıktı, kayıp logo ve ölçülen PDF kusurları sonraki 16 Ekim kanıtıyla kapandı; aşağıdaki teşhis satırları tarihçedir. Eski AFSÜ LEE test hatası güncel çalışma ağacında tekrarlanmadı: 1088/1088 test PASS; bu oturum üniversite kaynak kararı vermedi.

Kayıt bakımında 43–44 tamamlandı: SBE beş varyantı manifestle uzlaştırıldı; Felsefe kapak eksikliği uygulama görevi olmaktan çıkarıldı, kalan bağımsız kabul açık; İSG tarihsel bulgusu güncel yeniden doğrulama bekliyor. Eski alanlar progress içinde saklandı. Aktif yerel adapter/kalıcılık bilgisi refactoring belgesinde güncellendi. Bu güncelleme yeni Word/uzun belge kabulü değildir.

**Dışa aktarım için güncel durum:** aşağıdaki 206 sayfalık DOCX, kayıp kapak logosu, PDF SVG/ok/dikey etiket ve 24→12 pt kusurları son düzeltmede ölçülen kapsamda giderildi. Son SRC09 editör/PDF/Word 180/180/180; Word alan güncellemesi sonrası da 180, üç TOC korunuyor. [Düzeltme raporu](EXPORT_DUZELTMELERI_2026-10-16.md). Alttaki teşhis maddeleri tarihçedir; kapsam, SRC10, diğer şekil ayrıntıları ve genel seri kabul açık kalır.

Kapsam: bu çalışma alanındaki TxtNote uygulaması, üretim motoru, görev/plan kayıtları, manifest, ilerleme dosyası, son kabul raporları ve kaynak kodundaki entegrasyon noktaları. Bu bir kayıt/kod incelemesidir; yeni Word, tarayıcı veya ürün kabulü çalıştırılmadı. 16 Ekim yeniden incelemesinde üç dosyalık hedefli Node testi çalıştırıldı: 23 test, 22 PASS, 1 FAIL. Başka Codex sohbetleri veya uzak issue sistemleri bu envanterin kapsamında değildir.

Durum önceliği: 16 Ekim SRC09 son kabulü ve orkestrasyon raporu, MISSION içindeki 14 Ekim uzun belge ölçümlerinden ve bu envanterin önceki metninden daha günceldir. Bir kontrol grubunun PASS olması bütün üniversite/ürün kabulü değildir. UNKNOWN kaynak boşluğu da tek başına doğrulanmış ürün hatası değildir.

## Yeniden inceleme — öncelikli güncel görevler

- **P1 — DOCX dışa aktarım yerleşimi:** yeni teşhiste SRC09 çıktısı Word'de açık alan güncellemesinden önce de sonra da 180 yerine 206 sayfa. Kaynak düğüm biçimi yazıcıya tam taşınmıyor. 651→348 sayısı `w:fldChar` işaretlerinin sayısıdır; üç TOC alanı bölüm kapsamlı dengelemede önbellek metnine düşüyor. “TOC yeniden üretimi” eski açıklaması doğru değil. [Yeni teşhis ve tekrar üretim](EXPORT_KAYMA_TESHISI_2026-10-16.md).
- **P1 — Kapak üstbilgi logosu:** `header1.xml` → `image1.jpeg` kaynakta mevcut, editör ve PDF/DOCX çıktılarında yok. İçe aktarım, üstbilgi gösterimi ve dışa aktarım boyunca korunmalı. Aynı son kabulde kayıtlı.
- **P1 — SRC09 kapsam:** son sabit sürümde 0,98068 < 0,995; 161559/164742 karakter sıralı eşleşiyor. Bu oran doğrudan silinen metin miktarı değildir. Tablo hücrelerinin ilk satır ofseti, okuma sırası ve döndürülmüş başlıklar için küçük Word/Chrome örnekleriyle teşhis gerekli.
- **P1 — AFSÜ LEE test/kaynak uzlaştırması:** `engine/src/templates/afsu-lee.test.js:57` beklenen etik madde `spaceAfterPt=6`, mevcut değer 0. Bu incelemede hata tekrar üretildi; kaynak kararıyla test/şablon uyumu incelenmeli. Testin yanlış mı, üretimin yanlış mı olduğu henüz belirlenmedi.
- **P1 — SRC10:** s.57 dikey sığma ve s.75 MS Mincho/Times New Roman font seçimi; son SRC09 çalışmasının kapsamı dışında, kapanış kanıtı yok.
- **P2 — Şekil/grafik kalanları:** dönüş açısı ayrı doğrulanmadı; s.39/48/66/68/69/153 görsel kabulü; s.115 `chartUserShapes` eksen çizgileri; Pareto stil ayrıntıları ve s.86 çubuk kalınlığı. s.97 şekil düzeltmesi uygulanmış, baştan eksik uygulama sayılmamalı.
- **P2 — Nihai seri kabul ve performans:** düzeltmelerden sonra aynı sürümde Word/PDF/DOCX, test/build ve `verify.mjs`; sayısal performans hedefinin belirlenmesi ve ölçümü.

16 Ekim ayrı dışa aktarım teşhisinde yeni açık kusurlar da doğrulandı: tez PDF'inde SVG grafik/ok ve CSS şekil katmanları atlanıyor, dikey metin/kırpma davranışı korunmuyor; normal akademik PDF'de 24 pt özel yazı 12 pt çıkıyor. Tez PDF'inde ölçülen 15 sayfanın eşleşen sıradan metin başlangıç konumları korunuyor; bütün PDF'e genel metin kayması iddiası verilmedi. Ayrıntı [dışa aktarım teşhisi](EXPORT_KAYMA_TESHISI_2026-10-16.md).

**Kapanmış alt işler:** SRC09 EK-2 sayfa açılışı 0/157 fark, 180/180 sayfa; 20/20 düzenleme/geri al ve kaydet-yeniden aç geçti. Bunlar tüm SRC09 kabulünü kapatmıyor. Son kanıt [16 Ekim orkestrasyon raporu](SRC09_ORKESTRASYON_2026-10-16.md) ve [sabit sürüm kabulü](../engine-work/src09-20261016/final/RESULT.md).

Yeniden inceleme komutu: `node --test engine/src/templates/afsu-lee.test.js engine/src/chartStyles.test.js TxtNote/frontend/src/lib/docxTerminalLeading.test.js`. Grafik ve terminal-leading testleri geçti; AFSÜ LEE geometri testi `0 !== 6` ile başarısız. Tam test/build veya Word kabulü bu incelemede yeniden çalıştırılmadı; uygulama kodu değiştirilmedi.

## 1. Kesin açık motor ve kabul işleri

1. **SRC09 EK-2 tablo devamları — açılış alt kapısı kapandı:** 16 Ekim son kabulünde 180/180 sayfa, 0/157 farklı açılış. Bu madde artık eski 11 farkın düzeltme görevi değildir; final DOCX yerleşimi ayrı açık.
2. **SRC09 metin kapsamı:** son sabit sürümde 0,98068; gerekli 0,995 eşiği sağlanmıyor. Okuma sırası farkı, görünür içerik kaybından ayrı incelenmeli.
3. **SRC09 şekil geometrisi:** s.97 ok/kırpılma alt düzeltmesi uygulandı ve görsel kontrol edildi; döndürme ve diğer şekilli sayfaların kabulü açık.
4. **SRC09 grafik stil/ölçü eşliği:** 16 Ekim stil düzeltmeleri ve altı yeni grafik testi var; s.115 chartUserShapes, Pareto ince stil farkları ve s.86 çubuk kalınlığı açık.
5. **SRC10 s.57 dikey kırılımı:** kerning kaynaklı satır farkı kapandı, son satırın sayfa sınırına sığması açık.
6. **SRC10 s.75 font seçimi:** Doğu Asya ipuçlu tırnaklarda Word MS Mincho, editör Times New Roman kullanıyor; font yükleme/seçimi açık.
7. **Uzun belge performansı:** kalan derleme/ölçüm maliyeti ve nihai hız kabulü. SRC09 yükleme 49,448→28,618 sn, yazı sonrası yerleşme 36,813→18,260 sn; bunlar tek eşlenmiş karşılaştırma, evrensel kabul değil. Nihai sayısal hız hedefi önceden tanımlanmamış.
8. **Uzun belgelerde PDF/DOCX çıktı kabulü:** sayfa, kırılım, içerik, grafik ve etkileşim kanıtını aynı üretim sürümünde tamamlamak.
9. **Tek sürümde tam seri kabul ve verify.mjs:** uzun belge farkları kapandıktan sonra güncel Word, şema, özel sayfa matrisi, SBE normal/CPU kısıtlı ve ilgili tarayıcı kontrolleriyle genel kabulü yeniden almak. Genel durum hâlâ FAIL/hazır değil.
10. **Word yeniden kayıt / Open XML SDK farkı:** uygulamanın üç MCBÜ DOCX'i SDK 2.9.1/Office2016 ile 0 hata; Word'ün yeniden kaydettiği kopyalar 13'er hata. tblLook ve useWord2013TrackBottomHyphenation farkının araç/sürüm uyumluluğu incelemesi açık. Resmî kılavuzda da benzer hata görüldüğü için otomatik ürün bozulması sayılmamalı.

Kaynaklar: [16 Ekim SRC09 son kabul](../engine-work/src09-20261016/final/RESULT.md), [16 Ekim orkestrasyon](SRC09_ORKESTRASYON_2026-10-16.md), [MISSION](../MISSION.md), [14 Ekim son motor raporu](ENGINE_RESUME_2026-10-14_4.md), [MCBÜ kabul raporu](MCBU_DUZELTMELER_VE_KABUL_2026-10-15.md).

## 2. Mevcut şablonlarda kaynak ve doğrulama işleri

11. **AFSÜ LEE:** tam İngilizce tez varyantı; ölçülen örneğin ötesindeki özet yerleşimi; genel tablo hücresi hizası; dipnot aralığı/ayırıcı/numaralandırma; sayısal alıntı sınırı. İçindekiler 4. düzey ve keyfî uzun tablo devamı ölçülen kapsam dışında.
12. **AFSÜ LEE Symbol etik işareti:** kaynaktaki Symbol yerine yedek font kullanılması bilinen teknik fark olarak açık.
13. **AFSÜ Tıp:** kaynak Word üstbilgi/altbilgi uzaklığı, dipnot ayrıntıları, tablo ayrıntıları, etik sayfası metni ve dış kapak konumları için kaynak boşlukları.
14. **AFSÜ Tıp kontrol aracı:** bazı başlıksız sayfaların içindekiler eşlemesinin teknik kapsamı eksik.
15. **AFSÜ Diş Hekimliği:** Tıp'ın yeni örnek kararı bu varyanta uygulanmadı; uygun güncel örnek yok. Eski bağımsız dipnot/table/caption bulgularının son kodda kapanış kapsamı ayrıca teyit edilmeli.
16. **AFSÜ Eczacılık:** uygun güncel öğrenci projesi bulunamadığı için kaynak ayrıntıları pas geçilmiş; ilerleme kaydında bağımsız v6/Word kabulü ve altbilgi uzaklığı açık görünüyor. Son kodla durum uzlaştırması gerekli.
17. **AFSÜ tez önerisi:** ilerleme kaydında bağımsız/Word incelemesi açık; spec'te yatay çalışma takvimi tablo bloğu gap kaydı var. Son motor yetenekleriyle yeniden sınıflandırılmalı.
18. **AKÜ FBE:** özgeçmiş–ekler sırası, ikinci danışmanlı doktora ve uzun kapak çelişkileri. 2026 örneklerinde ekler yok; sıra çözülemedi. Son 71 PASS bu kalanları kapatmıyor.
19. **AKÜ SBE:** kaynak üstbilgi/altbilgi uzaklığı; Sanatta Yeterlik etik metni/kopyaları; İngilizce ön sayfa adları ve kalan kaynak/bağımsız inceleme kapsamı. Beş varyant uygulanmış ve son çıktı kontrolleri geçmiş durumda; yeniden uygulanacak eksik varyant sayılmamalı.
20. **AKÜ Sağlık:** 2022 kaynaklarıyla geometri/checks/motor gereksinimlerini uzlaştırma ve bağımsız kabul. İlerleme kaydı 6 çelişki/1 UNKNOWN içeriyor. Uzun başlık/jüri stresinin sınırsız sığma kabulü yok.
21. **AKÜ Coğrafya:** uzun kapak başlığı kapasitesi ve ana akış içinde tek yatay şekil sayfası; Tier 1 kapanışı kalan kaynak/Tier 2 kapsamını kapatmıyor.
22. **AKÜ MBG / Kimya / Sosyoloji:** eski bağımsız inceleme ve kaynak boşluklarının güncel üretim/çıktı kanıtlarıyla uzlaştırılması. Sosyoloji DİZİNİ/LİSTESİ karşı kanıtı korunuyor; uygun güncel lisans örnekleri bulunamadı.
23. **AKÜ Felsefe lisans/seminer:** eski progress FAIL kaydı mevcut üretimle uzlaştırılmalı. Kodda lisans dış/iç kapakları ve seminer kapağı artık var; eski “kapak eksik” cümlesi güncel hata gibi sunulmamalı. Kaynak geometri/bağımsız kabulün kalan kapsamı ayrı.
24. **AKÜ İSG:** eski kaynak PAGE yapısı ve iki satırlı kapak taşması FAIL kaydını son motor/gerçek çıktı kanıtıyla uzlaştırma. Eski ölçümü mevcut hata gibi yeniden ilan etmek için yeni koşu gerekir.
25. **AKÜ Matematik:** Tier 1 DONE; kalan kaynak/Tier 2 UNKNOWN alanları ve uygun güncel lisans örneği yokluğu. Yeniden temel uygulama görevi değil.
26. **ADÜ Sağlık:** Tier 1 pilot geçti; diğer varyantlar/Tier 2, 109 kaynak özelliği inceleme grubu ve üniversite geneli bağımsız tamamlama açık.
27. **ADÜ Ziraat:** yayına dayalı alternatif etik beyanı gösterecek uygun lisans örneği yok. progress doğrulaması PENDING; eski kapak hatası sonraki motor kabul kayıtlarından bağımsız güncel hata sayılamaz.
28. **MCBÜ LEE:** dipnot, tablo, kaynakça/listeler, bazı yazı/boşluk ayrıntılarındaki kaynak bilinmeyenleri. Çözülen dört karar ve 202 PASS yeniden açık iş sayılmamalı.
29. **MCBÜ Tıp:** yeni erişilebilir örnek bulunamadığından alt başlık/dipnot/tablo vb. ayrıntılar açık/pas geçilmiş. Kaynakların sustuğu noktalar yeni ölçüyle tahmin edilmemeli.

Kaynaklar: [15 Ekim kaynak incelemesi](KAYNAK_BELIRSIZLIKLERI_RESIZEOBSERVER_2026-10-15.md), [örnek tez araştırması](TEMPLATE_ORNEK_TEZ_ARASTIRMASI_2026-10-15.md), [progress](../progress.json), [MCBÜ kararları](../decisions/MCBU-acik-kararlar.md). Ayrıntılı ham spec bilinmeyenleri bu raporun sonundaki ekte bulunur; eski engineGaps kayıtları uygulanmış yetenekler içerebildiğinden doğrudan yeni görev sayılmadı.

## 3. Henüz üretim şablonu olmayan hedefler

Manifestteki hedefler gerçek template dosyalarıyla karşılaştırıldı; Coğrafya, MBG, Diş Hekimliği ve İYTE'nin farklı/ortak modül adları hesaba katıldı. **28 hedefin üretim modülü yok; ayrıca 1 hedef analiz bekliyor.** Bu kapsam aktif mission ile aynı şey değildir; geniş şablon birikimidir.

- ADÜ (4): `adu-fbe`, `adu-sbe`, `adu-tip`, `adu-muhendislik-lisans`.
- Dokuz Eylül (5): `deu-fbe`, `deu-ebe`, `deu-sagbil`, `deu-ataturk`, `deu-tip`.
- Ege (2): `ege-fbe`, `ege-sagbil`.
- Kütahya Dumlupınar (1): `dpu-lee`.
- Kütahya Sağlık Bilimleri (1): `ksbu-lee`.
- Muğla Sıtkı Koçman (4): `msku-ebe`, `msku-fbe`, `msku-sagbil`, `msku-sbe`.
- Pamukkale (3): `pau-fbe`, `pau-ebe`, `pau-tip`.
- Uşak (2): `usak-lee-sosyal`, `usak-insaat-lisans`.
- Yaşar (2): `yasar-lee`, `yasar-lee-hukuk`.
- İzmir Bakırçay (1): `bakircay-lee`.
- İzmir Ekonomi (1): `ieu-lee`.
- İzmir Kâtip Çelebi (2): `ikcu-fbe`, `ikcu-sbe`.
- İzmir Demokrasi (1 analiz): `idu-lee`, durum `ANALYSIS_PENDING`, modül tanımlı değil.

Kaynak: [manifest](../manifest.json), `engine/src/templates/`. Manifest toplam 50 hedef içeriyor; bu 29 kayıt için mevcut üretim modülü tespit edilmedi.

## 4. Hesap, backend ve bulut entegrasyonu

30. **Sosyal giriş:** RegisterPage handleSocial zamanlayıcıyla simüle ediliyor; gerçek kimlik sağlayıcı entegrasyonu açık.
31. **E-posta kayıt/giriş:** handleJoin gerçek hesap oluşturmuyor; sağlayıcı ve oturum akışı uygulanmalı. OTP yönündeki doküman planı henüz mevcut şifre arayüzüyle uzlaşmamış.
32. **MetaMask/Trust bağlantısı:** handleWallet connect/sign TODO'su açık.
33. **12 kelime üretme/kasa oluşturma:** kayıt ekranının mock kelime havuzu ve yerel anahtar türetme TODO'su gerçek BIP-39/cüzdan/kasa akışıyla bağlanmalı. Mevcut ayrı crypto/wallet modülleri yok sayılmamalı.
34. **12 kelimeyle kurtarma:** checksum ve gerçek geri yükleme/hesap akışı; handleRecover zamanlayıcı kullanıyor.
35. **Kripto başlangıç akışı:** kayıt ekranındaki onboarding/backend yönlendirme TODO'su.
36. **Gerçek backend:** workspaces, content, notes, trash, settings sözleşmelerinin sunucu uygulaması ve kimlik doğrulamalı erişimi. HTTP istemci iskeleti var; aktif adapter `localServices`, backend klasöründe uygulama dosyası tespit edilmedi.
37. **Gerçek cihazlar arası senkronizasyon:** localSync.emitToPeers yalnız noteId kontrol ediyor; ağ yayını yapmıyor. WebSocket/HTTP aktarımı, yetkili oturumlar, gönderen cihaza yankı önleme ve servis sözleşmesindeki hız sınırları bekliyor.
38. **Gerçek bulut yedekleme/geçmiş:** localServices.saveToCloud = appendVersion; mevcut sürüm kaydı yerel. Sunucu saklama, geçmiş sürümleri ve hash ile yinelenen yazmayı önleme işi bekliyor.
39. **Şifreli paket taşımasının üretime bağlanması:** blindRelay açıkça geçici E2E laboratuvarı ve “No real network yet” diyor. Yerel şifreleme var; gerçek ağ/sunucu/ikinci fiziksel cihaz kabulü ayrı.
40. **Avatar yükleme:** HTTP adapter uploadAvatar doğrudan notImplemented atıyor; sunucu dosya saklama/URL akışı açık.
41. **Sunucu çöp kutusu zamanlayıcısı:** 30 günlük saklama/temizleme; HTTP adapter sweepExpiredTrash boş dizi döndürüyor.
42. **Kurtarma ve şifreleme üretim kabulü:** gerçek sağlayıcıyla yeni cihazda kurtarma, notların çözülebilmesi ve ağ payload'ında düz metin bulunmaması. AUTH_AND_ENCRYPTION kontrol listesi bu entegrasyonun kanıtı yerine geçmiyor.

Kaynaklar: `TxtNote/frontend/src/features/auth/RegisterPage.tsx` (387, 892–1055, 1359), `TxtNote/services/index.ts`, `TxtNote/services/http/index.ts`, `TxtNote/services/local/index.ts` (localSync), `TxtNote/services/local/blindRelay.js`, [backend sözleşmesi](../docs/TxtNote/backend/README.md), [kimlik/şifreleme planı](../docs/TxtNote/AUTH_AND_ENCRYPTION.md).

## 5. Teyit ve kayıt bakımı gereken diğer işler

43. **Progress/manifest/rapor tutarlılığı:** SBE eksik-varyant notu, Felsefe eksik-kapak notu, eski ISG/AFSÜ/ADÜ kabul etiketleri ve capability kataloğundaki eski Arial ertelemesi güncel kapanışlarla uzlaştırılmalı. Bu rapor özgün kayıtları değiştirmedi.
44. **Eski refactoring planının güncellenmesi:** Phase 3 “mock adapter” başlangıç açıklaması güncel local SQLite/IndexedDB yapısıyla artık birebir doğru değil. Kalan varsayılan fixture dışa aktarımları boş ilk-kurulum verisi; tek başına backend yokluğu dışında yeni hata kanıtı değil.
45. **Kademeli TypeScript geçişi:** REFACTORING Phase 5 hâlâ belgelenmiş devam işi; lib/hooks/UI/features/app sırası ve uygun aşamada checkJs. Bir ürün kabul engeli olduğu doğrulanmadı.
46. **Platform/özellik doğrulama kapsamları:** Firefox/Safari, gerçek işletim sistemi IME, bidi/yerel olmayan ondalık sekmeler, bazı dipnot yatay yerleşimleri ve isimsiz blok terminal payı için önceki sınırlamalar var. Bunlar son kodda yeniden ölçülmeden kapanmış veya kesin ürün hatası sayılamaz.
47. **Büyük görsel stres koşusu:** eski bağımsız thesis-image testi bağımlılık/koşu sözleşmesiyle başlatılamamış; sonraki sayfalama regresyonu büyük görsel etkileşimini kapsıyor fakat aynı eski stres kabulünün kapanışı açıkça kaydedilmemiş.
48. **Lisans seçimi:** README'de lisans dosyası yokluğu kayıtlı; bu taramada da kökte lisans dosyası görülmedi. Kamuya açık yayın düşünülürse çözülmesi gereken yayın hazırlığı maddesi.

Kodun sunduğu her eksik olabilecek özellik yeni görev sayılmadı. Örneğin otomatik DOI arama veya tüm atıfları yeniden numaralandırma UX raporunda kapsam dışı; bunlar onaylanmış bekleyen mission olarak eklenmedi. Kullanıcının kaldırdığı başlanmamış Word fazları ve Sidebar/shell-hook ayrıştırma işleri de yeniden kuyruğa konmadı.

## 6. Kapanmış olduğu için bekleyenlere eklenmeyenler

- Arial/uzun sözcük/URL sabit korpus satır eşliği: 15 Ekim 78 PASS, 204 satır eşliği.
- ResizeObserver bildirimi: 15 Ekim son kodda dört gerçek şablon ve sayfalama regresyonuyla kapandı.
- AFSÜ LEE altbilgi 11 pt/mesafe, TOC 1–3 girintileri ve jüri asgari satır yüksekliği kaynak soruları: kapandı.
- MCBÜ'nün dört uygulama kararı: çözüldü; 202 PASS, zorunlu UNKNOWN/SKIPPED yok.
- FBE/SBE/AFSÜ Tıp dört örnek-tez kararı: 315 PASS ile kapsamlı olmayan ilgili çıktı kabulü kapandı.
- Tez yazım UX çalışması, BUG-001–004 ve SRC09 20 örnekli geri al/kaydet-yeniden aç alt kapısı: kapanmış kayıtlar.

Bu envanter uygulama kodunu değiştirmez; bir kayıt taramasıyla bütün ürünün hatasızlığı veya bütün eski FAIL'lerin hâlâ yeniden üretilebilirliği iddia edilmez.

## Ek — Güncel spec dosyalarındaki ham kaynak boşlukları ve teyit işaretleri

Bu ek dosyalardaki kayıtları eksiksiz taşır. Her satır ayrı yeni görev değildir; tekrarlar, eski anahtar açıklamaları ve sonraki raporlarla kapanmış parçalar bulunabilir. Yukarıdaki uzlaştırılmış liste önceliklidir. EngineGaps alanı tarihsel uygulanmış yetenekler içerdiğinden burada yeni açık görev olarak sayılmaz.

### afsu-lee

- UNKNOWN: {"key":"language.fullThesisEnglish","why":"Only English ABSTRACT requirements are established; no English-language full-thesis variant is present in the supplied LEE sources."}
- UNKNOWN: {"key":"abstract.exactPresentationBeyondProse","why":"Abstract prose rules are explicit, but exact line positions/spacing beyond stated one-line spacing and 6 nk paragraph spacing depend on template example XML and are reserved for companion inspection."}
- UNKNOWN: {"key":"tableCellAlignment","why":"Guide specifies table content numeric/text alignment in some contexts and overall table centered placement, but does not establish a universal cell alignment rule."}
- UNKNOWN: {"key":"footnoteSpacingSeparatorAndNumbering","why":"The post-defense checklists specify footnotes as 10 pt Times New Roman, but the guide/checklists do not establish line spacing, separator, or numbering behavior."}
- UNKNOWN: {"key":"citations.maximumQuotationLength","why":"The guide says quotations beyond reasonable limits are an ethical violation, but states no numeric quotation-length/page limit."}

### afsu-tip

- UNKNOWN: {"key":"page number font/size, header/footer distance","why":"guide silent (orchestration/engine-work/Word default 12.5 mm footer distance in DOCX)"}
- UNKNOWN: {"key":"ethics page content","why":"listed in TOC/EK 13, no text or example in the guide"}
- UNKNOWN: {"key":"table borders/cell padding","why":"EK 3 full grid vs EK 4 two rules"}
- UNKNOWN: {"key":"DHF English faculty wording","why":"only 'Faculty of Medicine' given (EK 12)"}
- UNKNOWN: {"key":"vertical positions on dış kapak","why":"EK 6 is a schematic frame"}
- UNKNOWN: {"key":"footnote font size","why":"only single spacing stated"}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"H2 case","sources":[{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"p.5 §2.6","value":"each word capitalised, ve/veya/ile lower"},{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"EK 1 p.16, EK 13 p.29","value":"H2 in capitals"}],"decision":"example applied (user rule: example wins)","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Front-matter title size","sources":[{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"pp.5-6 §2.5/2.7","value":"14 pt (Özet, Abstract named as 1st-degree headings)"},{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"EK 10/11/13","value":"12 pt bold centred"}],"decision":"12 pt applied","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Ethics page / Roman sequence","sources":[{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"p.2 TOC §3.1.4 and EK 13","value":"Bilimsel Etiğe Uygunluk Sayfası after iç kapak; kabul iii, teşekkür iv, özet v, abstract vi, içindekiler vii"},{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"pp.8-10 §3.1.3-3.1.8","value":"iç kapak i, kabul ii, teşekkür iii, özet iv, abstract v, içindekiler vi"}],"decision":"page not generated (no text/example exists); prose sequence used","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Caption numbering/label","sources":[{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"EK 3 p.20","value":"Tablo 1.1: / Şekil 1.4:"},{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"EK 4/5 p.21","value":"Tablo 1. / Şekil 2."}],"decision":"EK 4/5 (sequential, period) applied; EK 3 form not offered","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Inner cover year/city order","sources":[{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"EK 7","value":"AFYONKARAHİSAR-YILI"},{"path":"Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf","locator":"EK 8, EK 6","value":"YILI-AFYONKARAHİSAR"}],"decision":"each inner-cover variant follows its own example","needsConfirmation":true}

### aku-cografya-lisans

- UNKNOWN: {"key":"outerCover.layout","why":"Only “ciltletilmelidir”; no content/layout supplied."}
- UNKNOWN: {"key":"abstract layout / title lines / year-pages string","why":"Only content items are listed; “formata uygun” refers to the missing template."}
- UNKNOWN: {"key":"headings.h3.caps, headings.h4.caps","why":"Only H1/H2 case prescribed."}
- UNKNOWN: {"key":"page.footer.distanceMm / pagination.distanceFromEdgeMm","why":"Guide PDF prints no page numbers; only “alt orta”."}
- UNKNOWN: {"key":"pagination.unnumbered.counted","why":"Whether unnumbered prelims are counted is not stated."}
- UNKNOWN: {"key":"pagination.appendix","why":"Not stated."}
- UNKNOWN: {"key":"toc.leader, toc.indentPerLevelMm, toc.lineSpacing, toc.frontMatterEntries","why":"Only title, “Sayfa”, completeness, automatic generation are stated."}
- UNKNOWN: {"key":"lists.symbols.title, lists.symbols.tabStopMm","why":"Not stated."}
- UNKNOWN: {"key":"tables.lineSpacing, table border style","why":"Only the example (9 pt single, full grid)."}
- UNKNOWN: {"key":"footnotes.*","why":"Never mentioned."}
- UNKNOWN: {"key":"equations.*","why":"Never mentioned."}
- UNKNOWN: {"key":"abstract.maxWords","why":"Not stated."}
- UNKNOWN: {"key":"binding.type","why":"Cover material/colour/spine not stated."}
- UNKNOWN: {"key":"outerCover.layout","why":"Guide: only 'ciltletilmelidir'. The template's first page is the inner cover (14 pt bold with two seals); no separate outer-cover sample."}
- UNKNOWN: {"key":"footnotes","why":"No footnote text in guide or template (footnotes.xml has only separators). Engine: TNR 12 pt (global rule, INFERRED), rest engine default."}
- UNKNOWN: {"key":"equations","why":"Neither source mentions equations."}
- UNKNOWN: {"key":"appendices.heading","why":"EKLER has no sample page; heading typography UNKNOWN."}
- UNKNOWN: {"key":"pagination.unnumbered.counted (template)","why":"Template S1 (cover + approval) numbering and S2 start=2 contradict each other; the guide is silent whether unnumbered pages are counted. OZET = i is used."}
- UNKNOWN: {"key":"landscape figure page","why":"The template shows a single landscape page (Sekil 6, sectPr#4, 16840x11904 twips, pgNumType start=5) with portrait page-number chrome; the engine cannot place a single landscape page inside the main editable flow."}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Body paragraph first-line indent","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"p.2-3 2.4","value":"0 (paragraf baslari ... bosluk birakilmadan; ambiguous)"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx","locator":"body paragraphs #238,#258,#285-#296,#310-#314 w:ind firstLine","value":"708/709 twips = 12.5 mm on 15 of 16 paragraphs (#259 none)"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"guide body geometry p.2-23","value":"12.45 mm"}],"decision":"DECIDED (template integration): 12.5 mm. The prose is ambiguous (can also mean 'no empty lines'), while the template and the guide's own Word body agree. Single constant PARA_INDENT_MM in templates/aku-cografya.js.","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Spacing around headings","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"p.3 §2.4, §2.6","value":"1 empty line (1.5-spaced) before and after headings"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"guide geometry","value":"only +6 pt; heading→heading 0"}],"decision":"Explicit: one empty 1.5-spaced line (20.69 pt) on each side of every heading. Proposed: + heading/paragraph 6/6 Word-additive → 53.4 pt baseline distance; minimum 41.4 pt. Kept open.","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Blank line between ordinary paragraphs","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"p.3 §2.4","value":"“Alt bölüm başlıkları ile paragraflardan önce ve sonra 1 satır boşluk (1,5 aralıklı)” (ambiguous)"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"guide geometry","value":"no blank lines between paragraphs"}],"decision":"Read with §2.6 as heading↔paragraph only; ordinary paragraphs separated only by the §2.2 6/6 spacing. Kept UNKNOWN-flagged but not blocking.","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"“Sayfa” column heading on list of figures","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"p.11 §4.2.7, §4.2.10","value":"required for TOC and list of tables"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"p.11 §4.2.9","value":"not mentioned for list of figures"}],"decision":"Apply to the list of figures too for consistency (INFERRED). [2026-10-02: template #216 has 'Sayfa' on ŞEKİLLER DİZİNİ -> confirmed.]","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Spacing around headings","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"p.3 2.4, 2.6","value":"1 satir bosluk (1,5 araliklı) before and after (stated twice)"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx","locator":"body H1 samples #237,#257,#284,#299,#309,#317","value":"spacing before=120 after=120 line=360 (6/6 pt), no empty paragraph"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"guide body","value":"6 pt"}],"decision":"Guide prose implemented: one empty 1.5 line (20.7 pt) between a heading and the text next to it = 14.7 pt heading space + 6 pt paragraph space (Word additive). H1 at a page top: no space before. INFERRED reading; the template's H1 samples have only 6/6.","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Table note size","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"p.8 3.3","value":"11 pt, single"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx","locator":"body #272 red note","value":"'10 punto ve 1 satir araligiyla'"}],"decision":"Guide 11 pt implemented (normative text); template instruction says 10 pt.","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Roman page numbering start","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"p.3 2.7","value":"Dis kapak, ic kapak, onay, etik unnumbered; Ozet ... i, ii, iii"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx","locator":"sectPr#2 pgNumType lowerRoman start=2 (ethics ... lists)","value":"ethics would print ii, OZET iii"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx","locator":"cached TOC #125-#132","value":"OZET i, ABSTRACT ii, ... RESIMLER ix"}],"decision":"Guide + cached TOC implemented: OZET = i (template sectPr start=2 treated as a leftover).","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Abstract order of keywords and year/pages","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf","locator":"p.10 4.2.5","value":"text, 1 line, Anahtar Kelimeler, 1 line, year + page count"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Sablonu_2024.docx","locator":"body #68-#72, #107-#111","value":"text, year + pages, keywords"}],"decision":"Guide order implemented.","needsConfirmation":true}

### aku-fbe

- UNKNOWN: {"key":"footnotes.*","why":"Guide silent (author-year citations); template has only the Word default footnote style (10 pt)."}
- UNKNOWN: {"key":"abstract.maxWords","why":"No word/page limit in guide or template."}
- UNKNOWN: {"key":"typography.hyphenation","why":"Not mentioned; template has no auto-hyphenation setting."}
- UNKNOWN: {"key":"outer-cover.border","why":"Dotted box on p.32 is an illustration of the printed area; the template cover has no border."}
- UNKNOWN: {"key":"outer-cover.firstBaselineWithinBox","why":"Only the illustration (title baseline 5.53 mm below the box top) - text-box inset of the real cover print is not specified."}
- UNKNOWN: {"key":"inner-cover.projectLineSlotWhenAbsent","why":"Whether the empty slot of the optional \"Bu tez çalışması … desteklenmiştir.\" line is kept is not stated."}
- UNKNOWN: {"key":"approval.coAdvisorRowSlotWhenAbsent","why":"Not stated whether the İkinci Danışman row space is kept."}
- UNKNOWN: {"key":"signaturePlaceholders.print","why":"Grey (BFBFBF) \"İmza\" / \"…… İmza ……\" hints: printing in grey vs leaving blank for the handwritten signature is not stated."}
- UNKNOWN: {"key":"appendices.individualTocEntries","why":"TOC example lists only \"EKLER\"."}
- UNKNOWN: {"key":"cv.noteLine","why":"\"NOT: Yayınların yazımı ...\" is an instruction; whether it is printed is not stated."}
- UNKNOWN: {"key":"lists.photos.examplePage","why":"No guide example for RESİMLER DİZİNİ (rules stated by analogy)."}
- UNKNOWN: {"key":"variants.foreignLanguageThesis","why":"p.6 §2.5 allows a thesis 'Türkiye Türkçesi veya yabancı bir dilde', but no layout differences (order of ÖZET/ABSTRACT, English section titles, caption labels) are given; no English variant can be specified."}
- UNKNOWN: {"key":"wordModel.spaceBeforeAtPageTop","why":"No Word-rendered source page starts with a soft-broken paragraph that has space-before (e.g. a bibliography entry), so suppression at the page top is not demonstrated."}
- UNKNOWN: {"key":"wordModel.spacingCollapse","why":"No source case with both after(prev) and before(next) non-zero."}
- UNKNOWN: {"key":"outer-cover.verticalAnchor","why":"Whether the cover text is top-anchored (215.53 mm) or vertically centred in the 65 mm area when the optional co-advisor lines are absent (≈ +5.9 mm) is not stated."}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"2021 university-repository doctoral thesis versus 2020 guide: long cover position and co-advisor jury count","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf","locator":"PDF p.32 outer-cover dimension diagram; PDF p.34 approval callout","value":"Cover title starts within the box at y=210 mm (guide example first baseline 215.53 mm); doctorate with second advisor requires seven jurors"},{"url":"https://acikerisim.aku.edu.tr/xmlui/bitstream/handle/11630/8542/10375459.pdf?isAllowed=y&sequence=1","locator":"Ahmet Burçin BATIBAY, January 2021 doctoral thesis, physical PDF pp.1 and 3","value":"Three-line outer-cover title first baseline y=203.48 mm, 12 pt; date baseline y=264.79 mm; second advisor present but signed approval page shows five juror rows"}],"decision":"CONFLICT: the later accepted thesis demonstrates an actual layout but does not state a general exception to the guide's explicit cover dimension or seven-juror instruction. Do not use its upward-shifted cover or five-juror approval as a universal rule; request authoritative resolution before claiming exact compliance for these cases.","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Position of ÖZGEÇMİŞ vs EKLER","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf","locator":"p.16 §4 / p.28 §4.3.7","value":"Özgeçmiş at the very end (\"tezin en son sayfasında\")"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf","locator":"p.17 §4.1 order list","value":"15. Özgeçmiş, 16. Ekler (varsa)"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx","locator":"#671 ÖZGEÇMİŞ before #703 EKLER; TOC #241/#242","value":"Özgeçmiş then Ekler"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf","locator":"p.29 §4.3.8","value":"“Ekler bölümünün sayfa numaraları, kaynaklar bölümünün bitişini izleyen sayfa numarası ile devam etmelidir” (implies EKLER directly after KAYNAKLAR)"}],"decision":"ÖZGEÇMİŞ before EKLER (ordered list + template + TOC example).","needsConfirmation":true,"reviewDecision":"Kept ÖZGEÇMİŞ → EKLER, needsConfirmation. Explicit texts contradict each other (p.16 + p.28 'en son sayfa' + p.29 EK numbering continues from KAYNAKLAR vs the §4.1 ordered list), so the tie is broken by the template order and the TOC example (p.39: ÖZGEÇMİŞ 62, EKLER 63). The analyzer missed the p.29 sentence, which strengthens the other reading."}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Official LaTeX sample line spacing vs 2020 guide","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf","locator":"PDF p.6 §2.4","value":"1.5 line spacing for thesis text except stated special cases"},{"path":"orchestration/official-sources/aku-fbe/Fen_Bil_Ens_Tez_LaTeX_Sablon_2020.rar","locator":"Ana Dosya.tex line 17; 1-kapak.tex lines 47-51; 3-onay.sayfasi.tex lines 11-22","value":"\\renewcommand{\\baselinestretch}{1.2}; fixed -0.3 cm title/advisor gaps on cover and -0.6 cm between approval rows in a five-row example"}],"decision":"The LaTeX example's numeric spacing is a source conflict with the explicit guide, not a conditional rule for long titles or seven jurors. Its A4/30 mm geometry corroborates the guide. Do not transfer the fixed negative gaps to the Word/editor template without independent validation.","needsConfirmation":true}

### aku-isg-tezsiz-proje

- UNKNOWN: {"key":"inner-cover title beyond the source's one line","why":"Tier 2 UNKNOWN: official page 2 has one title line at baseline 106.571 mm and no long-title overflow rule. Deterministic default: title wraps in flow; later flow paragraphs move, while city/year stays anchored at its source-derived 261.1 mm baseline. No long-title compliance PASS is claimed."}
- UNKNOWN: {"key":"caption position/style/numbering (tables, figures)","why":"No caption paragraphs found. Çizelge/Şekil labels are INFERRED from the Çizelgeler/Şekiller index titles; caption placement, typography and numbering remain UNKNOWN."}
- UNKNOWN: {"key":"footnote typography","why":"template defines nothing"}
- UNKNOWN: {"key":"block quote","why":"template defines nothing"}
- UNKNOWN: {"key":"equations","why":"template defines nothing"}
- UNKNOWN: {"key":"appendix layout","why":"template defines nothing"}
- UNKNOWN: {"key":"CV layout","why":"template defines nothing"}
- UNKNOWN: {"key":"list-of-tables/figures/symbols entry format","why":"template defines nothing"}
- UNKNOWN: {"key":"table borders","why":"template defines nothing"}
- UNKNOWN: {"key":"bold/alignment intent of abstract text (Balk1 bleed)","why":"template defines nothing"}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"H1 paragraph format","sources":[{"path":"orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.docx","locator":"1. GİRİŞ (Balk1: 1.5 lines, before 12, after 0)","value":"heading 1"},{"path":"orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.docx","locator":"2./3./KAYNAKÇA (T1: single, 6/6)","value":"toc 1"}],"decision":"T1 (3 of 4); GİRİŞ differs","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Instruction plan vs body pages","sources":[{"path":"orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.docx","locator":"ÖRNEK (GEÇİCİ TASLAK) PLAN: BİRİNCİ BÖLÜM centred caps, 2.1 caps regular, per-chapter restart, unnumbered GİRİŞ","value":"plan"},{"path":"orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.docx","locator":"body pages: 1. GİRİŞ, 2.1 bold title case, no BÖLÜM","value":"body"}],"decision":"body pages implemented (real XML); plan not implemented","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"First-line indent of body text","sources":[{"path":"orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.docx","locator":"Baykal paragraph: none","value":0},{"path":"orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.docx","locator":"GİRİŞ placeholders: 709","value":12.5}],"decision":"0 (only real text)","needsConfirmation":true}

### aku-kimya-lisans

- UNKNOWN: {"key":"outerCover.layout","why":"guide §4.2.1 says only 'plastik spiralli ciltlenmelidir'; the template has no Dış Kapak page"}
- UNKNOWN: {"key":"headings.h3h4.case","why":"guide states case for levels 1-2 only; template titles are placeholders"}
- UNKNOWN: {"key":"tables.rowHeight","why":"template sample rows use exact/at-least heights of 6.2-7.0 mm, no rule in the guide"}
- UNKNOWN: {"key":"cover.wrappedTitleSpacing","why":"template shows a 2-line title as a 1.5-spaced paragraph plus a single-spaced '(Devam)' paragraph; the line spacing of a wrapped long title is undefined"}
- UNKNOWN: {"key":"abstract.maxLength","why":"no word/page limit in either source"}
- UNKNOWN: {"key":"cv.fields","why":"template ÖZGEÇMİŞ is a field list (Adı Soyadı, Doğum Yeri ve Tarihi, ...) but the guide only asks for a short CV; left as author content"}
- UNKNOWN: {"key":"internetSources.group","why":"numbered 'İnternet Kaynakları' group has no engine representation; authored by hand"}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"footnote font size","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Kimya_Bolumu_Bitirme_Tezi/AKU_Kimya_Bitirme_Tezi_Yazim_Kilavuzu_2023.pdf","locator":"§2.2","value":"all text 12 pt (footnotes not mentioned)"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Kimya_Bolumu_Bitirme_Tezi/AKU_Kimya_Bitirme_Tezi_Sablonu_2026.docx","locator":"styles DipnotMetni","value":"inherits Normal, no size = 10 pt"}],"decision":"Template style (10 pt single) implemented, INFERRED.","needsConfirmation":true}

### aku-matematik-lisans

- UNKNOWN: {"key":"headings.h2-h4.caps","why":"sample text only"}
- UNKNOWN: {"key":"tables.rowHeightMm","why":"sample rows exact/atLeast heights; no rule"}
- UNKNOWN: {"key":"tables.fontSizePt","why":"samples mixed"}
- UNKNOWN: {"key":"appendices.layout","why":"EKLER named only in stale TOC"}
- UNKNOWN: {"key":"cv.rows","why":"author-fill skeleton, not reproduced"}
- UNKNOWN: {"key":"footnotes","why":"no footnote in template; style chain gives 10 pt"}
- UNKNOWN: {"key":"multi-line title spacing (cover pages)","why":"sample shows 2 lines with (Devam) single-spaced; derived rule single lines + 8.05 pt after"}
- UNKNOWN: {"key":"approval/ethics/abstract pages","why":"not in template (absent, not generated)"}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Gövde/kaynakça yazı tipi","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Matematik_Bolumu_Bitirme_Tezi/AKU_Matematik_Lisans_Tez_Sablonu_2025.docx","locator":"styles.xml Normal","value":"Times New Roman"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Matematik_Bolumu_Bitirme_Tezi/AKU_Matematik_Lisans_Tez_Sablonu_2025.docx","locator":"document.xml P298, P306, P328 and ~22/30 bibliography entries","value":"direct Calibri runs"}],"decision":"style TNR (Normal; majority of body paragraphs); Calibri treated as paste residue","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Dış Kapak bölüm satırı","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Matematik_Bolumu_Bitirme_Tezi/AKU_Matematik_Lisans_Tez_Sablonu_2025.docx","locator":"P43","value":"ANABİLİM DALI"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Matematik_Bolumu_Bitirme_Tezi/AKU_Matematik_Lisans_Tez_Sablonu_2025.docx","locator":"P70","value":"MATEMATİK BÖLÜMÜ (İç Kapak)"}],"decision":"COVER_DEPARTMENT placeholder, default = template wording","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Çizelge hücre yazı boyutu","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Matematik_Bolumu_Bitirme_Tezi/AKU_Matematik_Lisans_Tez_Sablonu_2025.docx","locator":"tables 1-2","value":"12 pt"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Matematik_Bolumu_Bitirme_Tezi/AKU_Matematik_Lisans_Tez_Sablonu_2025.docx","locator":"tables 3-4","value":"10-11 pt / unspecified (10 pt default)"}],"decision":"12 pt (majority of explicit sizes), UNKNOWN requirement","needsConfirmation":true}

### aku-mbg-lisans

- UNKNOWN: {"key":"outer-cover.layout","why":"Guide lists 'Dış Kapak' but gives no layout; template has only the İç Kapak."}
- UNKNOWN: {"key":"inner-cover.logoLine.height","why":"Narrowed by review: full-line scaling of 1.5-spaced picture lines is rejected by Word's pagination record (docProps Pages=27, lastRenderedPageBreak positions). Remaining: whether Word adds the text-based 0.5-line extra (8.05 pt) to the logo row (variant A, used) or nothing (A0): cover lines below the logos would be 2.84 mm higher under A0. Only a Microsoft Word render of the template can settle it."}
- UNKNOWN: {"key":"footnotes.*","why":"Guide silent; template footnote style is Normal (TNR 10 pt, single) by inheritance only."}
- UNKNOWN: {"key":"abstract.maxWords","why":"Guide/template silent."}
- UNKNOWN: {"key":"abstract.maxPages","why":"Guide/template silent (only TEŞEKKÜR has a 1-page limit)."}
- UNKNOWN: {"key":"appendices.headingStyle","why":"Only 'EK 1., EK 2.' naming is given; no sample page."}
- UNKNOWN: {"key":"curriculumVitae.layout","why":"Mentioned for TOC only; no content/layout rule."}
- UNKNOWN: {"key":"headings.h3/h4.caps","why":"Guide defines case for H1/H2 only; template samples are title case."}
- UNKNOWN: {"key":"multiLineTitle.spacing","why":"Template demonstrates a 2nd title line as a separate paragraph with different spacing (see conflict cover-title-line-spacing)."}
- UNKNOWN: {"key":"wordModel.paragraphSpacing.additive/topOfPage","why":"No source page shows after>0 followed by before>0, or a 6 pt space-before paragraph at a page top rendered by Word (the guide's own bibliography examples do not use the 6 nk setting)."}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"cv-presence","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/AKU_MBG_Lisans_Bitirme_Tezi_Kilavuzu_2025.pdf","locator":"PDF p.13 §4.1 order","value":"no ÖZGEÇMİŞ"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/AKU_MBG_Lisans_Bitirme_Tezi_Kilavuzu_2025.pdf","locator":"PDF p.14 §4.4","value":"özgeçmiş listed in TOC"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/AKU_MBG_Lisans_Bitirme_Tezi_Sablonu_2025.docx","locator":"TOC P166","value":"ÖZGEÇMİŞ entry, no page"}],"decision":"Optional section, disabled by default; position before EKLER as in the template TOC.","needsConfirmation":true,"decisionReview":"Optional section, disabled by default; position after KAYNAKLAR and before EKLER (template TOC order); unnumbered level-1 TOC entry. Layout stays UNKNOWN."}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"outer-vs-inner-cover","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/AKU_MBG_Lisans_Bitirme_Tezi_Kilavuzu_2025.pdf","locator":"PDF p.13 §4.1","value":"Dış Kapak + İç Kapak"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/AKU_MBG_Lisans_Bitirme_Tezi_Sablonu_2025.docx","locator":"section 1","value":"one cover page, 14 pt ('Sadece bu sayfada 14 punto') = İç Kapak per guide §2.2"}],"decision":"Template page = İç Kapak; Dış Kapak layout UNKNOWN.","needsConfirmation":true,"decisionReview":"Template page = İç Kapak (guide §2.2 14 pt rule + template callout). Dış Kapak layout UNKNOWN: do not generate it; missing evidence = a Dış Kapak sample/statement."}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"cover-title-line-spacing","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/AKU_MBG_Lisans_Bitirme_Tezi_Sablonu_2025.docx","locator":"P12 (1.5) / P13 (single)","value":"first title paragraph 1.5, '(Devam)' paragraph single"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/AKU_MBG_Lisans_Bitirme_Tezi_Sablonu_2025.docx","locator":"P48 single / P49 1.5 (ÖZET); P83/P84 single (ABSTRACT)","value":"title single in ÖZET/ABSTRACT"}],"decision":"Cover title paragraph 1.5; ÖZET/ABSTRACT title single. Multi-line wrapping inside one paragraph is not demonstrated.","needsConfirmation":true,"decisionReview":"A wrapped title is one paragraph and keeps that paragraph's spacing: cover 1.5 (24.15 pt pitch), ÖZET/ABSTRACT single (13.8 pt pitch). The template \"(Devam)\" paragraphs are samples of a second line and are themselves inconsistent (cover single, ÖZET 1.5, ABSTRACT single), so they cannot define a rule."}

### aku-sagbil

- UNKNOWN: {"key":"page.header.distanceMm / pagination.distanceFromEdgeMm","why":"page numbers go at the top but no distance is given"}
- UNKNOWN: {"key":"pagination.font","why":"not stated"}
- UNKNOWN: {"key":"pagination.firstPageOfChapterVisible","why":"not stated"}
- UNKNOWN: {"key":"pagination approval page visible","why":"only the inner cover is explicitly unnumbered"}
- UNKNOWN: {"key":"headings.h1.spaceBeforePt","why":"2 aralık from text-block top is stated only for front/back titles"}
- UNKNOWN: {"key":"headings.h1.lineSpacing / multi-line headings","why":"not stated"}
- UNKNOWN: {"key":"headings.h4.* (except bold, numbering)","why":"level 4 discouraged; no style"}
- UNKNOWN: {"key":"captions.fontSizePt (exact)","why":"only 'smaller than body'"}
- UNKNOWN: {"key":"footnotes.fontSizePt (exact), marker style, separator thickness","why":"only 'smaller'/'narrower'"}
- UNKNOWN: {"key":"tables.lineSpacing / cell style","why":"not stated"}
- UNKNOWN: {"key":"equations number placement","why":"only reference form 'Denklem 1.1'"}
- UNKNOWN: {"key":"toc/list font size and row spacing","why":"raster example only (≈ single)"}
- UNKNOWN: {"key":"lists.figures/tables line spacing","why":"not stated"}
- UNKNOWN: {"key":"front/back title font size (ÖNSÖZ, İÇİNDEKİLER, ÖZET, KAYNAKLAR)","why":"bold caps centred only"}
- UNKNOWN: {"key":"inner-cover gaps other than '5 aralık' and absolute positions","why":"Şekil 8 is explicitly not to scale"}
- UNKNOWN: {"key":"cover-under page font sizes","why":"not stated; example ≈ 10-12 pt"}
- UNKNOWN: {"key":"approval page font sizes/spacing, master's jury count","why":"zoomed PhD example only"}
- UNKNOWN: {"key":"preface signature/date block","why":"not stated"}
- UNKNOWN: {"key":"appendix numbering/title format","why":"only 'Ekler' section named"}
- UNKNOWN: {"key":"ÖZGEÇMİŞ content, format, TOC inclusion","why":"listed as §2.6 but no text"}
- UNKNOWN: {"key":"abstract.maxWords","why":"page limit only (≤ 2 pages)"}
- UNKNOWN: {"key":"outer-cover logo asset","why":"only a ≈200 px raster inside Şekil 6; no vector/official file in sources"}
- UNKNOWN: {"key":"headings.h*.fontSizePt for non-default body sizes","why":"only annotated for the TNR-12 example"}
- UNKNOWN: {"key":"wordModel.firstBaselineOffsetEm for 1.5 spacing; wordModel.paragraphSpacing","why":"no vector 1.5-spaced text or spacing-based paragraphs in the source"}
- UNKNOWN: {"key":"approval Raportör role for master","why":"PhD example only"}

### aku-sbe

- UNKNOWN: {"key":"pagination.distanceFromEdgeMm / page.footer.distanceMm","why":"Guide only says 'alt orta'. The guide's own pages do not follow its margins."}
- UNKNOWN: {"key":"page.header.distanceMm","why":"No header specified."}
- UNKNOWN: {"key":"headings.*.fontSizePt","why":"No heading size stated; 12 pt INFERRED from the general text rule."}
- UNKNOWN: {"key":"headings.h5.spaceBeforePt/spaceAfterPt","why":"4th sub-level spacing not stated; 6/6 INFERRED."}
- UNKNOWN: {"key":"unnumbered main parts (GİRİŞ, TARTIŞMA…, KAYNAKÇA) spacing","why":"Only uppercase/bold/centred stated."}
- UNKNOWN: {"key":"cover.innerCover.verticalDistances","why":"No distances stated; example gives only blank-line counts at 11 pt."}
- UNKNOWN: {"key":"cover.outerCover (Tez Tanıtım Sayfası) font size, window position and width","why":"Example only (11 pt, block at 228–274 mm, ≤80 mm wide); window cover dimensions not given."}
- UNKNOWN: {"key":"inner-cover programme line wording","why":"Required in text, absent in example."}
- UNKNOWN: {"key":"captions spacing before/after","why":"Only 0/0 inside tables and single spacing stated."}
- UNKNOWN: {"key":"equations.numbering","why":"Not mentioned."}
- UNKNOWN: {"key":"abstract.maxWords","why":"Only 'one page'."}
- UNKNOWN: {"key":"jury member count per degree","why":"EK 2a shows 3 members (YL), EK 2b 5 (two advisors); PhD count not stated."}
- UNKNOWN: {"key":"approval page reproduction","why":"Form is downloaded from the institute web site (not included as a file); only the EK 4 picture exists."}
- UNKNOWN: {"key":"ethics-declaration / preface / TOC title sizes","why":"Examples show 11 pt bold; size INFERRED 12 pt."}
- UNKNOWN: {"key":"wordModel.paragraphSpacing (additive vs collapsed, top-of-page suppression)","why":"No DOCX; PDF input values unknown. Decision taken on textual grounds (see conflict)."}
- UNKNOWN: {"key":"Sanatta Yeterlik ethics-declaration wording and copies","why":"EK 3 and §5.6 cover only YL/Doktora."}
- UNKNOWN: {"key":"English page titles for foreign-language (EN) theses","why":"Guide only gives Turkish titles."}
- UNKNOWN: {"key":"page number weight","why":"Only 'Times New Roman (12 punto)'; regular INFERRED."}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Programme line on the inner cover","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf","locator":"PDF p.4 §2.1 i","value":"T.C., Üniversite, Enstitü, Anabilim/Anasanat Dalı, Program Adı, tez türü"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf","locator":"PDF p.37–38 EK 2a/2b","value":"no programme line (department = programme 'Turizm İşletmeciliği')"}],"decision":"Explicit text wins: include a programme line; wording (e.g. '… PROGRAMI') not given.","needsConfirmation":true,"reviewDecision":"Print the programme line (explicit §2.1 i) as the upper-cased programme name supplied by the user, and omit it when it equals the department name — EK 2a/2b (department and programme both 'Turizm İşletmeciliği', cf. EK 4 'Programı: Turizm İşletmeciliği') is consistent with that reading. Exact suffix ('PROGRAMI' or none) remains UNKNOWN → user-typed."}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Vertical placement of 'Sayfa' and the first TOC row","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf","locator":"PDF p.6 §2.6 i–ii","value":"'Sayfa' two line spacings below the title; first row one line spacing below 'Sayfa'"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf","locator":"PDF p.44 EK 8","value":"title 43.82 → Sayfa 50.76 → first row 57.67 mm (one pitch + 6 pt each, no blank lines)"}],"decision":"Explicit text wins (one empty line between title and 'Sayfa'); needs confirmation because the example shows none.","needsConfirmation":true,"reviewDecision":"Keep the text: 'Sayfa' baseline two single line pitches below the İÇİNDEKİLER title (one empty single line), first row on the next line below 'Sayfa'. The example's 6-pt gaps are example-frame artefacts. Remains ambiguous because §2.6 v uses 'bir satır aralığı' for an extra gap; the institute must confirm."}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Tanıtım page type size","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf","locator":"PDF p.11 §5.2","value":"Times New Roman 12 pt"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf","locator":"PDF p.36 EK 1","value":"11 pt (whole example set is 11 pt)"}],"decision":"12 pt (explicit general rule; 11 pt is the example set's global size). Window size unknown → block width ≤ 80 mm kept from the example as a soft limit.","needsConfirmation":true}

### aku-sosyoloji-lisans

- UNKNOWN: {"key":"page-number font/distance","why":"guide silent"}
- UNKNOWN: {"key":"header","why":"guide silent"}
- UNKNOWN: {"key":"heading spacing/page breaks","why":"guide silent"}
- UNKNOWN: {"key":"caption position/size","why":"guide silent"}
- UNKNOWN: {"key":"table borders","why":"guide silent"}
- UNKNOWN: {"key":"equations","why":"guide silent"}
- UNKNOWN: {"key":"footnote format","why":"guide silent"}
- UNKNOWN: {"key":"bibliography indent/spacing","why":"guide silent"}
- UNKNOWN: {"key":"Önsöz format","why":"guide silent"}
- UNKNOWN: {"key":"appendix pages","why":"guide silent"}
- UNKNOWN: {"key":"abstract/approval/declaration pages (not in guide)","why":"guide silent"}
- UNKNOWN: {"key":"page size","why":"guide silent"}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Prose 12 pt vs list examples 11.5 pt","sources":[{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Sosyoloji_Bolumu_Bitirme_Tezi/AKU_Sosyoloji_Lisans_Tez_Yazim_Kilavuzu_2022.docx","locator":"para 31","value":"12 puntoda"},{"path":"Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Sosyoloji_Bolumu_Bitirme_Tezi/AKU_Sosyoloji_Lisans_Tez_Yazim_Kilavuzu_2022.docx","locator":"Ek-4/5/6 runs sz=23","value":"11.5 pt"}],"decision":"example pages applied (user decision)","needsConfirmation":true}

### mcbu-lee

- UNKNOWN: {"key":"U1 TOC entry form/indents","why":"C6 resolved for level indents; whether sub-rows carry dot leaders/page numbers is open (placeholders show dots only in G[307]/G[308]/G[316]); template: page numbers, no leader"}
- UNKNOWN: {"key":"U2 footnote line pitch / numbering scope","why":"guide silent beyond 10 pt TNR at the page bottom; export 1.2 lines, counter restarts per section"}
- UNKNOWN: {"key":"U3 table borders / padding / header bold / repeat / '(devam)'","why":"guide specifies only caption position, single spacing, centred cells"}
- UNKNOWN: {"key":"U4 bibliography spacing / hanging","why":"excluded from 1.5 spacing without a stated value; template single, 6 pt after, no hanging"}
- UNKNOWN: {"key":"U5 list formatting","why":"no rule text"}
- UNKNOWN: {"key":"U6 figure alignment","why":"only the caption is specified in prose; image centring inferred from the example paragraph"}
- UNKNOWN: {"key":"U7 Simgeler key bold / font","why":"theme font (majorBidi) in the example XML, key bold only in the example"}
- UNKNOWN: {"key":"U8 page-number font/size","why":"footer1.xml: Calibri 11 (theme) AltBilgi paragraph + empty paragraph; export uses Times New Roman 12 at the footer distance"}
- UNKNOWN: {"key":"U9 equations","why":"guide silent; the template has no equations rule, therefore a numbered equation shows no number (audit F15 is a fixture artefact, not a defect)"}
- UNKNOWN: {"key":"U10 H2-H4 spacing","why":"examples show after=0; template 6 pt"}
- UNKNOWN: {"key":"U12 whole 'Anahtar Kelimeler:' line bold?","why":"example run formatting only"}
- UNKNOWN: {"key":"U13 Taahhütname counted/numbered","why":"template: counted (physical page), number not shown, ÖZET = I"}
- UNKNOWN: {"key":"U14 blank line after chapter heading 1.5 vs single","why":"G[339] 'bir satır boşluk'; template 20.7 pt (1.5)"}

### mcbu-tip-uzmanlik

- UNKNOWN: {"key":"page.header/footer.distanceMm","why":"guide silent"}
- UNKNOWN: {"key":"pagination.font","why":"page-number typography not stated (body 12 pt inherited)"}
- UNKNOWN: {"key":"headings.h2-h4 spacing, case, size, weight","why":"guide gives only its own heading samples; levels 3-4 not described"}
- UNKNOWN: {"key":"captions.separator/size/weight/spacing","why":"no caption sample"}
- UNKNOWN: {"key":"tables (font size, line spacing, borders, cell alignment)","why":"no table rules or samples"}
- UNKNOWN: {"key":"footnotes","why":"citations are numeric in the text; footnotes not mentioned"}
- UNKNOWN: {"key":"equations","why":"not mentioned"}
- UNKNOWN: {"key":"abstract and English abstract layout (heading block, keywords, words)","why":"only 'bir sayfayı geçmeyecek' and the English title rule; no sample"}
- UNKNOWN: {"key":"approval/jury page, declaration, acknowledgements, symbols/abbreviations, list of tables/figures","why":"not part of this guide (a thesis jury form is outside the document)"}
- UNKNOWN: {"key":"absolute cover top distance","why":"the Ek-1 example sits inside the guide's page below an 'Ek-1' caption line"}
- UNKNOWN: {"key":"LEE relation / newer rules","why":"no statement; PDF from 2014"}
- UNKNOWN: {"key":"bibliography entry spacing","why":"example spacing irregular (5.33 mm once, 10.7 mm otherwise)"}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"İÇİNDEKİLER title placement","sources":[{"path":"Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Tip_Fakultesi_Uzmanlik_Tezi/MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf","locator":"p.2 §1.2","value":"contents is a 'ilk sayfa': title centred at 5 cm"},{"path":"Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Tip_Fakultesi_Uzmanlik_Tezi/MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf","locator":"p.4 Ek-2 (MEASURED)","value":"'İÇİNDEKİLER' left-aligned at x0 18.44 mm"}],"decision":"Prose (centred, 50 mm) implemented; Ek-2 is an order-of-presentation example, not a page-layout sample.","needsConfirmation":true}
- TEYİT İŞARETLİ ÇELİŞKİ: {"topic":"Meaning of '5 harf boşluk' (paragraph indent)","sources":[{"path":"Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Tip_Fakultesi_Uzmanlik_Tezi/MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf","locator":"p.2 §1.3","value":"'Paragrafta 5 harf boşluk bırakılarak başlanır'"}],"decision":"Five space characters of Arial 12 = 5.88 mm; alternative (five average letters) ~10-12 mm.","needsConfirmation":true}
