# Yapay zekâ çalışma rehberi

Bu proje için görev, plan, karar, yönerge ve teknik belge merkezi `orchestration/` klasörüdür. Bu rehber tüm proje üzerinde çalışırken başlangıç noktasıdır.

1. Güncel işi anlamak için önce [MISSION.md](MISSION.md) ve [README.md](README.md) okuyun. Geçmiş planları yalnızca ilgili iş gerektirirse açın; tarihsel açık/kapalı durumlar güncel görevin yerine geçmez.
2. Kullanıcının son talimatını esas alın. Önceki mola ve erteleme kayıtları, yeni bir görev için verilen yetkiyi geçersiz kılmaz; ayrı ürün geliştirme işlerini kendiliğinden yeniden başlatmayın.
3. Üretim motoru kökteki `engine/src/` altındadır. `orchestration/engine-work/` deney, araç ve kanıt arşividir; içindeki uygulama kopyalarını üretim koduyla karıştırmayın.
4. Yeni görevleri, planları, kararları, yapay zekâ yönergelerini ve birinci taraf Markdown belgelerini `orchestration/` altında tutun. Motor belgeleri `docs/engine/`, uygulama belgeleri `docs/TxtNote/`, kaynak notları `docs/Butun-Sablonlar/` altındadır.
5. Motor değişikliğinden önce [yetenek kataloğuna](docs/engine/CAPABILITIES.md) ve [motor belgesine](docs/engine/README.md) bakın. İlgili kaynak dosyalarını hedefli okuyun; tüm geçmişi baştan taramayın.
6. Üniversite değerlerini resmî kaynaklarıyla ilişkilendirin. Paylaşılan motor davranışını genel tutun; belirsizlikleri, çelişkileri ve desteklenmeyen özellikleri açık kaydedin.
7. Mevcut kullanıcı değişikliklerini ve özgün PDF/DOCX kaynaklarını koruyun. Taşımalarda bağlantılı klasörlerin içine girmeyin; kaynak ve hedefin proje içinde kaldığını kontrol edin.
8. Değişikliğe uygun testleri ve derlemeyi çalıştırın. Birim testinin geçmesi, Word/PDF yerleşiminin veya tüm ürün kabulünün geçtiği anlamına gelmez. Eski ölçümleri yeni sürümün kanıtı olarak göstermeyin.
9. Doğrulama sonuçlarını `validation/`, çalışma raporlarını `reports/` veya ilgili `engine-work/` işi altında saklayın. Eski kanıt dosyalarının ölçümlerini/hash değerlerini yeni sonuç gibi değiştirmeyin.
10. İş sonunda yapılan değişikliği, çalıştırılan kontrolleri ve açık kalan konuları kısa kaydedin. Kullanıcı istemedikçe commit veya geniş süreç kapatma işlemi yapmayın.

Klasör taşımalarının eşlemesi [relocation-map.json](relocation-map.json) içindedir. Önceki kaynak yollarını içeren kanıt JSON/log dosyaları tarihsel kayıt olarak korunmuştur.
