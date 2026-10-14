# Görev 01 — Sabit kabul kümesi

**TAMAMLANDI · 08.10.2026**

Görev 02–13 için kullanılacak belgeler, kaynak içerik/özellik konumları, Word/PDF görsel referansları ve sentetik sınır örnekleri sabitlendi. Kullanıcıdan ek dosya gerekmiyor. Bu kapanış referans hazırlığına aittir; motorun içe/dışa aktarım uygunluğunun geçtiğini belirtmez. Görev 02 başlatılmadı.

## Güncel kayıtlar

- `acceptance-v3.json`: geçerli, SHA256 ile sabit kabul sözleşmesi; 14 belge ve 5 mevcut sentetik regresyon grubu.
- `acceptance-verification.json`: **PASS**, 157 dosya başvurusu doğrulandı; Görev 02–13 eşlemelerinin tamamı ve ayrılmış belge sınırları kontrol edildi.
- `references/<ID>/`: kaynak Word PDF’leri, Word özellik konumları, tam yerel XML özellik indeksleri ve fiziksel PDF sayfa indeksleri. Özgün PDF kaynakları sözleşmede doğrudan gösterilir.
- `visual-review.json`: 17 sentetik sayfanın tamamının ve 11 kaynak için 66 temsili sayfanın görsel inceleme kaydı. Kaynakların tüm sayfalarının görsel uygunluğu iddia edilmez; tam PDF referansları saklanır.
- `validation-protocol.json`: sonraki görevlerde performans, ortam ve gerçek kullanıcı etkileşimi ölçümlerinin uygulanma yöntemi.

## Seçilen kaynaklar

11 özgün kaynak TR/EN, yüksek lisans/doktora/uzmanlık ve fen/sosyal/sağlık kapsamını temsil eder. AKÜ fen ve sosyal, ADÜ sağlık, AFSÜ yüksek lisans/doktora, MCBÜ uzmanlık kılavuzu, DEÜ İngilizce yüksek lisans/doktora ve Yaşar Türkçe/İngilizce/hukuk şablonları seçilmiştir. Kılavuz ve boş şablonların rolleri dolu araştırma örneğinden ayrı kaydedilir.

Yaşar Türkçe belgesi 180 fiziksel Word PDF sayfasıyla uzun belge geliştirme girdisidir (SRC09). Yaşar İngilizce belgesi 91 sayfadır (SRC10). Bunlar gerçek araştırma içeriği taşıyan resmi şablonlardır; arşive teslim edilmiş eksiksiz tez oldukları doğrulanmış değildir. Her alan/derece birleşimi için dolu tez bulunduğu iddia edilmez.

**SRC08 (DEÜ İngilizce doktora) ve SRC10 (Yaşar İngilizce uzun örnek), Görev 13 son kabulü için ayrılmıştır.** Görev 02–12 geliştirme eşlemelerine dahil değildir; motor bu belgelere göre ayarlanmaz.

SRC11 hukuk şablonunda önceden mevcut bozuk yer imi hedefleri vardır. Aynı Word oturumunda istatistik sayımı 21, dışa aktarılan PDF 23 sayfadır; PDF eksik yer imi hata metinlerini gösterir. Kaynak düzeltilmeden korunmuştur ve açıkça negatif kontrol olarak işaretlenmiştir. Önbellek alan konumları geometri başarısı için referans alınmaz; geçerli alan/geometri kontrolleri SRC01 ve EDGE_STRUCTURE üzerinden yürütülür.

## Yeni sınır girdileri

- `inputs/edge-native-structure-final.docx` (EDGE_STRUCTURE): 11 sayfa; uzun kapak, iki danışman/beş jüri, kalıtılmış/doğrudan biçimler, listeler, canlı REF/PAGEREF ve yer imi, 47 satırlı tekrarlanan başlıklı tablo, yatay/dikey birleştirme ve iç içe tablo, dört yerel OMML denklem (matris/integral/vektör dahil), satır içi/ankorlu/kırpılmış görseller, yatay bölüm ve numara yeniden başlatma, sonnot. Word’ün ürettiği boş 10. sayfa ve sayfa sınırında bölünen tablo satırları gözlenen kaynak davranışı olarak korunur.
- `inputs/edge-long-notes-final.docx` (EDGE_NOTES): 3 sayfa; 40 paragrafı üç sayfaya yayılan gerçek yerel dipnot. Devam sayfaları PDF işaretlerinden doğrulanır; Word not hikayesi aralıklarının uç sayfaları fiziksel yayılım sayılmaz.
- `inputs/edge-synthetic-scans-final.pdf` (EDGE_SCAN): metin katmanı olmayan üç görüntü sayfası; normal metin, düşük çözünürlüklü gri tablo ve döndürülmüş denklem. `scan-ground-truth-final.json` kaynak sayfa, metin/kutu, çözünürlük ve dönüş bilgisini kaydeder. Gerçek taranmış tez olduğu iddia edilmez; OCR başarısı Görev 04’te ölçülür.

İki yeni DOCX, OpenXML SDK doğrulamasında **PASS / 0 hata** aldı. Bağımsız Word referansları üretildi; 14 yerel belge sayfası ve üç tarama sayfası görsel olarak incelendi. Mevcut beş regresyon grubunun değerleri ve toleransları korundu; J03/J04 dahil önceki FAIL/UNKNOWN sonuçları başarıya çevrilmedi.

## Yeniden doğrulama

Proje kökünden, `pdfmeasure.py` bağımlılıklarını kullanabilen Python ile:

```powershell
python orchestration/engine-work/close_mission01.py
# Eski giriş noktası da güncel sözleşmeyi doğrular:
python orchestration/engine-work/prepare_mission01.py
```

`--freeze` yalnızca ilk sabitleme içindir; mevcut sözleşmeyi yeniden yazmayı reddeder. Dosya değişiklikleri SHA256 kontrolünü bozar; yeni referans gerekiyorsa sürümlü bir sözleşme oluşturulmalıdır. Kurulu ortamda kullanılan Python: `C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`.

Kaynak PDF üretimi kurulu Word 16.0.20430 ile, kaynaklar salt okunur açılarak yapıldı. Paketli `render_docx.py` denendi ancak `soffice.exe` bulunmadığından kullanılamadı; sayfa görselleri Word PDF’lerinden PyMuPDF ile üretildi. LibreOffice eşdeğerliği iddia edilmez. Font dosyası kimlikleri ve ortam bilgisi sözleşmede kayıtlıdır.

## Geçmiş ve kapsam

198 yerel PDF/DOCX envanteri, yedi arşiv incelemesi ve dolu içerik incelemesi sırasıyla `source-inventory.json`, `archive-review.json`, `content-review.json` içindedir. `corpus.json`, `reference-index.json` ve `corpus-review-v2.json` geçmiş kayıt olarak korunur; eski kısmi durumlar ve kapsamı aşan ek koşullar güncel kabul sözleşmesinin yerine geçmez.

Motor geliştirmesi, OCR uygulaması, uzun belge sürelerinin ölçülmesi/iyileştirilmesi ve nihai Word eşliği ilgili sonraki görevlerin işidir. Görev 01’in kendi kabul koşullarında açık iş kalmadı.
