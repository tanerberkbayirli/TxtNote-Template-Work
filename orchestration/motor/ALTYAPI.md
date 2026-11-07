# Şablon altyapısı

Bu belge tasarım ilkelerini tutar. Eski şablon/test sayıları, geri alınmış geçiş planları ve silinmiş rapor atıfları çıkarılmıştır. Güncel çalışma kuralı [BASLA.md](../BASLA.md), kalan iş [GOREVLER.md](../GOREVLER.md) içindedir.

## Sorumluluklar

- Şablon, kendi resmî kaynağının söylediği değerleri taşıyan düz JSON verisidir. Başka şablondan `extends`/ortak taban yoluyla üniversiteye özgü sayısal gereksinim devralmaz.
- Motor ortak davranışı ve yalnız eksik anahtarlar için nötr varsayılanları sağlar (`engineDefaults.js`). Açık şablon değerini değiştirmez. A4, kenar boşluğu, font ve aralık gibi kurum kuralları kaynak olmadan motor varsayılanı diye dayatılmaz.
- Üniversite kimliğinin kodda kullanılması mutlak yasak veya zorunluluk değildir. Değer farkı veride; gerçek davranış farkı gerekçesiyle ortak motor yolunda çözülür. Belge kimliği/sayfasına özel yama yapılmaz.
- Otomasyon elle işi azaltır; kaynak okuma ve görsel doğrulamayı gereksiz kıldığı iddia edilmez. Hedef model ile uygulanmış davranış birbirinden ayrılır.

## Ortak belge modeli

Şema `engine/src/schema.d.ts`, doğrulama `validation.js` içindedir. Sayfa, paragraf/başlık, tablo/şekil, dipnot, kaynakça, dizin ve özel sayfa kuralları çözümlenmiş modelde birleşir. Editör CSS, DOCX ve PDF bu modeli kullanır. Nadir bayraklar veya yinelenen boşluk yolları temizlenirken mevcut çıktı korunur; bir alan az kullanılıyor diye kaynak izi silinmez.

Yerleşim modeli [LAYOUT.md](LAYOUT.md), anahtar kataloğu [CAPABILITIES.md](CAPABILITIES.md), çıkarım [DOCX_EXTRACTION.md](DOCX_EXTRACTION.md), çıktı kontrolleri [CHECKER.md](CHECKER.md) içindedir.

## Üretim hattı ve araçlar

1. Özgün resmî belge ve güncellik kaydedilir; hash ve XML konumları korunur.
2. `docx2spec.py` çıkarır; `profile-suggest.mjs` kaynak rollerini önerir. Bulunamayan rol insan incelemesine kalır; değer uydurulmaz.
3. `spec2template.mjs`/`template-add.mjs` düz şablon, check, fixture ve menşei kaydı üretir. Şema/JSON kapısı geçmeden yazılmaz. Üretim tek başına kabul değildir.
4. Kayıt ve çıktı yolu incelenir. Çalışan JSON'ların yeri `Butun-Sablonlar/`, wrapper/registry `engine/src/templates/` ve `registry.js`, makine verisi `engine/specs/`/`engine/references/`, bağlam `orchestration/hedefler/` altındadır. Eski araç varsayılanları bu yerleşimin kanıtı değildir.
5. Gerçek editör PDF/DOCX çıktısı ve gerektiğinde Word yeniden sayfalaması ölçülür. Uzun başlık, koşullu ikinci danışman, boş/dolu dizin ve sayfa sonu duyarlılığı ayrı senaryolardır.

Menşei sınıfları: `MEASURED` kaynak gerçeği, `GEOMETRY` doğrulanmış kaynak geometrisi, `GENERATED` üretici/profil kararı. `ENGINE_DEFAULT` motorun eksik anahtarı doldurmasıdır; resmî kaynak kanıtı değildir. Uygulanamayan özellik `UNKNOWN` kalır.

- `engine/tools/kaynak/`: kaynak edinme ve envanter.
- `engine/tools/taslak/`: toplu çıkarım, taslak kurma ve çıktı kapıları.
- `template-add.mjs --write`: yazma etkinleşir; öneri/inceleme ile karıştırılmaz.
- `template-remove.mjs <kimlik> [--write]`: önce silinecek kayıtları ve kalan atıfları inceleyin. Spec/referans/testlerin otomatik temizlendiğini varsaymayın.
- `templates-defaults.mjs`/`templates-reuse.mjs`: ölçüm araçlarıdır; benzerlik tek başına şablon verisi paylaşma veya silme gerekçesi değildir.

## Kalite sınırı

Ortak motor değişikliğinde ilgili regresyon, altın karşılaştırma ve gerekli Word/PDF eşliği çalıştırılır. Bir örnekte aynı sayfa sayısı, bütün içeriklerde uyum değildir. Font, satır kırılımı, açılışlar, dizin hedefleri ve koşullu sayfalar ayrı kontrol edilir. Eksik görsel kontrol açıkça yazılır; kapanış ölçütü değiştirilerek hata kapatılmaz.

Atıf/kaynakça kullanıcı davranışı [uygulama mimarisinde](../uygulama/ARCHITECTURE.md) tutulur; ürün kararları burada ikinci kez tanımlanmaz.
