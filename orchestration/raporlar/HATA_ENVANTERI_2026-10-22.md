# 22 Ekim 2026 hata envanteri özeti

Bu liste tarihsel kimlik dizinidir; DOĞRULANDI/KOD OKUMA/BELGEDEN etiketleri yalnız 22 Ekim kaydıdır. Bugün bütün maddelerin açık olduğunu göstermez. Sonraki raporlar ve güncel [GOREVLER.md](../GOREVLER.md) birlikte değerlendirilir. Hiçbir kayıt bu sadeleştirmede yeniden çalıştırılmadı.

Uzun yeniden üretim anlatımları ve ham çıktılar, temizlik öncesi yedeğin `orchestration/raporlar/HATA_ENVANTERI_2026-10-22.md` üyesinde eksiksiz korunur: `.test-tmp/validation/orchestration-sadelestirme-20261026/orchestration-before.zip`. İncelenecek kimlik seçildiğinde oradan alınabilir. Commit atma veya başka işleri başlatma önkoşulu yoktur.

## Tarihsel kimlik dizini


| ID | Önem | Durum | Başlık |
|---|---|---|---|
| HE-VB-01 | P1 | DOĞRULANDI | Okunamayan bir öğe satırı yüklemede sessizce atlanır, sonraki ilk kayıtta öğe ve notu **kalıcı silinir** |
| HE-VB-02 | P1 | DOĞRULANDI | Bozuk tek bir not satırı bütün anlık görüntü yüklemesini bozar; sonra boş not üzerine yazılır |
| HE-VB-03 | P1 | DOĞRULANDI | Metin/kod dosyası düzenlenince `encoding`, `languageId`, `languageLocked`, `fileId` kaybolur (UTF-16 dosya sessizce UTF-8'e döner) |
| HE-VB-04 | P1 | DOĞRULANDI | "Kalıcı olarak sil" + Geri al (Ctrl+Z): öğe çöp kutusuna döner ama **içeriği boştur** |
| HE-VB-05 | P1 | DOĞRULANDI | Kayıt hataları kullanıcıya hiç bildirilmez |
| HE-DP-01 | P2 | DOĞRULANDI | Çalışma ağacı işlenmemiş; bu belgenin taban aldığı durum commit'te yok |
| HE-GV-03 | P2 | KOD OKUMA | Güncelleyici uç noktası `http://localhost:3000` ve `dangerousInsecureTransportProtocol: true` üretim yapılandırmasında |
| HE-SB-01 | P2 | DOĞRULANDI | Dokuz Eylül (FBE YL) ve Ege (Eğitim YL) şablonları kayıt defterinde yok; kaynak-temelli kontrolleri çalıştırıldığında çok sayıda başarısızlık |
| HE-SB-05 | P2 | DOĞRULANDI | Şablon üretim hattı yeni kaynaklarda çoğunlukla "bir insan gerekir" diye duruyor (6 yeni kaynaktan 1'i otomatik) |
| HE-SR-01 | P2 | BELGEDEN | Gerçek Tauri uygulamasından PDF/Word alma ve yazarken gecikme **hiç ölçülmedi** |
| HE-TS-07 | P2 | DOĞRULANDI | Masaüstü kabul testi (`desktop-smoke.mjs`) ve gerçek kurulum paketi bu turda çalıştırılmadı; yerel kurulum paketi eski |
| HE-DP-02 | P3 | DOĞRULANDI | Depo ağırlığı: izlenen 1 GB üretilmiş fixture; `.git` içinde 88 MB çöp |
| HE-DX-01 | P3 | DOĞRULANDI | Dışa aktarılan **bütün** DOCX dosyaları Open XML şema doğrulamasından geçmiyor (`settings.xml` eleman sırası) |
| HE-DX-02 | P3 | DOĞRULANDI | AFSÜ LEE: editör PDF'inde `SymbolMT` yazı tipi (madde işareti); kaynak-temelli yazı tipi kontrolü başarısız |
| HE-EW-01 | P3 | DOĞRULANDI | AKÜ Sağlık Bilimleri Enstitüsü (yüksek lisans ve doktora): onay sayfası Word'de **iki sayfaya taşıyor** |
| HE-EW-02 | P3 | DOĞRULANDI | AKÜ Kimya (lisans bitirme tezi): kapak sayfası Word'de **boş bir ikinci sayfa** üretiyor |
| HE-EW-03 | P3 | DOĞRULANDI | AKÜ Felsefe (lisans bitirme ve seminer): tablo ve bölüm başı kaymaları |
| HE-EW-04 | P3 | DOĞRULANDI | Dokuz Eylül FBE (kayıtsız şablon): editör **52**, Word **62** sayfa |
| HE-EW-05 | P3 | DOĞRULANDI | Ege Eğitim Bilimleri (kayıtsız şablon): sayfa sayısı eşit ama 318 satır yatayda kayık |
| HE-EW-06 | P3 | DOĞRULANDI | Sayfa altı dipnot: Word, dipnota yer açmak için gövdenin son satırlarını sonraki sayfaya iter, editör itmez |
| HE-EW-07 | P3 | BELGEDEN | Üretilen listeler (içindekiler/şekil/tablo dizini): ~1 pt satır kayması; uzun girdinin sayfa numarası ilk/son satırda |
| HE-EW-08 | P3 | DOĞRULANDI | İYTE: alt başlık + sonraki paragraf ayrımı, 1/90 tablo satırı; **EEE bitirme projesinde 299 satır 35,4 pt yatay kaymış** |
| HE-EW-09 | P3 | DOĞRULANDI | Tablo sütun konumları: AKÜ FBE ve MBG'de **115,3 pt**, MCBÜ/AKÜ ISG/Matematik'te "özgeçmiş" sayfasında 32,6 pt |
| HE-GV-01 | P3 | DOĞRULANDI | `sanitizeHtml` `javascript:` süzgeci sekme/satır sonu/C0 karakteriyle atlatılır |
| HE-GV-02 | P3 | DOĞRULANDI | Belge derleme ve yazdırma yolu notun HTML'ini süzmeden taşır |
| HE-SB-02 | P3 | DOĞRULANDI | Üretilen iki şablonun künyesi yanıltıcı: `status: "official"`, `source.documentName: "official.docx"`, `verifiedAt: 2026-10-22` |
| HE-SB-03 | P3 | DOĞRULANDI | Kayıt defteri (`registry.js`) elle bakılan, şablon verisini tekrarlayan bir liste |
| HE-SR-02 | P3 | DOĞRULANDI | Yazarken gecikme (80–120 sayfalık tez): her tuşta uzun görev, kabul bütçesi yok |
| HE-SR-04 | P3 | KOD OKUMA | Sayfalama, Chromium'un yeni CSS özelliklerine dayanıyor; en düşük WebView2 sürümü belirtilmemiş |
| HE-TS-03 | P3 | KOD OKUMA | Birim testlerinin bir kısmı makine yazı tiplerine bağlı, yoksa **sessizce atlanır** |
| HE-TS-04 | P3 | DOĞRULANDI | Tür denetimi, lint ve CI yok; belgelenen "TypeScript koruması" çalışmıyor |
| HE-TS-06 | P3 | KOD OKUMA | `devserver.sh stop/restart` makinedeki **bütün** `vite` süreçlerini sonlandırır |
| HE-UI-04 | P3 | DOĞRULANDI | Şablon seçicide "Enstitü" listesinde AKÜ Sosyal Bilimler boş görünür; "Tez türü"nde `sanatta-yeterlik` ham kimlikle yazılır |
| HE-VB-06 | P3 | DOĞRULANDI | Her yazma duraklamasında bütün veritabanı yeniden yazılır; kapanışta 1,5 sn'lik yarış |
| HE-VB-07 | P3 | DOĞRULANDI | ZIP sınırları açıldıktan **sonra** denetlenir (zip bombası bellek tüketir) |
| HE-VB-11 | P3 | KOD OKUMA | Geri alma yığını her adımda **bütün not nesnelerinin** önce/sonra kopyasını tutar (görselli tezde bellek) |
| HE-DP-03 | P4 | DOĞRULANDI | Belge çürümesi: yönlendirme bağlantılarının çoğu kırık |
| HE-DP-04 | P4 | DOĞRULANDI | `.gitattributes` yok; satır sonları karışık |
| HE-DP-05 | P4 | DOĞRULANDI | Klasör kuralı ve katman ihlalleri |
| HE-DP-06 | P4 | DOĞRULANDI | Satır içi yardımcı kod: Windows'a/yerel makineye bağlı yollar |
| HE-EW-10 | P4 | DOĞRULANDI | Şekil konumu farkları (AFSÜ Tıp/DHF `37,9 pt`; AKÜ Felsefe `26,7`/`20,6`; İYTE EEE `17,7`) |
| HE-SB-06 | P4 | DOĞRULANDI | Şablon klasörlerinde yalnız kaynak belgesi olan 11 üniversite var (bilinen eksik, hata değil) |
| HE-SR-03 | P4 | DOĞRULANDI | Paket içeriği: yinelenen parça, gömülü yazı tipleri, şablon görselleri |
| HE-TS-05 | P4 | DOĞRULANDI | Open XML doğrulayıcısı Office'in "Power Query" eklentisindeki bir DLL'e bağlı |
| HE-TS-08 | P4 | BELGEDEN | `parity.py` şekil açıklamalarını yanlış eşliyor |
| HE-TS-09 | P4 | DOĞRULANDI | Test sayıları ve belge ifadeleri geride kalmış (kayıt) |
| HE-UI-05 | P4 | DOĞRULANDI | "Word içe aktar" ve "PDF içe aktar" düğmeleri ribbon'da duruyor; sahibin kararı (20.10.2026): şimdilik dışarıdan `.docx` içe aktarma özelliği olmayacak |
| HE-UI-06 | P4 | KOD OKUMA | Pagination "sabit nokta" döngüsü sınırı aşılırsa dışa aktarma engellenir |
| HE-VB-08 | P4 | DOĞRULANDI | `upsert_note` revizyonu yalnız bazı alanlar değişince artırır |
| HE-VB-09 | P4 | KOD OKUMA | Tarayıcı modunda "en zengin" anlık görüntü seçimi yeniliği değil sayıyı esas alır |
| HE-VB-10 | P4 | KOD OKUMA | Not sürüm geçmişi Tauri'de de `localStorage`'a yazılır (kota) |

Toplam **51** kayıt: P1 5, P2 6, P3 25, P4 15. Durum dağılımı: DOĞRULANDI 40, KOD OKUMA 8, BELGEDEN 3.

## Tarihsel teslim sonrası bildirim (22.10.2026, düzeltmeyi yapan taraftan gelen bildirim)

Bu bölüm kayıtların kendisini değiştirmez; hangi kaydın düzeltildiğini, hangisinin neden açık kaldığını ve ileride birlikte çözülecekleri tutar. Beş düzeltme commit'i (`44329a75` … `03766db9`) çekildi; bu makinede birim testleri 1151/1151, araç testleri 24/24, `cargo test --lib` 26/26, `vite build` geçti.

### 13.1 Bildirilen çözümler
| Kayıt | Durum | Bu makinede ne görüldü |
|---|---|---|
| HE-DX-01 | düzeldi | **Doğrulandı:** AKÜ Kimya ve MCBÜ DOCX'i `validate-openxml.ps1` → `PASS errors=0` (önceden 34/34 FAIL). Kalan 32 şablon yeniden koşulmadı. |
| HE-GV-01 | düzeldi | **Doğrulandı:** `sanitizeHtml` ile SVG `onload`/`animate`, sekme gizlemeli `javascript:`, MathML `xlink:href`, `<img onerror>` girdileri temizlendi. |
| HE-VB-01…05, 07, 08 | bildirildi | Rust (db.rs karantina) ve birim testleri geçiyor; tarayıcıda yeniden üretilmedi. |
| HE-GV-02, GV-03, SB-02, SB-03, UI-04, TS-03, TS-04, TS-06 | bildirildi | Commit mesajlarına ve testlere göre; `npm run typecheck` ve CI iş akışı bu makinede çalıştırılmadı (`tsc` kurulu değil). |
| HE-UI-05 | karar | Kullanıcı kararı: içe aktar düğmeleri kalır (GOREVLER.md). |
| HE-SR (sistem fontu) | kısmen | macOS/Linux'ta PDF için sistem fontu okunuyor (`system_fonts.rs`); masaüstü uçtan uca doğrulanmadı. |

### 13.2 Çözülmeyenler (birlikte ileride ele alınacak)
- **Windows + Word gerektirir (düzeltmeyi yapan taraf macOS'ta olduğu için doğrulayamadı):** Word eşliği HE-EW-01…10, AFSÜ Symbol madde işareti HE-DX-02, DEÜ/Ege şablonlarının kayda eklenmesi HE-SB-01, masaüstü kurulum ve ölçümleri HE-SR-01 ve HE-TS-07, HE-TS-05, HE-SR-04.
- **Daha büyük mühendislik işleri, başlanmadı:** her kayıtta bütün veritabanının yeniden yazılması ve kapanıştaki yarış HE-VB-06; geri alma geçmişinin bellek kullanımı HE-VB-11; yazarken gecikme HE-SR-02; şablon üretim hattının yeni kaynaklarda takılması HE-SB-05.
- **Kullanıcı kararıyla dokunulmadı:** depo boyutu HE-DP-02 (takipsiz 62 fixture ve 50 MB'lık dosya uyarısı da bununla ilgili).
- **Küçük P4 kayıtları, yapılmadı:** HE-DP-03…06, HE-TS-08/09, HE-SR-03, HE-UI-06, HE-VB-09/10, HE-EW-10.

### 13.3 Yinelenen taslak notu (HE-SB-01 ile ilgili)
DEÜ FBE YL ve Ege Eğitim şablonları (kayıtsız, `status: generic`), taslak hattının ürettiği DEÜ ve Ege `TezliYLSablon` taslaklarıyla **birebir aynı kaynak dosyadan** üretilmiş. Resmî olanlar kayda girdiğinde aynı kaynaktan gelen taslaklar kaldırılmalı (kayıt eklenirken tekrar önlenmeli).
