# Word uyumu — beş fazlık uygulama planı

Tarih: 2026-10-07. Durum: UYGULANIYOR; 5.1 teşhis/düzeltme kapanışı tamamlandı, 5.2–5.5 PLANLANDI; bu belge motor düzeltmelerinin tamamlandığı anlamına gelmez.
Başlangıç kodu: `6deaf6d`. Önceki MOTOR Faz 0–4 kayıtları korunur. Yeni çalışma,
MOTOR Faz 5 programının **5.1–5.5** alt fazlarıdır; eski fazlar yeniden numaralandırılmaz.

Plan revizyonu: 2 (2026-10-07). Bu revizyon kapsam, bağımlılık, araştırma sınırı ve
kapanış koşullarını netleştiren plan revizyonudur. Revizyon yazıldığında uygulama
başlatılmamıştı; güncel 5.1 kapanışı aşağıda ayrıca kayıtlıdır. Aşağıdaki süreler ölçülmüş tahmin değildir; iş paketleri ilk pilot sonrasında
ölçülen eforla tahminlenecektir.

## Hedef ve kabul sözleşmesi

Hedef, uygulamanın desteklediği tez belgelerinde editör, PDF ve gerçek Word DOCX
çıktısının içerik, biçim, satır kırılımı, sayfa akışı ve güncellenen alanlar bakımından
doğrulanmış uyumudur. Sadece DOCX dosyasının açılması veya toplam PASS sayısının
yükselmesi yeterli değildir.

İlk referans ortamı mevcut ölçüm ortamıdır: Windows, Microsoft Word 16.0.20430,
uyumluluk modu 15, Microsoft Print to PDF. Tarayıcı sürümü, kullanılan font dosyası
hash'leri, dil/bölge, ilgili Word seçenekleri ve her çıktı hash'i kabul kaydına eklenir.
Başka Word sürümlerinde aynı sonucu verdiği ayrıca ölçülmeden iddia edilmez.

Kabul boyutları:

- İçerik: metin, başlık hiyerarşisi, tablo hücreleri, dipnotlar ve referanslar kayıpsız.
- Biçim: gerçek font ailesi/boyutu, girinti, boşluk, hizalama ve sayfa geometrisi doğru.
- Akış: referans korpusta satır metinleri, sayfa sayıları ve görünür/gizli sayfa etiketleri aynı.
- Dinamik alanlar: ilk açılış, alan güncellemesi ve kaydet/aç sonrasında doğru TOC/PAGE/NUMPAGES.
- Düzenlenebilirlik: kapak metni, tablolar ve desteklenen denklemler Word'de düzenlenebilir;
  görüntüye çevirerek fark gizlenmez. Uygulamanın genel DOCX içe aktarması bu sözleşmede yoktur.
- Dayanıklılık: eksik font, ölçülemeyen özellik veya tamamlanmayan Word işlemi PASS değildir.

Mevcut kaynak beklentileri ve toleransları korunur. Güvenilir konum karşılaştırmasında
0,25 mm hedeflenir; kaynak ölçüm belirsizliği gerektiriyorsa mevcut en fazla 0,5 mm
korunur. Satır içeriği, sayfa sayısı ve etiket sırası birebir karşılaştırılır.
Font boyutu için kontrolün mevcut pt toleransı geçerlidir; tek genel mm eşiği kullanılmaz.
Antialiasing farkı ile gerçek geometri/içerik farkı ayrı raporlanır.

## Kapsamı sabitleme ve değişiklik yönetimi

5.1'in ilk çıktısı sürümlü bir **kapsam kaydı** olmalıdır. Başlangıç envanteri mevcut
21 hedef / 35 varyanttır; uygulama başlangıcında gerçek checks/fixture envanteriyle
karşılaştırılır. Her hedef/varyant için zorunlu özellikler, font ve boyutlar, dil/bölge,
referans ortamı, kaynak locator'ı, kontrol kimlikleri ve kanıt yolu kaydedilir.

- **Zorunlu çekirdek:** mevcut kaynak temelli kontroller ve ürünün hâlihazırda sunduğu
  özellikler. Mevcut 39 FAIL'in hiçbiri kapsam daraltılarak kapanmış sayılamaz.
- **Araştırma korpusu:** sınır durumları ve ikili etkileşim örnekleri. TNR/Arial/Calibri,
  10/11/12/14 pt ve TR/EN aday kapsamdır; her kombinasyonun destek sözü değildir.
  Zorunlu doğrulama kümesi deney başlamadan seçilir ve sabitlenir.
- **Genişletme kuyruğu:** yeni üniversiteler, yeni Word özellikleri ve erişilemeyen
  ortamlar. Firefox/Safari/macOS Word/Word web, ikinci Word build'i ve bidi/RTL için
  mevcut ürün vaadi kontrol edilir; kanıt yoksa durum doğrulanmamış olarak görünür.
  Mevcut bir ürün gereksinimi, sırf test erişimi yok diye isteğe bağlıya çevrilemez.

Her kapsam değişikliği gerekçe, eski/yeni kapsam, etkilenen kabul paydası ve yeniden
çalıştırılacak kontrollerle kaydedilir. Başarısız zorunlu özelliği erteleme kararı,
programın o kapsamda tamamlandığı anlamına gelmez. Yeni özelliklerin çekirdeğe alınması
ayrı bir plan kararıdır; iş listesi uygulama sırasında sessizce büyütülmez.

