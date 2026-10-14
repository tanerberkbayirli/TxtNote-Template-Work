# Görev 08 — Kontrol noktası (mola, 10.10.2026)

## 11.10.2026 — son kullanıcı kararıyla kapanış

Diğer geliştirme işleri kapatıldı. Kullanıcının "bu üçünü bırak gerisi tamamen kapat" talimatıyla **uzun belge Word eşliği**, **kalan PDF/Wingdings–ChartEx dışa aktarma sorunları**, **son seri genel kabul** ertelendi. Bunlar başarılı kabul sayılmıyor; yeni geniş test veya otomatik devam başlatılmayacak. Geçerli kanıt ve kapsam kaydı: [../final-closure/README.md](../final-closure/README.md).

Özel sayfalar: FBE 51 PASS, doktora 39/39; yedi uzun başlıklı aile 7/7 PASS; küçük ondalık CSS döngüsü 20/20 kararlı ölçümle kapandı; 08-E tamamlandı. Son taze 232 matris ve bütün hedeflerin kabulü üçüncü ertelenen başlıktadır. Eski başarısız/yarım denemeler korundu, commit yapılmadı. Aşağıdaki devam talimatları tarihsel olup son kullanıcı kararının yerine geçmez.

## 11.10.2026 paralel devam — güncel kayıt

**Kullanıcı limit nedeniyle kapanış istedi:** 912/912 birim + build PASS; SBE'de üç numarasız sayfa beklentisi FAIL (`none x3` beklenen / `none x2` gerçek). Beklenti dış kapağın eski taşmasına dayanıyor; kaynak/gerçek Word kanıtı tamamlanmadan değiştirilmedi. Genel tur ayrıntıları `resume-final-summary.json`/`resume-final-r3`; altı Word grubu, SBE stres tekrarları, taze matris ve SRC09/SRC10 sayfa/performance ölçümü açık. Sonraki oturum `../motor.md` başındaki devam kaydından başlamalı; tamamlandı kaydı yok.

Üç ajan 08 / 09–10 / 07–11–12 alanlarını sürdürdü; raporlar `resume-special-pages.md`, `resume-tables-media.md`, `resume-notes-references.md`, `resume-schema/README.md`. Şablon kaynak ölçüleri değiştirilmedi, commit yapılmadı. Alttaki 10.10 kayıtları tarihsel olup güncel kabul sayılmaz.

- Sabit kodla tam birim **912/912 PASS**, 0 atlama; üretim derlemesi PASS (`resume-final-r2/base-gates.json`). İlk 911 turunun tek hatası yer imi eklenince 200 karakter regex sınırını aşan doğru OMML idi; gerçek aralık/font/boyut değerleri korunarak namespace-DOM kesin testine düzeltildi, ayrıca gerçek hücre-listesi çağrı hatasına yeni regresyon eklendi.
- EPERM/EACCES sandbox kısıtları normal yerel yetkili çalıştırmada aşıldı; 5175 eski Vite önbelleğinin 504 sonuçları başarı sayılmadı. 5177 ayrı temiz sunucuyla genel tur `resume-final-r3` altında sürüyor; eski başarısız denemeler korunuyor.
- SRC08/SRC10 sabit kaynak hash, sıralı gövde metni, kalıcı kimlik, kaydet/aç, DOCX üretimi PASS; yeniden Office2016 SDK 0/0 hata. Yedi bağımsız küçük DOCX ve gerçek SRC09 çizim/OMML kesiti de SDK 0 hata PASS.
- Gerçek küçük tarayıcı kanıtları: özel sayfa çakışma/kayma/geri dönüş/taşma; bölüm/belge sonnot yerleşimi; gerçek klavye kopyala/yapıştır, IME, seçim, undo/redo, yeniden açma PASS. Bunlar uzun tez ve tam Word eşliği değildir.
- Açık son tur: genel 25 hedef, gerçek altı Word grubu, SBE normal/CPU kısıtlı 5'er tekrar, taze değişken içerik ve başlık hizası matrisi, SRC09/SRC10 sayfa/performance ölçümü. Görev 08–13 tamamlandı sayılmıyor.

Durum: **DEVAM EDİYOR · TAMAMLANMADI.** Görev 07 metin akışı ölçütüyle kapatıldı (bkz. `orchestration/engine-work/mission07/README.md`). Kullanıcı kararları: önce MOTOR, şablonlara en son bakılır; hiçbir görev iptal edilmez; kılavuz sessizse mantıklı olan yapılır (ortalı başlıkta her satır ortalı).

