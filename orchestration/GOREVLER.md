# GOREVLER — açık görevler, hatalar ve notlar (tek yer)

Son derleme: 21.10.2026. Kurallar [BASLA.md](BASLA.md)'dedir. Burada yalnız **hâlâ açık olanlar** durur; kapanan madde silinir, kanıtı `orchestration/raporlar/` altına yazılır.

## Durum
- 20.10.2026: 1130/1130 birim testi ve üretim derlemesi geçti (klasör yeniden düzenlemesinden sonra). E2E tarayıcı testleri ve gerçek Word kontrolleri bu turda çalıştırılmadı.
- 21.10.2026: şablona özel görevler (tek tek şablon farkları, üniversite hedef durumları, MCBÜ SDK şema incelemesi) kullanıcı kararıyla kaldırıldı; ölçümleri (eski rapor silindi) içinde duruyor.
- 22.10.2026: depo üç commit'e düzenlendi; şablonlar düz veri (taban/varyant geri alındı); motor varsayılanları (`page.orientation`, `numbering.sequence`) ve dipnot varsayılanı belgesi düzeltildi; 1133/1133 birim testi ve derleme geçti. `golden`, `parity`, `check --word` ve tarayıcı uçtan uca testleri bu turda çalıştırılmadı.
- 22.10.2026 (çıktı kalitesi): 7 referans şablon editör = Word sayfa sayısı; MCBÜ YL kaymasız (8 yerleşim), düzeltme sonrası hiçbir şablonda kayan sayfa artmadı (AFSÜ 8→2, Tıp 12→2, İYTE 10→8). Birim testleri 1137/1137. Bu turdaki motor değişiklikleri (`pageLayout.js`, `parity.mjs --pad`, `thesisTablePageEnd.test.js`) commit edilmedi. Ayrıntı bölüm 3.
- Kullanıcı kararı (20.10.2026): uygulamada şimdilik dışarıdan `.docx` içe aktarma özelliği olmayacak. İçe aktarmaya bağlı işler aşağıda "Askıda".
- Kullanıcı kararı (22.10.2026, HE-UI-05): tez düzenleyicinin **Dosya** sekmesindeki "Word içe aktar" ve "PDF içe aktar" düğmeleri arayüzde **kalır**. Bu karar yalnız düğmelerin görünürlüğü içindir; "Askıda" bölümündeki içe aktarma uyum işleri ayrıca açılmadıkça askıda kalır.

## Açık hatalar
**Bilinen hataların tamamı tek dosyada: [raporlar/HATA_ENVANTERI_2026-10-22.md](raporlar/HATA_ENVANTERI_2026-10-22.md)** (51 kayıt, `HE-<alan>-<no>`; yeniden üretme, kanıt, kabul ölçütü; düzeltmeyi başkası yapacak). Yeni hata bulunursa o dosyaya aynı biçimde eklenir; burada yalnız bu işaretçi durur. (Önceki "doğrulanmış açık ürün hatası yok" ifadesi geçersizdir: bkz. HE-VB-01…05 veri kaybı.)

## Açık görevler