## İş paketi sözleşmesi ve erken regresyon kapıları

Her iş paketi tek bir neden/özellik etrafında tutulur. Başlamadan giriş kanıtı,
hipotez, ilgili kaynak/dosyalar, minimal fixture, kabul kontrol kimlikleri, zaman/deney
bütçesi ve geri alma yöntemi yazılır. Çıkışta karar, kod/spec/fixture kimliği, gerçek
ölçümler, test komutları, açık kalan nedenler ve sonraki adım kaydedilir.

Durumlar ayrı tutulur: PLANLANDI, ARAŞTIRILIYOR, UYGULANIYOR, DOĞRULANDI veya
ENGELLİ. Deney başarısı, kapsam kararı ve faz kabulü aynı durum değildir. Eksik ortam
kanıtı ENGELLİ/UNKNOWN olarak görünür; PASS üretilmez.

Regresyon altyapısı 5.1'de kurulur ve bütün fazlarda kullanılır:

1. Ölçüm/fixture değişikliği: eşleşme yokluğu, yanlış bölüm ve eksik öğe vakalarını
   sınayan checker testleri + etkilenen hedefin taze export'u. Eski çıktı teşhis içindir.
2. Şablon değişikliği: kaynak kanıtı + etkilenen hedefin gerekli varyantlarında kontrol;
   ortak kod etkileniyorsa üçüncü kapı da uygulanır.
3. Paylaşılan motor değişikliği: ilgili anlamlı birim testleri, frontend test/build ve
   checks.json olan bütün hedeflerde gerçek Word dahil regresyon. Önce dar kontrollerle
   hata ayıklanır; kabul koşusu tutarlı kod/spec/fixture sürümünden alınır.
4. Mevcut FAIL'ler kimlik/varyant ve ilk ayrışma bilgisiyle izlenir. Yeni FAIL, yeni
   zorunlu UNKNOWN/SKIPPED veya eski PASS'in bozulması paketin kabulünü engeller.
   Aynı FAIL kimliğinin altında yeni bir neden oluşması da regresyon sayılır.
5. PR/yerel doğrulama komutu ve makinece okunabilir sonuç 5.1'de hazırlanır. Word
   runner yoksa non-Word sonucu ayrı raporlanır; tam motor kabulünün yerine geçmez.

5.1'de aynı referans makinede export süresi ve editör etkileşim gecikmesi baz ölçümü
alınır; fixture, belge boyutu ve örnek sayısı kaydedilir. Performans eşiği uygulamadan
önce sabitlenir. Mevcut yerel non-Word <=30 saniye kapısı korunur; yeni etkileşim eşiği
ölçüm yapılmadan uydurulmaz. Her pakette tahmin/gerçek süre ve yeniden iş nedeni
kaydedilerek kalan iş tahmini güncellenir.

## Mevcut durum ve doğrulanan açıklar

Son kabul: 21 hedef; 1.658 PASS / 39 FAIL / 32 INFO; 70 layout/PDF kapısı PASS.
ADÜ Sağlık Bilimleri pilotu 303/303; 732 frontend + 40 Python + 3 generator testi PASS.
Bu sayılar 07.10.2026 tarihli kayıttır; plan hazırlanırken tüm Word regresyonu yeniden
çalıştırılmadı. Mevcut raporlar, seçili gerçek çıktı satırları ve ilgili motor kodu incelendi.

39 başarısız kontrol sekiz aileye ayrılıyor:

1. **ADÜ Ziraat kapak: 1.** İç kapak son baseline 251,199 yerine 249,196 mm;
   yaklaşık 2,003 mm fark. Kaynak/şablon/paint offset ayrımı yapılmalı.
2. **AKÜ Sağlık H4 bold: 2.** Kontrol eşleşme bulamıyor. Seçili gerçek PDF ve Word
   satırı `1 Alt Başlık 1.1.1.1` ve bold=true; regex numara önekini kapsamıyor.
   Bu iki FAIL, şu an tek başına bold motor hatası kanıtı değil. Numara biçimi ayrıca incelenmeli.
3. **AKÜ Sağlık TOC: 2.** Etik bildirim satırı kaynakta gizli iii, PDF'de iv,
   Word'de v gösteriyor; ön sayfa akışıyla birlikte çözülecek.
4. **AKÜ Sağlık sayfa eşliği: 6.** Master/PhD 40 PDF–41 Word sayfa;
   t80 varyantı 36 PDF–34 Word. Sayfa sayısı ve etiket kontrolleri ayrı FAIL satırları.
5. **AKÜ SBE İngilizce varyantlar: 8.** İki varyantta pitch, ilk girinti, ön etiketler
   ve numarasız sayfa adedi. Pitch 7,3 yerine 4,866 mm raporlanıyor; kontrol bütün
   Arapça sayfaları tarıyor. Girinti kontrolü fiziksel sayfa 15'e bağlı.
   Ana metin/alıntı/kaynakça kapsamı doğrulanmadan motor hatası tanısı konmayacak.
6. **AKÜ SBE tablo hizası: 15.** Beş varyant × üç kontrol. Türkçe çıktıların glyph
   merkezleri beklenen 105/155 mm'den sapıyor. İngilizce iki fixture'ın ana içeriğinde
   tablo yok: bu altı eşleşmesiz kontrol kapsam açığı içeriyor. Hücre kutusu merkezi
   ile hücre içi metnin merkezi ayrıca ayrıştırılmalı.
