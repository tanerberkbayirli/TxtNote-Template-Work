# Tez bilgileri ve başlık alanları

10 Ekim başlık ve metadata kararları burada birleştirilmiştir; eski test sayıları güncel sonuç olarak taşınmamıştır.

## Alan seçimi

`metadataPanel.js`, açık bölümlerin kullandığı yer tutucuları ve metadata bloklarını okur. Şablon tanımında bulunmak, bir alanı panelde istemek için yeterli değildir.

- Kapalı isteğe bağlı bölüme özel alanlar gizlenir; bölüm açılınca görünür.
- Kullanıcı doldurunca etkinleşen ikinci danışman gibi koşullu alanlar erişilebilir kalır.
- Eski/yeni anahtarlar aynı veriyi temsil ediyorsa tek alan gösterilir.
- Üniversite, enstitü, derece ve hesaplanan değerler tekrar sorulmaz.
- Boş gruplar ve belgede kullanılmayan kaynakça/ayar alanları gizlenir. Gizlenen değerler silinmez.
- Belgeye basılmayan metadata için doldurma uyarısı üretilmez; bu kaynak gereksinimlerini değiştirme yetkisi değildir.

## Başlık

Ana başlık notun `title` alanında saklanır. İngilizce şablonlarda tek “Tez başlığı” alanı gösterilir; `THESIS_TITLE` ve `THESIS_TITLE_EN` aynı ana başlığa çözülür. Eski kayıtta ana başlık boşsa mevcut `THESIS_TITLE_EN` kullanılır; veri silinmez. İngilizce tezin kaynağının istediği Türkçe ÖZET başlığı ayrı kalır. Türkçe şablonlarda ana başlık ve İngilizce çeviri bağımsızdır.

## Kontrol

İsteğe bağlı bölüm açma/kapama, koşullu ikinci danışman, eski kayıtlar, yeniden açılışta başlığın korunması ve İngilizce/Türkçe başlık ayrımı denetlenir. Alanı gizlemek veriyi silmemelidir. Komutlar [motor dizininde](../motor/README.md); sağ sütun davranışı [Rehber panelinde](REHBER_PANELI.md).
