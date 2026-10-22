# TxtNote araştırma planı (ayrıntılı sürüm) — 17.10.2026

18.10.2026 kapsam notu: Kullanıcı ortak editör için dört genel düzen işini seçip uygulama yetkisi verdi; yan panel klavye/odak davranışı, araç durumları, dışa aktarım geri bildirimi ve görev kaydı bakımı [raporlanan kapsamda](../engine/docs/reports/GENEL_DUZEN_2026-10-18.md) tamamlandı. Bu sonuç W1/W2/W3/W8/W10'un ilgili alt maddelerini kapsar; aşağıdaki araştırma planının tamamını veya MCBÜ simülasyonunu kapatmaz. Aşağıdaki “henüz çalıştırılmadı/kod değiştirmeyeceğim” ifadeleri 17 Ekim planının tarihsel başlangıç durumudur.

Bu belge bir **plandır, bulgu raporu değil.** Uygulama kod ve belgelerden incelendi; aşağıdaki maddelerin hiçbiri henüz çalıştırılıp doğrulanmadı. Çalışmaya sizin komutunuzla başlayacağım (örn. `P4'ü yap`, `W2'yi yap`, `S'yi başlat`). Siz söylemeden kod değiştirmeyeceğim.

> **Not (kullanıcı hedefi):** Kullanıcı **MCBÜ Yüksek Lisans tezi** (`mcbu-lee-master-tr-v1`, Manisa Celal Bayar Üniversitesi · Lisansüstü Eğitim Enstitüsü) yazacak. Tezin konusu ve içeriği önemsiz; sınanan şey, **kullanıcının yapmak istediği işi yapıp yapamadığıdır.** Simülasyonda metin yer tutucudur.

## 0. Üç bölümlü yapı

| Bölüm | Konu | Kodlar |
|---|---|---|
| **I** | Tez yazım alanı: sayfa sayfa yüzey, her işlev | `P1 … P18` |
| **II** | Word penceresi: üst şerit, sekmeler, yan paneller | `W1 … W10` |
| **III** | MCBÜ Yüksek Lisans tezini baştan sona yazma simülasyonu | `S0 … S16` |
| **IV** | Diğer araştırma başlıkları (kısaltılmış) | `D1 … D8` |

Önerilen sıra: **W → P → S → D.** Önce araçları, sonra yüzeyi tek tek, en sonda hepsini birlikte sınarım; simülasyon, öncekilerde bulunan sürtünmeleri gerçek bir iş akışında yeniden doğrular.

### Ortak yöntem
- Test ortamı: yerel geliştirme sunucusu (Vite), gerçek `ThesisEditor`; MCBÜ Yüksek Lisans şablonu seçili. Gerçek hesap/ödeme/kullanıcı verisi yok.
- Her test: **adım → beklenen → gözlenen → kanıt** (ekran görüntüsü, konsol/ağ çıktısı veya kod satırı).
- Sonuç etiketleri: `OK` · `SÜRTÜNME` (çalışıyor ama zor/kafa karıştırıcı) · `HATA` · `ENGEL` (işi yapamıyorum) · `ÖLÇÜLEMEDİ`.
- Her bulgu için kullanıcı etkisi: veri kaybı > iş yapılamıyor > yanlış çıktı > kafa karışıklığı > görünüş.

## 1. MCBÜ Yüksek Lisans şablonunun incelenen yapısı

Şablon verisinden (`engine/src/templates/mcbu.js`) okunan, **doğrulanacak** beklentiler:

