# GOREVLER — açık görevler, hatalar ve notlar (tek yer)

Son derleme: 21.10.2026. Kurallar [BASLA.md](BASLA.md)'dedir. Burada yalnız **hâlâ açık olanlar** durur; kapanan madde silinir, kanıtı `engine/docs/reports/` altına yazılır.

## Durum
- 20.10.2026: 1130/1130 birim testi ve üretim derlemesi geçti (klasör yeniden düzenlemesinden sonra). E2E tarayıcı testleri ve gerçek Word kontrolleri bu turda çalıştırılmadı.
- 21.10.2026: şablona özel görevler (tek tek şablon farkları, üniversite hedef durumları, MCBÜ SDK şema incelemesi) kullanıcı kararıyla kaldırıldı; ölçümleri `engine/docs/reports/UZUN_BELGE_CIKTI_2026-10-20.md` içinde duruyor.
- Kullanıcı kararı (20.10.2026): uygulamada şimdilik dışarıdan `.docx` içe aktarma özelliği olmayacak. İçe aktarmaya bağlı işler aşağıda "Askıda".

## Açık hatalar
Doğrulanmış açık ürün hatası yok. Yeni hata: `H-<n>` olarak buraya yazın (alan, yeniden üretme adımları, beklenen/gözlenen, etki: P1 veri kaybı · P2 işlev çalışmıyor).

## Açık görevler