7. **AKÜ Sosyoloji sayfa eşliği: 2.** PDF 37, Word 36 sayfa; etiket dizisi de farklı.
8. **Arial satır kırılımı: 3.** J03 10 pt ve J04 12 pt; satır adedi aynı olsa bile
   kelimelerin satırlara dağılımı farklı. J03 son satır kelime karşılaştırması da FAIL.

Ek açıklar: editörde son satır sıkışık görünümü; yatay dipnot/işaret eşliği;
adsız blok terminal boşluğu; bidi/RTL ve bölge dışı decimal tab; Firefox/Safari
kanıtı; uzun kapak başlığı/jüri değişikliği; ADÜ kaynağındaki 109 eşlenmemiş özellik
grubu. **109 grup, 109 doğrulanmış motor hatası değildir:** metadata, kullanılmayan
stil ve ilgili gerçek özellik ayrımı henüz tamamlanmamıştır.

Makinece okunabilir ayrıntı: `orchestration/specs/word-compatibility-plan.audit.json`.

## Araştırmanın mimari sonuçları

- W3C CSS Text, tam bir justification algoritması tarif etmediğini belirtiyor.
  Tarayıcının standart justify davranışının Word ile birebir olması beklenemez.
  Sabit negatif word-spacing yerine, ölçümle doğrulanan satır bazlı çözüm araştırılmalı.
  [CSS Text 3, justification](https://www.w3.org/TR/css-text-3/#text-justify-property)
- Word sayfalamasında keep/widow/satır bölünmesi birlikte etkili; tablo satırındaki
  `cantSplit` doğrudan sayfa akışını değiştirir. Mevcut engine default'u true olduğundan
  kaynakta eksik olan özellik otomatik olarak true kabul edilmemeli; değişiklik opt-in
  ve kaynak temelli olmalı. [Microsoft CantSplit](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.cantsplit?view=openxml-3.0.1)
- Word sürümü ve uyumluluk modu davranışı etkiler; printer metrics kullanımı ayrıca
  belge ayarıdır. Yazıcı adı kaydı tek başına yeterli değil; ilgili ayarın açık/kapalı
  durumu da kaydedilmeli. [Compatibility](https://support.microsoft.com/en-us/word/compatibility-changes-between-versions),
  [UsePrinterMetrics](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.useprintermetrics?view=openxml-3.0.1)
- Şema doğrulaması, alan güncellemesi ve sayfalama ayrı kontrollerdir. Repaginate
  sayfaları hesaplar; TOC.Update satırları, UpdatePageNumbers sayfa sonuçlarını günceller.
  Mevcut renderer zaten repagination ve isteğe bağlı iki güncelleme turu içeriyor;
  yeni iş bunları yeniden yazmak değil, tez varyantlarına yaymak ve yakınsamayı ölçmek.
  [Open XML validation](https://learn.microsoft.com/en-us/office/open-xml/word/how-to-validate-a-word-processing-document),
  [Repaginate](https://learn.microsoft.com/en-us/office/vba/api/word.document.repaginate),
  [TOC.Update](https://learn.microsoft.com/en-us/office/vba/api/word.tableofcontents.update)
- `w:decimalSymbol` alan formüllerinin radix noktası içindir; decimal tab konumunu
  otomatik düzeltir varsayımı yapılmayacak. Tab davranışı ayrı fixture ile ölçülmeli.
  [DecimalSymbol](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.decimalsymbol?view=openxml-3.0.1)

## Faz 5.1 — kapsam, güvenilir ölçüm ve sınırlı düzeltmeler

Amaç: gerçek uyumsuzlukları kapsam/ölçüm hatalarından ayırmak; sonraki fazların yanlış
bir referansa göre motoru değiştirmesini önlemek. Göreli efor: orta; ölçüm düzeltmeleri
daha öngörülebilir, cache ve doğrulayıcı entegrasyonu ortam bağımlıdır.
Giriş: kayıtlı başlangıç kabulü ve mevcut kaynak/check/fixture envanteri erişilebilir.

- **5.1.1 Kabul envanteri.** 39 FAIL kimliğini koru; sekiz aileye kaynak locator'ı,
  fixture/varyant, ilk farklı satır/sayfa, hipotez ve kanıtın izin verdiği tanıyı ekle.
  Doğrulanamayan neden açık araştırma olarak, sahibi ve sonraki deneyiyle devredilir.
  Yukarıdaki kapsam kaydını sabitle. 32 INFO'yu
  gerekli özellik/izleme bilgisi olarak ayır; gerekli UNKNOWN kabulü engellesin.
- **5.1.2 Ölçüm kapsamı.** H4 kontrolünde numaralı başlığı semantik kimlikle bul;
  bold ve numaralandırmayı ayrı doğrula. SBE İngilizce tablo fixture'larına kaynakla
  aynı anlamdaki tablo örneklerini ekle. Fiziksel sayfa 15 yerine section + paragraph
  anchor kullan; pitch'i ana gövdeyle sınırla. Beklenen kaynağı/toleransı değiştirme.
- **5.1.3 Küçük düzeltmeler.** ADÜ kapak son satırının 2,003 mm farkını kaynak
  geometriyle çöz. SBE tablo hücresinin kendi hizası, hücre paragrafı stili ve layout
  glyph merkezini birlikte incele; yalnız doğrulanan yerde genel hizalama aktarımını
  veya o üniversitenin kaynak temelli verisini düzelt. İki hedefi ayrı kabul edilebilir
  paketlerde tut. Bir sorun ortak satır/sayfa modeli gerektiriyorsa 5.2/5.3'e kanıtıyla
  devret; 5.1'i kapsamı belirsiz bir motor yeniden yazımına dönüştürme.
- **5.1.4 Referans ortamı.** Word build/mode/printer bilgisine font hash'leri,
  tarayıcı sürümü, locale ve ilgili compatibility seçeneklerini ekle. Cache anahtarını
  kaynak + code/spec/fixture + renderer/font ortamı ile ilişkilendir. Eksik cache PASS olmaz.
- **5.1.5 DOCX geçerliliği.** Open XML SDK doğrulayıcısı için mevcut çalışma ortamını
  kontrol et; şema/relationship hatalarını gerçek Word açılışından ayrı raporla.
  Kullanılamayan doğrulayıcıyı açık ortam bağımlılığı olarak kaydet; PASS üretme.
- **5.1.6 Erken kapılar ve baz ölçümü.** Ortak regresyon sözleşmesini çalıştırılabilir
  komut/manifest ile kur; eksik fixture/anchor/cache durumlarının yanlış PASS üretmediğini
  test et. Performans bazını al. 5.4'teki tablo/dipnot/kapak sınır örneklerinden satır ve
  sayfa modelini etkileyen minimal örnekleri şimdiden korpusa ekle.

Ana dosyalar: `orchestration/tools/conformance.py`, `check.mjs`, `word2pdf.ps1`,
`specs/aku-sagbil.*`, `specs/aku-sbe.*`, `templates/adu-ziraat-lisans.js`,
`layoutReport.js`, `docx/tables.js`.

Çıkış: 39 eski satırın tamamı sınıflandırılmış; gerekli fixture öğesi yokken ölçüm
başarısı yok; her etkilenen kontrol source-backed ve gerçek öğeye bağlı; küçük
düzeltme olarak kabul edilen paketlerin kontrolleri PASS; sıfır yeni regresyon;
kapsam/ortam kaydı ve erken regresyon kapıları hazır. Kalan FAIL'ler sonraki fazlara
açık kimlik, kanıt ve sorumlu paketle devredilir. Eksik doğrulayıcı gibi ortam bağımlılığı
bu fazın teşhis kapanışında açık kaydedilebilir; gerekli olduğu son kabulü engeller.
Sayısal FAIL azalması tek başına çıkış ölçütü değildir.

## Faz 5.2 — yazı, satır kırılımı ve paragraf eşliği

Bağımlılık: 5.1'in kapsam, anchor, ortam ve regresyon kapıları. Amaç: sayfalamanın
temel girdisi olan satır akışını düzeltmek. Bağımsız stil/girinti paketi, line breaker
araştırmasının sonucunu beklemeden ilerleyebilir.
Göreli efor: yüksek; özel line breaker bu programın en belirsiz teknik parçası.

- **5.2.1 Dar deney.** Mevcut Word justify probe'larını ve J03/J04'ü yeniden kullan.
  Son kelime bütçesini Word kuralı diye genellemeden; kısa son kelime, az/çok boşluk,
  noktalama, kalın/italik run ve farklı font boyutlarında ölç. Öğrenme ve doğrulama
  metinlerini ayır; yalnız üç başarısız cümleye uygun sabit üretme.
  İlk deney çevrimi en fazla **iki yaklaşım × iki iyileştirme turu** ile sınırlıdır.
  Bu sınır süre tahmini değildir; her turun çalışma süresi ve Word koşusu sayısı
  başlamadan kaydedilir. Tur sonunda aynı sabit doğrulama kümesi kullanılır.
- **5.2.K Araştırma karar kapısı.** İlk çevrim sonunda aşağıdaki kararlardan biri,
  doğrulama sonuçları ve kalan farklarla yazılır:
  - DEVAM: üç Arial kontrolü ve önceden sabitlenmiş doğrulama kümesi kaynak toleransları
    içinde geçer; içerik/etkileşim kaybı ve yeni regresyon yoktur. Model entegrasyona alınır.
  - YENİ DENEY: sonuç geçmiyorsa ayırt edici yeni hipotez, önceki yaklaşımın neden
    yetmediği ve tek bir ek çevrimin bütçesi yazılır. Aynı ayarla sınırsız tur yapılmaz.
  - ERTELE/KAPSAM KARARI: uygulanabilir model bulunmadıysa açık FAIL'ler korunur;
    bağımsız paketler ilerler, tam tipografi ve ona bağlı sayfalama kabulü açık kalır.
    Daha dar bir sürüm kapsamı ayrı ve görünür bir ürün kararıdır; eski 39 satır kapanmaz.
- **5.2.2 Ortak satır modeli.** Font advance/shaping, break fırsatları ve satır başına
  genişleme/sıkıştırmayı tek modelde değerlendir. Önce bu modele dayalı opt-in çözümü
  prototiple; editör ve PDF aynı sonucu kullansın, DOCX semantik metni Word'e bıraksın.
  Mevcut Word-dışı tarayıcı modu korunur. İncelenen ölçüm modelinin açıklayamadığı
  farklar açık FAIL kalır; raster çıktı veya zorlanmış manuel line break çözüm sayılmaz.
- **5.2.3 Editör davranışı.** Son satır paint düzeltmesini editör önizlemesine de taşı;
  caret/seçim/IME, satır ortasında yazma, paste, undo/redo ve kaydet/aç korunmalı.
  Ölçüm DOM'unu kullanıcı metnine yazma; her tuşta bütün belgeyi yeniden yerleştirme.
- **5.2.4 Stil çözümleme.** Body/paragraph/section/direct formatting önceliğini
  PDF ve DOCX'te karşılaştır. SBE İngilizce 8 kontrolün tipografi/girinti alt kümesini
  düzeltilmiş 5.1 anchor'larıyla çöz; gerektiğinde şablon düzelt, genel motoru kirletme.
- **5.2.5 Korpus.** TNR, Arial, Calibri; 10/11/12/14 pt; TR/EN; karışık run,
  NBSP, uzun sözcük/URL, manuel satır sonu, dar/geniş satır. Tüm olası kombinasyonlar
  yerine sınır vakaları + ikili etkileşim kapsamı kullan; mevcut PASS örneklerini koru.

Ana dosyalar: `wordBaseline.js`, `justifyLastLine.js`, `engineCss.js`, `layoutPdf.js`,
`sourceHtml.js`, `docx/paragraphs.js`, ilgili editör ölçüm yolu; `engine-word-justify.*`
ve typography/justify testleri.

Çıkış: üç Arial kontrolü PASS; doğrulama korpusunda aynı satır metni ve son satır glyph
konumları; style/font/pitch/girinti kapıları PASS; editör etkileşiminde içerik kaybı yok;
birim/build ve tüm mevcut hedeflerde yeni regresyon yok. Başarılı araştırma kararı tek
başına bu çıkışı sağlamaz; entegrasyon ve taze tam regresyon gerekir. Satır akışını
etkileyen sonraki değişiklik bu kabulü ve bağımlı sayfalama sonuçlarını yeniden açar.

## Faz 5.3 — sayfalama, bölüm sınırları ve dinamik alanlar

Bağımlılık: teşhis için 5.1; nihai akış kabulü için 5.2. Amaç: doğru satırların aynı
fiziksel sayfalara yerleşmesi. Göreli efor: yüksek. İlk ayrışma analizi, bölüm/etiket
kuralları ve alan yaşam döngüsü 5.1 sonrasında ayrı paketler olarak araştırılabilir.
5.2 açıkken alınan sayfa sayısı/etiket sonuçları geçicidir; satır modeli sabitlenince
taze export ile yeniden doğrulanır. Word işlemleri her zaman tek sıra çalışır.

- **5.3.1 İlk ayrışma.** AKÜ Sağlık master/PhD/t80 ve Sosyoloji için ilk farklı
  sayfa/paragraph/table/footnote anchor'ını raporla; toplam sayfayı elle telafi etme.
  Akışta oluşan ilk fark ile ondan türeyen tüm etiket farklarını ilişkilendir.
- **5.3.2 Sayfa kuralları.** keepNext/keepLines/widowControl, section/page break,
  terminal leading, adsız alıntı/caption/list blokları ve boş paragraf etkilerini
  sınır fixture'larında karşılaştır. Sayfa sonundaki tek satırlık boşluk farklılıkları
  dahil, üniversiteye özel if eklemeden genel opt-in semantik düzeltmeler uygula.
- **5.3.3 Ön sayfalar.** Onay/etik/kapakların doğal taşması, gizli ama sayılan
  sayfalar, Roman → Arapça geçiş, chapter restart ve ilk sayfada numara gizleme
  davranışını ortak page model ile eşleştir. Sağlık etik iii ve SBE İngilizce ön
  etiket kontrolleri burada kapanır; kaynakta gerçekten sabit olan örnek ile dinamik
  içerik nedeniyle değişen sayfa adedini ayrı kontrol et.
- **5.3.4 Alan yaşam döngüsü.** İhracatın cached TOC/PAGE/NUMPAGES sonuçları,
  Word güncellemesi ve tekrar repagination sonrası ölçümleri karşılaştır. Yakınsama
  için sınırlı tur + hash/etiket sabitliği kullan; sınırsız update döngüsü kurma.
  Mevcut fields fixture'larını gerçek tez varyantlarına genişlet.
- **5.3.5 Taşma ve süre.** 79/80/81 karakter başlık, çok jüri, kısa/uzun paragraf,
  dipnot ekleme/silme ve çok sayfalı tablo ile sınırları dene. Word işlemleri tek sıra,
  sahiplik/PID kaydı ve 120 saniyelik watchdog ile çalışır; timeout kabulde açık hatadır.

Ana dosyalar: `pageLayout.js`, `exportPagination.js`, `generatedIndex.js`,
`blockGap.js`, `footnotes.js`, `docx/sections.js`, `docx/fields.js`, `word2pdf.ps1`.

Çıkış: Sağlık altı + TOC iki ve Sosyoloji iki kontrolü, SBE ön akış alt kümesi PASS;
seçili bütün varyantlarda sayfa/etiket sırası birebir; alan güncellemeleri yakınsar;
tekrar dışa aktarımda landmark kimlikleri kararlı; beklenmeyen boş sayfa yok.
Kapanış kaydı kullanılan 5.2 model sürümünü içerir; yalnız toplam sayfa eşitliği,
ilk farklı paragraf veya alan sonucundaki hatayı kapatmaz.

## Faz 5.4 — karmaşık içerik, dinamik kapak ve düzenlenebilirlik

Bağımlılık: envanter/minimal fixture hazırlığı için 5.1; satır/sayfa akışının nihai
kabulü için 5.2–5.3. Amaç: gerçek tez kullanımını ayrı kapanabilen paketlerle doğrulamak.
Göreli efor: toplamda yüksek, paket bazında yeniden tahminlenecek. Aşağıdaki altı paket
ayrı değişiklik ve kabul kaydı taşır; tek büyük değişiklikte birleştirilmez. 5.4.5'in
kapsamı belirleyen envanter ayrımı 5.1'de başlar; son doğrulaması burada tamamlanır.

- **5.4.1 Tablolar.** Çok satırlı/birleşik hücreler, atLeast/exact row height,
  padding/border, repeatHeader, cantSplit, caption/continuation ve hücre içi paragraf
  stilini PDF/Word'de ölç. Bölünemeyen tek satır bir sayfadan büyükse açık taşma tanısı
  üret; içerik kırpma veya bütün tabloya gereksiz keep zinciri uygulama.
- **5.4.2 Dipnotlar.** Dikeyde geçen testlerin yanına işaret/gövde yatay girintisi,
  asılı girinti, devam notu, çok dipnot ve referans paragrafıyla birlikte bölünme ekle.
  İşaret ve gövde metni Word'de gerçek dipnot olarak kalmalı.
- **5.4.3 Kapaklar.** ADÜ pilotundaki sözcük sözcük sabit örnek metnini semantik
  metadata alanları ve kaynakla ölçülmüş metin kutuları/gruplarıyla değiştirmeyi tasarla.
  Kısa/uzun tez başlığı, ad/soyad, jüri, ikinci danışman, tarih ve boş alanları doğrula.
  Kaynakta desteklenmeyen alternatif sayfayı üretme; taşmayı kullanıcıya anlaşılır göster.
- **5.4.4 Diğer desteklenen öğeler.** Mevcut denklemler, resim/caption, tab stop,
  kaynakça/alıntı, döndürülmüş yazı ve karakter biçimlerini içerik + geometri + Word'de
  düzenlenebilirlik açısından dene. Önce uygulamanın gerçekten sunduğu özellikleri kapat;
  kullanıcı akışında olmayan yeni bir Word özelliğini sırf envanterde var diye ekleme.
- **5.4.5 Dil/bölge ve kaynak boşlukları.** 109 grubu metadata/kullanılmayan
  stil/desteklenen eşleme/gerekli motor açığı diye gerekçeli ayır. Bidi/RTL ürün
  kapsamındaysa paragraph/run yönü ve karışık metni uygula; değilse sertifikada açıkça
  hariç tut. Decimal tab'ı bölgeye uygun virgül/nokta ile ölç; decimalSymbol ile karıştırma.
- **5.4.6 Word düzenleme turu.** Word'de başlık değiştir, paragraf/tablo satırı ekle,
  alanları güncelle, kaydet ve yeniden aç; içerik/stil/alan ilişkileri korunmalı.
  Word'ün ZIP/XML'i yeniden yazması nedeniyle byte eşliği zorunlu tutulmaz.

Paket kapanışları:

- **5.4.1:** kayıtlı tablo örneklerinde hücre içeriği/geometri ve sayfa bölünmesi
  doğru; repeatHeader/cantSplit ve taşma tanısı doğrulanmış.
- **5.4.2:** dipnot işareti/gövdesi, yatay girinti ve devam akışı doğru; Word'de
  gerçek dipnot ve referans ilişkisi korunmuş.
- **5.4.3:** kaynakta desteklenen metadata alanları kısa/uzun/boş sınırlarında
  düzenlenebilir; taşma görünür; sabit örnek metne bağlı yerleşim kalmamış.
- **5.4.4:** kapsam kaydındaki her mevcut öğe için içerik/geometri/düzenlenebilirlik
  kanıtı var. Yeni özellik talepleri genişletme kuyruğuna ayrılmış.
- **5.4.5:** 109 grubun her biri gerekçeli sınıfta; gerekli özellik açıkları kontrol
  kimliğine bağlı. Zorunlu dil/bölge senaryoları geçmiş; erişilemeyen ortamlar görünür.
- **5.4.6:** ilgili paketlerden seçilen sabit Word düzenleme senaryolarında
  başlık/paragraf/tablo değişimi, alan güncelleme ve kaydet/aç sonrası kayıp yok.

Bir pakette yeni satır veya sayfa davranışı gerekiyorsa ilgili 5.2/5.3 kabulü yeniden
açılır. Paket tamamlanması bağımsız kaydedilebilir; faz kapanışı bütün zorunlu paketlerin
birlikte geçtiği entegrasyon koşusunu gerektirir.

Ana dosyalar: `docx/tables.js`, `docx/specialPages.js`, `specialPages.js`,
`layoutDocument.js`, `layoutDocx.js`, `paragraphTabs.js`, `footnotes.js`, `export.js`,
`spec2template.mjs`, `schema.d.ts` ve ilgili tablo/kapak/dipnot testleri.

Çıkış: kapsam kaydındaki bütün zorunlu Tier 2 senaryoları PASS; başlangıçta kapsam dışı
belirlenenler gerekçeli ve görünür; kapsam içi UNKNOWN yok. Başarısız zorunlu senaryoyu
sonradan kapsam dışı saymak kapanış değildir. Desteklenen öğeler düzenlenebilir; 109 grubun her biri
gerekçeli bir duruma sahip; içeriği kırparak/rasterleştirerek sağlanan PASS yok.

## Faz 5.5 — tüm hedefler, ortam matrisi ve kalıcı sürüm kapısı

Bağımlılık: çekirdek kapsam için 5.1–5.4'ün gerekli kabul kayıtları. Amaç: önceden
kurulmuş kapıları tam sürüm kabulünde birleştirmek. Göreli efor: referans ortamında
orta; ek ortamların erişim ve hata giderme eforu ayrı tahminlenir. Ortam hazırlığı
5.1'de başlar; bu fazda ilk kez bağımlılık keşfedilmesi beklenmez.

- **5.5.1 Tam regresyon.** O an checks.json olan bütün hedef ve kayıtlı gerekli
  varyantlar; sabit kapsam kaydı, mevcut 21 hedef ve karmaşık içerik korpusu. Sonradan
  eklenen hedefler regresyon kapısına katılır; sertifika kapsamına alınmaları değişiklik
  kaydı gerektirir. Başlangıçtaki 35 varyantın kapsam ve payda farkları açıklanır.
  39 eski FAIL için çözüm/source-backed yeniden ölçüm kaydı bulunmalı; başarısız
  kontrolü silmek veya required kontrolü SKIPPED yapmak kapanış değildir.
- **5.5.2 Ortam kapsamı.** Önce referans Windows Word + sabit Chromium; sonra
  Chrome/Edge sürümleri, erişilebilen ikinci Word build'i ve TR/EN bölge senaryoları.
  Firefox, Safari/macOS Word ve Word web'e ancak gerçek koşu kanıtıyla destek ver.
  Kullanılamayan ortam, açık doğrulanmamış ortamdır; ana sertifikaya sessizce dahil edilmez.
- **5.5.3 Tekrarlanabilirlik.** Değişmeyen kodla iki ardışık tam kabul koşusu:
  içerik/geometri/page labels/stable IDs karşılaştırılır. PDF/DOCX zaman damgası ve
  metadata farkını belge yerleşim farkı sayma; artefact hash'lerini yine kaydet.
- **5.5.4 Hız ve dayanıklılık.** Üniversite fixture'ında mevcut yerel non-Word
  <=30 saniye kapısını koru; büyük belgeler ayrı performans sınıfında raporlansın.
  Editör etkileşim gecikmesini 5.1 baz ölçümüne karşı izle; tekrar export/wait yakınsaması,
  hata mesajı ve eksik font akışlarını dene. Mutlak süreyi bütün bilgisayarlara garanti etme.
- **5.5.5 Otomatik kapının sürüm kabulü.** 5.1'de kurulan PR/yerel kapının birim/build,
  mevcutsa şema ve etkilenen fixture sonuçlarını gerçekten engelleyici olarak kullandığını
  doğrula; gerekli şema doğrulayıcısının yokluğu açık ortam engelidir. Paylaşılan motor
  değişikliğinde tüm hedef regresyonu; sürüm öncesi zorunlu Word ortam matrisi.
  Word kurulu yerel/Windows runner ayrı gereksinimdir. Plan kullanıcıdan zamanlanmış
  automation istemediği için bu adım bir scheduler kurulumu değildir.
- **5.5.6 Kapanış.** Özellik × ortam × varyant sertifika kaydı, gerekli kontrollerin
  paydası, açık/kapsam dışı durumlar, kod/font/ortam hash'leri ve kanıt yolları yayımlanır.
  Üniversite SOURCE→SPEC doğrulaması motor sertifikasından ayrı tutulur.

Çıkış: ilan edilen kapsamda **0 FAIL, 0 zorunlu SKIPPED/UNKNOWN**, iki tam koşu PASS;
gereken bütün içerik/geometri/alan/editability kapıları geçmiş; önceki 39 satırın
tamamının izlenebilir kapanışı var. "Tam uyum" etiketi sadece bu özellik ve ortam
kapsamını ifade eder. Yeni 30 bekleyen üniversitenin tamamlanması ayrı ölçekleme kuyruğudur.

## En verimli yürütme yöntemi

1. Önce 5.1 ile yanlış tanı maliyetini azalt; küçük kapak/tablo düzeltmelerini paketle.
2. 5.2 dar deneyini bütçesi ve karar kapısıyla yürüt. Bu sırada 5.3'ün bağımsız
   teşhis/alan/bölüm paketlerini ve 5.4'ün minimal sınır fixture'larını hazırlayabilirsin;
   nihai sayfalama kabulünü satır modeli sabitlenmeden verme. Bu bağımsızlık sıralama
   esnekliğidir; alt ajan veya eşzamanlı Word işlemi başlatma talimatı değildir.
3. Bir aile için minimal fixture → `--only <id1,id2>` → etkilenen hedef tam koşusu.
   Mevcut çıktıyla yalnız ölçüm deneyi yapılabilir; kod düzeltmesinin kabulü taze export ister.
4. Ortak motor paketi tamamlanınca npm test/build birer kez ve bütün hedeflerde gerçek
   Word regresyonu; sonraki değişiklik/başarısızlık olmadan aynı testleri tekrar etme.
5. Kaynak/Word cache ve dar XML/paragraph okumalarını kullan; tüm kılavuzu yeniden okuma.
   Word işlemlerini paralelleştirme; tarayıcı export havuzunu mevcut sınırlı boyutta tut.
6. Her fazı ayrı commit + <=15 satır kapanış + acceptance JSON ile kapat.
   Duvar süresini ölç; token telemetrisi yoksa tahmini token sayısını gerçekmiş gibi yazma.
7. Tek seferde bir kabul edilebilir uygulama paketi üzerinde çalış. Her paket sonunda
   tahmin/gerçek süre, yeni bağımlılık ve kalan riskleri güncelle. Takvim tahmini için
   5.1 pilotu ile 5.2 ilk deney çevrimi kanıtını kullan; araştırma süresini garanti etme.

## Fazlar arası teslim ve yeniden açma kuralları

- **5.1 → 5.2:** kapsam, düzeltilmiş ölçüm/fixture'lar, ortam parmak izi, baz performans,
  eski FAIL eşleme kaydı ve çalışan regresyon komutu teslim edilir.
- **5.2 → 5.3:** doğrulanan satır modeli/sürümü, sabit korpus sonuçları ve editör
  etkileşim kanıtı teslim edilir. Açık tipografi FAIL'i varsa nihai akış kabulü bekler.
- **5.3 → 5.4 entegrasyonu:** ilk ayrışma kapanışları, bölüm/etiket ve alan yaşam
  döngüsü sonuçları teslim edilir; önceden hazırlanmış karmaşık örnekler birlikte koşulur.
- **5.4 → 5.5:** her zorunlu paketin kabulü, Word düzenleme turu ve özellik kapsamı
  teslim edilir. Eksik zorunlu paket varsa sürüm sertifikası verilmez.
- **Her aşamada:** kaynak, font, renderer, satır/sayfa modeli veya fixture değişirse
  etkilenen kabul kayıtları geçersiz işaretlenir. Kullanılabilir eski kanıt korunur;
  yeni sürümün PASS sonucu gibi sunulmaz. Sürüm kapsamını daraltma kararı varsa tam
  programın açık işleri ve önceki 39 FAIL ayrıca görünür kalır.

Başlangıç komutları (preview açıkken, depo kökünde):

```sh
node orchestration/tools/check.mjs --target aku-sagbil --word --only h4-bold-editor,h4-bold-word --out orchestration/validation/word-compat/phase-1/aku-sagbil
node orchestration/tools/check.mjs --target adu-ziraat-lisans --word --only cover-inner-baselines --out orchestration/validation/word-compat/phase-1/adu-ziraat-lisans
node orchestration/tools/check.mjs --target aku-sbe --word --only table-header-f-centered,table-number-centered,table-percent-centered --out orchestration/validation/word-compat/phase-1/aku-sbe
node orchestration/tools/check.mjs --target aku-sbe --word --only table-header-f-centered-master-en,table-number-centered-master-en,table-percent-centered-master-en,table-header-f-centered-phd-en,table-number-centered-phd-en,table-percent-centered-phd-en --out orchestration/validation/word-compat/phase-1/aku-sbe-en-tables
node orchestration/tools/check.mjs --target aku-sbe --word --only body-line-pitch-master-en,first-line-indent-master-en,body-line-pitch-phd-en,first-line-indent-phd-en --out orchestration/validation/word-compat/phase-1/aku-sbe-en-body
node orchestration/tools/check.mjs --target engine-word-justify --word --out orchestration/validation/word-compat/phase-2/justify
node orchestration/tools/check.mjs --all --word --out orchestration/validation/word-compat/regression --manifest orchestration/validation/word-compat/regression-manifest.json
```

5.1'den sonraki komutlar şimdiden PASS sayılmaz; uygulama sırasında çalıştırılacak
doğrulama tarifleridir. İlk iş: kapsam ve başlangıç envanteri, ardından H4/İngilizce
tablo/gövde ölçümü ve erken kapılar. ADÜ kapak ile doğrulanan SBE tablo hizası ayrı
paketlerde ele alınır. Dar komutlar teşhis içindir; ilgili hedefin bütün gerekli
varyantlarında ve ortak motor için bütün hedeflerde kabul koşusunun yerine geçmez.
Açık kök nedenler, kendilerine bağlı sonraki ölçümlerin nihai kabulünü engeller;
bağımsız teşhis ve hazırlık işleri ilerleyebilir.

## 5.1 uygulama kapanışı — 2026-10-07

Durum: CLOSED_WITH_DOCUMENTED_DEFERRALS. 21 hedef/35 varyant taze Word koşusu: 1714 PASS / 18 FAIL / 32 INFO; başlangıçtaki 39 FAIL’in 21’i kapandı, yeni yerleşim regresyonu yok. Beklentiler ve toleranslar korunmuştur. SDK şema kontrolü ayrı: 3 varyant PASS, 32 FAIL; hatalar 5.3/5.4 paketlerine kayıtlıdır. ADÜ kapak tipografisi 5.2’ye devredildi; kaynak H4 numaralandırması UNKNOWN kalır. Tam uyum/sürüm kabulü verilmedi.

Kapanış: `orchestration/reports/MOTOR_PHASE51_CLOSE_2026-10-07.md`; kabul: `orchestration/validation/word-compat/phase-5.1/acceptance.json`. 5.2 kullanıcı talimatı bekliyor.