- **Sayfa:** A4; kenar boşlukları üst 25 · alt 25 · sol 40 · sağ 25 mm; sayfa numarası altta ortada, biçim `arabic`; dipnot sayfa altında, Times New Roman 10 pt.
- **Metin:** Times New Roman 12 pt, iki yana yaslı, satır aralığı 1,5, ilk satır girintisi 12,5 mm, paragraf sonrası 6 nk.
- **Başlık 1:** “BİRİNCİ BÖLÜM” biçimli sıra numarası ayrı satırda, BÜYÜK HARF, kalın, yeni sayfada başlar. **Başlık 2–4:** `1.1.`, `1.1.1.`, `1.1.1.1.`.
- **Tablo:** açıklama üstte, “Tablo n” (numaralandırma seçilebilir: tez boyunca 1’den veya bölüme göre `1.1`). **Şekil:** açıklama altta, aynı seçim.
- **İçindekiler:** düzey 1–4, sayfa numaralı. **Denklem:** şablonda tanımlı değil.
- **Atıf biçimi:** şablon bir atıf biçimi tanımlamıyor (`citationStyle` yok); kaynakça başlığı “KAYNAKÇA”, tek satır aralığı, kaynaklar arası 6 nk, sarkık girinti 0.
- **Bölümler (sırayla):** İç Kapak (sabit) · Taahhütname (sabit) · ÖZET + Özet metni + anahtar kelime altlığı · ABSTRACT + Abstract text + keywords · ÖNSÖZ VE TEŞEKKÜR (+ imza, sabit) · SİMGELER VE KISALTMALAR DİZİNİ (yazılır) · ŞEKİLLER DİZİNİ, TABLOLAR DİZİNİ, İÇİNDEKİLER (otomatik) · GİRİŞ · Bölümler (ana metin) · KAYNAKÇA · EKLER (isteğe bağlı) · ÖZGEÇMİŞ (isteğe bağlı).
- **Bilgi alanları (17):** üniversite, enstitü, başlık, öğrenci, bölüm (TR/EN), program, danışman ve eş danışman (unvan/ad), şehir, yıl, anahtar kelimeler (TR/EN), sayfa sayısı, kullanılan programlar.
- **Doğrulama kuralları:** Anahtar kelime ≥ 5 (TR ve EN, virgülle); Abstract için İngilizce bölüm adı dolu olmalı.

---

# BÖLÜM I — Tez yazım alanı (sayfa sayfa yüzey)

Bakılacak kod: `ThesisEditor.jsx`, `ThesisSectionPages.jsx`, `RichTextBody.jsx`, `useLayoutInteraction.js`, `LayoutSelectionOverlay.jsx`, `LayoutRulers.jsx`, `engine/src/pageLayout.js`, `engine/src/generatedIndex.js`, `engine/src/footnotes.js`, `engine/src/specialPages.js`.

### P1. Sayfa yüzeyi ve sayfalama
- Sayfa boyutu/kenarlıkların şablonla birebir uyumu (cetvel ve denetçiyle ölçüm: 210×297 mm, 25/25/40/25).
- Metin yazarken sayfaların oluşması/silinmesi; sayfa sayısının durum çubuğuyla tutarlılığı (`pagination hazır` bayrağı).
- Yeni bölümün yeni sayfada başlaması; boş sayfa/çift-tek sayfa boşluk davranışı.
- Yakınlaştırma 50–150 %, kaydırma, sayfa gölgesi/arka plan, büyük ve küçük pencerede sayfa ortalama.
- Sayfa sonu ekleme; elle sayfa sonunu silme.
- Başlık sayfa sonunda kalınca bir sonraki satırla taşınıyor mu (`keepWithNext`); dul/öksüz satır.

### P2. Üç bölüm türünün davranışı
- **Sabit** (iç kapak, taahhütname, özet/abstract başlıkları, anahtar kelime altlıkları, önsöz imza): tıklayınca ne oluyor, hangi satırlar yazılabilir (başlık/sabit satır), Enter ve Esc davranışı, değişiklik tez bilgilerine mi yoksa yalnız metne mi gidiyor.
- **Yazılabilir** (özet, abstract, önsöz, simgeler, giriş, bölümler, kaynakça, ekler, özgeçmiş): imleç ilk girişte nerede, boş bölüm yer tutucusu, bölüm sınırında Backspace/ok tuşu.
- **Otomatik** (şekiller, tablolar, içindekiler): seçilince uyarı mesajı, düzenleme denemesi, güncelleme gecikmesi.
- İsteğe bağlı bölümlerin (Ekler, Özgeçmiş) nasıl açılıp kapandığı; kapalı bölümün çıktıda yer almaması.

