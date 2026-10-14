# TxtEngine — Faz 0–2 kapanış raporu

2026-10-04 · Dal: `integrate/aku-mcbu` · Doğrulanan motor checkpoint'i: `8176503db8688ec019a3304da7437ac135f72cbd`.

orchestration/plans/MOTOR.md'de tanımlanan Faz 0–2 **zorunlu tamamlanma kapıları geçti**. Faz 2 B3.1–B3.5 tamamlandı. Önceden açıkça ertelenmiş B3.6/Arial işi ve aşağıdaki sınırlar açık tutuluyor; bütün Word davranışlarının veya bütün üniversite varyantlarının tamamlandığı iddia edilmiyor.

## Kapsam ve önceki fazlar

Durulan `f8df108` checkpoint'inden devam edildi; yarım kalan yararlı kod korundu. İki ajan kullanıldı: dar kapsamlı motor/fixture geliştiricisi ve bağımsız kod/kapı denetçisi. Word dışa aktarımları tek sıra halinde çalıştırıldı.

Faz 0'ın kaynak düzeltmeleri, checker kapısı ve Coğrafya/Matematik kapanışı; Faz 1'in katalog, katalog-senkronizasyon testi ve davranışı koruyan dosya ayrıştırma checkpoint'leri yeniden incelendi. Tarihsel kanıt: [Faz 0–1 raporu](./MOTOR_FAZ0_FAZ1_RAPOR.md). Yeni genel regresyonda Coğrafya 49, Matematik 53 kontrolle iki kez PASS. Bekleyen üniversite varyantları ve kaynak incelemeleri bu motor raporuyla DONE yapılmadı.

## Faz 2'de tamamlanan işler

- B3.1–B3.3: paragraf stilinin kendi terminal satır boşluğu, başlık/şekil/tablo/keep korumaları ve üçten fazla parçaya bölünen dipnotlu paragraflar gerçek çıktı fixture'ıyla doğrulandı. Genişletilmiş pagefit kapısı 205 kontrol.
- Önceki fixture'ın atladığı 23 tablo sonrası satır kontrolü yeniden açıldı. Ham HTML tabloları ortak blok boşluğu kuralına alınarak 1,7–1,8 mm fark giderildi; kontrol örneklerinde en büyük taban çizgisi farkı 0,019 mm. Tolerans 0,25 mm olarak korundu.
- Bağımsız denetçinin bulduğu küçük satır aralığı + dipnot break-stamp asimetrisi düzeltildi. Reserve damgası yakaladığı padding'i yönetiyor; break damgası doğal koruma padding'i ve karşılık gelen negatif boşluğu birlikte koruyor.
- Ek birleşim testi, Word'ün tutulan paragrafı yerinde bırakıp dipnotu bölmesine karşı editörün paragrafı sonraki sayfaya taşıdığını gösterdi. Genel dipnot alanı artık doğal kept-reference bloğunun altında kalan gerçek boşlukla sınırlanıyor. 15 satırlı paragraf aynı sayfada kalıyor; dipnotun 1–49 sözcükleri aynı dört satırda, kalanları sonraki sayfada. Dört taban çizgisinde en büyük fark 0,016 mm. Başlangıç ve devam alanları ayrı checker satırlarıyla ölçülüyor.
- B3.4: pozitif ilk satır girintili mirror paragrafın çift sayfa sarımı modellendi; kaydedilen kaynak HTML'den geçici ölçüm öğeleri çıkarılıyor. Son structure kapısı 130 PASS; parity 146 PASS.
- B3.5: sonsuza uzayabilen sayfalama doğrulama döngüsü sınırlandı; zaman aşımı tanısı animasyon kareleri durduğunda da sonlanıyor. Transient dışa aktarım hatası için en fazla bir yeniden deneme var; tekrarlayan retler hata kalıyor. Son iki tam koşuda yeniden deneme bile gerekmedi. İlk takılmanın tek kök nedeni kesin olarak saptanmış sayılmıyor.
- Word renderer yalnız sahipliği doğrulanmış yeni örneği kapatıyor, PID kaydediyor, senkron repagination yapıyor. Raporlar kod/şartname/çıktı SHA-256 parmak izlerini ve Word sürümü, yazıcı, uyumluluk modu gibi ortam verilerini içeriyor.

