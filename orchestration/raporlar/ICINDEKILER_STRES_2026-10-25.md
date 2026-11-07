# İçindekiler paneli stres testi ve düzeltmeler

Kapsam: MCBÜ, AKÜ, AFSÜ ortak paneli; kullanıcının çelişkili başlık/sayfa örneği ve ek uç durumlar. Bu rapor kendi geliştirme/regresyon kontrolüdür; bağımsız üçüncü taraf doğrulaması veya tüm tez kurallarının yeniden araştırılması değildir.

## Korunan karar

`2 → 10`, `2.1 → 20`, `3 → 15` girilince sıra `2 → 10`, `3 → 15`, `2.1 → 20` olur. Girilen numara ve sayfalar aynen kalır. Bu örnek düzeltme öncesinde de geçti; numara sırası ile sayfa sırasının uyuşmaması tek başına çökme/otomatik yeniden numaralama gerekçesi yapılmadı.

## Yeniden üretilen ve düzeltilen sorunlar

İlk altı stres testinde örnek geçti, beş test başarısız oldu:

1. Büyük normal sayılar `Number` hassasiyeti/Infinity nedeniyle yanlış veya eşit sıralanıyordu. Baştaki sıfırlar hariç uzunluk ve rakam dizisi karşılaştırmasıyla tam sıralanıyor.
2. Word'den alınan `Ⅱ`, `Ⅸ`, tam genişlikli sayılar geçersiz sayılıp sona gidiyordu. Karşılaştırmada NFKC normalleştirmesi eklendi; görüntülenen/saklanan etiket değiştirilmedi. Gezinme de aynı ortak sayfa anahtarını kullanıyor.
3. Çok satırlı başlıkta numara ayırıcı regex satır sonundan sonrasını eşleştirmeyince hiyerarşi kayboluyordu. Tam metin korunarak ayrıştırılıyor.
4. Yinelenen veya kimliksiz eski satırlar aynı hedefi paylaşabiliyor, sıralanınca kimliksiz satırın hedefi değişebiliyordu. Sıralamadan önce kararlı ve benzersiz kimlik onarımı eklendi; geçerli başka kimlikler çalınmıyor. Panel ve motor aynı onarımı kullanıyor.
5. Kısmi kayıt (`null` satır, `rows: null`, dizi olmayan veri) editörü çökertebiliyordu. Kayıt sınırında güvenli normalleştirme eklendi; sıfır değerleri ve raw metin boşlukları korunuyor.

Ek sertleştirme: destek haritasında kalıtılmış `__proto__`/`constructor` anahtarları panel açamıyor. Çok uzun numara/sayfa panelde sınırlı genişlikte kırılıyor. Yeni bir zorunlu alan, onay, “Uygula” veya ayrıntı kontrolü eklenmedi.

## Çalıştırılan kontroller

- `node --test engine/src/manualToc.test.js engine/src/manualTocStress.test.js engine/src/presentationLayout.test.js engine/src/layoutOutput.test.js`: **60/60 PASS**. Kayıt: `.test-tmp/validation/icindekiler-stres-20261025/tests.log`.
- Stres dosyasındaki 13 test; tüm 1–3999 Roma sayfaları, 5.000 deterministik ekleme/düzenleme/boşaltma/silme işlemi, sıra/kimlik/girdi koruması, derleme ve Word çıktısı. 5.000 işlem, 5.000 ayrı test dosyası değildir.
- Üretim derlemesi: başarılı; `.test-tmp/mcbu-contents/stress-build.log`. Mevcut paket boyutu/tarayıcı dışsallaştırma uyarıları sürüyor.
- Gerçek editör: çelişkili üç satır; ilk satırı sona taşıyıp yeniden odaklamadan sayı yazma; Unicode `Ⅱ` girme, öne sıralanma ve basılı II sayfasına gezinme; kısmi/yinelenen kimlikli belgeyi açma; aynı eski kimlikli A satırını silip B satırının korunduğunu doğrulama. Geliştirme fixture'ı `tests/mcbu-contents-review.html?stress=1` ve `?stress=damaged` ile tekrar üretilebilir.
- Gerçek editörden MCBÜ/AKÜ/AFSÜ PDF ve DOCX dışa aktarımı başarılı. Her DOCX yalnız araca ait ayrı Word örneğiyle sırayla PDF'e çevrildi. Altı çıktının içindekilerinde `2 / 10`, `3 / 15`, `2.1 / 20` sırası korundu. Word sayfa görüntüleri incelendi. Toplam sayfalar sırasıyla 13 / 12 / 15; eşit toplam tek başına uygunluk iddiası değildir.
- Çıktı ve örnekler: `.test-tmp/validation/icindekiler-stres-20261025/{mcbu,aku,afsu}.{json,pdf,docx,word.pdf}`; metin/sıra kontrol özeti `outputs-verified.json`, sayfa görselleri `*-pdf-page.png` ve `*-word-page.png`.
- Son örnek ekranı: `icindekiler-stres-20261025/panel.png`.

Sınır: bu tur tüm uygulama/motor testlerinin tamamı, bütün belge uzunlukları veya başka üniversiteler için kabul değildir. Yeni hata bulunmayacağının garantisi verilmez. Bu turda yeniden üretilen beş hata düzeltildi ve kapsamına uygun regresyonlar geçti. Kullanıcı deneyimi ve yeni şablon bağlama rehberi de güncellendi.
