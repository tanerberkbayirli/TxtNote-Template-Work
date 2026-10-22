# Tez başlığı alanı — 2026-10-10

Kullanıcı kuralı: İngilizce şablonlarda ana başlık için yalnızca bir alan gösterilir;
etiketi “Tez başlığı” olur. Girilen başlık İngilizce kapak ve İngilizce başlık
yer tutucularına gider. Ayrı bir “İngilizce başlık” alanı gösterilmez.

Ana başlık notun `title` alanında saklanır. İngilizce belgelerde derleme sırasında
`THESIS_TITLE` ve `THESIS_TITLE_EN` aynı ana başlığa çözülür. Eski belgelerde ana
başlık boşsa mevcut `THESIS_TITLE_EN` değeri gösterilir ve kullanılır; veri silinmez.
Türkçe şablonlarda ana başlık ve İngilizce çeviri ayrı kalır. İngilizce tezlerde
kaynağın istediği Türkçe ÖZET başlığı ayrıca korunur.

Regresyon: tüm İngilizce şablonların başlık çözümlemesi, eski kayıtlar, Türkçe
şablonların bağımsız çevirisi ve beş İYTE şablonunun gerçek form akışı kontrol edilir.

Doğrulama: 797 test geçti; üretim derlemesi başarılı. Beş İYTE şablonunun gerçek
arayüz akışında tek “Tez başlığı” alanı, ikinci İngilizce alanın yokluğu ve yeniden
açılınca başlığın korunması doğrulandı. Kayıtlar:
`orchestration/validation/iyte/title-fix-tests.log`, `title-fix-build.log`,
`title-fix-ui/report.json`. Önceki İYTE tamamlama kaydı ilk eklemenin tarihsel
doğrulamasıdır; bu not sonraki başlık düzeltmesini kaydeder.
