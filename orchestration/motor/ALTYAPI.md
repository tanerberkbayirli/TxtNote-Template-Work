# Şablon altyapısı — motor esas (22.10.2026)

## Motor nedir (kullanıcı kararı, 22.10.2026)
Motorun asıl amacı, **binlerce üniversite ve tez şablonu** ekleyeceğimiz için bu işi **otomatize etmektir**. `engine/` şunları yapar:
1. **Eklemeyi kolaylaştırır:** yeni üniversite ya da tez, resmî kaynaktan en az elle işle şablona dönüşür (`docx2spec.py` → `spec2template.mjs` → `template-add.mjs`).
2. **Çıktıyı tutarlı yapar:** şablon + belge tek belge modelinde birleşir; editör, yazdırma, PDF ve DOCX aynı modeli çevirir.
3. **İşleri otomatize eder:** tekrar eden ölçüm, kontrol ve raporlama araç olur (`templates-defaults.mjs`, `check.mjs`...).
4. **Kapıdan geçirir:** her şablona aynı kalite kapıları (`golden.mjs`, `parity.mjs`, `check.mjs --word`, birim testleri).

Bileşenleri: çalışma zamanı `engine/src/`, otomasyon ve kapılar `engine/tools/`, kaynaktan çıkan veri `engine/specs/` ve `engine/references/`, belgeler `orchestration/motor/`. Başarı ölçütü: yeni bir üniversite eklerken elle iş ne kadar azaldı ve aynı girdiden çıktı ne kadar tutarlı.

## Üniversite adı kodda (kullanıcı kararı, 22.10.2026)
Üniversite adının (ya da kimliğinin) kodda geçmesi **zorunlu da değildir, yasak da değildir**; hangisi daha iyi çözümse o seçilir. Karar verirken ölçüt: daha az elle iş, daha tutarlı çıktı, daha kolay bakım. Bir değer farkıysa şablon verisi, bir davranış farkıysa motor kodu genellikle daha iyi olur; bu bir varsayılan eğilimdir, kural değil. Seçilen çözümün gerekçesi koda ya da bu belgeye yazılır. Bugün motor kodunda üniversite adına bağlı dal yoktur. Değişmeyen ilke ayrıdır: bir üniversitenin sayısal gereksinimi, kaynağı doğrulanmadan başka şablona taşınmaz.

Karar (kullanıcı, 21.10.2026): binlerce şablon gelecek. Şablon başına kod yazmak, şablon başına denetim ve düzeltme yapmak
ölçeklenmez. Hedef: **şablon = yalnız veri**, **bütün yerleşim davranışı motorda, tek yerde**; yeni bir şablon kod ve elle denetim
gerektirmeden eklenir. Şablona özel görevler listeden çıkarıldı.

Karar (kullanıcı, 22.10.2026): **şablonlar varyant olarak kurulmaz; motor esastır.** Motorun kendi tasarımı bunu söyler
([README](README.md), `engineDefaults.js`, `DOCX_EXTRACTION.md`): ortak olan şey **motorun davranışı** ve kaynağın hiç söylemediği
anahtarlar için **nötr motor varsayılanlarıdır**; şablon ise tek bir resmî kaynağın söylediği değerleri taşıyan **düz veridir**. Bir
şablon başka bir şablondan türemez, başka üniversitenin sayısal gereksinimini ödünç almaz ("Üniversitelerin sayısal gereksinimleri
asla paylaşılmaz"; kaynağın tanımlamadığı kurala uydurma değer zorlanmaz).

## Geri alınan karar: ortak taban ve varyantlar (21.10 → 22.10.2026)
21.10'da şablonlar `templates/base/thesis-base.json` ve `extends` ile fark olarak yazılmıştı (ayar 16 691 → 4 909). Bu, motorun ilkesiyle
çelişiyordu: taban, birkaç üniversitenin değerinin oyuyla çıkarıldığı için başka bir üniversitenin şablonuna kaynak doğrulaması
olmadan sayı taşıyordu. **22.10'da kaldırıldı:** her şablon kendi tam verisidir (`templates/data/<kimlik>.json`, `extends` yok);
`compose.js`, `base/`, `templates-factor.mjs`, `template-encode.mjs`, `templates-to-json.mjs` silindi.
- Düzleştirme kayıpsızdı: 34 şablonun motora giden çıktısı öncekiyle **bayt bayt aynı** (anahtar sırası dahil), 34/34; birim testleri
  1131/1131; üretim derlemesi geçti. Veri 2,7 MB (görseller dahil, eskiden de böyleydi).
- Korunan koruma: `test_template_add.mjs` hiçbir şablonda `extends` olmadığını ve tabanın/`compose.js`'in geri gelmediğini sınar.
- Yedek (depoda değil): düzleştirmeden önceki veri, taban ve araçlar oturum geçici klasöründe tutuldu; gerekirse geri yazılabilir.

## Bugünkü durum (ölçüldü)
- 34 şablon (+ generic). JSON veri: `Butun-Sablonlar/Ege/<üniversite>/`; modüller yalnız veriyi yeniden dışa veren sarmalayıcılar; eski JS kaynakları
  atıflarıyla `templates/legacy-js/` içinde (yüklenmez).
- Motora **1062 farklı ayar yolu** veriliyor; **396'sı yalnız 1–3 şablonda** kullanılıyor (kaçış kapıları: `figureExitGap`,
  `noteExitGap`, `omitOnChapterStart`, `centerOnPage`, `suppressSpaceBeforeAtPageTop`, `trailingBlankLines`, `sourceTable` stili…).
  Aynı kavramın birden çok yazımı var (`lineHeight` ile `lineSpacing { rule, value }`).
