# Word uyumu — beş fazlık uygulama planı

Tarih: 2026-10-07. Durum: PLANLANDI; bu belge motor düzeltmelerinin tamamlandığı anlamına gelmez.
Başlangıç kodu: `6deaf6d`. Önceki MOTOR Faz 0–4 kayıtları korunur. Yeni çalışma,
MOTOR Faz 5 programının **5.1–5.5** alt fazlarıdır; eski fazlar yeniden numaralandırılmaz.

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

## Faz 5.1 — güvenilir ölçüm ve küçük, kaynak temelli düzeltmeler

Amaç: gerçek uyumsuzlukları kapsam/ölçüm hatalarından ayırmak; sonraki fazların yanlış
bir referansa göre motoru değiştirmesini önlemek. Göreli efor: düşük–orta.

- **5.1.1 Kabul envanteri.** 39 FAIL kimliğini koru; sekiz aileye kaynak locator'ı,
  fixture/varyant, ilk farklı satır/sayfa, hipotez ve doğrulanmış tanı ekle. 32 INFO'yu
  gerekli özellik/izleme bilgisi olarak ayır; gerekli UNKNOWN kabulü engellesin.
- **5.1.2 Ölçüm kapsamı.** H4 kontrolünde numaralı başlığı semantik kimlikle bul;
  bold ve numaralandırmayı ayrı doğrula. SBE İngilizce tablo fixture'larına kaynakla
  aynı anlamdaki tablo örneklerini ekle. Fiziksel sayfa 15 yerine section + paragraph
  anchor kullan; pitch'i ana gövdeyle sınırla. Beklenen kaynağı/toleransı değiştirme.
- **5.1.3 Küçük düzeltmeler.** ADÜ kapak son satırının 2,003 mm farkını kaynak
  geometriyle çöz. SBE tablo hücresinin kendi hizası, hücre paragrafı stili ve layout
  glyph merkezini birlikte incele; yalnız doğrulanan yerde genel hizalama aktarımını
  veya o üniversitenin kaynak temelli verisini düzelt. Küçük işleri aynı pakette topla.
- **5.1.4 Referans ortamı.** Word build/mode/printer bilgisine font hash'leri,
  tarayıcı sürümü, locale ve ilgili compatibility seçeneklerini ekle. Cache anahtarını
  kaynak + code/spec/fixture + renderer/font ortamı ile ilişkilendir. Eksik cache PASS olmaz.
- **5.1.5 DOCX geçerliliği.** Open XML SDK doğrulayıcısı için mevcut çalışma ortamını
  kontrol et; şema/relationship hatalarını gerçek Word açılışından ayrı raporla.
  Kullanılamayan doğrulayıcıyı açık ortam bağımlılığı olarak kaydet; PASS üretme.

Ana dosyalar: `orchestration/tools/conformance.py`, `check.mjs`, `word2pdf.ps1`,
`specs/aku-sagbil.*`, `specs/aku-sbe.*`, `templates/adu-ziraat-lisans.js`,
`layoutReport.js`, `docx/tables.js`.

Çıkış: 39 eski satırın tamamı sınıflandırılmış; gerekli fixture öğesi yokken ölçüm
başarısı yok; her etkilenen kontrol source-backed ve gerçek öğeye bağlı; küçük
düzeltmelerin kontrolleri PASS; sıfır yeni regresyon. Kalan gerçek FAIL'ler sonraki
fazlara açık kimliklerle devredilir. Sayısal FAIL azalması tek başına çıkış ölçütü değildir.

## Faz 5.2 — yazı, satır kırılımı ve paragraf eşliği

Bağımlılık: 5.1. Amaç: sayfalamanın temel girdisi olan satır akışını düzeltmek.
Göreli efor: yüksek; özel line breaker bu programın en belirsiz teknik parçası.

- **5.2.1 Dar deney.** Mevcut Word justify probe'larını ve J03/J04'ü yeniden kullan.
  Son kelime bütçesini Word kuralı diye genellemeden; kısa son kelime, az/çok boşluk,
  noktalama, kalın/italik run ve farklı font boyutlarında ölç. Öğrenme ve doğrulama
  metinlerini ayır; yalnız üç başarısız cümleye uygun sabit üretme.
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
birim/build ve tüm mevcut hedeflerde yeni regresyon yok. Sonraki faz bu modeli kullanır.

## Faz 5.3 — sayfalama, bölüm sınırları ve dinamik alanlar

