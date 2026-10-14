# TxtEngine 1.0 — durum ve kalan işler

**14.10.2026 — klasör düzeni:** üretim motoru `engine/src/`, görev/plan/yönergeler `orchestration/` altındadır. Başlangıç rehberi [README.md](README.md), ortak yapay zekâ yönergeleri [AGENTS.md](AGENTS.md). Aşağıdaki uzun belge ölçümleri kendi tarihsel sürümlerine aittir; klasör taşıması bu açık ürün işlerini kapatmaz.

## Güncel çalışma — 14.10.2026

Kullanıcının devam talebiyle çalışma yeniden açıldı. **Genel kabul hâlâ FAIL.** Aşağıdaki 13 Ekim kayıtları tarihçedir. Mevcut motor korunarak hedefli düzeltmeler yapıldı; [ilk devam raporu](reports/ENGINE_RESUME_2026-10-14.md), [tablo/düzenleme raporu](reports/ENGINE_RESUME_2026-10-14_3.md) ve [son kapanış çalışması](reports/ENGINE_RESUME_2026-10-14_4.md).

- **Doğrulanan hız iyileştirmesi:** şekille ilişkisi olmayan paragrafların gereksiz DOM kopyaları atlandı. Aynı SRC09 test belgesinde eşleşen tek karşılaştırma: yükleme 49.448 → 28.618 sn; yazı sonrası yerleşme 36.813 → 18.260 sn. Önce/sonra sayfa ve kelime koordinatı dosyalarının SHA-256 değerleri birebir aynı. Bu bir evrensel performans kabulü değildir.
- **Şekil alt düzeltmesi:** kaynak metin kutularının kalın/italik/büyük harf biçimi dıştaki ankraj paragrafından taşınmıyor; kendi belge varsayılanlarını ve açık kaynak stillerini kullanıyor. Bütün ok/döndürme/sarma geometrisi kapanmadı.
- **Bölüm sonu alt düzeltmesi:** boş, sayfa değiştiren bölüm işareti Word gibi önceki paragrafla aynı satırda kabul ediliyor; kaynak düğümü/XML silinmiyor. Üç küçük gerçek Word + üç Chrome kontrolü geçti. Word s.91 ile eşlenen içerik editörde s.92 yerine s.91'de; kalan grafik başlangıcı sonraki Pareto düzeltmesiyle kapandı.
- **SRC09 güncel:** taze içe aktarım; **180/180 sayfa, 11/157 kayık açılış, kapsam 0,98087**. Kalan 11 fark başka fiziksel sayfada (EK-2). Pareto grafiğinin s.91 açılış kontrolü kapandı. Eski 12/157 ve 0,97919 önceki sürüme aittir.
- **Pareto grafik alt hatası:** doğrulanan önbellekli, toplulaştırılmış sütun + Pareto çizgisi artık metin içeren SVG olarak çiziliyor; bilinmeyen ChartEx türleri kaynak yedeğini kullanıyor. Yerel nesne ve kaynak paket korunuyor; DOCX çıktısında tek düzenlenebilir grafik kalıyor. PDF'te özgün önbellek resmi korunuyor; küçük gerçek çıktıda 479×752 RGB piksel birebir eşleşti. Çok sütunlu kabın RTL yönü SVG ankrajlarını ters çevirmiyor; etiketler sütunların altında. s.91 açılışının kapanması bütün grafik/şekil görsel eşliğinin veya kapsam eşiğinin geçtiği anlamına gelmiyor.
- **Güncel SRC09 etkileşim/kaydet-aç alt kapısı kapandı:** sabit kaynak sürümünde 20/20 gerçek yaz/geri al örneği; her örnekte içerik birebir geri döndü ve 180 sayfa korundu. Payload sonrası belge modeli eşit; kaydedilen not gerçek test sayfasında yeniden açıldığında içerik/model eşit, 180 sayfa, 0 tarayıcı hatası. Kanıt: `engine-work/resume-20261014-4/interaction/result.json`. Bu, sayısal hız hedefi veya tüm uzun belge PDF/Word çıktı kabulü değildir.
- **Tek satır koruması:** kontrollü tek satırlı paragrafın son-satır payı ayrı sayfaya kopmuyor. Küçük birleşik/sabit satırlı tablo örneği Word gibi 2 sayfa; diğer iki varyant 3/3. 10 gerçek Word sayfa-sığdırma kontrolü geçti. SRC09 EK-2'nin tamamı kapanmadı.
- **Kaynak sekmeleri:** DOCX'teki açık varsayılan sekme aralığı artık aktarılıyor; paragraf sonundaki sekme, Word gibi sınırı aşınca yeni satıra geçebiliyor. Dört küçük gerçek Word/Chrome kontrolü geçti. SRC10 s.59 ve s.69 açılışları eşleşti.
- **Kaynak kerning:** `w:kern` eşiği, kalıtımı ve sıfırla kapatma korunuyor; tarayıcı satır ölçümü ve gösterimi aynı ayarı kullanıyor. Üç gerçek Word/Chrome kontrolünde satır sonu kelimeleri birebir eşleşti. SRC10 s.57'nin liste satırları düzeldi; dikey sayfa kırılımı hâlâ açık.
- **Uzun tablo koruması:** kaynak asgarileri bir sayfayı aşan, doğrulanmış basit tablolarda hücre başına biriken koruma tablo parçasına taşındı. SRC10 s.85–86 açılışları eşleşti. Dört taze gerçek Word/Chrome tablo kontrolü ve üç eski birleşik tablo regresyonu geçti. Karmaşık/yüzen/iç içe tablolar eski yolda; geniş kapsamlı başarısız deneyler kabul edilmedi.
- **Tablo düzenleme alt hatası:** tez editöründe yerel Word tablolarına otomatik boş caption, yeni kabuk ve hücre dışı görünmez karakter eklenmiyor. Küçük tabloda gerçek yaz/geri al sonrası kaynak HTML birebir döndü; sunum kayda girmedi, sayfa sayısı korundu. Normal akademik tablo dekorasyonu için DOM regresyonu geçti. Bu, uzun belgede 20 örnekli etkileşim/hız kabulü değildir.
- **SRC10 güncel:** taze içe aktarım; **91/91 sayfa, 2/75 kayık açılış, kapsam 0,99565**. Kalan fiziksel farklar s.57 ve s.75. Aynı-sayfa s.85–86 başlangıç farkları kapandı. Son devam başlangıcı 4 farktı; önceki turun başlangıcı 6. Eski fixture'daki 8 farkı kod düzeltmelerinin tamamına mal etmeyin: güncel içe aktarım ayrı bir etkendir.
- **Son kod kapıları:** 1047/1047 frontend/motor testi, 0 atlama; üretim derlemesi PASS. Uzun belge kontrolleri FAIL olduğundan yeni tam genel kabul veya 1.0 hazır onayı verilmedi. Son SRC09 kanıtı `engine-work/resume-20261014-4/final-export09/` içinde; tarayıcı hatası 0. SRC10'un son uzun ölçümü önceki turdaki `engine-work/resume-20261014-3/verified10/` içindedir.