- Aynı kural motorda birden çok yerde: editör CSS (`engineCss.js`), DOCX yazıcısı (`docx/*`), PDF yazıcısı. Uzun belge
  çalışmasında bulunan hataların çoğu bu çiftlikten çıktı (tablo altı 2 pt, şekil hizası/boşluğu, liste, boş hücre, sekme, tablo sütunu).
- Blok arası boşluk için dört yol vardı (`collapse`, `additive`, `additive + blockGap`, modsuz); A/B aşamasında DOCX ve editörün
  `additive` boşluğu tek modele (`blockGap.js`) bağlandı, davranış değişmeden (altın karşılaştırma 34/34 aynı).
- Şablon nesnelerinde fonksiyon yok.

## Hedef katmanlar
1. **Şablon şeması (düz veri):** sayfa (boyut, kenar boşlukları, üst/alt bilgi, numaralama), metin stilleri (tek satır aralığı biçimi,
   önce/sonra boşluk, girintiler, sekme durakları, tutma kuralları), öğe stilleri (gövde, başlık 1–n, tablo/şekil başlığı, hücre,
   dipnot, liste, kaynakça, dizin satırları), bölüm listesi (sıra, tür, sayfa sonu, numaralama dizisi), özel sayfalar (kapalı bir
   blok türü kümesiyle yerleşim). Yalnız **kaynağın söylediği** değerler yazılır. Şemada olmayan her şey motor varsayılanıdır.
2. **Tek yerleşim modeli (motor):** şablon verisinden çözümlenmiş tek model; Word davranışı burada bir kez kodlanır (boşluk = max,
   sayfa başında boşluğun atılması, dipnot alanı açıklığı, sekme/asılı girinti, paragraf işareti fontu, tutma kuralları, tablo
   geometrisi…). Editör CSS, DOCX ve PDF yazıcıları yalnız bu modeli çevirir; varsayılan tek modeldir. Üniversite/şablon kimliğine göre dallanma yasak değildir (bkz. "Üniversite adı kodda"), ama dal yerine tek modelin kabul edemediği bir davranış farkı gerektiğinde, gerekçesiyle eklenir.
   Nötr varsayılanlar `engineDefaults.js` içindedir (yalnız **eksik** anahtarları doldurur, şablonun yazdığını asla değiştirmez).
3. **Şablon üretim hattı:** resmî DOCX/PDF → çıkarıcı (`engine/tools/docx2spec.py`) → `spec2template.mjs` → düz şablon + menşei →
   şema doğrulaması → otomatik genel doğrulama. Elle denetim yok; bir şablonun düzgün çıkmaması motordaki bir eksiği gösterir ve motorda
   bir kez düzeltilir.
4. **Genel kalite kapısı (her şablona aynı):** şema doğrulaması + üretilmiş belgede editör/Word eşliği (`parity.mjs`) + değişiklik
   öncesi/sonrası altın karşılaştırma (`golden.mjs`). Eşikler tüm şablonlarda aynı; şablona özel beklenen değer yok.