Bağımlılık: 5.2. Amaç: doğru satırların aynı fiziksel sayfalara yerleşmesi.
Göreli efor: yüksek; typography tamamlanmadan bu fazı kapatmak yeniden iş üretir.

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

## Faz 5.4 — karmaşık içerik, dinamik kapak ve düzenlenebilirlik

Bağımlılık: 5.2–5.3. Amaç: basit fixture dışındaki gerçek tez kullanımını güvenceye almak.
Göreli efor: orta–yüksek; kapsamdaki özellikler 5.1 sözleşmesine göre seçilir.

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

Ana dosyalar: `docx/tables.js`, `docx/specialPages.js`, `specialPages.js`,
`layoutDocument.js`, `layoutDocx.js`, `paragraphTabs.js`, `footnotes.js`, `export.js`,
`spec2template.mjs`, `schema.d.ts` ve ilgili tablo/kapak/dipnot testleri.

Çıkış: gerekli Tier 2 senaryoları PASS veya kapsam dışı olarak gerekçeli ve görünür;
kapsam içi UNKNOWN yok. Desteklenen öğeler düzenlenebilir; 109 grubun her biri
gerekçeli bir duruma sahip; içeriği kırparak/rasterleştirerek sağlanan PASS yok.

## Faz 5.5 — tüm hedefler, ortam matrisi ve kalıcı sürüm kapısı

Bağımlılık: 5.1–5.4. Amaç: tek makinede birkaç örneğin geçmesini ürün güvencesine çevirmek.
Göreli efor: orta; başka ortamların erişilebilirliği ayrıca kaydedilecek.

- **5.5.1 Tam regresyon.** O an checks.json olan bütün hedef ve kayıtlı gerekli
  varyantlar; mevcut 21 hedef, sonradan eklenenler ve karmaşık içerik korpusu.
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
- **5.5.5 Otomatik kapı.** PR'da birim/build/şema ve etkilenen fixture'lar;
  paylaşılan motor değişikliğinde tüm hedef regresyonu; sürüm öncesi tam Word matrisi.
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
2. 5.2'de satır kırılımını çöz; değişen satırlarla 5.3 sayfalamasını ikinci kez yapma.
3. Bir aile için minimal fixture → `--only <id1,id2>` → etkilenen hedef tam koşusu.
   Mevcut çıktıyla yalnız ölçüm deneyi yapılabilir; kod düzeltmesinin kabulü taze export ister.
4. Ortak motor paketi tamamlanınca npm test/build birer kez ve bütün hedeflerde gerçek
   Word regresyonu; sonraki değişiklik/başarısızlık olmadan aynı testleri tekrar etme.
5. Kaynak/Word cache ve dar XML/paragraph okumalarını kullan; tüm kılavuzu yeniden okuma.
   Word işlemlerini paralelleştirme; tarayıcı export havuzunu mevcut sınırlı boyutta tut.
6. Her fazı ayrı commit + <=15 satır kapanış + acceptance JSON ile kapat.
   Duvar süresini ölç; token telemetrisi yoksa tahmini token sayısını gerçekmiş gibi yazma.

Başlangıç komutları (preview açıkken, depo kökünde):

```sh
node orchestration/tools/check.mjs --target aku-sagbil --word --only h4-bold-editor,h4-bold-word --out orchestration/validation/word-compat/phase-1/aku-sagbil
node orchestration/tools/check.mjs --target adu-ziraat-lisans --word --only cover-inner-baselines --out orchestration/validation/word-compat/phase-1/adu-ziraat-lisans
node orchestration/tools/check.mjs --target aku-sbe --word --only table-header-f-centered,table-number-centered,table-percent-centered --out orchestration/validation/word-compat/phase-1/aku-sbe
node orchestration/tools/check.mjs --target engine-word-justify --word --out orchestration/validation/word-compat/phase-2/justify
node orchestration/tools/check.mjs --all --word --out orchestration/validation/word-compat/regression --manifest orchestration/validation/word-compat/regression-manifest.json
```

5.1'den sonraki komutlar şimdiden PASS sayılmaz; uygulama sırasında çalıştırılacak
doğrulama tarifleridir. İlk iş: H4 ve İngilizce tablo kapsamını düzeltmek, ardından
ADÜ kapak ve doğrulanan SBE tablo hizası. Her fazda açık kök nedenler çözülmeden
sonrakinin ölçümleri nihai kabul yerine geçmez.