Üniversiteye özgü değerler ve doğrulama toleransları değiştirilmedi; yeni davranışlar genel motor düzeltmeleridir.

## Son doğrulama

Değişmeyen `8176503` koduyla `node orchestration/tools/check.mjs --all --word` iki kez çalıştırıldı. Her koşuda **14 hedef: 897 PASS, 3 ertelenmiş FAIL, 17 INFO; 0 SKIPPED, 0 CONFLICT**. On gerçek üniversite hedefi toplam 399 PASS; engine-word-pagefit 205, engine-word-parity 146, engine-word-structure 130, engine-word-justify 17 PASS / 3 FAIL.

Günlüklerde iki koşuya ait toplam 42 gerçek editör PDF/DOCX dışa aktarım denemesinin tümü `status 0`; hata veya retry yok. DOCX'ler gerçek Word ile render edildi. İki toplu komut da bilinen Arial FAIL'leri nedeniyle **çıkış kodu 1** verdi; küresel checker sonucu tümüyle yeşil olarak sunulmuyor.

- [Birinci koşu manifesti](../validation/phase2-close/final-run-1.json): 16:14–16:25, 14 hedef.
- [İkinci koşu manifesti](../validation/phase2-close/final-run-2.json): 16:26–16:35, 14 hedef; iki koşunun export günlük denetimi dahil.
- Son kodda 711 ana frontend testi + 6 ek test, 14 checker testi ve 3 zaman aşımı tanı testi PASS; üretim derlemesi PASS. Derlemenin mevcut büyük chunk uyarısı hata değildir.

Manifestler her hedefin ayrıntılı checker raporunu, rapor hash'ini, çıktı hash'lerini, ölçüm şartnamesi hash'ini, kod revision'ını ve Word ortamını kaydeder. Generated PDF/DOCX ve büyük render klasörleri Git checkpoint'ine alınmadı; tekrar üretilebilir fixture/checker kaynakları ve küçük kapanış kanıtları kaydedildi.

## Açık ve dürüst sınırlar

1. B3.6 ertelenmiş: editörde iki yana yaslı son satırın aralık görünümü ve özel Word justification line breaker. Arial kontrolleri `J03-Arial-10-justify-line-breaks`, `J03-Arial-10-justify-last-line-words`, `J04-Arial-12-justify-line-breaks` hâlâ FAIL. PASS yapılmadı veya tolerans genişletilmedi.
2. Bidi, bölgesel olmayan decimal tab ve adlandırılmış `paragraphStyles` dışında kalan blokların terminal boşluğu UNKNOWN. Firefox/Safari çalıştırılmadı.
3. Yeni dipnot testinde yatay metin/işaret girintisi farkı MEASURED bir sınırlama; yeni kabul satırları dikey konumu ve sayfa/satır sayısını doğrular. Kesin yatay dipnot eşliği iddia edilmiyor.
4. Eski Word render'ında aynı fixture için kaydedilmiş baseline değişimi korunuyor; nedeni UNKNOWN. Mevcut iki temiz koşu bütün ortamlarda deterministik render garantisi değildir.

Bağımsız denetçi kod düzeltmelerini, ayrılmış reserve/break davranışını, dipnot alanı sınırını, kanıt manifestlerini ve zorunlu kapı kapsamını inceledi. Kapanış sonucu, yukarıdaki ertelemeler ve sınırlar korunarak **zorunlu motor kapısı PASS** olarak kaydedilir.

Sonraki motor işi orchestration/plans/MOTOR.md Faz 3'tür. Üniversite kaynak/variant tamamlanma kuyruğu kendi kapılarıyla sürdürülmelidir.
