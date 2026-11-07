# Başlangıç

Düzenleme: 26 Ekim 2026. Bu dosya çalışma kurallarının tek giriş noktasıdır.

## Okuma sırası

1. Bu dosya ve [bilinen değerlendirme hataları](AGENTS-RAPOR.md).
2. [Açık işler](GOREVLER.md): yalnız verilen işle ilgili madde.
3. İşe göre [uygulama](prompts/GOREV_YAP.md), [doğrulama](prompts/DOGRULA.md) veya [kaynak inceleme](prompts/KAYNAK_INCELE.md) yöntemi.
4. Yalnız gereken teknik belge ve hedef kaydı; bütün geçmişi okumayın.

## Bilginin yeri ve yetkisi

- Kullanıcının güncel talimatı önceki proje kararlarından önce gelir. Belgeler yeni iş, commit, push, paketleme veya yayınlama yetkisi vermez.
- [KATI_KURALLAR.md](KATI_KURALLAR.md): dosya yerleşimi. [GOREVLER.md](GOREVLER.md): açık işler. [AGENTS-RAPOR.md](AGENTS-RAPOR.md): tekrar edilmeyecek değerlendirme hataları; görev listesi değildir.
- [Motor](motor/README.md): mimari, araçlar ve komutlar. [Uygulama](uygulama/README.md): ürün davranışları. [Hedefler](hedefler/README.md): hedef bağlamı. [Kaynaklar](sablon-kaynaklari/README.md): üniversite künyeleri. [Raporlar](raporlar/README.md): tarihli sonuçlar.
- Tarihli rapor, test sayısı ve eski “current/latest” kaydı bugünkü duruma kanıt değildir. Sonraki raporun kapattığı bulgu açık iş diye tekrarlanmaz. Kanıt yetersizse “yeniden doğrulanmalı” denir.

## Çalışma kuralları

1. **Kapsam:** editörün biçim becerisi incelenirken kullanıcının bilinçli unvan, cümle veya bölüm sayısı tercihini hata saymayın. İçeriği izinsiz değiştirmeyin; kaynakta olmayan teslim engeli eklemeyin.
2. **Kaynak:** güncellik araştırılıyorsa canlı resmî kaynağa bakın. Güncel kaynak eskiden; aynı kılavuzdaki açık kural örnek geometrisinden; bölüme özgü talimat genel kuraldan önce gelir. Ayrı resmî Word şablonu ile kılavuz aynı güncellikteyse şablon XML'i esas alınır. Çelişkinin iki tarafını ve gerekçeyi kaydedin. Kullanıcının açık farklı kararı varsa uygulayın; kaynak kuralı olduğunu iddia etmeyin. Rutin çelişkide kendiliğinden onay engeli üretmeyin.
3. **Ölçüm:** bildirilen hatayı gerçek dosya/kodda doğrulayın. Doğru mevcut değer “korundu” diye raporlanır. Şablon düz veridir; başka üniversiteden doğrulanmamış değer alınmaz.
4. **Kontrol:** değişikliğe uygun testleri çalıştırın. Yerleşim değiştiyse gerçek editör çıktısı ve görsel kontrol gerekir. XML, PDF ve Word'ün yeniden sayfaladığı görünüm ayrı kanıtlardır. Kendi kontrolünüz bağımsız doğrulama değildir; bu sıra başka ajan veya görev başlatma talimatı vermez.
5. **Kanıt sınırı:** tolerans ölçüm gürültüsüdür (varsayılan en çok 0,5 mm); geçsin diye büyütülmez. İkame font tam uygunluk değildir. Eksik render veya tamamlanmayan aktarım belirtilir. Örnek testlerden bütün çıktılara ya da enstitü kabulüne garanti çıkarılmaz.
6. **Koruma:** mevcut kullanıcı değişiklikleri, özgün resmî belgeler ve içerik korunur. Belge kimliği/sayfa numarasıyla özel çözüm, içerik budama veya eşik gevşetme yapılmaz. Üniversiteye özgü davranış gerekiyorsa kaynak ve gerekçe yazılır.
7. **Araçlar:** Word yalnız araca ait PID, zaman aşımı ve finally/Quit ile çalıştırılır; kullanıcının Word süreçleri kapatılmaz. Temizlikte kaldırılan kayıtlar geri alınabilir yedekle korunur.
8. **Kapanış:** değişiklik, kontrol sonucu ve sınırları kısa yazın. Açık işi GOREVLER'e, ölçümü tarihli rapora bağlayın. Yalnız belge değişikliği için ilgisiz uygulama testleri veya derleme çalıştırmayın.

## Korunan ürün kararları

- Görünen şablonlar Ege bölgesiyle sınırlıdır; diğer bölgelerin kaynakları silinmez (`engine/src/templates/hidden.js`). Sabit şablon sayıları esas alınmaz.
- İçe aktarma kabul çalışmaları askıdadır; Word/PDF içe aktarma düğmeleri görünür kalır. Düğmenin görünmesi SRC09/SRC10 kabul işlerini yeniden açmaz.
- Sağ sütun sırası: İçindekiler → Tez bilgileri (kapalı “Sayfa ayarı”) → Kaynaklar → Yazım planı → Rehber. Aynı anda tek panel açılır; eski yan çekmece geri getirilmez.
- Şablon/içindekiler işinde [İçindekiler paneli](uygulama/ICINDEKILER_PANELI.md), metadata işinde [Tez bilgileri](uygulama/TEZ_BILGILERI.md), rehber işinde [Rehber paneli](uygulama/REHBER_PANELI.md) okunur. Kararlaştırılmış davranışlar yeniden sorulmaz. Otomatik dizin ile kullanıcının elle girdiği dizin ayrı çıktı kurallarına sahiptir.