### Yapılmayı bekleyen ana işler

1. SRC09 EK-2: 11 fiziksel sayfa açılışını etkileyen birleşik hücre/satır devamı yüksekliği ve paragraf dağılımı.
2. SRC09 grafik/şekiller: kalan metin kapsam kaybı; s.97 ok, döndürme ve kırpılma geometrisi; dar koridorda metin sarma. s.91 Pareto grafiğinin açılış kontrolü kapandı; tam grafik stil/ölçü eşliği sertifikalanmadı.
3. SRC10: s.57 ve s.75 fiziksel kırılımları. s.57'de kerning kaynaklı satır kırılımları kapandı; son satırın sayfa sınırına sığması/dikey ölçüsü açık. s.75'te kaynak Doğu Asya font ipuçlu tırnakları Word MS Mincho, editör Times New Roman çiziyor; font yükleme/seçimi açık. s.85–86 tablo açılışları kapandı.
4. Performans: mevcut iyileştirmeyi koruyarak kalan derleme/ölçüm maliyeti ve uzun belge çıktı kabulü. Güncel SRC09 20 örnekli yaz/geri al ve kaydet-yeniden aç alt kontrolü PASS; sayısal hız hedefi önceden tanımlanmadığından nihai hız kabulü verilmedi.
5. Bu kontroller kapandıktan sonra tek kaynak sürümünde tam seri kabul ve `verify.mjs`.