### 0. Şablon altyapısı (öncelik)
Kullanıcı kararı (21.10.2026): şablona özel denetim ve düzeltme görevleri kaldırıldı; iş **tek altyapı**: şablon = yalnız veri, bütün yerleşim davranışı motorda tek yerde, yeni şablon kod ve elle denetim olmadan eklenir. **Kullanıcı kararı (22.10.2026): varyant yok, motor esas** — şablon tek resmî kaynağın söylediği değerleri taşıyan düz veridir (`extends` yok, ortak taban yok, başka üniversiteden sayı ödünç yok); ortak olan yalnız motor davranışı ve nötr motor varsayılanlarıdır (`engineDefaults.js`). Mimari, ölçümler ve geçiş sırası: [engine/docs/ALTYAPI.md](../engine/docs/ALTYAPI.md). Kapılar (her adımda, tüm şablonlarda aynı): `node engine/tools/golden.mjs` (davranış değişmemeli: editör + DOCX birebir), `node engine/tools/parity.mjs --baseline engine/docs/reports/parity-baseline-2026-10-21-adim6.json` (Word), `check.mjs --all --word`, birim testleri.
1. ~~Şablonları JSON veriye çevir~~ **tamam (21.10):** 34 şablon `engine/src/templates/data/<kimlik>.json` düz veri (2,7 MB); modüller yalnız veriyi yeniden dışa veren sarmalayıcılar; eski JS kaynakları atıflarıyla `engine/src/templates/legacy-js/` (yüklenmez). Sıradaki iyileştirme: gömülü base64 logolar (verinin %64'ü) ikili varlık dosyasına.
   ~~Ortak taban ve varyantlar~~ **geri alındı (22.10):** 21.10'daki `thesis-base.json` + `extends` motorun ilkesiyle çelişiyordu (oyla çıkan taban başka üniversitenin sayısını kaynak doğrulaması olmadan taşıyordu). Şablonlar düzleştirildi, `compose.js`/`base/`/`templates-factor.mjs`/`template-encode.mjs`/`templates-to-json.mjs` silindi. Kayıpsız: 34/34 şablon çıktısı bayt bayt aynı, 1131/1131 test, derleme geçti; `test_template_add.mjs` `extends` ve tabanın geri gelmesini sınar. Ayrıntı ALTYAPI.md.
2. **Motor varsayılanları:** ölçüm tamam (22.10, `engine/docs/reports/MOTOR_VARSAYILANLARI_2026-10-22.md`, araç `engine/tools/templates-defaults.mjs`): %31 değer silinse çıktı değişmez ama toptan silme yapılmaz; asıl bulgu, doğrulamanın tek değerli 6 yolu zorunlu tutması (kaynak sessizken değer uydurma). Kalan: önce `page.orientation` ve `numbering.sequence` için `engineDefaults.js` doldurması + doğrulamada isteğe bağlı yapma, sonra diğerleri (karar sizde); dipnot numaralandırma varsayılanı belge/kod çelişkisi (`schema.d.ts` ↔ `engine.js`) çok bölümlü probe ile doğrulansın. Her adım altın + Word kapısıyla. Üniversite gereksinimi olan sayı motora taşınmaz.
3. Tek şema: aynı kavramın yazımlarını teke indir (satır aralığı, boşluk); şemayı kapat.
4. Kaçış kapılarını kaldır (396 nadir ayar yolu): genel kurala ya da değere dönüştür.
5. Boşluk politikalarını tek Word modelinde birleştir; eski DOCX/CSS dallarını sil (A/B aşaması yapıldı, bkz. ALTYAPI.md).
6. Kalan çift kodlu kuralları (sayfa başı, dipnot, sekme/asılı girinti, tablo, özel sayfa) tek modele taşı.
7. Üretim hattı: **ilk dilim tamam (22.10)**, `engine/tools/template-add.mjs`: kaynaktan düz şablon + menşei (`MEASURED/GEOMETRY/GENERATED`, motor varsayılanı ayrı) + veri kapısı; ADÜ ile 0 farklı yeniden üretim. Kalan: profil (paragraf indeksleri) otomatik önerilsin; 66 kaynak gerçeği şablon yoluna yerleşsin (üretici `sections[i].overrides…` yolunu kaydetsin); ikinci kaynakla (ADÜ dışı, DOCX) uçtan uca deneme; `check.mjs --word` kapısını komuta bağlama; sabit sayfaları anlamlı alanlara dönüştürme kararı (kullanıcı); görseller ikili varlığa; kayıt defteri indeksi şablon üst verisinden üretilsin.

### 1. Gerçek Tauri uygulamasından PDF alma
Gerçek masaüstü uygulamasından PDF hiç alınmadı; Liberation Serif yalnız Rust izin listesi birim testiyle (`cargo test system_fonts`) doğrulandı. Kapanış: uygulamadan MCBÜ şablonuyla PDF alınır, gömülü fontlar ve sayfa sayısı doğrulanır.

### 2. Normal boyutlu tezde yazarken gecikme
Şu ana kadarki ölçümler içe aktarılmış 180 sayfalık belgeye aitti (yükleme ~33 sn) ve sayısal hedef yoktu. Gerçek soru: 80–120 sayfalık MCBÜ tezinde yazarken/biçimlendirirken takılma var mı? Kapanış: sabit makine/font/kod sürümüyle, kullanıcıyla onaylanmış bir bütçe (uydurulmaz), ≥20 gerçek yaz/geri al örneği, medyan/p95; doğruluk ve font beklemesi devre dışı bırakılmaz.

### 5. Uygulama (TxtNote)
1. **Araştırma turu (MCBÜ Yüksek Lisans tezini yazma simülasyonu):** plan [ARASTIRMA_PLANI.md](ARASTIRMA_PLANI.md) (P1–P18, W1–W10, S0–S16, D1–D8; genel hata taraması da bunun içindedir). **Kullanıcı komut verene kadar başlatılmaz** (örn. `W2'yi yap`).
2. Gerçek uzak arka uç ve cihaz senkronizasyonu (şu an yalnız yerel: Tauri'de SQLite, tarayıcıda IndexedDB; `TxtNote/backend/` boş yer tutucu). *İstek doğrulanmadı.*
3. Hesap/şifreleme (`TxtNote/docs/AUTH_AND_ENCRYPTION.md`): yalnız belge var, kod yok. *İstek doğrulanmadı.*
4. Faz 5: bileşenlerin kademeli TypeScript'e geçişi (şu an `frontend/src` içinde 1 `.ts`, 328 `.js/.jsx`). *İstek doğrulanmadı.*
5. Yeniden başlatılmayacak (kullanıcı kararı, 8 Ekim): kenar çubuğu ve kabuk kancası çıkarma görevleri.

## Askıda (içe aktarma özelliği olmadığı için)
SRC09/SRC10 uzun Word belgesi içe aktarma uyumu: şekil/grafik eşliği, kaynak koruma, uzun belge performansı, nihai seri kabul. Eski ölçümler `engine/docs/reports/SRC09_A1_A2_KAPANIS_2026-10-19.md` ve `SRC10_S57_S75_2026-10-19.md`. İçe aktarma özelliği geri gelirse yeniden açılır; içe aktarma kodu `engine/src/` içinde duruyor.