### P3. Metin girişi ve düzenleme
- Türkçe karakterler (ı, İ, ş, ğ, ü, ö, ç) ve büyük/küçük harf dönüşümü; IME/ikinci klavye.
- Enter/Shift+Enter, Tab, Backspace ve Delete paragraf başında/sonunda, sözcük silme.
- Seçim: çift/üç tık, Ctrl+A (bölüm mü belge mi?), bölümler arası seçim, fareyle sürükleyerek seçim.
- Kopyala/yapıştır: düz metin, Word’den biçimli, web’den, görselli, tablolu; kaynak biçiminin temizlenmesi/korunması; çok büyük yapıştırma.
- Geri al/yinele (`textHistory`): uzun yazı sonrası, biçim sonrası, başlık ekleme sonrası, bölüm değiştirdikten sonra.
- Kısayollar: Ctrl+B/I/U, Ctrl+Shift+X; yazarken otomatik dönüştürülen kısaltmalar (`RichTextBody` “shorthand rewrite”; hangi diziler tetikliyor, beklenmedik dönüşüm var mı).
- Sağ tık biçim menüsü (`FormatContextMenu`).
- Yazım denetimi (tarayıcı) görünümü ve şablon renkleriyle çakışması.

### P4. Başlıklar ve numaralama
- Başlık 1–4 uygulama: stil galerisi, paragraf biçimi açılır listesi, “Başlık ekle” (yazım planı); düzey değiştirme.
- Numaralar: “BİRİNCİ BÖLÜM” ayrı satır, `1.1.`, `1.1.1.`; numaranın metne elle yazılması durumunda uyarı/çift numara.
- Büyük harf dönüşümü ve istisnalar; başlık metni düzenlenince içindekilerin güncellenmesi.
- Başlık silme/taşıma/birleştirme; boş başlık.
- Şablonun beklediği ana başlık sırası (varsa “Şablondaki ana başlıklar” listesi) ve eksik başlık ekleme.
- Giriş ile Bölümler arasında numaralandırmanın devamı; Kaynakça/Ekler başlıklarının numarasız olması.

### P5. Paragraf biçimi, listeler, girinti, hizalama
- Madde işaretli/numaralı liste; iç içe liste; liste içinde Enter ile çıkış; listenin şablon girintisiyle uyumu.
- Girinti artır/azalt; ilk satır girintisi ile çakışma.
- Hizalama (sol/orta/sağ/iki yana) ve bölüm kuralına geri dönüş; biçim temizleme sonrası şablon varsayılanı.
- Yazı tipi kilidi: şablon yazı tipi değişmiyor mu; punto kutusu, büyüt/küçült, renk/vurgu şablon kurallarını bozuyor mu (bozuyorsa kullanıcıya uyarı var mı).
- Satır aralığı, paragraf aralığı değişikliklerinin şablonla çatışması.

### P6. Tablolar
- Satır/sütun sayısı sınırları (1–30 / 1–12) ve geçersiz girdi davranışı; boş/büyük değer.
- Hücreye yazma, Tab ile gezinme, satır/sütun ekleme-silme, hücre birleştirme (varsa), hücre içi hizalama.
- Açıklama üstte, “Tablo n” numarası; numaralandırma seçimi (tez boyunca / bölüme göre) ve sonradan değiştirme etkisi; açıklama silinirse dizin.
- Tablonun sayfa sonunda bölünmesi (satır parçalanması), başlık satırı tekrarı, taşan geniş tablo.
- Tablolar dizinine yansıma; tablo silince numaraların yeniden dizilmesi.
- Word’den yapıştırılan tablo (kaynak biçim).