## Geçiş sırası
1. **Şablonları JSON veriye çevir — tamam (21.10).** Altın 34/34.
2. **Ortak taban ve varyant — geri alındı (22.10), yukarıya bakın.**
3. **Motor varsayılanları — ölçüm tamam, ilk iki varsayılan uygulandı (22.10).** Rapor: MOTOR_VARSAYILANLARI_2026-10-22.md (rapor silindi),
   araç `engine/tools/templates-defaults.mjs`. 34 şablonda 10 162 kural değeri: %34 silinse çıktı değişmez (birlikte silinebilen 3279; 2795'i
   bölüm geçersiz kılmasının devralınan değeri yeniden yazması, 484'ü şablon düzeyi), %43 etkili, %14 doğrulamaca zorunlu, %8 probe dışı.
   Toptan silme **yapılmaz** (menşei kaybı; kaynak sessizliği bilinemez). Doğrulama, tek değerli 6 yolu zorunlu tuttuğu için kaynak sessizken
   değer uydurulmak zorunda kalıyordu. **Yapıldı:** `engineDefaults.js` artık eksik `page.orientation`'ı (`portrait`) ve tablo/şekil
   açıklamasındaki eksik `numbering.sequence`'ı (`arabic`) doldurur; açıkça verilmiş geçersiz değer hâlâ reddedilir. Mevcut 34 şablonun motorun
   gördüğü hâli ve derlenmiş çıktısı değişmedi (34/34 birebir), 1133/1133 test, derleme geçti. Kalan dört zorunluluk
   (`page.numbering.enabled/position`, `toc.showPageNumbers`, `typography.lineSpacing.mode`) kaynağın söylediği ya da görünür davranışı
   değiştiren değerlerdir; varsayılan **önerilmez**. Üniversite gereksinimi olan sayı (A4, kenar boşluğu, yazı tipi/punto, satır aralığı)
   motora taşınmaz. Dipnot numaralandırma varsayılanı belge/kod çelişkisi çözüldü: varsayılan `"document"` (kod ve test doğruydu, `schema.d.ts` ve iki belge düzeltildi).
4. Tek şema: aynı kavramın yazımlarını teke indir (satır aralığı, boşluk), şemayı `schema.d.ts` + `validation.js`'te kapat.
5. Kaçış kapılarını kaldır: her nadir bayrak ya genel bir kurala (motor) ya da bir değere (şema) dönüşür.
6. Boşluk politikalarını (`paragraphPitch`, `margins`) tek Word modelinde birleştir; eski dalları sil.
7. Diğer çift kodlu kuralları (sayfa başı, dipnot, sekme, tablo, özel sayfa) aynı modele taşı.
8. Üretim hattı: profil (paragraf indeksleri) otomatik önerilsin; görseller JSON'dan ikili varlığa; kayıt defteri indeksi şablon üst verisinden üretilsin.

## Kapak ailesi ölçümü (22.10.2026)
Şablonlardaki değerin yaklaşık %54'ü dört bölüm türünden gelir: onay, dış kapak, etik beyan, iç kapak. Ölçüm
(`engine/tools/templates-reuse.mjs`, 97 bölüm, 1367 blok): başka bir üniversitede aynısı bulunan blok oranı **birebir %3, metin hariç %11,
metin ve ölçü hariç %29**. Blok türleri zaten kapalı kümedir (text, spacer, metadata, group, image); kapaklar kurumlara özgü, mutlak
konumlu ve paylaşılamaz. Sonuç: kapak ailesi paylaşımla değil **kaynaktan otomatik üretimle** çözülür (`spec2template.mjs` kapağı
doğrulanmış Word geometrisinden üretir). Bu bölümler elle yazılmaz; boyutları önemsizdir.
Açık tasarım kararı: sabit sayfalar bugün kelime kelime mutlak blok (ADÜ Sağlık: değerlerin %90'ı); el yapımı MCBÜ kapağı ise anlamlı
alanlarla (`metadata`) yazılı. Otomatik çıktının düzenlenebilirliği için anlamlı alana dönüştürme kararı bekliyor.

## Üretim hattı — tek komut (22.10.2026)
`node engine/tools/template-add.mjs --extracted <hedef>.extracted.json --profile <hedef>.generation.json [--replace] [--write] [--out-root <dizin>]`
1. `generate()` (spec2template) kaynak gerçeklerinden **düz** şablonu, Tier 1 kontrollerini, fixture ve eşlemeyi üretir.
2. Veri kapısı: şablon JSON olarak saklanınca değişmemeli ve şema doğrulamasından geçmeli; aksi hâlde hiçbir şey yazılmaz.
3. **Menşei:** her saklanan değer tek sınıf alır: `MEASURED` (bir kaynak gerçeği o değeri söyler), `GEOMETRY` (doğrulanmış Word
   çıktısından ölçülen sabit sayfa metni), `GENERATED` (kaynak gerçeği yok: üreticinin sabiti, ölçülmüş değerin kopyası ya da gözden
   geçirilmiş profil seçimi). Şablonun hiç yazmadığı, motorun doldurduğu anahtarlar `ENGINE_DEFAULT` olarak ayrıca listelenir (kanıt
   sayılmaz). Motorun uygulayamadığı özellik grupları `UNKNOWN` (mapping.engineGaps). Sonuç `specs/<hedef>.provenance.json`a yazılır.
4. `--write`: `templates/data/<kimlik>.json`, modül `templates/<hedef>.js`, `specs/<hedef>.{checks,fixture,mapping,provenance}.json`;
   kayıt satırı yazdırılır (otomatik eklenmez). `--out-root` ile başka dizine yazılır.
**Ölçüm (ADÜ Sağlık, kaynaktan yeniden üretim):** 111 947 B düz şablon; 5291 saklanan değerin %90'ı GEOMETRY (sabit sayfalar), %2
MEASURED, %8 GENERATED. Yeniden üretilen şablon kayıtlıyla **0 farklı**, 24 ms. Açık: 66 kaynak gerçeği şablon yoluna yerleştirilemiyor
(bölüm başlık/dizin stilleri `sections.<id>.…` anahtarıyla kaydediliyor, şablonda `sections[i].overrides…` altında); üretici gerçek yolu
kaydetmeli.

**Profil önerisi (22.10.2026, `engine/tools/profile-suggest.mjs`).** Profil (gövde, başlık, açıklama, bölüm paragraf numaraları ve sabit sayfaların Word sayfası) artık kaynaktan önerilir; `template-add.mjs --identity <kimlik.json>` elle profil istemez. Kimlik (üniversite, enstitü, derece, dil, şablon kimliği) kaynaktan çıkmaz, girdidir. Yöntem: başlıklar stil adından ("Heading N"/"Başlık N") ya da numarasından ("1.", "2.1."); içindekiler satırları noktalı kılavuz çizgisinden; bölüm başlıkları Türkçe/İngilizce bir sözlükten; sabit sayfalar Word'ün çizdiği tek başına satırdan. Bulamadığı rolü uydurmaz, `missing` olarak listeler ve durur. **Doğrulama (ADÜ Sağlık, elle yazılmış referans profile karşı):** 11/11 rol birebir aynı, bölüm listesi ve sırası aynı, Tier 1 kontrolleri (298 adet) **birebir aynı**; üretilen şablonda iki fark: gözden geçirme tarihi ve özgeçmiş sayfası başlığının alt boşluğu (referans profil o başlığı ölçmemiş; araç kaynaktan ölçüyor, Word çizimiyle teyit edilmeli). Örnek metinler (fixture) bölüm başına en çok 6 paragraf, referanstan biraz farklı; şablonu etkilemez. **İki ADÜ dışı gerçek kaynakla denendi (22.10.2026, rapor (rapor silindi)):** Dokuz Eylül FBE YL (83 KB şablon, 236 kontrol) ve Ege Eğitim YL (101 KB, 322 kontrol), elle profil yazılmadan. İkisinde de ilk denemede araç/üretici takıldı ve toplam 10 genel eksik kapatıldı (başlık düzeyleri stil numarasından değil sıralamadan, içindekiler tablosundan anahat, stil adı bağımsız TOC tespiti, iç kapak, sayfa numarası hizası kaynaktan, içindekiler düzey sayısı kaynaktan, vb.); hiçbiri kuruma özgü değil. **Sınır:** Tier 1 kontrolleri (Word ile) bu iki şablon için çalıştırılmadı ve şablonlar kayıt defterine eklenmedi; yakınsama (bir sonraki kaynakta kaç düzeltme gerekir) üçüncü ve sonraki kaynaklarla ölçülmeli. Ege Fen Bilimleri gibi yalnız kılavuz yayımlayan kurumlar bu hatta girmez.

## Çıktı kalitesi kapısı (22.10.2026)
Motorun üç görevinden biri çıktıyı tutarlı yapmaktır (editör = PDF = Word). Ölçüm yöntemi, bulunan iki neden (tablo satırı sığması, tablo başlığı ve
başlık satırı), sonuçlar ve kalan işler: reports/CIKTI_KALITESI_2026-10-22.md (rapor silindi). Önemli ders: tek bir örnek metindeki
sıfır kayma kalite kanıtı değildir; `parity.mjs --pad N` duyarlılık taraması (aynı içeriği sayfa sonlarına farklı yerde denk getirir) kapının parçası olmalıdır.
Kullanıcı kararı: kalite yeterliyse bu kapı **yeni şablon ekleme hattına** alınır (üret → geçici kaydet → dışa aktar → Word ile karşılaştır → rapor).
Önkoşul: kabul eşiği kullanıcıyla netleşmeli, dipnot ve otomatik liste farkları kapanmalı.