## Motor tarafında inenler (commit edilmedi, 863 birim testi PASS, `TMPDBG` satırı yok)
- Özel sayfa taşma/çakışma bildirimi: `thesis/specialPageFit.js` (kırpma yok, gizleme yok, uyarı şeridinde Türkçe mesaj).
- Esnek boşluk (üst düzey spacer, `minHeightMm`, varsayılan %35) + ölçülen boşlukları DOCX'e taşıma + kayan çerçeve konumu: `specialPages.js`, `engineCss.js`, `docx/specialPages.js`, `docx/body.js`, `export.js`.
- İçe aktarılan Word: başlık numaraları, liste girintisi, Symbol madde işareti yüksekliği, boş/gizli paragraf, bağlamsal boşluk, tablo geometrisi (genişlik, hücre kenar boşluğu, hücre satır yüksekliği), dipnot paragrafları ve %100 alan, sınıf anahtarlı CSS (SRC09 yükleme 250 sn → ~32 sn).
- Sonuç ölçümleri: SRC10 editör 91 sayfa = Word 91; SRC09 203 sayfa (Word 180).

## Açık / sıradaki (motor)
1. Esnek boşluk: iç içe sütun gruplarındaki spacer'lar esnemiyor (Sağlık onay sayfası uzun başlıkta 4–11 sözcük taşıyor); dış kapağın sığmasının kod yolu doğrulanmadı; Word'de dış kapakta 1 sözcük taşıyor. Ajan `ad64ebc4213dbd958` bu işte çalışıyordu (sonucu henüz alınmadı).
2. SBE kararsızlığı: olası neden bulundu ve korundu — `ThesisEditor.jsx probe()` fontlar yüklenirken (`document.fonts.status === "loading"`) onaylamıyor. 5/5 normal, 5/5 CPU kısıtlı, `--all` ve `npm test` doğrulaması YAPILMADI.
3. Tablo: boş satır yüksekliği (30 pt vs Word 34 pt), hücre kenarlıkları Word'den alınmıyor, SRC09 yatay ek bölümü yeniden bakılmadı.
4. Şekil içi metin kutuları (örn. Şekil 2.3) çizilmiyor.
5. DOCX dışa aktarma çok paragraflı dipnotu tek paragraf yazıyor.
6. Başlık numarası: "4.1. Data Description" Word çıktısında numarasız görünüyor (neden bakılmadı); PDF/DOCX çıktısı render edilerek doğrulanmadı.
7. Sınıf anahtarlı CSS (`txn-*`): kaydet/yeniden aç akışında sınıfın kayda sızmadığı ayrıca test edilmeli.
8. Son tur: tam regresyon (`check.mjs --all`, tek tek temiz koşu), gerçek Word grupları (617), 29 şablonlu değişken-içerik denetimi (`orchestration/engine-work/mission08/audit/driver.py`, `run1.sh`, `report.py`) yeniden.

## Şablonlara en son bakılacak
- Değişen şablon dosyaları: `adu-ziraat-lisans.js` (not satırı 1,725 + CITY_YEAR sabit konum; kontrol PASS=14), `aku-sagbil.js` (5/6 jüri için sıkıştırılmış yerleşim), `aku-fbe.js` (iç kapak ortak danışman boşluğu grup dışına), `iyte.js` (onay sayfası ve dış kapak akışkan gruplara çevrildi; dosya git'te takip edilmiyor, ÖNCEKİ HALİ YOK — kullanıcıya soruldu).
- Motor çözümü gelince bu değişikliklerin hâlâ gerekli olup olmadığına bakılacak; kaynak ölçüsüne dokunanlar geri alınacak.
- Kılavuzu ikinci danışmanı anmayan şablonlarda (13 hedef) ikinci danışman alanı eklenmedi.

## Not
- Üretilmiş büyük dosyalar: `TxtNote/frontend/tests/generated/`, `orchestration/engine-work/mission07/*.fixture.json`, `orchestration/engine-work/mission08/**/out*` — commit edilmemeli.
- Ölçüm araçları: `orchestration/engine-work/mission07_*`, `orchestration/engine-work/mission08/audit/`, `orchestration/engine-work/mission08/elastic/`.