### P7. Şekiller ve görseller
- Görsel ekleme (dosya seçici, sürükle-bırak, yapıştır), boyut sınırı, desteklenen türler, bozuk dosya.
- “Görsel türü” (şekil/fotoğraf/grafik) ve açıklama altta, “Şekil n”; numara seçimi.
- Yeniden boyutlandırma, hizalama, sayfa sonuna taşma, görsel seçince çıkan denetim (`AcademicImageControls`).
- Şekiller dizinine yansıma; görsel silinince açıklama ve numara.
- Büyük görselin kayıt/boyut etkisi.

### P8. Denklemler
- Şablon denklem tanımlamıyor (MCBÜ): “Blok denklem ekle” yine de çalışıyor mu, numaralandırma açılıp kapanıyor mu, biçim şablonla uyumlu mu; bu durumda kullanıcıya bilgi veriliyor mu.
- Denklem giriş biçimi (LaTeX/formül düzenleyici), satır içi formül, Word’e ve PDF’e aktarım.

### P9. Dipnot ve sonnot
- Dipnot ekleme (imleç konumunda), numaralama, metin düzenleme, silme.
- Sayfa altına yerleşme (10 pt), sayfa değişince taşınma, çok uzun dipnotun sonraki sayfaya sarkması.
- Sonnot ekleme ve listesi; dipnot ↔ sonnot ayrımı.
- Geri al/yinele, dışa aktarımda numara ve konum.

### P10. Atıf ve kaynakça
- Kaynaklar paneli: kaynak ekleme/düzenleme/silme/arama; yazarlı ve yazarsız; çok sayıda kaynak.
- Metin içi atıf (parantez) ve dipnot atfı; atıfın imleç konumuna yerleşmesi; “yalnızca bölümde atıf yapılabilir” kısıtları.
- MCBÜ’de atıf biçimi tanımsız: panelin hangi biçimi varsayıyor, kullanıcı biçimi seçebiliyor mu, Rehber ne söylüyor.
- Kaynakça bölümünde elle yazma ile panel kayıtlarının birbirine karışması; kaynak silince atıfların durumu.
- Kaynakça tipografisi: tek aralık, kaynaklar arası 6 nk, sarkık girinti 0.

### P11. Bağlantı, çizgi, metin çerçevesi ve yerleşim araçları
- Bağlantı ekleme (adres/metin), düzenleme, kaldırma.
- Çizgi ve metin çerçevesi ekleme; seçme, taşıma, boyutlandırma, çoklu seçim, hizalama, kenar yakalama.
- Cetveller (birim mm/cm/inç), yerleşim denetçisi (`LayoutInspector`, `PageLayoutInspector`), bağlam menüsü.
- Düzen geçmişi (geri al/yinele) ile metin geri almasının ilişkisi; kapanmış hata kayıtlarının (BUG-001…004) gerilemesi.
- Çerçeve içinde metin düzenleme sonrası yeniden açma.

### P12. Üstbilgi, altbilgi ve sayfa numarası
- Sayfa numarasının altta ortada olması; ön sayfalarda (özet, önsöz, dizinler) numara biçimi/gizleme; ana metinde 1’den başlama mı yoksa devam mı; iç kapak ve taahhütnamede numara olmaması.
- Numaranın sayfa ve dışa aktarım arasında aynı olması; ilk bölümün (giriş) numaralandırma kuralı.
- Üstbilgi/altbilgi yok; özel içerik eklenebiliyor mu.

