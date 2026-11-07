# Uygulama mimarisi

## Bileşenler

- `TxtNote/frontend/`: React 19, Vite ve Tailwind arayüzü. `src/app/` kabuk ve ortak durum; `src/features/` editör, şablonlar, notlar, çalışma alanları, zihin haritası, senkronizasyon ve diğer özellikler.
- `TxtNote/src-tauri/`: Tauri 2/Rust masaüstü kabuğu; veritabanı, güvenli saklama, font ve masaüstü dışa aktarım komutları.
- `TxtNote/services/`: servis giriş noktası (`index.ts`); `local/` yerel kalıcılık ve paket/aktarım yardımcıları (`wallet/` cüzdan, `crypto/` şifreleme); `http/` uzak servis için taslak adaptör.
- `TxtNote/types/` paylaşılan veri şekilleri; `TxtNote/scripts/` geliştirme ve sürüm araçları.
- `engine/` ortak belge motoru; `Butun-Sablonlar/` şablon ve kaynak verisi (ikisi de frontend/src altında değildir).

## Veri ve sınırlar

Yerel kalıcılık masaüstünde SQLite, tarayıcıda IndexedDB adaptörleriyle yürür; cüzdan ve şifreleme kodu mevcuttur. `TxtNote/backend/` çalışan bir HTTP sunucusu içermez; `services/http/` dosyası çalışan uzak sunucu kanıtı değildir. Uzak arka uç, hesap hizmeti ve cihazlar arası senkronizasyon tamamlanmış kabul edilmez. Kodun varlığı tüm güvenlik veya kurtarma senaryolarının doğrulandığı anlamına gelmez. Açık işler [GOREVLER.md](../GOREVLER.md)'dedir.

## Metin kutularında seçime özel biçim

Şablon ve kullanıcı metin kutuları (layout `text` öğeleri) düz `text` tutar; kısmi biçim `runs` örtüsüdür: ardışık parçalar (`bold/italic/underline/strike/color/highlight/fontSizePt/fontFamily`), metinleri birleşince `text` ile aynı olmalıdır ([layoutRuns.js](../../engine/src/layoutRuns.js)). Düzenlenen kutuda metin seçiliyken şerit komutları yalnız seçime uygulanır (`interaction.applyInline`), seçim yoksa tüm kutu stilini değiştirir. `runs` yalnız kutunun kendi stilinden farkı saklar (kalın kutuda kalınsızlık `bold:false`). Metin değişip yeni `runs` gelmezse örtü atılır. Editör ve PDF DOM'daki satır içi stilleri okur; Word `docx/specialPages.js` ile aynı run'ları yazar. Düzenleme sırasında seçim, tarayıcıya bırakılır (kutu içi pointerdown/dblclick yakalanmaz) ve yeniden çizimde metin karakter ofsetiyle geri yüklenir.

## Atıf ve kaynakça

Tek veri, üç çizim. Kaynak havuzu `thesis.sources` (yazar, yıl, başlık, yayın…; `entryOverride` = elle düzeltilmiş künye). Metindeki atıf yalnız hangi kaynağı ve hangi sayfayı gösterdiğini saklar (`<span class="thesis-cite" data-cite-id data-cite-key data-cite-locator>`); görünen etiket sunumdur, kayda yazılmaz (`storedCitationHtml`, `engine/src/citations.js`).
| Mod | Metinde | Konum | Kaynakça sırası |
|---|---|---|---|
| Parantezli | `(Yılmaz, 2026, s. 45)` | cümle sonu, noktadan önce | yazar soyadı A→Z |
| Dipnotlu | üst simge `¹`, sayfa altında `Yılmaz, 2026, s. 45.` (mevcut dipnot düzeni, Word dipnotu) | cümle sonu, noktadan sonra | yazar soyadı A→Z |
| Numaralı | `(1)` | noktadan önce | ilk atıf sırası |
- Varsayılan mod şablonun `bibliography.citationStyle` değerinden gelir; kullanıcı Başvurular sekmesinden ya da kaynak panelinden tek tıkla değiştirir (`thesis.citationMode`). Atıf kayıtta tek konumda (noktadan hemen önce, boşluksuz) durur; çizim moda göre yerleştirir, mod değişimi metni yeniden yazmaz.
- Kaynakça her derlemede türetilir: metinde atfı olan havuz kaynakları, kaynak başına bir künye. Son atfı silinen kaynak listeden düşer, atıf eklenen kaynak girer. Kaynak bilgisi değişince bütün atıflar ve künye birlikte güncellenir. Havuzdan silinen kaynağın atıfları metinden de silinir.
- Elle düzeltme: kaynak panelinde "Künyeyi elle düzenle" ya da kaynakça sayfasında künyeye çift tıklama. Yalnız künye metni değişir; bağ kaynak kimliğindedir, eşitleme sürer. "Şablon biçimine dön" elle metni kaldırır.
- Eski düz satırlar (`docBibliographyItems`) bağlantısız olarak listenin sonunda kalır; panelde "Havuza bağla" ile kaynağa dönüşür (metni elle düzeltilmiş künye olarak korunur).
- Noktalama (parantezli): nokta her zaman kapanan parantezin hemen sağında: `… bulunur (Falanca, 2026, s. 42).` Atıftan önce yazılmış nokta (boşluklu ya da kalın/italik içinde) kayıtta atfın sağına alınır; noktasız cümleye eklenen atıftan sonra nokta konur.
- Kaynak formu türe göre alan gösterir (`SOURCE_KIND_FIELDS`, `citations.js`): ortak Yazar(lar), Yıl, Başlık ve en altta isteğe bağlı URL/DOI; Kitap: Yayınevi; Makale: Dergi adı, Cilt, Sayı, Sayfa aralığı; Tez: Tez türü, Üniversite adı; Web sayfası: Web sitesi adı (DOI yok); Kitap bölümü ve Rapor da kendi alanlarıyla. Tür değişince önceki türün kendi alanları boşalır; kayıtta (`normalizeSource`) türe ait olmayan alan saklanmaz.
- Tez kaynağı: formda "Tez türü" (Yüksek Lisans / Doktora, `thesisType`); künyede yalnız seçilen tür yazılır: `[Yayımlanmamış yüksek lisans tezi]` ya da `[Yayımlanmamış doktora tezi]` (türü kaydedilmemiş eski kayıt: `[Yayımlanmamış tez]`).
- Ayrıntılı künye biçimi APA 7 (`engine/src/apa7.js`). Sınırlar: kurumsal yazar, çeviri, "a.g.e./ibid", aynı yazarın ardışık dipnotlarında kısaltma ve şablona özgü künye biçimleri (ör. İSNAD) yok; bunlar `entryOverride` ile elle düzeltilir.
- Sınav: `engine/src/citations.test.js` (eşitleme, sıralama, üç mod, Word dipnotu, elle künye, konum), `TxtNote/frontend/src/lib/citationPlacement.test.js` (cümle sonu).