Verimli devam yöntemi: özgün Word PDF'lerini yeniden üretmeden taze içe aktarılmış fixture kullan; karşılaştırma raporundaki küçük `wordOpening`/`editorOpening` penceresinden ilk ayrışmayı seç; önce küçük bağımsız Word/Chrome kontrolünde kanıtla, sonra ilgili uzun belgeyi ölç. Kontrol eşikleri değiştirilmedi. Kanıtsız genel satır yüksekliği/kenar boşluğu ayarı yapılmadı; mevcut sayfalama motoru korunuyor.

---

## Tarihsel kayıt — 13.10.2026

Güncelleme: 13.10.2026 · Durum: **KABUL GEÇMEDİ — hazır değil.** SRC09 son ölçüm: 181/180 sayfa, 17/157 kayık, kapsam 0,97916; 1014 test + derleme PASS. Kullanıcı isteğiyle ikinci molada. Önceki seri kabul aşağıda tarihseldir.

## Kapanan (bu oturum, gerçek Word/Chrome kanıtlı)
- **AFSÜ 36/37 farkı.** Kök neden: DOCX `settings.xml` dipnot ayırıcılarını tanımlamıyordu; Word kendi 12 pt ayırıcısını çiziyordu. Düzeltme `docx/package.js` + `export.js`. afsu-lee master+phd 94 PASS / 0 FAIL; dipnotlu diğer hedefler 0 FAIL.
- StructureSPACE, Wingdings, ChartEx, kapak boşlukları, Matematik alt çizgisi, SBE/ISG etiketleri: önceki kapanışlar, son koşuda gerileme yok.
- Uzun belgede genel nedenler: içe aktarılan tek aralıklı paragrafların son-satır payı, liste ilk satırı sekme durağı, `w:noWrap` hücre, manuel sayfa sonu, başlık sayfası altbilgi payı. SRC10 kayık açılışları 27→8.

## Son seri kabul (Run `final-20261012`)
| Aşama | Sonuç |
|---|---|
| base (birim 974/974, derleme, cargo, checker) | PASS |
| word (25 hedef, gerçek Word) | PASS — 1976 PASS / 0 FAIL / 0 atlama |
| sbe (5 normal + 5 CPU kısıtlı) | PASS |
| schema | PASS |
| özel sayfa matrisi 232 durum, 7 Word ailesi | PASS |
| SRC10 etkileşim (gerçek giriş/kopyala/yapıştır/geri al/kaydet-aç) | PASS |
| browser aşaması genel | **FAIL** (aşağıdaki 3 kalem) |
| verify.mjs | **FAIL** |

CDP IME kontrolü işletim sistemi IME doğrulaması değildir.

## Açık hatalar (bunlar kapanmadan 1.0 hazır sayılmaz)
1. **SRC09 uzun belge:** editör **181 / Word 180** sayfa; 157 açılıştan **17 kayık** (bu turun başında 25); kapsam **0,97916** (eşik 0,995). **100–113. sayfa açılışları eşleşiyor.** Kısa yüzen tabloların fazladan akış yüksekliği, 12 pt TNR simge kutuları, sabit satır kenarlık/iç boşluk hesabı, ortalanmış hücrelerin miras aldığı kelime daraltması ve bölüm başındaki Caption boşluğu düzeltildi. Genel kabul FAIL; s.91 grafik öncesindeki fazla boş sayfa, EK-2 devamları ve akış şemasının ayrıntılı görsel kabulü açık. **1014 test + derleme PASS**. SRC10 91/91, 8/75 kayık, 0,99565. Kullanıcı süre dolduğu için tekrar mola istedi. Güncel kanıt ve devam noktası: [RESUME-20261013-2.md](./engine-work/final-closure/src09-active/RESUME-20261013-2.md).
2. **SRC10 uzun belge:** 91/91 sayfa ama 75 açılıştan 8'i kayık (s.57, 59, 69, 75, 88–91); kapsam 0,996.
   Ölçülmüş nedenler: (a) denklem satır yüksekliği — Word = matematik doğal yüksekliği + 6,9 pt (düz 14,1; kesir 24,7; etiketli kesir 29,9; Σ 39,2; sqrt 16,4), editörde MathML 21 pt'e sığıyor (`resume2/exp/eqprobe*`); (b) kare-sarmalı yüzen şekiller altyazıyı aşağı iter (SRC09 s.48–51, 53 pt); (c) satır sığdırmada ±0,4 pt gürültü (s.57, s.68/69); (d) SRC09 EK-2 yüzen tablosunda bölünen satır devam parçası asgari yüksekliği (s.150–180); (e) SQL listesi s.88–91 küçük kayma; (f) SRC09 s.91 grafik.