### P13. Tez bilgileri ve özel sayfalar
- Tez bilgileri panelinde 17 alanın doldurulması; her alanın hangi sayfaya yansıdığı (iç kapak, taahhütname, özet/abstract altlıkları, önsöz imza).
- Doğrulama: anahtar kelime < 5 uyarısı (TR/EN), İngilizce bölüm adı; uyarı rozetinin görünmesi/kaybolması, “Bilgiyi tamamla” bağlantısı.
- Uzun başlık/ad/unvan taşması; Türkçe karakterli ve çok satırlı değerler; boş alanların kapakta nasıl göründüğü (yer tutucu mu boşluk mu).
- Tez bilgileri ile sayfa üzerindeki doğrudan düzenleme arasındaki senkronizasyon (iki yönlü mü).
- `PAGE_COUNT` ve `USED_PROGRAMS` alanlarının otomatik/elle doldurulması.

### P14. Otomatik üretilen sayfalar
- İçindekiler: düzey 1–4, noktalı çizgi, sayfa numaralarının doğruluğu, başlık değişince güncelleme gecikmesi, tıklayınca başlığa gitme.
- Şekiller/Tablolar dizini: açıklamalardan üretim, boşken görünüm, uzun açıklama sarma.
- Simgeler ve kısaltmalar dizini (yazılabilir): biçim, sıralama.
- Sayfa numaralarının dışa aktarılan PDF/Word ile uyumu.

### P15. Kayıt, yeniden açma, sekmeler
- Yazdıktan hemen sonra sekmeyi/pencereyi kapatma; yenileme; ikinci sekmede aynı not.
- Çok sayfalı belgede kayıt süresi; yerel yedek (`localBackup`); eşitleme açıkken/kapalıyken.
- Aynı tezin şablonunu değiştirme (başka bir üniversite şablonuna geçiş): içerik korunuyor mu, uyarı var mı.

### P16. Dışa aktarma ve içe aktarma
- PDF, Word dışa aktarımı: sayfa sayısı ve sayfa sonlarının ekrandakiyle aynı olması; yazı tipleri; sayfa numaraları; dipnotlar; tablo/şekil açıklamaları.
- Word’de açıp düzenleme; yeniden TxtNote’a Word içe aktarma (gidiş-dönüş kaybı).
- Yazdırma önizlemesi; dışa aktarma sırasında düzenleme kilidi ve iptal.
- PDF içe aktarma inceleme paneli.

### P17. Performans ve dayanıklılık
- 10 / 50 / 100 sayfalık yer tutucu metinle tuş gecikmesi, kaydırma akıcılığı, bellek.
- Hızlı yazma, hızlı bölüm değiştirme, art arda geri al, çok sayıda başlık.
- Sayfalama sırasında yazı kaybı/imleç sıçraması.

### P18. Uç durumlar ve hata davranışı
- Çok uzun sözcük/URL; boş bölüm; bütün içeriği silme; bölüm sınırında kes-yapıştır.
- Hatalı dosya içe aktarma; ağ yokken eşitleme; depolama dolu; konsol hataları (`window.error`, ResizeObserver).
- Koyu tema ve dar pencerede sayfa yüzeyi.

---

# BÖLÜM II — Word penceresi (üst pencere / şerit)

Bakılacak kod: `ThesisRibbon.jsx`, `ribbon/*`, `thesisRibbonPanels.css`, `ThesisStatusBar.jsx`, `formatHotkeys.js`. Her şerit denetimi için dört durum sınanır: **seçim yok · yazılabilir gövde · sabit/otomatik bölüm · yerleşim çerçevesi seçili**. Beklenen: kullanılamayan denetimin neden kullanılamadığı anlaşılır olmalı (ipucu veya açıklama).

### W1. Şerit çerçevesi ve gezinme
- Altı sekme (Dosya, Giriş, Ekle, Düzen, Başvurular, Görünüm): fare, ok/Home/End, Tab sırası, odak halkası, ekran okuyucu rolleri.
- Üst satır: Geri al/Yinele (hangi geçmişe bağlı), belge uyarı rozeti (sayı, açılır liste, “Bilgiyi tamamla”), geçici mesaj kutusu (ne zaman çıkıyor/kayboluyor).
- “Paneller” düğmesi ve sağdan açılan çekmece; çekmeceden sekmeye dönüşte seçimin korunması; Esc ile kapanma.
- Dar ekran/koyu tema; şeridin yükseklik değişimi nedeniyle sayfa yüzeyinin kayması.