### 0. Şablon altyapısı (öncelik)
Kullanıcı kararı (21.10.2026): şablona özel denetim ve düzeltme görevleri kaldırıldı; iş **tek altyapı**: şablon = yalnız veri, bütün yerleşim davranışı motorda tek yerde, yeni şablon kod ve elle denetim olmadan eklenir. **Kullanıcı kararı (22.10.2026): varyant yok, motor esas** — şablon tek resmî kaynağın söylediği değerleri taşıyan düz veridir (`extends` yok, ortak taban yok, başka üniversiteden sayı ödünç yok); ortak olan yalnız motor davranışı ve nötr motor varsayılanlarıdır (`engineDefaults.js`). **Kullanıcı kararı (22.10.2026): motorun amacı** binlerce şablonu eklemeyi kolaylaştırmak, çıktıyı tutarlı yapmak ve işleri otomatize etmektir; üniversite adının kodda geçmesi yasak da zorunlu da değildir, hangisi daha iyiyse o seçilir. Mimari, ölçümler ve geçiş sırası: [orchestration/motor/ALTYAPI.md](motor/ALTYAPI.md). Kapılar (her adımda, tüm şablonlarda aynı): `node engine/tools/golden.mjs` (davranış değişmemeli: editör + DOCX birebir), `node engine/tools/parity.mjs` (eski taban dosyası silindi) (Word), `check.mjs --all --word`, birim testleri.
1. ~~Şablonları JSON veriye çevir~~ **tamam (21.10):** 34 şablon `Butun-Sablonlar/Ege/<üniversite>/<kimlik>.json` düz veri (2,7 MB); modüller yalnız veriyi yeniden dışa veren sarmalayıcılar; eski JS kaynakları atıflarıyla `Butun-Sablonlar/Ege/<üniversite>/eski-js/` (yüklenmez). Sıradaki iyileştirme: gömülü base64 logolar (verinin %64'ü) ikili varlık dosyasına.
   ~~Ortak taban ve varyantlar~~ **geri alındı (22.10):** 21.10'daki `thesis-base.json` + `extends` motorun ilkesiyle çelişiyordu (oyla çıkan taban başka üniversitenin sayısını kaynak doğrulaması olmadan taşıyordu). Şablonlar düzleştirildi, `compose.js`/`base/`/`templates-factor.mjs`/`template-encode.mjs`/`templates-to-json.mjs` silindi. Kayıpsız: 34/34 şablon çıktısı bayt bayt aynı, 1131/1131 test, derleme geçti; `test_template_add.mjs` `extends` ve tabanın geri gelmesini sınar. Ayrıntı ALTYAPI.md.
2. **Motor varsayılanları:** ölçüm tamam, ilk dilim uygulandı (22.10, (eski rapor silindi), araç `engine/tools/templates-defaults.mjs`): `engineDefaults.js` artık eksik `page.orientation` (`portrait`) ve tablo/şekil `numbering.sequence` (`arabic`) doldurur; 34 şablon çıktısı 34/34 aynı, 1133/1133 test. %34 değer silinse çıktı değişmez ama toptan silme yapılmaz. Dipnot numaralandırma çelişkisi çözüldü (22.10): varsayılan `"document"`, çok bölümlü ölçümle kanıtlandı, `schema.d.ts` ve iki belge düzeltildi, kod değişmedi. Kalan: kalan dört doğrulama zorunluluğu için varsayılan önerilmez (kaynağın söylediği ya da görünür davranış). Her adım altın + Word kapısıyla. Üniversite gereksinimi olan sayı motora taşınmaz.
3. Tek şema: aynı kavramın yazımlarını teke indir (satır aralığı, boşluk); şemayı kapat.
4. Kaçış kapılarını kaldır (396 nadir ayar yolu): genel kurala ya da değere dönüştür.
5. Boşluk politikalarını tek Word modelinde birleştir; eski DOCX/CSS dallarını sil (A/B aşaması yapıldı, bkz. ALTYAPI.md).
6. Kalan çift kodlu kuralları (sayfa başı, dipnot, sekme/asılı girinti, tablo, özel sayfa) tek modele taşı.
7. Üretim hattı: **ilk dilim tamam (22.10)**, `engine/tools/template-add.mjs`: kaynaktan düz şablon + menşei (`MEASURED/GEOMETRY/GENERATED`, motor varsayılanı ayrı) + veri kapısı; ADÜ ile 0 farklı yeniden üretim. Profil önerisi tamam (22.10, `engine/tools/profile-suggest.mjs`, ADÜ referansına karşı 11/11 rol ve 298/298 kontrol aynı) ve iki ADÜ dışı kaynakla (Dokuz Eylül FBE YL, Ege Eğitim YL) uçtan uca denendi: (eski rapor silindi); şablonlar `Butun-Sablonlar/Ege/<üniversite>/{deu-fbe,ege-egitim}-master-tr-v1.json`, **kayıt defterine eklenmedi, Tier 1 kontrolleri çalıştırılmadı**. Kalan: bu iki şablonun Tier 1 kontrolleri (kayıt + geliştirme sunucusu + Word) ve kayıt kararı; üçüncü kaynakla yakınsama ölçümü; 66 kaynak gerçeği şablon yoluna yerleşsin (üretici `sections[i].overrides…` yolunu kaydetsin); kılavuz-yalnız / PDF-yalnız kaynaklar için ayrı yol; `check.mjs --word` kapısını komuta bağlama; sabit sayfaları anlamlı alanlara dönüştürme kararı (kullanıcı); görseller ikili varlığa; kayıt defteri indeksi şablon üst verisinden üretilsin.

### 1. Gerçek Tauri uygulamasından PDF alma
Gerçek masaüstü uygulamasından PDF hiç alınmadı; Liberation Serif yalnız Rust izin listesi birim testiyle (`cargo test system_fonts`) doğrulandı. Kapanış: uygulamadan MCBÜ şablonuyla PDF alınır, gömülü fontlar ve sayfa sayısı doğrulanır.

### 2. Normal boyutlu tezde yazarken gecikme
Şu ana kadarki ölçümler içe aktarılmış 180 sayfalık belgeye aitti (yükleme ~33 sn) ve sayısal hedef yoktu. Gerçek soru: 80–120 sayfalık MCBÜ tezinde yazarken/biçimlendirirken takılma var mı? Kapanış: sabit makine/font/kod sürümüyle, kullanıcıyla onaylanmış bir bütçe (uydurulmaz), ≥20 gerçek yaz/geri al örneği, medyan/p95; doğruluk ve font beklemesi devre dışı bırakılmaz.

### 3. Çıktı kalitesi: editörde görünen Word'e / PDF'e aynen geçiyor mu?
Ölçüm, düzeltmeler ve kalan işler: orchestration/raporlar/CIKTI_KALITESI_2026-10-22.md (rapor silindi). Araç: `node engine/tools/parity.mjs [--pad N]` (gerçek editör dışa aktarımı + tek Word örneği). Kullanıcı kararı (22.10.2026): önce ölçülür; kalite iyiyse bu kapı motora, yeni şablon ekleme hattına alınır ("engine ile Word/PDF çıktı yapısı bir olacak").
Durum: tablo satırı sığması ve tablo başlık/başlık satırı kuralları düzeltildi; MCBÜ YL duyarlılık taramasında (dolgu 0–7) 3/8 → 0/8 kayan yerleşim; ADÜ 3/8, MCBÜ Tıp 8/8 yerleşimde hâlâ kayıyor (varsayılan metindeki "0 kayma" şans eseriydi).
Açık, önerilen sırayla:
1. **Dipnot:** ADÜ dolgu 2'de Word sayfa altındaki dipnota yer açmak için gövdenin son 2 satırını sonraki sayfaya itiyor, editör itmiyor (28–47 sayfalık kayma, sayfa sayısı bile farklı). Neden bulunmadı.
2. **Otomatik listeler** (içindekiler, şekil/tablo dizini): ~1 pt kayma ve uzun girdinin sayfa numarasının ilk/son satırda olması (`generatedIndex.pageNumberAlignment`).
3. Tıp'ta yatay kayan satır 5 → 7 (düzeltmelerin yan etkisi olabilir); ADÜ dolgu 4 tablo devam sayfası; Tıp dolgu 6 (12 sayfa); İYTE alt başlık + sonraki paragraf; AFSÜ numaralı denklem. Hepsi düzeltme sonrası yeniden doğrulanmalı.
4. `parity.py` `captions.figure` eşleştirme hatası (özet metrikler doğru, ayrıntı bölümü güvenilmez).
5. Kabul eşiği (kaç kayan sayfa kabul): **kullanıcı kararı**, uydurulmaz.
6. Kapıyı `template-add` hattına bağla: şablon üret → geçici kaydet → dışa aktar → Word ile karşılaştır → rapor. Dokuz Eylül ve Ege kayıt defterinde olmadığı için henüz ölçülemedi.
7. Sınırlar kapatılsın: gerçek bir tezle (MCBÜ YL) ölçüm; editör ekranı ↔ PDF bağımsız doğrulaması (`check.mjs`); sabit sayfalar (`check.mjs`); denklem/uzun tablo/metin içi resim içeren gövde.

### 5. Uygulama (TxtNote)
1. **Araştırma turu (MCBÜ Yüksek Lisans tezini yazma simülasyonu):** plan [ARASTIRMA_PLANI.md](ARASTIRMA_PLANI.md) (P1–P18, W1–W10, S0–S16, D1–D8; genel hata taraması da bunun içindedir). **Kullanıcı komut verene kadar başlatılmaz** (örn. `W2'yi yap`).
2. Gerçek uzak arka uç ve cihaz senkronizasyonu (şu an yalnız yerel: Tauri'de SQLite, tarayıcıda IndexedDB; `TxtNote/backend/` boş yer tutucu). *İstek doğrulanmadı.*
3. Hesap/şifreleme (`orchestration/uygulama/AUTH_AND_ENCRYPTION.md`): yalnız belge var, kod yok. *İstek doğrulanmadı.*
4. Faz 5: bileşenlerin kademeli TypeScript'e geçişi (şu an `frontend/src` içinde 1 `.ts`, 328 `.js/.jsx`). *İstek doğrulanmadı.*
5. Yeniden başlatılmayacak (kullanıcı kararı, 8 Ekim): kenar çubuğu ve kabuk kancası çıkarma görevleri.

## Askıda (içe aktarma özelliği olmadığı için)
SRC09/SRC10 uzun Word belgesi içe aktarma uyumu: şekil/grafik eşliği, kaynak koruma, uzun belge performansı, nihai seri kabul. Eski ölçümler (eski rapor silindi) ve `SRC10_S57_S75_2026-10-19.md`. İçe aktarma özelliği geri gelirse yeniden açılır; içe aktarma kodu `engine/src/` içinde duruyor.
