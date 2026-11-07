# Dosya yerleşimi

Yapay zekâya yönelik bütün talimat, plan, görev, açıklama ve raporlar yalnız `orchestration/` altında tutulur. Kök dizinde veya başka klasörlerde ikinci kopya/yönlendirme notu oluşturulmaz.

- Kök: başlangıç, yerleşim kuralı, açık işler ve bilinen değerlendirme hataları.
- `prompts/`: çalışma yöntemleri ve isteğe bağlı araştırma senaryoları.
- `motor/`, `uygulama/`: teknik başvuru ve ürün kararları.
- `hedefler/`: hedefe özgü bağlam; geçmiş kayıtlar güncel kabul sonucu değildir.
- `sablon-kaynaklari/`: üniversite künyeleri; özgün belgeler `Butun-Sablonlar/` altında kalır.
- `raporlar/`: tarihli ölçüm sonuçları. Ham görsel/JSON/log/çıktı kanıtı ve temizlik yedekleri `.test-tmp/validation/<iş>-<tarih>/` altında tutulur.

Uygulama kodu, ham kaynak verisi, test girdileri ve üçüncü taraf lisansları bu bilgilendirme kuralının kapsamında değildir. Taşınan belgelerin bağlantıları güncellenir; özgün kaynaklar sadeleştirme için silinmez. Çalışma kuralları [BASLA.md](BASLA.md) içindedir.