### W2. Giriş sekmesi
- Yazı tipi (kilitli ad), punto kutusu (yazma, ok, açılır liste, sınırlar), büyüt/küçült, K/İ/A/ab, yazı rengi, vurgu rengi, biçimi temizle.
- Liste, girinti, hizalama düğmeleri; “Paragraf biçimi” açılır listesi; stil galerisi (Normal, Başlık 1–4, şablon stilleri) ve etkin stilin yansıması.
- Gezinti ve Yazdır düğmeleri; durumlarına göre etkin/pasif.
- Düğmelerin seçili metne etkisi, seçim kaybı (odak) ve geri alınabilirliği.

### W3. Dosya sekmesi
- Tez bilgileri aç/kapa; belge bağlamı kartı; Word/PDF içe aktar; PDF/Word dışa aktar (hazır olma göstergesi, sürerken kilit); Yazdır.
- Dışa aktarma bitince kullanıcı geri bildirimi; hata durumunda mesaj.

### W4. Ekle sekmesi
- Görsel (tür, dosya), Tablo (satır/sütun/başlık), Bağlantı (adres/metin), Dipnot/Sonnot (metin alanı), Denklem (blok, numara), Metin çerçevesi, Çizgi, Sayfa sonu, Başlık ekle.
- İmleç bir sabit/otomatik bölümdeyken veya hiç yokken pasiflik ve açıklama.
- Her eklemenin imleç konumuna doğru yerleşmesi ve geri alınması.

### W5. Düzen sekmesi
- Sayfa düzeni denetçisi, cetvel göster/gizle ve birim, sayfa ölçüleri (kenar boşluğu bilgisi), yerleşim geri al/yinele.
- Şablon kuralı olan değerlerin değiştirilebilir mi salt okunur mu olduğu; değiştirilirse şablon ihlali uyarısı.

### W6. Başvurular sekmesi
- Kaynakları yönet (panel açma), metin içi atıf ekleme, dipnot/sonnot, belgeyi kontrol et, içindekiler/başlıklar grubu.
- Atıf biçiminin sekmede ne gösterdiği (MCBÜ’de biçim tanımsız).

### W7. Görünüm sekmesi
- Gezinti bölmesi, cetveller, yakınlaştırma (−, +, açılır liste, kaydırıcı), belge durumu (sayfa/sözcük/boyut), sayfa düzeni denetçisi.
- Yakınlaştırma ile durum çubuğunun eşzamanlılığı.

### W8. Yan paneller (Yazım planı, Kaynaklar, Rehber, Sayfa ayarları, Öğe, Tez bilgileri)
- Her panelin çekmecede düzgün sığması (tek sütun), kaydırma, odak, kapatma.
- Yazım planı: bölüm ve başlık gezintisi, arama, başlık ekle, eksik başlık önerileri, Tez bilgileri kartı.
- Kaynaklar: ekle/düzenle/ara/atıf; Rehber: şablona özel içerik, MCBÜ için doğruluk; Sayfa ayarları ve Öğe: denetçi alanları.
- Bir panelden diğerine geçişte durum kaybı.

### W9. Durum çubuğu
- Sözcük sayısı (doğruluk, gecikme, sabit bölümleri sayıyor mu), sayfa sayısı, sayfa boyutu, yakınlaştırma düğmeleri ve kaydırıcı.

### W10. Genel kullanılabilirlik ve erişilebilirlik
- Tüm denetimlerin ipucu/etiketi; ekran okuyucu adları; renk karşıtlığı; tıklama hedef boyutu.
- Aynı işlevin iki yerde bulunduğu durumlar (ör. sayfa düzeni denetçisi hem Düzen hem Görünüm’de; cetvel hem Düzen hem Görünüm’de): tutarlılık.
- Word’e alışkın bir kullanıcının beklediği kısayollar (Ctrl+Z/Y/S/P/F, Ctrl+Enter sayfa sonu) var mı.
- Mobil/dar genişlikte şerit.