## Sonraki düzeltme — SRC09 kaydet/aç KAPANDI (Codex)

Tez editöründeki akademik başlık dekorasyonu, her düzenlemede ikinci bir bölüm içi numaralandırmayı uyumluluk HTML'ine yazıyordu. `academicDocument.js` içindeki yeni `headingNumbers` seçeneği tez editöründe kapatıldı; normal akademik editörde açık kaldı. Kaynak veya kullanıcı başlık nitelikleri silinmedi.

Gerçek SRC09: 20 yaz/sil örneği, `twentySamplesRestoreAuthorContent=true`, `save.documentEqual=true`, 0 tarayıcı hatası; gerçek DOCX/PDF çıktıları alındı. Tam birim 974/974 ve derleme geçti. Başlık regresyonu gerçek DOM ile geçti. Yerleşme süresi hâlâ yaklaşık 14–20 saniye; hız düzeltildi denmiyor.

Kanıt: [save-resume/RECORD.md](./engine-work/final-closure/save-resume/RECORD.md). Yukarıdaki seri kabul önceki kaynak sürümünün tarihsel sonucudur; yeni genel kabul verilmedi. Açık ürün hataları 1 ve 2'deki uzun belge uyumudur; düzeltmeler sonrası güncel sürümde son kabul gerekir.

Reddedilen/geri alınan deneyler: hücre paragraflarına terminal-leading koruması (SRC10 8→11 kayık; SRC09 sayfa sayısını 180'e getirip açılışları düzeltmedi — toplam eşitliği tuzağı); tail-reserve yeniden yüklenmedi.

## Denklem limit önizlemesi — hedefli düzeltme tamamlandı (Codex)

Yeni içe aktarılan DOCX'te toplam/integral üst-alt/yan limit yerleşimi, belge matematik varsayılanları ve gizli limitteki metnin Word gibi sonraki görünür alana taşınması düzeltildi. 8 gerçek Word + 8 gerçek Chrome durumu geçti; tam birim 978/978 ve derleme geçti. Bu alt hata kapandı; tüm denklem yüksekliği ve uzun belge sayfa uyumu kapanmadı. Eski saklanmış önizlemeler otomatik göç ettirilmedi. Ayrıntı: [math-resume/RECORD.md](./engine-work/final-closure/math-resume/RECORD.md).
## Küçük denklem önizleme hataları — kapandı (Codex)

Boş başlangıç/bitiş parantezlerinin geri gelmesi, çok argümanlı delimiter ayırıcılarının kaybolması ve çizgisiz/doğrusal kesirlerin çizgili kesre dönüşmesi düzeltildi. Gerçek Word 10/10, gerçek Chrome 10/10; kaynak OMML korunarak DOCX dışa aktar/aç kontrolü geçti. Tam birim **984/984**, derleme PASS. Eski saklanmış önizlemeler otomatik göç ettirilmedi. Uzun belge ve genel kabul bu turda yeniden koşulmadı; yukarıdaki son uzun belge sayıları önceki ölçümlerdir. Kanıt: [quick-math/RECORD.md](./engine-work/final-closure/quick-math/RECORD.md).

## Süreçler

Claude'un son kaydı: kendi Vite sunucusu (5210, PID 10468) açık; kabul sürücüsü bitti. Bu oturumda Codex'in açtığı 5193 sunucusu kapatıldı. Başka sunucu veya Word/Chrome süreçlerine dokunulmadı.

Ayrıntı: [resume2/RECORD.md](./engine-work/final-closure/resume2/RECORD.md).