---

# BÖLÜM III — MCBÜ Yüksek Lisans tezini yazma simülasyonu

**Amaç:** Gerçek bir yüksek lisans öğrencisi gibi tezi baştan sona kurmak ve her adımda “yapmak istediğimi yapabiliyor muyum?” sorusunu yanıtlamak. **Konu ve içerik önemsiz**; metin yer tutucu (rastgele paragraflar, “Başlık 1” gibi adlar). Önemli olan işlev, sıra ve sürtünme.

**Puanlama (her adım için):** yapabiliyor muyum `E / KISMEN / H` · tıklama/adım sayısı · kafa karışıklığı (0–2) · veri kaybı riski · gözlenen hata.
**Başarı ölçütü (özet):** kullanıcı kılavuz okumadan, şablon kurallarını bilmeden, bir MCBÜ tez dosyasını (PDF/Word) üretebiliyor.

Senaryo sırası:

- **S0. Başlangıç.** Şablon galerisinden MCBÜ Yüksek Lisans şablonunu bulma ve yeni tez açma. Şablon adlarının ayırt edilebilirliği; açılışta ilk ne görüyorum, ne yapmalıyım (Rehber ilk adımı gösteriyor mu).
- **S1. Tez bilgileri.** 17 alanın doldurulması; zorunlu olanların anlaşılması; doğrulama uyarıları; kapak/taahhütname/özet altlığına yansıma; hata düzeltme.
- **S2. Kapak ve taahhütname.** İç kapak ve taahhütname doğru görünüyor mu; bir alanı yanlış girip düzeltme; sayfaya doğrudan yazıp yazamama.
- **S3. Özet ve Abstract.** Özet metni, 5+ anahtar kelime (TR), Abstract, 5+ keywords (EN), İngilizce bölüm adı; sayfa sınırı/uzunluk ipuçları; doğrulama.
- **S4. Önsöz ve teşekkür, simgeler ve kısaltmalar.** Yazma, imza satırı (sabit), simgeler dizini biçimi.
- **S5. Giriş.** İlk başlık(lar), uzun paragraflar, liste; yazı akışı ve sayfa değişimi hissi; geri al/yinele.
- **S6. Bölümler (BİRİNCİ … BÖLÜM).** En az üç bölüm; her biri Başlık 1 + alt başlıklar (1.1, 1.1.1, 1.1.1.1); numaraların doğru üretilmesi; başlık adlandırma/yeniden sıralama/silme; yazım planıyla gezinme.
- **S7. Tablolar.** İki-üç tablo; açıklama üstte; numaralandırma seçeneği (tez boyunca/bölüme göre) seçimi ve sonradan değiştirme; sayfa sonuna denk gelen tablo.
- **S8. Şekiller.** Birkaç görsel; açıklama altta; boyutlandırma; sayfa sonu taşması; şekiller dizini.
- **S9. Denklem (şablonda yok).** Bir denklem eklemeyi dene; ne oluyor, kullanıcıya açıklama var mı (kabul/ret kararı belgelenir).
- **S10. Dipnotlar.** 5–10 dipnot; sayfa altına yerleşme; çok uzun dipnot; silme/yeniden numaralama.
- **S11. Atıf ve kaynakça.** 10–20 kaynak ekleme; metinde atıf; atıf biçimi seçimi (şablon tanımlamıyor); kaynakçanın tipografisi; kaynak silme/düzenleme; elle yazılmış kaynakla karışıklık.
- **S12. Ekler ve özgeçmiş.** İsteğe bağlı bölümleri açma; ek başlıkları; özgeçmiş sayfası.
- **S13. Otomatik sayfalar.** İçindekiler, şekiller ve tablolar dizinlerinin doğruluğu ve güncelleme; başlık değiştirince; sayfa numaraları; boş durum.
- **S14. Sayfa numaraları ve genel görünüm.** Ön sayfalar ile ana metin numaralandırması; iç kapak/taahhütnamede numara yok; tüm belgeyi baştan sona gezme (yakınlaştırma, gezinti).
- **S15. Kontrol ve dışa aktarma.** “Belgeyi kontrol et” sonucu; PDF ve Word çıktısı; çıktıyı ekranla karşılaştırma (sayfa sayısı, sayfa sonları, numaralar, dipnotlar); Word’de açıp düzenleme.
- **S16. Ara verme ve devam etme.** Kapat/yeniden aç; bilgisayar yeniden başlatma benzeri senaryo (sekme kapatma); başka sekmede açma; yerel yedek; şablon değiştirme ihtimali.

**Simülasyon çıktısı:** adım adım “yapabiliyor muyum” tablosu; en büyük 10 engel/sürtünme; her biri için kullanıcı etkisi ve düzeltme önerisi; toplam süre ve tıklama tahmini; kılavuzsuz tamamlanabilirlik sonucu.

---

# BÖLÜM IV — Diğer araştırma başlıkları (kısaltılmış)

- **D1. Rehber doğruluğu (19 şablon):** `thesisGuide.js` çıktısı ile şablon ve kaynak notlarının karşılaştırması; `INFERRED/UNKNOWN` kuralların kesin gibi sunulup sunulmadığı. *(P1)*
- **D2. Sayfalama ve Word/PDF uyumu (motor):** GOREVLER.md’deki açık işler (SRC09 EK-2, grafikler, SRC10 s.57/s.75, performans); mevcut ölçüm araçlarıyla güncel durum. *(P2)*
- **D3. Kayıt, eşitleme, veri güvenliği:** `useNoteSync`, `localBackup`, `services/crypto`, `services/local`, `db.rs`, `secure_store.rs`; çakışma birleştirme, çevrimdışı. *(P1)*
- **D4. Hesap, Premium, cüzdan, güncelleyici:** yalnızca yerel/test ortamı; oturum kilidi; güncelleyici doğrulaması. *(P1)*
- **D5. Diğer not türleri ve kabuk:** standart not, To-Do, Günlük, Haritalandırmalı not, Akademik yazı, Klasör, flashcard, canvas; kenar çubuğu, sekmeler, çöp kutusu, arama, ayarlar, tema. *(P3)*
- **D6. Masaüstü (Tauri):** izin kapsamları, sistem yazı tipleri, dışa aktarma yolları, `desktop:smoke`. *(P3)*
- **D7. Depo hijyeni ve test sağlığı:** 149 değişmiş dosya, izlenmeyen fixture’lar, `orchestration/` içinde çoğaltılmış kod ağaçları, `TxtNote/` içindeki günlük/çıktı klasörleri, deney dosyaları (`_exp12*.mjs`); tam `npm test`, derleme, e2e’lerin hangisinin hâlâ çalıştığı. *(P3)*
- **D8. Kendi değişikliklerimin doğrulaması:** şerit yeniden düzeni, “Paneller” çekmecesi, şablona özel Rehber; eski e2e testlerinin (`ribbon-panels`, `thesis-ribbon-panels`) yeni yapıda durumu. *(W1/W8 ile birleşir)*

## Çalışma kuralları
- Komut gelmeden hiçbir başlığa başlamam; her başlıkta önce bulguları, sonra isterseniz düzeltme önerisini sunarım.
- Onayınız olmadan kod değiştirmem; doğrulanmamış şeyi “doğrulandı” diye yazmam.
- Gerçek hesap/ödeme/kullanıcı verisi kullanmam; hesap ve ödeme akışları yalnız yerel ortamda test değerleriyle sınanır.
- Hesap girişi veya kişisel veri gerektiren bir adıma gelirsem durup size sorarım.
