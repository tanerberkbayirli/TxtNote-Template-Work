# Hata envanteri — TxtNote + şablon motoru (22.10.2026)

> Bu belge **başkasına devredilmek üzere** yazıldı. Düzeltmeyi yapacak kişi bu konuşmayı, önceki oturumları ya da başka bir belgeyi görmeden bu dosyayla çalışabilmelidir. Bu belgeyi hazırlarken hiçbir hata düzeltilmedi; yalnız bulundu, ölçüldü ve yazıldı.

## 0. Nasıl okunur

### 0.1 Kapsam (kullanıcı kararı)
- **Yalnız mühendislik hataları:** yanlış çıktı, çalışmayan işlev, veri kaybı riski, bozuk test/kapı, bozuk derleme/dağıtım, belge-kod uyumsuzluğu. Ürün/kullanılabilirlik araştırması (araştırma planı P/W/S/D başlıkları) **yapılmadı**.
- **Şifreleme ve anahtar saklama koduna bakılmadı:** `TxtNote/services/crypto/`, `TxtNote/services/wallet/`, `TxtNote/services/local/{encryptedDbExport,encryptedPackage,blindRelay,dbOwner}.js`, `TxtNote/src-tauri/src/secure_store.rs`, kayıt sayfasındaki anahtar türetme/cüzdan akışı (`TxtNote/frontend/src/features/auth/RegisterPage.tsx`) incelenmedi; bunların testleri **çalıştırılmadı** (tek istisna: `cargo test --lib` tüm Rust birim testlerini birlikte çalıştırdığı için `secure_store::tests::native_store_survives_reopening_entry` de koştu ve çıktıda `ok` olarak göründü; testin ya da `secure_store.rs`'in kodu okunmadı). Sınırın kenarında okunanlar (dürüstlük için): `App.jsx`'te `bootstrapWallet/unlockVault` **çağrı yerleri** ve hata dalı, `services/local/index.ts` içindeki `isVaultReady()`/`seal*` **çağrıları** (gövdeleri okunmadı), `RegisterPage.tsx`'te yazı tipi/CDN yükleme satırları ve `TODO` işaretleri; bunların hiçbirinin anahtar/şifreleme mantığına girilmedi. Bu alanlarla ilgili hiçbir bulgu bu belgede yoktur yokluğu "sorun yok" demek değildir.
- **Derinlik tam:** kod incelemesi + 34 kayıtlı şablonun hepsinde gerçek Word ölçümü + 2 kayıtsız şablonda (Dokuz Eylül, Ege) ek ölçüm.

### 0.2 Hangi kod sürümü?
- Taban: `main` dalı, commit `268892af` (`Update thesis editor UI, system font lookup and editor tests`).
- **Üstüne işlenmemiş çalışma ağacı:** bu belgedeki bütün ölçümler, HEAD'in üstüne aşağıdakilerin eklendiği **commit edilmemiş** çalışma ağacında yapıldı (kullanıcı bunları ayrıca commit edecek):
  1. Depo yeniden düzeni: şablon verisi `engine/src/templates/data/*.json` → `Butun-Sablonlar/Ege/<üniversite>/<kimlik>.json` (+ `Butun-Sablonlar/Genel/generic.json`), eski şablon JS kaynakları `Butun-Sablonlar/**/eski-js/`; bütün not/rapor/belge dosyaları `engine/docs`, `TxtNote/docs`, `engine/reports`, `Butun-Sablonlar/**/{KAYNAK,README,metadata}` → `orchestration/` altına taşındı (yaklaşık 340 yeniden adlandırma).
  2. `engine/src/pageLayout.js` (tablo satırı alt dolgusu/çizgisi payı, başlık satırı/açıklama `break-after:avoid`), `engine/src/engineDefaults.js`, `engine/src/schema.d.ts`, `engine/tools/{parity,template-add,spec2template,templates-defaults,templates-reuse,check}.mjs`, `engine/tools/profile-suggest.mjs` (yeni) ve bunların testleri, `TxtNote/frontend/vite.config.js`.
  3. İki yeni, kayıt defterine **eklenmemiş** şablon (Dokuz Eylül FBE YL, Ege Eğitim Bil. YL) ve `engine/specs`, `engine/references` altındaki girdileri.
- Taban commit'e karşı da kontrol edilen yerde (e2e testleri) bu belge "HEAD'de de aynı" diye belirtir. Düzeltmeye başlamadan önce bu çalışma ağacının commit edilmiş olması beklenir.

### 0.3 Her kaydın alanları
`ID` · **önem** · **durum** · alan · yeniden üretme · beklenen / gözlenen · kanıt · ipucu · kabul ölçütü.

**Önem ölçeği** (GOREVLER.md ile aynı, bir sınıf eklendi):
- **P1** veri kaybı (kalıcı ya da sessiz)
- **P2** işlev çalışmıyor / dışa aktarma engelleniyor / kapı (test) güvenilmez
- **P3** yanlış çıktı (editör ≠ Word/PDF, yanlış metin/sayı)
- **P4** görünüş, bakım, belge, düzen

**Durum etiketleri** (kanıt düzeyi):
- **DOĞRULANDI** — bu turda komutla çalıştırıldı, çıktısı aşağıda.
- **KOD OKUMA** — kod satırı okunarak çıkarıldı; çalıştırılarak kanıtlanmadı. Düzeltmeden önce yeniden üretmek gerekir.
- **BELGEDEN** — projenin kendi belgesinde "açık" yazıyor; bu turda yeniden doğrulanmadı.

**Silinen eski raporlar:** bu belgede adı geçen `CIKTI_KALITESI_2026-10-22.md`, `IKI_KAYNAK_DENEMESI_2026-10-22.md`, `MOTOR_VARSAYILANLARI_2026-10-22.md` vb. önceki raporlar 22.10.2026'da `orchestration/raporlar/`dan silindi; gerekirse taban commit `268892af`'ta `engine/docs/reports/` altında durur (`git show 268892af:engine/docs/reports/<dosya>`).

**Önemli:** Hiçbir ölçüm eşiği (kaç sayfa kayması kabul) uydurulmadı; "kabul eşiği" kullanıcı kararıdır.

### 0.4 Sayılarla genel durum (bu tur)
| Kontrol | Sonuç |
|---|---|
| Frontend + motor birim testleri | **1137/1137 geçti** (0 atlanan) |
| Motor araç testleri (`engine/tools/test_*.mjs`, 5 dosya) | 24/24 geçti |
| Python testleri (`test_conformance.py` 43, `test_docx2spec.py` 8) | 51/51 geçti |
| Üretim derlemesi (`vite build`) | geçti (8 sn) |
| Rust (`cargo test --lib`) | 22/22 geçti; `cargo clippy` 8 biçim uyarısı (7 kütüphane + 1 test) |
| Word eşliği, 34 kayıtlı şablon, örnek metin (dolgu 0) | sayfa sayısı 30/34'te eşit; **15** şablonda kayan sayfa 0, **24**'ünde ≤ 2; **5 kayıtta ciddi sapma**: AKÜ Sağlık ×2 (60/61 sayfa, 58 kayan), AKÜ Kimya (57/58, 56 kayan), AKÜ Felsefe lisans (21 kayan) ve seminer (43/44, 38 kayan) |
| Duyarlılık taraması (dolgu 0/2/4/6; 136 Word çizimi) | yalnız **13/34** şablon dört yerleşimde de sayfa sayısı eşit ve kayan sayfa ≤ 2; dolgu 6'da 9 şablonda sayfa sayısı farklı (İYTE EEE dolgu 4'te 45/55) |
| Kayıtsız iki şablon (Dokuz Eylül FBE, Ege Eğitim) | DEÜ 52/62 sayfa, 45 kayan; Ege 49/49 ama 318 satır yatayda kayık (bkz. HE-EW-04/05) |
| Kaynak-temelli kontroller (`check.mjs --all --word`, 26 hedef) | 2201 PASS, **3 FAIL** (`afsu-lee` ×2, `aku-isg`); DEÜ FBE FAIL=17/242, Ege FAIL=133/328 (kayıtsız) |
| Dışa aktarılan 34 DOCX için Open XML şema doğrulaması | **34/34 başarısız** (her birinde aynı 1 hata, bkz. HE-DX-01) |
| Yazarken gecikme (editör, 76 sayfa, Chrome başsız) | medyan 65 ms, p95 90–123 ms, her tuşta 100–230 ms uzun görev; 34 sayfada medyan 41 ms (§2.7) |
| Yeni resmî kaynaklarla şablon üretim hattı | 6 yeni kaynaktan **1'i** otomatik şablon üretti (`NEEDS A PERSON` 5) (HE-SB-05) |
| Gerçek uygulamadan veri-bütünlüğü sınaması (tarayıcı modu) | **5 veri kaybı bulgusu (P1)**: HE-VB-01…05 |
| Gerçek Tauri uygulamasından PDF/Word alma | **yapılmadı** (HE-SR-01) |


## Hata dizini (önem sırasıyla)

| ID | Önem | Durum | Başlık |
|---|---|---|---|
| HE-VB-01 | P1 | DOĞRULANDI | Okunamayan bir öğe satırı yüklemede sessizce atlanır, sonraki ilk kayıtta öğe ve notu **kalıcı silinir** |
| HE-VB-02 | P1 | DOĞRULANDI | Bozuk tek bir not satırı bütün anlık görüntü yüklemesini bozar; sonra boş not üzerine yazılır |
| HE-VB-03 | P1 | DOĞRULANDI | Metin/kod dosyası düzenlenince `encoding`, `languageId`, `languageLocked`, `fileId` kaybolur (UTF-16 dosya sessizce UTF-8'e döner) |
| HE-VB-04 | P1 | DOĞRULANDI | "Kalıcı olarak sil" + Geri al (Ctrl+Z): öğe çöp kutusuna döner ama **içeriği boştur** |
| HE-VB-05 | P1 | DOĞRULANDI | Kayıt hataları kullanıcıya hiç bildirilmez |
| HE-DP-01 | P2 | DOĞRULANDI | Çalışma ağacı işlenmemiş; bu belgenin taban aldığı durum commit'te yok |
| HE-GV-03 | P2 | KOD OKUMA | Güncelleyici uç noktası `http://localhost:3000` ve `dangerousInsecureTransportProtocol: true` üretim yapılandırmasında |
| HE-SB-01 | P2 | DOĞRULANDI | Dokuz Eylül (FBE YL) ve Ege (Eğitim YL) şablonları kayıt defterinde yok; kaynak-temelli kontrolleri çalıştırıldığında çok sayıda başarısızlık |
| HE-SB-05 | P2 | DOĞRULANDI | Şablon üretim hattı yeni kaynaklarda çoğunlukla "bir insan gerekir" diye duruyor (6 yeni kaynaktan 1'i otomatik) |
| HE-SR-01 | P2 | BELGEDEN | Gerçek Tauri uygulamasından PDF/Word alma ve yazarken gecikme **hiç ölçülmedi** |
| HE-TS-07 | P2 | DOĞRULANDI | Masaüstü kabul testi (`desktop-smoke.mjs`) ve gerçek kurulum paketi bu turda çalıştırılmadı; yerel kurulum paketi eski |
| HE-DP-02 | P3 | DOĞRULANDI | Depo ağırlığı: izlenen 1 GB üretilmiş fixture; `.git` içinde 88 MB çöp |
| HE-DX-01 | P3 | DOĞRULANDI | Dışa aktarılan **bütün** DOCX dosyaları Open XML şema doğrulamasından geçmiyor (`settings.xml` eleman sırası) |
| HE-DX-02 | P3 | DOĞRULANDI | AFSÜ LEE: editör PDF'inde `SymbolMT` yazı tipi (madde işareti); kaynak-temelli yazı tipi kontrolü başarısız |
| HE-EW-01 | P3 | DOĞRULANDI | AKÜ Sağlık Bilimleri Enstitüsü (yüksek lisans ve doktora): onay sayfası Word'de **iki sayfaya taşıyor** |
| HE-EW-02 | P3 | DOĞRULANDI | AKÜ Kimya (lisans bitirme tezi): kapak sayfası Word'de **boş bir ikinci sayfa** üretiyor |
| HE-EW-03 | P3 | DOĞRULANDI | AKÜ Felsefe (lisans bitirme ve seminer): tablo ve bölüm başı kaymaları |
| HE-EW-04 | P3 | DOĞRULANDI | Dokuz Eylül FBE (kayıtsız şablon): editör **52**, Word **62** sayfa |
| HE-EW-05 | P3 | DOĞRULANDI | Ege Eğitim Bilimleri (kayıtsız şablon): sayfa sayısı eşit ama 318 satır yatayda kayık |
| HE-EW-06 | P3 | DOĞRULANDI | Sayfa altı dipnot: Word, dipnota yer açmak için gövdenin son satırlarını sonraki sayfaya iter, editör itmez |
| HE-EW-07 | P3 | BELGEDEN | Üretilen listeler (içindekiler/şekil/tablo dizini): ~1 pt satır kayması; uzun girdinin sayfa numarası ilk/son satırda |
| HE-EW-08 | P3 | DOĞRULANDI | İYTE: alt başlık + sonraki paragraf ayrımı, 1/90 tablo satırı; **EEE bitirme projesinde 299 satır 35,4 pt yatay kaymış** |
| HE-EW-09 | P3 | DOĞRULANDI | Tablo sütun konumları: AKÜ FBE ve MBG'de **115,3 pt**, MCBÜ/AKÜ ISG/Matematik'te "özgeçmiş" sayfasında 32,6 pt |
| HE-GV-01 | P3 | DOĞRULANDI | `sanitizeHtml` `javascript:` süzgeci sekme/satır sonu/C0 karakteriyle atlatılır |
| HE-GV-02 | P3 | DOĞRULANDI | Belge derleme ve yazdırma yolu notun HTML'ini süzmeden taşır |
| HE-SB-02 | P3 | DOĞRULANDI | Üretilen iki şablonun künyesi yanıltıcı: `status: "official"`, `source.documentName: "official.docx"`, `verifiedAt: 2026-10-22` |
| HE-SB-03 | P3 | DOĞRULANDI | Kayıt defteri (`registry.js`) elle bakılan, şablon verisini tekrarlayan bir liste |
| HE-SR-02 | P3 | DOĞRULANDI | Yazarken gecikme (80–120 sayfalık tez): her tuşta uzun görev, kabul bütçesi yok |
| HE-SR-04 | P3 | KOD OKUMA | Sayfalama, Chromium'un yeni CSS özelliklerine dayanıyor; en düşük WebView2 sürümü belirtilmemiş |
| HE-TS-03 | P3 | KOD OKUMA | Birim testlerinin bir kısmı makine yazı tiplerine bağlı, yoksa **sessizce atlanır** |
| HE-TS-04 | P3 | DOĞRULANDI | Tür denetimi, lint ve CI yok; belgelenen "TypeScript koruması" çalışmıyor |
| HE-TS-06 | P3 | KOD OKUMA | `devserver.sh stop/restart` makinedeki **bütün** `vite` süreçlerini sonlandırır |
| HE-UI-04 | P3 | DOĞRULANDI | Şablon seçicide "Enstitü" listesinde AKÜ Sosyal Bilimler boş görünür; "Tez türü"nde `sanatta-yeterlik` ham kimlikle yazılır |
| HE-VB-06 | P3 | DOĞRULANDI | Her yazma duraklamasında bütün veritabanı yeniden yazılır; kapanışta 1,5 sn'lik yarış |
| HE-VB-07 | P3 | DOĞRULANDI | ZIP sınırları açıldıktan **sonra** denetlenir (zip bombası bellek tüketir) |
| HE-VB-11 | P3 | KOD OKUMA | Geri alma yığını her adımda **bütün not nesnelerinin** önce/sonra kopyasını tutar (görselli tezde bellek) |
| HE-DP-03 | P4 | DOĞRULANDI | Belge çürümesi: yönlendirme bağlantılarının çoğu kırık |
| HE-DP-04 | P4 | DOĞRULANDI | `.gitattributes` yok; satır sonları karışık |
| HE-DP-05 | P4 | DOĞRULANDI | Klasör kuralı ve katman ihlalleri |
| HE-DP-06 | P4 | DOĞRULANDI | Satır içi yardımcı kod: Windows'a/yerel makineye bağlı yollar |
| HE-EW-10 | P4 | DOĞRULANDI | Şekil konumu farkları (AFSÜ Tıp/DHF `37,9 pt`; AKÜ Felsefe `26,7`/`20,6`; İYTE EEE `17,7`) |
| HE-SB-06 | P4 | DOĞRULANDI | Şablon klasörlerinde yalnız kaynak belgesi olan 11 üniversite var (bilinen eksik, hata değil) |
| HE-SR-03 | P4 | DOĞRULANDI | Paket içeriği: yinelenen parça, gömülü yazı tipleri, şablon görselleri |
| HE-TS-05 | P4 | DOĞRULANDI | Open XML doğrulayıcısı Office'in "Power Query" eklentisindeki bir DLL'e bağlı |
| HE-TS-08 | P4 | BELGEDEN | `parity.py` şekil açıklamalarını yanlış eşliyor |
| HE-TS-09 | P4 | DOĞRULANDI | Test sayıları ve belge ifadeleri geride kalmış (kayıt) |
| HE-UI-05 | P4 | DOĞRULANDI | "Word içe aktar" ve "PDF içe aktar" düğmeleri ribbon'da duruyor; sahibin kararı (20.10.2026): şimdilik dışarıdan `.docx` içe aktarma özelliği olmayacak |
| HE-UI-06 | P4 | KOD OKUMA | Pagination "sabit nokta" döngüsü sınırı aşılırsa dışa aktarma engellenir |
| HE-VB-08 | P4 | DOĞRULANDI | `upsert_note` revizyonu yalnız bazı alanlar değişince artırır |
| HE-VB-09 | P4 | KOD OKUMA | Tarayıcı modunda "en zengin" anlık görüntü seçimi yeniliği değil sayıyı esas alır |
| HE-VB-10 | P4 | KOD OKUMA | Not sürüm geçmişi Tauri'de de `localStorage`'a yazılır (kota) |

Toplam **51** kayıt: P1 5, P2 6, P3 25, P4 15. Durum dağılımı: DOĞRULANDI 40, KOD OKUMA 8, BELGEDEN 3.

## 1. Proje ve ortam (düzeltecek kişi için)

### 1.1 Proje nedir
**TxtNote**: Tauri 2 (Rust) + React 19 + Vite 8 masaüstü not uygulaması; yerel veri SQLite (Tauri'de) / IndexedDB (tarayıcıda). Uygulamanın içindeki **tez editörü**, üniversitelerin resmî tez yazım şablonlarını (JSON, her kaynak için bir dosya) ve kullanıcının metnini tek bir *belge modeline* derler; editör (tarayıcı CSS çok sütunlu sayfalama), yazdırma, PDF ve DOCX aynı modelden çizilir. **Motor** (`engine/`) bunu yapan ve yeni üniversite/tez şablonu eklemeyi otomatikleştiren araç setidir. Amaç: binlerce şablonu eklemeyi kolaylaştırmak, çıktıyı tutarlı yapmak (editörde görünen = PDF = Word), tekrar eden işi otomatikleştirmek.

### 1.2 Klasör kuralları (sahibinin kesin kararı; her yeni dosya buna uyar)
1. Bütün şablonlar yalnız `Butun-Sablonlar/` içinde (resmî kaynak belgeler + `Ege/<üniversite>/<kimlik>.json` + `Genel/generic.json` + `**/eski-js/`); orada başka bir şey olmaz.
2. Motor kodu yalnız `engine/` (`src/` çalışma zamanı, `tools/` otomasyon ve kapılar, `specs/` ve `references/` kaynaktan türetilen veri); uygulama ve geri kalan kod `TxtNote/` içinde.
3. Not, bilgi, plan, rapor, belge ve yapay zekâ komutları yalnız `orchestration/` içinde.
4. Şablon ilkesi: şablon **düz veridir** (`extends` yok, ortak taban yok, başka üniversiteden sayı ödünç yok); ortak olan yalnız motor davranışı ve nötr varsayılanlardır (`engine/src/engineDefaults.js`, yalnız **eksik** anahtarları doldurur). Belge-kimliğine ya da sayfa numarasına bağlı koşul koda eklenmez.

### 1.3 Makine (bu ölçümlerin yapıldığı)
- Windows 11 Home 10.0.26200 (tr-TR; ondalık ayırıcı `,`).
- Node **v24.20.0** (sistem), Python: `C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`; araçlar `python -E -s` ile çalışır (`-I` **olmaz**: kardeş modül `pdfmeasure` içe aktarılamaz). PyMuPDF `engine/tools/measurement-packages/` içindedir (sürüm 1.28.2); `-E` ortam değişkenlerini yok sayar, betikler yolu kendileri ekler.
- Tarayıcı: Google Chrome **155.0.8059.85** (`C:/Program Files/Google/Chrome/Application/chrome.exe`), Microsoft Edge 155.0.4283.62 (bazı e2e testleri `channel: "msedge"` ister). Playwright: `engine/tools/node_modules/playwright`.
- Word: Microsoft Office 16.0, derleme **16.0.20430**, tr-TR, yazıcı "Microsoft Print to PDF", uyumluluk modu 15. **Word yalnız sahip olunan tek örnekle çalıştırılır** (`engine/tools/word2pdf.ps1`: yeni süreç PID'i yazılır, `finally`'de `Quit`); iki Word işi **aynı anda çalıştırılamaz** (betik "tam bir yeni Word süreci" doğrulaması yapar).
- Rust: `cargo` 2026 sürümü, hedef dizin `C:/Users/CASPER/AppData/Local/txtnote-cargo-target` (`TxtNote/.cargo/config.toml`, gitignore'da).
- Kurulum: `npm ci --prefix engine`, `npm ci --prefix TxtNote/frontend` (ağsız: `node engine/tools/seed-engine-dependencies.cjs`).

### 1.4 Komutlar (hepsi depo kökünden, aksi belirtilmedikçe)
```bash
# Birim testleri (TxtNote/frontend içinde): 1137 test
cd TxtNote/frontend && node --test 'src/lib/*.test.js' 'src/features/mindmap/*.test.js' 'src/features/workarea/*.test.js' 'src/features/sync/*.test.js' '../../engine/src/*.test.js' '../../engine/src/templates/*.test.js'
# Üretim derlemesi
cd TxtNote/frontend && node node_modules/vite/bin/vite.js build
# Motor araç testleri
node --test engine/tools/test_template_add.mjs engine/tools/test_profile_suggest.mjs engine/tools/test_spec2template.mjs engine/tools/test_export_diagnostics.mjs engine/tools/test_validationProvenance.mjs
cd engine/tools && python -E -s -m unittest test_conformance test_docx2spec
# Rust
cd TxtNote/src-tauri && cargo test --lib --offline
# Geliştirme sunucusu (geçici; port 5175)  — DİKKAT: `stop` makinedeki TÜM vite süreçlerini kapatır (bkz. HE-TS-06)
bash engine/tools/devserver.sh start
# Editör/PDF ↔ Word eşliği (tek Word örneği, ~1,5 dk/şablon). Çıktı: .test-tmp/validation/<ad>/
node engine/tools/parity.mjs --templates <kimlik,kimlik,...> --keep-going --out .test-tmp/validation/<ad> [--pad N] [--copies 2]
# Kaynak temelli kontroller (Tier 1)
node engine/tools/check.mjs --target <hedef> --word          # örn. aku-kimya-lisans
node engine/tools/check.mjs --all --word --targets a,b,c --manifest <dosya.json>
# Dışa aktarılan DOCX'in Open XML şema doğrulaması (Office'in Power Query eklentisindeki SDK DLL'ini kullanır)
powershell -File engine/tools/validate-openxml.ps1 -In <x.docx> -Out <x.json>
# E2E tarayıcı testi örneği (sunucu açıkken)
PLAYWRIGHT_MODULE=engine/tools/node_modules/playwright THESIS_BASE_URL=http://127.0.0.1:5175 node TxtNote/frontend/tests/<ad>.e2e.mjs http://127.0.0.1:5175
```

### 1.5 Sözlük
- **Editör**: uygulama içindeki tez yazım ekranı (Chromium çok sütunlu CSS sayfalaması; `engine/src/pageLayout.js`).
- **Word / PDF eşliği (parity)**: aynı belgenin editörden alınan DOCX'inin Word'de, PDF'inin ise editör sayfalarından çizilmiş hâlinin karşılaştırılması. *Kayan sayfa*: Word'de ≥6 sözcüğü editörden farklı sayfaya düşen sayfa. *Dolgu (pad N)*: her bölüm başlığından sonra N satır dolgu; aynı içeriği sayfa sonu kararlarına farklı yerde rastlatır (duyarlılık taraması).
- **Tier 1 kontrolleri**: resmî kaynaktan türetilen kaynak-temelli ölçüm kontrolleri (`engine/specs/<hedef>.checks.json`).
- **Sabit sayfa / özel sayfa**: şablonun bloklarla çizdiği kapak, onay, etik beyan gibi sayfalar.
- **Üretilen liste**: içindekiler, şekil/tablo dizini (editörde otomatik).


## 2. Ölçüm sonuçları (kanıt)

Bütün ölçümler 22.10.2026'da, §1.3'teki makinede, §0.2'deki çalışma ağacında alındı. Ham çıktılar `.test-tmp/validation/` altında (gitignore'da; silinebilir) — bu belgedeki sayılar oradan kopyalandı, silinirse yukarıdaki komutlarla yeniden üretilir.

### 2.1 Yöntem (Word eşliği)
- `engine/tools/parity.mjs`: her şablon için `make-fixture.mjs` sentetik örnek tezi üretir (5 bölüm; 5 dipnot; 2 tablo; 2–3 şekil; 1 denklem; gövde `--copies 2` kez → 49–62 sayfa), **gerçek editörün** PDF ve Word düğmeleri Playwright ile basılır (`export.mjs`; sunucu `http://127.0.0.1:5175/tests/thesis.html`), indirilen DOCX kendi tek Word örneğinde PDF'e çizilir (`word2pdf.ps1`), `parity.py` iki PDF'i PyMuPDF ile karşılaştırır.
- **Kayan sayfa:** Word'de en az 6 sözcüğü editörden farklı sayfaya düşen sayfa. **Başka sayfaya geçen sözcük %:** tüm sözcüklerin kaçı. **Konum farkı işareti = editör − Word** (dikey: pozitif = editörde satır daha aşağıda; yatay: pozitif = editörde satır daha sağda). Sayfa numarası farkı: aynı fiziksel sayfada farklı basılı numara.
- **Dolgu (`--pad N`):** her bölüm başlığının hemen arkasına N tek satırlık dolgu paragrafı konur; bölümler yeni sayfada başladığı için bu, bölüm içindeki her şeyi N satır kaydırır ve aynı içerik sayfa sonu kararlarına her seferinde başka yerde rastlar. Tek bir metinde "kayma yok" sonucu şans eseri olabilir (`CIKTI_KALITESI_2026-10-22.md`: MCBÜ YL ve ADÜ varsayılan metinde 0 kayan sayfaydı; sekiz dolgunun toplamında sırasıyla 24 ve 79 kayan sayfa çıkmıştı); bu yüzden 0, 2, 4, 6 dolgularıyla ölçüldü.
- **Sınır:** sentetik metin; gerçek bir tez, denklem/uzun tablo/metin içi resim içeren içerik, kapak/onay gibi sabit sayfaların **uzun adlı** hâli bu ölçümün dışında (yalnız başlık uzun).

### 2.2 Sonuç: örnek metin, dolgu 0 (34 kayıtlı şablon + 2 kayıtsız)

| şablon | sayfa editör/Word | kayan sayfa | başka sayfaya geçen sözcük % | tablo satırı başka sayfada | şekil sayfaları / en büyük konum farkı pt | sayfa no farkı | yatay kayan satır (en büyük pt) |
|---|---|---|---|---|---|---|---|
| `adu-sagbil-master-tr-v1` | 54/54 | 0 | 0.21 | 0/90 | = 0.1 | 0 | 8 (28.4) |
| `mcbu-lee-master-tr-v1` | 55/55 | 0 | 0.23 | 0/90 | = 0.1 | 0 | 1 (1.5) |
| `mcbu-lee-phd-tr-v1` | 56/56 | 0 | 0.22 | 0/90 | = 0.1 | 0 | 7 (32.6) |
| `afsu-eczacilik-proje-lisans-tr-v1` | 62/62 | 0 | 0.23 | 0/90 | = 0.1 | 0 | 0 (0.8) |
| `afsu-lee-master-tr-v1` | 55/55 | 2 (8,9) | 0.37 | 0/90 | = 0.1 | 0 | 8 (32.6) |
| `afsu-lee-phd-tr-v1` | 55/55 | 2 (8,9) | 0.37 | 0/90 | = 0.1 | 0 | 8 (32.6) |
| `afsu-tip-uzmanlik-tr-v1` | 52/52 | 0 | 0.24 | 0/90 | = 37.9 | 0 | 4 (1.1) |
| `afsu-dis-hekimligi-uzmanlik-tr-v1` | 52/52 | 0 | 0.24 | 0/90 | = 37.9 | 0 | 4 (1.1) |
| `afsu-lee-proposal-master-tr-v1` | 50/50 | 0 | 0.23 | 0/90 | = 0 | 0 | 0 (0.8) |
| `afsu-lee-proposal-phd-tr-v1` | 50/50 | 0 | 0.23 | 0/90 | = 0 | 0 | 0 (0.8) |
| `mcbu-tip-uzmanlik-tr-v1` | 52/52 | 2 (4,5) | 0.32 | 0/90 | = 0 | 0 | 7 (1.3) |
| `aku-fbe-master-tr-v1` | 58/58 | 0 | 0.23 | 0/90 | = 0 | 0 | 12 (115.3) |
| `aku-fbe-phd-tr-v1` | 59/59 | 2 (3,4) | 0.38 | 0/90 | = 0 | 0 | 8 (115.3) |
| `aku-sbe-master-tr-v1` | 53/53 | 2 (8,9) | 0.33 | 0/90 | = 0.1 | 0 | 5 (1.5) |
| `aku-sbe-phd-tr-v1` | 53/53 | 2 (8,9) | 0.33 | 0/90 | = 0.1 | 0 | 5 (1.5) |
| `aku-sbe-sanatta-yeterlik-tr-v1` | 53/53 | 2 (8,9) | 0.33 | 0/90 | = 0.1 | 0 | 5 (1.5) |
| `aku-sbe-master-en-v1` | 54/54 | 2 (8,9) | 0.26 | 0/90 | = 0.1 | 0 | 5 (1.5) |
| `aku-sbe-phd-en-v1` | 54/54 | 2 (8,9) | 0.26 | 0/90 | = 0.1 | 0 | 5 (1.5) |
| `aku-sagbil-master-tr-v1` | 60/61 **≠** | 58 (3,4,5,6,7,8,…) | 40.36 | 45/90 | ≠ 0 | 48 | 5 (191.6) |
| `aku-sagbil-phd-tr-v1` | 60/61 **≠** | 58 (3,4,5,6,7,8,…) | 40.38 | 45/90 | ≠ 0 | 48 | 5 (191.6) |
| `aku-mbg-lisans-tr-v1` | 56/56 | 0 | 0.23 | 0/90 | = 0 | 0 | 9 (115.3) |
| `aku-cografya-lisans-tr-v1` | 49/49 | 0 | 0.22 | 0/90 | = 0 | 0 | 2 (1.6) |
| `aku-kimya-lisans-tr-v1` | 57/58 **≠** | 56 (2,3,4,5,6,7,…) | 42.51 | 45/90 | ≠ 0 | 54 | 7 (153.8) |
| `aku-matematik-lisans-tr-v1` | 54/54 | 0 | 0.24 | 0/90 | = 0 | 0 | 5 (32.6) |
| `aku-sosyoloji-lisans-tr-v1` | 57/57 | 0 | 0.23 | 0/90 | = 0 | 0 | 1 (4.8) |
| `aku-felsefe-lisans-tr-v1` | 47/47 | 21 (9,10,11,12,13,15,…) | 2.75 | 2/90 | = 26.7 | 0 | 1 (1.7) |
| `aku-felsefe-seminer-tr-v1` | 43/44 **≠** | 38 (3,5,6,7,8,9,…) | 17.27 | 45/90 | ≠ 20.6 | 0 | 0 (0.8) |
| `aku-isg-tezsiz-proje-tr-v1` | 49/49 | 3 (7,8,9) | 0.69 | 0/90 | = 0.1 | 0 | 4 (32.6) |
| `adu-ziraat-lisans-tr-v1` | 55/55 | 0 | 0.21 | 0/90 | = 0 | 0 | 2 (1.6) |
| `iyte-lee-master-en-v1` | 58/58 | 8 (22,23,28,29,42,43,…) | 0.53 | 1/90 | = 0.1 | 0 | 0 (0.7) |
| `iyte-lee-phd-en-v1` | 59/59 | 8 (22,23,28,29,42,43,…) | 0.52 | 1/90 | = 0.1 | 0 | 0 (0.7) |
| `iyte-lee-articles-master-en-v1` | 64/64 | 8 (23,24,29,30,43,44,…) | 0.52 | 1/90 | = 0.1 | 0 | 0 (0.7) |
| `iyte-lee-articles-phd-en-v1` | 64/64 | 8 (23,24,29,30,43,44,…) | 0.52 | 1/90 | = 0.1 | 0 | 0 (0.7) |
| `iyte-eee-undergraduate-en-v1` | 45/45 | 0 | 0.18 | 0/90 | = 17.7 | 0 | 299 (36) |
| `deu-fbe-master-tr-v1 (kayıtsız)` | 52/62 **≠** | 45 (7,8,9,11,12,13,…) | 35.19 | 45/90 | ≠ 0 | 0 | 0 (0.2) |
| `ege-egitim-master-tr-v1 (kayıtsız)` | 49/49 | 2 (6,7) | 0.29 | 0/90 | = 0.1 | 0 | 318 (35.3) |


### 2.3 Duyarlılık taraması: dolgu 0 / 2 / 4 / 6 (34 kayıtlı şablon, 136 Word çizimi)
Komut: her dolgu için `node engine/tools/parity.mjs --templates <34 kimlik> --keep-going --pad N --out .test-tmp/validation/envanter-parity-padN` (dolgu 0'da `--pad` verilmez). Hücre: `editör/Word sayfa sayısı · kayan sayfa`.


| dolgu | ölçülen şablon | sayfa sayısı eşit olmayan | kayan sayfa = 0 | kayan sayfa ≤ 2 | kayan sayfa > 8 |
|---|---|---|---|---|---|
| 0 | 34 | 4 | 15 | 24 | 5 |
| 2 | 34 | 4 | 11 | 15 | 12 |
| 4 | 34 | 6 | 12 | 16 | 16 |
| 6 | 34 | 9 | 13 | 16 | 14 |

| şablon | dolgu 0 | dolgu 2 | dolgu 4 | dolgu 6 |
|---|---|---|---|---|
| `adu-sagbil-master-tr-v1` | 54/54 · **0** | 54/54 · **28** | 56/56 · **4** | 56/56 · **0** |
| `mcbu-lee-master-tr-v1` | 55/55 · **0** | 55/55 · **0** | 55/55 · **0** | 55/55 · **0** |
| `mcbu-lee-phd-tr-v1` | 56/56 · **0** | 56/56 · **0** | 56/56 · **0** | 56/56 · **0** |
| `afsu-eczacilik-proje-lisans-tr-v1` | 62/62 · **0** | 62/62 · **8** | 64/66 ≠ · **41** | 66/66 · **0** |
| `afsu-lee-master-tr-v1` | 55/55 · **2** | 57/57 · **2** | 57/57 · **2** | 57/57 · **2** |
| `afsu-lee-phd-tr-v1` | 55/55 · **2** | 57/57 · **2** | 57/57 · **2** | 57/57 · **2** |
| `afsu-tip-uzmanlik-tr-v1` | 52/52 · **0** | 54/54 · **0** | 56/56 · **0** | 56/56 · **0** |
| `afsu-dis-hekimligi-uzmanlik-tr-v1` | 52/52 · **0** | 54/54 · **0** | 56/56 · **0** | 56/56 · **0** |
| `afsu-lee-proposal-master-tr-v1` | 50/50 · **0** | 52/52 · **0** | 52/52 · **0** | 52/52 · **0** |
| `afsu-lee-proposal-phd-tr-v1` | 50/50 · **0** | 52/52 · **0** | 52/52 · **0** | 52/52 · **0** |
| `mcbu-tip-uzmanlik-tr-v1` | 52/52 · **2** | 52/52 · **2** | 52/52 · **2** | 52/52 · **12** |
| `aku-fbe-master-tr-v1` | 58/58 · **0** | 58/58 · **0** | 58/58 · **0** | 60/60 · **0** |
| `aku-fbe-phd-tr-v1` | 59/59 · **2** | 59/59 · **2** | 59/59 · **2** | 61/61 · **2** |
| `aku-sbe-master-tr-v1` | 53/53 · **2** | 57/57 · **11** | 57/57 · **11** | 59/61 ≠ · **45** |
| `aku-sbe-phd-tr-v1` | 53/53 · **2** | 57/57 · **11** | 57/57 · **11** | 59/61 ≠ · **45** |
| `aku-sbe-sanatta-yeterlik-tr-v1` | 53/53 · **2** | 57/57 · **11** | 57/57 · **11** | 59/61 ≠ · **45** |
| `aku-sbe-master-en-v1` | 54/54 · **2** | 58/58 · **13** | 58/58 · **13** | 60/62 ≠ · **47** |
| `aku-sbe-phd-en-v1` | 54/54 · **2** | 58/58 · **13** | 58/58 · **13** | 60/62 ≠ · **47** |
| `aku-sagbil-master-tr-v1` | 60/61 ≠ · **58** | 60/61 ≠ · **58** | 60/61 ≠ · **58** | 60/61 ≠ · **58** |
| `aku-sagbil-phd-tr-v1` | 60/61 ≠ · **58** | 60/61 ≠ · **58** | 60/61 ≠ · **58** | 60/61 ≠ · **58** |
| `aku-mbg-lisans-tr-v1` | 56/56 · **0** | 56/56 · **0** | 56/56 · **0** | 58/58 · **0** |
| `aku-cografya-lisans-tr-v1` | 49/49 · **0** | 53/53 · **0** | 53/53 · **0** | 53/53 · **0** |
| `aku-kimya-lisans-tr-v1` | 57/58 ≠ · **56** | 57/58 ≠ · **56** | 57/58 ≠ · **56** | 59/60 ≠ · **58** |
| `aku-matematik-lisans-tr-v1` | 54/54 · **0** | 54/54 · **0** | 54/54 · **0** | 56/56 · **0** |
| `aku-sosyoloji-lisans-tr-v1` | 57/57 · **0** | 58/58 · **14** | 59/59 · **32** | 60/59 ≠ · **25** |
| `aku-felsefe-lisans-tr-v1` | 47/47 · **21** | 48/47 ≠ · **20** | 49/49 · **0** | 49/49 · **6** |
| `aku-felsefe-seminer-tr-v1` | 43/44 ≠ · **38** | 43/43 · **4** | 44/44 · **6** | 45/45 · **6** |
| `aku-isg-tezsiz-proje-tr-v1` | 49/49 · **3** | 50/50 · **14** | 51/50 ≠ · **11** | 51/51 · **3** |
| `adu-ziraat-lisans-tr-v1` | 55/55 · **0** | 55/55 · **0** | 55/55 · **0** | 59/59 · **8** |
| `iyte-lee-master-en-v1` | 58/58 · **8** | 58/58 · **4** | 60/60 · **10** | 60/60 · **10** |
| `iyte-lee-phd-en-v1` | 59/59 · **8** | 59/59 · **4** | 61/61 · **10** | 61/61 · **10** |
| `iyte-lee-articles-master-en-v1` | 64/64 · **8** | 64/64 · **4** | 66/66 · **10** | 66/66 · **10** |
| `iyte-lee-articles-phd-en-v1` | 64/64 · **8** | 64/64 · **4** | 66/66 · **10** | 66/66 · **10** |
| `iyte-eee-undergraduate-en-v1` | 45/45 · **0** | 45/45 · **4** | 45/55 ≠ · **39** | 45/45 · **0** |



**Okuma:** `editör/Word sayfa sayısı · kayan sayfa`; `≠` = sayfa sayısı farklı. "Kayan sayfa" kayma başlangıcından sonraki bütün sayfaları sayar, bu yüzden küçük bir sayfa-sonu karar farkı bölümün sonuna kadar büyür.

**Özet:** dolgu 0/2/4/6'nın **dördünde de** sayfa sayısı eşit **ve** kayan sayfa ≤ 2 olan **13/34** şablon var: MCBÜ LEE (YL, doktora), AFSÜ LEE (YL, doktora), AFSÜ Tıp, AFSÜ DHF, AFSÜ tez önerisi (YL, doktora), AKÜ FBE (YL, doktora), AKÜ MBG, AKÜ Coğrafya, AKÜ Matematik. Diğer **21 şablon** bu dört yerleşimin en az birinde ya sayfa sayısında ayrışıyor ya da >2 sayfa kayıyor. Varsayılan metindeki (dolgu 0) tablo bu yüzden olduğundan iyimser (`CIKTI_KALITESI_2026-10-22.md` aynı dersi çıkarmıştı).

**Kayma kümeleri (ilk sapma noktalarından; nedenleri kesin değil, ayrıştırma gerekir):**
1. **Dipnot sığdırma farkı** (HE-EW-06): ADÜ Sağlık dolgu 2'de 28 sayfa; İYTE EEE dolgu 4'te **45/55 sayfa, 39 kayan** (Word'de dipnotlu sayfadan son iki satır tek başına sonraki sayfaya düşüyor — sayfa 12: 16 sözcük — ve her bölümde +1 sayfa açıyor); AFSÜ Eczacılık dolgu 4'te **64/66, 41 kayan** (ilk sapma sayfa 22'de numaralı denklem `(3.1)` `+33,9 pt`).
2. **AKÜ Sosyal Bilimler (beş kayıt, aynı sonuç):** dolgu 2/4'te 11–13, **dolgu 6'da 59/61 ve 45–47 kayan sayfa**; dolgu 2'de ilk sapma Türkçe kayıtlarda sayfa 1'de (kapak başlık satırı `ÇEVRİMİÇİ ÖĞRENME` editörde Word'den `+11,6 pt` aşağıda), İngilizce kayıtlarda sayfa 3'te (`15 / 01 / 2026` imza satırı `+5,9 pt`). Sabit sayfa yerleşim farkı + gövde sığdırma; dolgu 6'da sayfa sayısı 2 farklı (editör 59, Word 61).
3. **AKÜ Sosyoloji:** dolgu 2'de 14, 4'te **32**, 6'da 60/59 (`≠`) 25 kayan; ilk sapmalar gövdede başlık/paragraf (`+62,1 pt`, `+94,8 pt`, `+53,4 pt`) — Word başlık ve sonrasını farklı sayfaya koyuyor.
4. **AKÜ İSG:** dolgu 2'de 14, 4'te 51/50 (`≠`) 11; ilk sapma sayfa 1 başlık `+4,2 pt` ve TOC (HE-EW-07).
5. **AKÜ Felsefe lisans/seminer:** dolgu 0'da 21/38, sonra 20/4 ve 0/6 (tek yerleşime çok duyarlı: HE-EW-03).
6. **İYTE LEE (4 kayıt):** dolgu 0/2/4/6'da 8/4/10/10; dolgu 2'de ilk sapma sayfa 3 onay sayfasında `Üye 2 ADI SOYADI` `+23,8 pt` (sabit sayfa yerleşimi) sonra gövde.
7. **MCBÜ Tıp:** dolgu 0/2/4'te 2, **dolgu 6'da 12** (`CIKTI_KALITESI`: "16–20 ve 37–41" sayfa aralıkları). **ADÜ Ziraat:** dolgu 6'da 8 (diğerlerinde 0).
8. **Sabit yapısal kayıtlar (her dolguda aynı):** AKÜ Sağlık (58) ve AKÜ Kimya (56): sabit sayfa taşması (HE-EW-01/02) — dolgudan bağımsız.

**Yorum:** `parity.mjs --pad` taraması bu turda **34 şablonun hepsinde** koşuldu (dolgu 0/2/4/6, 136 Word çizimi). Dolgu değişince sonuç değişmeyen 13 şablon, bu ölçümün kapsadığı sentetik içerik için kararlıdır; gerçek bir tezin kararlılığı garanti değildir.


### 2.4 Kaynak-temelli kontroller (Tier 1): `check.mjs --all --word`
Komut: `node engine/tools/check.mjs --all --word --targets <26 hedef> --manifest .test-tmp/validation/envanter-check-all/manifest.json` (Word tek örnek, ~16,6 dk). Dokuz Eylül ve Ege hedefleri kayıt defterinde olmadığından ayrıca, geçici kayıtla koşuldu (HE-SB-01: `deu-fbe` FAIL=17/PASS=225, `ege-egitim` FAIL=133/PASS=195).


| hedef | PASS | FAIL | INFO | süre (sn) |
|---|---|---|---|---|
| `adu-sagbil` | 304 | 0 | 0 | 23 |
| `adu-ziraat-lisans` | 16 | 0 | 1 | 21 |
| `afsu-eczacilik-proje` | 28 | 0 | 1 | 24 |
| `afsu-lee` | 92 | 2 | 1 | 45 |
| `afsu-tip` | 68 | 0 | 2 | 19 |
| `aku-cografya-lisans` | 51 | 0 | 3 | 21 |
| `aku-fbe` | 71 | 0 | 3 | 61 |
| `aku-felsefe-lisans` | 86 | 0 | 4 | 21 |
| `aku-felsefe-seminer` | 64 | 0 | 4 | 21 |
| `aku-isg-tezsiz-proje` | 41 | 1 | 1 | 19 |
| `aku-kimya-lisans` | 51 | 0 | 1 | 24 |
| `aku-matematik-lisans` | 60 | 0 | 2 | 38 |
| `aku-mbg-lisans` | 53 | 0 | 1 | 23 |
| `aku-sagbil` | 44 | 0 | 1 | 58 |
| `aku-sbe` | 176 | 0 | 2 | 97 |
| `aku-sosyoloji-lisans` | 31 | 0 | 4 | 19 |
| `engine-mission05-typography` | 22 | 0 | 0 | 18 |
| `engine-word-justify` | 22 | 0 | 0 | 20 |
| `engine-word-pagefit` | 213 | 0 | 0 | 84 |
| `engine-word-parity` | 148 | 0 | 0 | 19 |
| `engine-word-structure` | 136 | 0 | 0 | 68 |
| `engine-word-style-precedence` | 64 | 0 | 0 | 51 |
| `iyte` | 124 | 0 | 0 | 79 |
| `mcbu-lee` | 108 | 0 | 1 | 67 |
| `mcbu-tip-uzmanlik` | 94 | 0 | 2 | 29 |
| `phase52-justify` | 34 | 0 | 0 | 29 |
| **toplam (26 hedef)** | **2201** | **3** | | 996 |


Başarısız 3 kontrol: `afsu-lee` `body-font`, `phd-body-font` (HE-DX-02), `aku-isg-tezsiz-proje` `engine-layout-pdf-default` (HE-EW-07).

### 2.5 Open XML şema doğrulaması (34 DOCX)
`.test-tmp/validation/envanter-parity-pad0/<kimlik>/export.docx` için `powershell -File engine/tools/validate-openxml.ps1 -In … -Out …`: **34/34 `SDK_SCHEMA:FAIL errors=1`**; her dosyada aynı tek hata: `The element has unexpected child element '…wordprocessingml/2006/main:defaultTabStop'. | /word/settings.xml | /w:settings[1]` (HE-DX-01). Başka hata yok: gövde, stiller, numaralandırma, altbilgiler, dipnotlar şema-geçerli.

### 2.7 Yazarken gecikme (80–120 sayfalık MCBÜ tezi)
Araç: `typing-latency` (bu turda yazıldı; geçici betik, depoda yok): `engine/tools/make-fixture.mjs mcbu-lee-master-tr-v1` çıktısının gövdesi 1, 3 ve 4 kopya (34 / 76 / 97 sayfa); `tests/thesis.html` (gerçek `ThesisEditor`, kayıt/ağ/eşzamanlama katmanı **yok**), Chrome 155 başsız (GPU yok), `1400×1000`; imleç gövdenin ortasındaki (ve ayrıca sonundaki) bir paragrafın sonuna konur; 60 karakter 120 ms aralıkla gönderilir (52 `keydown` kaydedildi; Türkçe özel karakterler `insertText` ile gittiği için `keydown` üretmez). **Girdi → boyama gecikmesi:** `keydown` anından iki `requestAnimationFrame` sonrasına kadar; **uzun görev:** `PerformanceObserver("longtask")` (>50 ms).

| Belge | Yükleme ve sayfalama hazır (sn) | Gecikme medyan / p95 / en büyük (ms) | Uzun görev sayısı / toplam (ms) / en büyük 5 (ms) |
|---|---|---|---|
| 34 sayfa | 1,4 | 41,3 / 61,9 / 73,6 | 11 / 624 / 69, 67, 60, 59, 57 |
| 76 sayfa (ortada yazma) | 2,4 | 65,3 / 89,9 / 107,5 | 65 / 4484 / 233, 133, 131, 102, 94 |
| 76 sayfa (sonda yazma) | 2,4 | 64,4 / 122,7 / 175,3 | 67 / 4550 / 166, 155, 135, 132, 127 |
| 97 sayfa | 4,2 | 78,0 / 97,7 / 103,4 | 66 / 5299 / 218, 197, 172, 104, 103 |

**Yorum:** belge büyüdükçe gecikme ve uzun görev boyu artıyor; 76–97 sayfada her tuş vuruşu arka planda 100–230 ms'lik uzun görev (yeniden derleme + sayfalama) çıkarıyor, toplam ~4,5–5,3 sn ana iş parçacığı kullanımı 60 tuş + 6 sn bekleme boyunca. Sayısal bir hedef (bütçe) **tanımlı değil** (GOREVLER §2: "kullanıcıyla onaylanmış bir bütçe, uydurulmaz"); bu tablo yalnız ölçümdür. Ölçülmeyenler: Tauri WebView2, tam uygulama (kayıt + eşzamanlama şeritleri; bkz. HE-VB-06 yazma duraklaması başına ~230 ms Rust maliyeti ayrıca), ≥20 gerçek yaz/geri al örneği (burada 52 örnek), gerçek tez içeriği, görselli belge.


### 2.8 Şablon üretim hattı: daha önce kullanılmamış kaynaklarla deneme
Yöntem: sahibin `orchestration/motor/DOCX_EXTRACTION.md` hattı, **kullanılmamış 6 resmî DOCX şablonuyla**, depoya hiçbir şey yazılmadan (`--out-root` ile geçici dizine): `cache-official-source.mjs` (Word çizimi) → `docx2spec.py` (kaynak gerçekleri) → `template-add.mjs --identity <kimlik.json> --write --out-root <dizin>` (profil önerisi + düz şablon + kontroller). Önceki iki deneme (DEÜ FBE, Ege Eğitim) her biri araçta 4–6 genel düzeltme gerektirmişti (`IKI_KAYNAK_DENEMESI_2026-10-22.md`); bu tur "yakınsama" sorusunun ölçümü:

| Kaynak (üniversite · dosya) | Word çizimi | Çıkarma | `template-add` sonucu |
|---|---|---|---|
| Pamukkale · `PAU_Fen_Bilimleri_Tez_Sablonu.docx` | ✓ 11,3 sn | ✓ 1 sn (3 sec., 92 stil, 10 tablo) | **durdu:** eksik rol `tableCaption` |
| Muğla · `MSKU_Egitim_Bilimleri_Yuksek_Lisans_Tez_Sablonu_TR_2025-10-06.docx` | ✓ 9,9 sn | ✓ 1 sn | **durdu:** `figureCaption`, `bibliographyParagraph` |
| Kütahya Dumlupınar · `DPU_Lisansustu_Tez_Sablonu_2026-09-29.docx` | ✓ 10,9 sn | ✓ 1,5 sn | **durdu:** `bibliographyParagraph` |
| Pamukkale · `PAU_Saglik_Bilimleri_Yuksek_Lisans_Tez_Sablonu_2023_Haziran.docx` | ✓ 8,2 sn | ✓ 1,4 sn | **durdu:** `bibliographyParagraph` |
| Dokuz Eylül · `DEU_Sosyal_Bilimler_Tez_Sablonu_2025-05-27.docx` | ✓ 11,0 sn | ✓ 1,1 sn | **üretildi** (0,3 sn; 12 bölüm) |
| Ege · `EGE_Saglik_Bilimleri_Tez_Sablonu_2018.docx` | ✓ 18,7 sn | ✓ 0,8 sn | **durdu:** `headingParagraphs` (içindekilerden sonra numaralı 1. düzey başlık bulunamadı), `bodySourcePage`, `tableCaption`, `figureCaption` |

**Sonuç: 6 yeni kaynaktan 1'i (%17) elle iş olmadan şablona dönüştü; 5'i "NEEDS A PERSON" ile durdu** (araç dürüstçe duruyor, şablon üretmiyor). Durma nedeni her seferinde profil önerisinin bir rolü (açıklama/kaynakça/başlık paragrafı) bulamaması: ADÜ'ye kalibre edilmiş sezgilerin başka kurumlarda genellenmesi henüz kanıtlanmadı.

**Üretilen tek şablonun kalitesi** (`deu-sbe-master-tr-v1`; yalnız ölçüm için kayıt defterine geçici eklendi, ölçüm sonrası dosyalarıyla birlikte **silindi**; `registry.js`/dosya listesi HEAD ile aynı doğrulandı): `parity.mjs` dolgu 0/2/4'te **49/49, 51/51, 51/51 sayfa ve 0/0/0 kayan sayfa**, başka sayfaya geçen sözcük %0,21–0,22, 6 satır yatay kayma (en büyük `35,4 pt` = 12,5 mm = `ENGINE_DEFAULT_TAB_STOP_MM`; İYTE EEE'deki 299 satırın değeriyle aynı — HE-EW-08). Aynı şablonun otomatik üretilen kaynak-temelli kontrolleri: `check.mjs --target deu-sbe --word` **FAIL=15, PASS=211** (ilk başarısızlıklar `pdf-body-font … actual=[]`, `pdf-body-size actual=null`, `pdf-body-first-indent no line matched`: seçici gövde sayfasını bulamadı). Yani **çıktı eşliği iyi, üretilen kontrol dosyası güvenilmez**.

Not: `--out-root` yerleşimi (`<kök>/src/templates/…`, `<kök>/specs/…`, `<kök>/Butun-Sablonlar/…`) depo yerleşiminden (`engine/src/templates`, `engine/specs`, kökte `Butun-Sablonlar`) farklı; üretilen modülün içe aktarma yolu (`../../Butun-Sablonlar/…`) depoya kopyalanınca `../../../Butun-Sablonlar/…` olmalı (elle düzeltildi).



### 2.9 Çalışanlar (yeniden ölçmeye gerek olmayanlar — bu turda doğrulandı)
- **Birim testleri** 1137/1137, 0 atlanan; motor araç testleri 24/24; Python testleri 51/51; `vite build` geçti; `cargo test --lib` 22/22; `cargo clippy --all-targets -W clippy::all` yalnız 8 biçim uyarısı (7'si kütüphanede: çok bağımsız değişkenli 3 işlev, karmaşık tür, 3 gereksiz `&`; 1'i testte: `== false`; hepsi `db.rs`/`desktop_export.rs`).
- **Şablon verisi:** `Butun-Sablonlar` altındaki 37 şablon JSON'unun hepsi `validateThesisTemplate`'ten hatasız geçiyor; kimlik tekrarı yok; 34 kayıtlı şablon `compileThesisDocument` ile 5 farklı girdiyle (boş içerik, `null` tez durumu, bozuk tez alanları, `<script>` içerikli metin, 3000 paragraflık belge) toplam **170/170** derlendi, hata yok; en uzun derleme (3000 paragraf) 86 ms. `source.documentName`'in adlandırdığı resmî kaynak dosya, 33 şablonda klasörde bulundu (ADÜ Ziraat'ın künyesi dosya adı yerine açıklama taşıyor ama dosya `ADU_Ziraat_Lisans_Tez_Yazim_Kilavuzu_2025.docx` klasörde duruyor; iki üretilmiş şablon ve `generic` için bkz. HE-SB-02).
- **Belirlilik:** `engine/tools/golden.mjs --save` + `--compare` (MCBÜ YL, AKÜ SBE, İYTE YL, AFSÜ Tıp, her biri 33–37 sayfa, 4157–5116 metin parçası) ikinci koşuda **IDENTICAL**: dışa aktarım aynı kodla tekrarlanabilir.
- **Uygulamadan şablon oluşturma:** gerçek uygulamada "Tüm şablonları keşfet" → 34/34 kayıtlı şablon seçilip "Tez oluştur" ile açıldı; her açılışta doğru `data-thesis-template-id`, konsolda/sayfada hata yok (açılış 300–900 ms). Tek sorun etiketler (HE-UI-04).
- **Kaynak-temelli kontroller:** 26 hedefte toplam **2201 PASS, 3 FAIL** (HE-DX-02, HE-EW-07); ADÜ Sağlık 304/304.
- **Word süreç hijyeni:** kontrol edilen noktalarda (her uzun işten sonra) `WINWORD` süreci kalmadı; bu turda 34×4 + 26 + 8 + 6 Word işi tek sahip örnekle çalıştı.
- **Düz-metin kayıt:** standart not yaz → sayfayı yenile → içerik korunuyor; "Sil → geri yükle" içeriği koruyor.

## 3. Editör/PDF ↔ Word uyumu (HE-EW)

**Bağlam.** Word, DOCX'i kendi sayfalama motoruyla yeniden dizer; editör ise tarayıcı CSS sayfalamasıyla. İki bağımsız motor aynı kararı (satır sayfaya sığar mı, tablo satırı sığar mı, dipnot alanı kaç satır yer ister) sayfa sonlarında farklı verirse, bir sonraki zorunlu sayfa sonuna (yeni bölüm) kadar bütün sayfalar kayar. Bu yüzden "kayan sayfa" sayısı, kaymayı başlatan **tek karar noktasının** büyüklüğünü değil bulunduğu bölümün uzunluğunu da yansıtır. Ölçüm yöntemi §2.1'de.

**Ölçüm koşulu.** `make-fixture.mjs`'in sentetik 5 bölümlü örnek tezi (5 dipnot, 2 tablo, 2–3 şekil, 1 denklem), gövde iki kopya, 49–62 sayfa; başlık gerçekçi uzunlukta (11 sözcük). **Gerçek tez değil.**

### HE-EW-01 — AKÜ Sağlık Bilimleri Enstitüsü (yüksek lisans ve doktora): onay sayfası Word'de **iki sayfaya taşıyor** · P3 · DOĞRULANDI
- **Kapsam:** `aku-sagbil-master-tr-v1`, `aku-sagbil-phd-tr-v1` (aynı sonuç).
- **Yeniden üretme:** `node engine/tools/parity.mjs --templates aku-sagbil-master-tr-v1 --out .test-tmp/validation/x` (dev sunucusu açık).
- **Beklenen:** editörde ve Word'de sayfa sayısı eşit, sayfa kayması yok.
- **Gözlenen:** sayfa sayısı **editör 60, Word 61**; **58 kayan sayfa** (sayfa 3'ten itibaren), başka sayfaya geçen sözcük **%40,4**; 45/90 uzun-tablo satırı Word'de başka sayfada; 48 sayfada sayfa numarası farkı (ör. sayfa 5'te editör `iv`, Word boş; sayfa 14'te editör `1`, Word `xiii`).
- **Neden (PDF metninden):** sayfa 3 "TEZ KABUL VE ONAY SAYFASI": editörde 165 sözcük **tek sayfada**; Word'de aynı sayfa 130 sözcük, kalan 34 sözcük ("Afyon Kocatepe Üniversitesi · Sağlık Bilimleri Enstitüsü Yönetim Kurulu'nun … sayılı kararıyla onaylanmıştır." imza bloğu) **4. sayfaya** düşüyor. Bütün sonraki sayfalar bir sayfa kayıyor (Word 61).
- **DOCX yapısı (dışa aktarılan dosyadan):** onay sayfası, `w:spacing w:lineRule="exact"` yükseklikli boş paragraflar (1, 106, 221, 457, 102, 105, 438, 115, 120 twip…) ve `Başkan / Üye 1 ADI SOYADI / İmza / Üye 2 … Üye 5` satır yığınıdır; sayfa gövdesi 297 mm − 2×30 mm. Editörde aynı sayfa mutlak konumlu bloklarla çizildiği için taşma görünmez.
- **İpucu:** sabit (özel) sayfanın yüksekliğini editör kendi satır kutularıyla ölçüyor (`engine/src/specialPageFit.js`); Word boş paragraflarda ve paragraf aralıklarında farklı yükseklik veriyor. Uyarı yalnız danışma amaçlı (`measureSpecialPageFit` "sığmıyor" mesajı üretir ama dışa aktarmayı engellemez). Karşı örnek: kısa başlıkla (Tier-1 fixture: "Sağlık Bilimleri Tezi") sayfa sığıyor.
- **Kabul ölçütü:** bu şablonda `parity.mjs` sayfa sayısı eşit ve kayan sayfa ≤ kabul eşiği (kabul eşiği sahibinindir); `check.mjs --target aku-sagbil --word` da uzun başlıklı fixture ile geçer.

### HE-EW-02 — AKÜ Kimya (lisans bitirme tezi): kapak sayfası Word'de **boş bir ikinci sayfa** üretiyor · P3 · DOĞRULANDI
- **Kapsam:** `aku-kimya-lisans-tr-v1`.
- **Gözlenen:** sayfa **57/58**; **56 kayan sayfa**; başka sayfaya geçen sözcük **%42,5**; sayfa numarası 54 sayfada farklı; 45/90 tablo satırı başka sayfada.
- **Neden (PDF metninden + dışa aktarılan DOCX'ten):** Word PDF'inde sayfa 1 kapak (48 sözcük), **sayfa 2 tamamen boş (0 sözcük)**, sayfa 3 onay sayfası; editörde sayfa 1 kapak (43 sözcük) ve doğrudan sayfa 2 onay sayfası. DOCX'te kapak, `lineRule="exact"` yükseklikli 6 boşluk paragrafı (1829+1859+1394+929+929+2323 = **9263 twip**) ile 14 pt, 1,5 aralıklı ~12 metin satırının (~5800 twip) yığınıdır; sayfa gövdesi `16838 − 568 − 1701 = 14569 twip`. Toplam ≈ 15060 twip > 14569: **başlık 3 satıra sarılınca** (gerçekçi uzunluk) son paragraflar boş bir sayfaya taşıyor; 1 satırlık kısa başlıkla (Tier-1 fixture) sığıyor. Kod tarafında `export.js` zaten `elasticSpacers`/`elasticContentMm` seçenekleri ve `specialPageFit.js` `measureElasticSpecialPages` taşıyor; bu şablonda boşluklar sarılan başlığa göre daralmıyor.
- **Kabul ölçütü:** Word'de sabit sayfa sonrası boş sayfa oluşmaz (`check.mjs`'e "boş sayfa yok" kontrolü eklenir); `parity.mjs` sayfa sayısı eşit.

### HE-EW-03 — AKÜ Felsefe (lisans bitirme ve seminer): tablo ve bölüm başı kaymaları · P3 · DOĞRULANDI
- **Kapsam:** `aku-felsefe-lisans-tr-v1` (47/47 sayfa, **21 kayan sayfa**, %2,75, 2/90 tablo satırı başka sayfada, ilk sapma sayfa 10'da gövde satırı `+20,7 pt`: "1 Alt Başlık 1.1.1" öncesi), `aku-felsefe-seminer-tr-v1` (**43/44**, **38 kayan sayfa**, %17,3, **45/90** tablo satırı Word'de başka sayfada; ilk sapma sayfa 6'da `+20,7 pt`, sayfa 7'de tablo başlığı `+74,1 pt`).
- **İpucu:** `parity.json → tableRowPages.onOtherPage` her iki şablonda aynı satırlarda tekrarlanıyor (`[13,29]`/`[13,30]` çifti: editörde satır 29 sayfa 13'te, Word'de satır 30). Kayan ilk karar tablo/alt başlık bölgesinde. Tablo başlık satırı + açıklama kuralı bu turda yeni eklendi (`pageLayout.js` `break-after:avoid`); bu şablonlar için ayrıca denenmedi.
- **Kabul ölçütü:** iki şablonda kayan sayfa ≤ eşik; seminerde sayfa sayısı eşit.

### HE-EW-04 — Dokuz Eylül FBE (kayıtsız şablon): editör **52**, Word **62** sayfa · P3 · DOĞRULANDI
- **Kapsam:** `deu-fbe-master-tr-v1` (kayıt defterine geçici eklenerek ölçüldü; HE-SB-01). Sayfa **52/62**, **45 kayan sayfa**, %35,2, 45/90 tablo satırı başka sayfada.
- **Neden (PDF metinlerinden çıkarım):** Word'de bazı gövde sayfaları kısa kalıyor (sayfa 12: **39 sözcük**, sayfa 17: 59 sözcük). Word'de sayfa 11 133 sözcükle bitiyor (editörde 165); "Alt Başlık 1.1.1.1 + kısa paragraf + maddeli ve numaralı liste" bloğu Word'de sayfa 12'ye taşınıyor, ardından `Şekil 1` sayfa 13'e (editörde şekil sayfa 12'nin başında). Şablon: gövde `lineSpacing 1,5 auto`, başlık 1–3 `keepWithNext`+`keepLines`, başlık 3 `spaceAfterPt 32,698` (üretici ölçümü), `paragraphSpacing: additive`. Yani editör ve Word'ün başlık+paragraf+liste sayfa sığdırma kararı ayrışıyor.
- **Kabul ölçütü:** şablon kayda alınıp `parity.mjs` ve `check.mjs --word` kapılarını geçer (bkz. HE-SB-01).

### HE-EW-05 — Ege Eğitim Bilimleri (kayıtsız şablon): sayfa sayısı eşit ama 318 satır yatayda kayık · P3 · DOĞRULANDI
- **Kapsam:** `ege-egitim-master-tr-v1`: 49/49 sayfa, 2 kayan sayfa (6, 7), %0,29; **318 satır yatay kayma** (en büyük **35,3 pt**; işaret = editör − Word): şekil açıklamaları (`Şekil 2. …` −35,3 pt), **bütün tablo hücreleri** (sayfa 15: `Değişken`, `Grup`, `f`, `%`, `Cinsiyet`, `Kadın`, `64`… −7,3 … −8 pt). Yani Word'de tablo sütunları editörden yaklaşık 7,3 pt **sağda**, şekil açıklamaları 35,3 pt **sağda** (editör daha solda).
- **Kabul ölçütü:** yatay kayma ≤ 1,5 pt (ölçüm gürültüsü).

### HE-EW-06 — Sayfa altı dipnot: Word, dipnota yer açmak için gövdenin son satırlarını sonraki sayfaya iter, editör itmez · P3 · DOĞRULANDI (yeniden ölçüldü; kök neden bulunamadı)
- **Belge:** `orchestration/raporlar/CIKTI_KALITESI_2026-10-22.md`: ADÜ dolgu 2, sayfa 12 ve 16: Word, sayfa altındaki dipnota yer açmak için gövdenin **son 2 satırını** sonraki sayfaya itiyor (dipnot 751,7 pt'de), editör itmiyor; 28 ve 47 sayfalık kaymalar, sayfa sayısı bile farklı (editör 56, Word 60). "Neden bulunmadı."
- **Kod:** `engine/src/footnotes.js`: Word'ün gövde-dipnot boşluğu için **iki örnekte uydurulmuş sabitler** (`WORD_NOTE_CLEARANCE_PT = 12.9`, `EDITOR_NOTE_CLEARANCE_PT = 9.55`; yorum: "fitted on AFSÜ lh 1.2 = 13.3 pt and İYTE lh 1.0 = 9.85 pt"), `trailingSpace` kuralı yalnız `paragraphSpacing: "additive"` şablonlar için. Üçüncü bir şablonun dipnot davranışı bu sabitlerle öngörülemez.
- **Bu turda yeniden ölçüm (DOĞRULANDI):** `parity.mjs --templates adu-sagbil-master-tr-v1 --pad 2`, sayfa 12 (PDF satır konumları, pt; sayfa yüksekliği 841,9, alt kenar boşluğu 85 pt):

  | | gövdenin son satırları (alt kenar) | dipnot metni (üst) | son gövde satırının altı ile dipnot üstü arası |
  |---|---|---|---|
  | **Editör** | …, 669,6 / 690,3 / **711,0–724,3** (6 satır, sonuncusu `görünmelidir.`) | 746,2 | **21,9 pt** |
  | **Word** | …, 628,4 / 649,0 / **669,8–683,1** (4 satır) | 746,3 | **63,2 pt** |

  Word, 5. satırı (altı 703,6; dipnota uzaklık 42,7 pt) bile sığdırmıyor; editör 21,9 pt'ye kadar izin veriyor. Yani bu şablonda Word dipnot metninin üstünde **42,7 ile 63,2 pt arasında** bir boşluk istiyor; editörün ayırdığı ≈ 22 pt (`WORD_NOTE_CLEARANCE_PT` 12,9 + paragraf sonrası boşluk). İki motorda dipnot metninin kendisi aynı yerde (746,2/746,3) ve aynı satır sayısında (2); fark gövdenin dipnot üstündeki **sığma sınırında** (≈ 20–40 pt). İlk şüpheli: Word'ün dipnot alanına eklediği ayırıcı çizgi + önce/sonra aralığı ya da dipnot paragrafının satır aralığı; ayrıca dipnot göndermesinin kendi satırı (gönderme satırı dipnotla aynı sayfada kalmak zorunda). Çözülmedi.
- **Bu turun duyarlılık taraması:** bkz. §2.3.
- **Kabul ölçütü:** dolgu 0–7 taramasında dipnotlu sayfa sığdırma kararında kayma yok (ADÜ, AFSÜ LEE, AKÜ SBE, MCBÜ Tıp dahil).

### HE-EW-07 — Üretilen listeler (içindekiler/şekil/tablo dizini): ~1 pt satır kayması; uzun girdinin sayfa numarası ilk/son satırda · P3 · BELGEDEN + DOĞRULANDI (AKÜ ISG)
- **Belge:** `CIKTI_KALITESI_2026-10-22.md`: Tıp sayfa 4–5, ADÜ dolgu 7 sayfa 4–5'te ~1 pt; MCBÜ'de şekiller dizininde 3 satırlı uzun girdinin sayfa numarası editör/PDF'de **ilk satırda**, Word'de **son satırda** (27,6 pt). Neden kısmen bulundu: `leaderFlow` `"flex"` (varsayılan; sayfa numarası girdinin **ilk** satırında) ile `"inline"` (Word'ün sağ sekmesi gibi **son** satırda) farkı — `engine/src/generatedIndex.js:261–267`, `engine/src/engineCss.js:294,316`; hangi şablonda hangisinin gerektiği kaynağa göre belirlenmeli.
- **Bu turda yeni (DOĞRULANDI):** AKÜ İSG `check.mjs --target aku-isg-tezsiz-proje --word`: `engine-layout-pdf-default` **FAIL**, `layout_pdf_consistency`: `281 PDF glyph örneği; p7 toc:index-row:… PDF text absent 'BİLİMSEL' / 'ONAY' / 'ÖZET' / 'ABSTRACT' / 'ÇİZELGELER' / 'ŞEKİLLER' / 'SİMGELER'; p7 toc:index-row:toc-source-title:page:7:run:1: delta 60.5317 mm` — editörün yerleşim raporu içindekiler satırlarını sayfa 7'ye yazıyor, PDF'te sayfa 7'de bu satırlar yok (aynı şablonda `parity.mjs` 3 kayan sayfa: 7, 8, 9). Yani **içindekiler birden çok sayfaya yayıldığında yerleşim raporundaki sayfa ataması PDF'le uyuşmuyor**.
- **Kabul ölçütü:** `check.mjs --target aku-isg-tezsiz-proje --word` `FAIL=0`; üretilen liste satırlarının sayfa numarası konumu iki motorda eşit.

### HE-EW-08 — İYTE: alt başlık + sonraki paragraf ayrımı, 1/90 tablo satırı; **EEE bitirme projesinde 299 satır 35,4 pt yatay kaymış** · P3 · DOĞRULANDI
- **Kapsam:** dört İYTE LEE şablonunun hepsi: **8 kayan sayfa** (sayfa 22,23,28,29,42,43,…), %0,52, 1/90 tablo satırı başka sayfada. Belgedeki not: alt başlığın sonraki paragrafla birlikte kalması farkı (+9, +21 pt).
- **Yeni:** `iyte-eee-undergraduate-en-v1`: sayfa sayısı eşit, kayan sayfa 0, **299 satır yatay kayma, hepsi `+35,4 pt`** (editör − Word): `ABSTRACT`, `TABLE OF CONTENTS`, `ABBREVIATIONS`, `LIST OF FIGURES`, `1. INTRODUCTION`, `4.1. Subheading 1.1`, `4.1.1.1. Subheading 1.1.1.1`… Yani bütün başlıkların x konumu **editörde Word'den 35,4 pt sağda** (Word'de daha solda) — sistematik bir girinti farkı. **35,4 pt = 12,5 mm = `ENGINE_DEFAULT_TAB_STOP_MM`** (`engine/src/engineDefaults.js:19`, hem editör sekme hesabı hem DOCX `w:defaultTabStop` için kullanılıyor): büyük olasılıkla başlık numarasından sonraki sekme/asılı girinti Word'de farklı bir durağa oturuyor. Aynı 35,4/35,3 pt değeri otomatik üretilen DEÜ SBE şablonunda (6 satır) ve Ege Eğitim'de (şekil açıklamaları, `−35,3 pt`) da görüldü (HE-EW-05, §2.8).
- **Kabul ölçütü:** İYTE EEE yatay kayma ≤ 1,5 pt; LEE şablonlarında kayan sayfa ≤ eşik.

### HE-EW-09 — Tablo sütun konumları: AKÜ FBE ve MBG'de **115,3 pt**, MCBÜ/AKÜ ISG/Matematik'te "özgeçmiş" sayfasında 32,6 pt · P3 · DOĞRULANDI
- **Kapsam ve gözlem:** (işaret = editör − Word) `aku-mbg-lisans-tr-v1` sayfa 8 (`Frekans`, `Yüzde`, `Bilimsel Araştırma Projeleri`, `Ölçme, Seçme ve Yerleştirme Merkezi`: hepsi `+115,3 pt`: editörde sütunlar Word'den 115 pt sağda), `aku-fbe-master-tr-v1` sayfa 10 (`Frekans`, `Yüzde`: `+115,3 pt`) ve `aku-fbe-phd`; `aku-isg-tezsiz-proje`, `aku-matematik-lisans`, `aku-mbg-lisans`, `mcbu-lee-phd`: özgeçmiş sayfasında `": Afyonkarahisar, 01.01.1995"` satırı `−32,6 pt` (diğer satırlar +1,3 pt: iki nokta + sekme sonrası metin farklı konumda); `afsu-lee-*`: tablo açıklaması `Tablo 2.1. …` `+1,1 pt`, en büyük `32,6 pt`; `aku-sagbil-*` sayfa 8 `ÖNSÖZ` `−191,6 pt` (HE-EW-01'in sonucu olabilir).
- **Kabul ölçütü:** bu satırlar ≤ 1,5 pt.

### HE-EW-10 — Şekil konumu farkları (AFSÜ Tıp/DHF `37,9 pt`; AKÜ Felsefe `26,7`/`20,6`; İYTE EEE `17,7`) · P4 · DOĞRULANDI (nedeni belirsiz: eşleştirme hatası olabilir)
- Bkz. HE-TS-08. Diğer 29 şablonda şekil konumu farkı ≤ 0,1 pt ve şekil sayfaları eşit.

## 4. Şablon verisi, üretim hattı ve çıktı paketi (HE-SB, HE-DX)

### HE-DX-01 — Dışa aktarılan **bütün** DOCX dosyaları Open XML şema doğrulamasından geçmiyor (`settings.xml` eleman sırası) · P3 · DOĞRULANDI
- **Alan:** `engine/src/export.js:179` (`new Document({ defaultTabStop, evenAndOddHeaderAndFooters, features: { updateFields: false }, … })`), `docx` kütüphanesi 9.7.1 `Settings` sınıfı, `engine/src/docx/package.js` (`finalizeThesisDocx` `settings.xml`'i ayrıca yamıyor: `footnotePr` ve `doNotExpandShiftReturn` ekler).
- **Yeniden üretme:** `node engine/tools/parity.mjs --templates <id> --out <dir>` ile bir DOCX üret, sonra `powershell -File engine/tools/validate-openxml.ps1 -In <dir>/<id>/export.docx -Out x.json`. 34 kayıtlı şablonun hepsi için: `SDK_SCHEMA:FAIL errors=1`.
- **Hata iletisi (34/34 aynı):** `The element has unexpected child element 'http://schemas.openxmlformats.org/wordprocessingml/2006/main:defaultTabStop'. | /word/settings.xml | /w:settings[1]`.
- **Neden:** `settings.xml` çocuk sırası `displayBackgroundShape, evenAndOddHeaders, updateFields, defaultTabStop, footnotePr, …`; ECMA-376 şemasında `defaultTabStop`, `evenAndOddHeaders`'tan **önce** gelmelidir (`docx` kütüphanesi bunu ters yazıyor: `evenAndOddHeaders` önce itiliyor).
- **Etki:** Word bu dosyaları açıyor ve çiziyor (bu turdaki 34 Word dönüşümü), ancak şema-sıkı okuyucular (başka ofis paketleri, kurumsal doğrulayıcılar) reddedebilir; "Word'e aynen geçiyor mu" kapısında şema doğrulaması şimdilik yok.
- **İpucu:** `package.js` içinde `settings.xml` yazılırken elemanları şema sırasına yeniden diz (ya da kütüphaneyi yamala).
- **Kabul ölçütü:** 34 şablonun DOCX'inde `validate-openxml.ps1` `PASS`; bu doğrulama `parity.mjs`/`check.mjs` kapısına eklenir.

### HE-DX-02 — AFSÜ LEE: editör PDF'inde `SymbolMT` yazı tipi (madde işareti); kaynak-temelli yazı tipi kontrolü başarısız · P3 · DOĞRULANDI
- **Alan:** `engine/specs/afsu-lee.checks.json` `body-font` / `phd-body-font` (beklenen: yalnız `TimesNewRomanPSMT, …Bold, …Italic, …BoldItalic`); PDF yazı tipi seçimi `TxtNote/frontend/src/lib/systemPdfFonts.js`.
- **Yeniden üretme:** `node engine/tools/check.mjs --target afsu-lee --word` → `FAIL=2`. PyMuPDF ile `.test-tmp/validation/envanter-parity-pad0/afsu-lee-master-tr-v1/export.pdf`: `TimesNewRomanPSMT:70083, …, SymbolMT:6` — 6 simge, sayfa 3, kod noktası `U+F0B7` (Word'ün Symbol madde işareti). Aynı doğrulamadan geçen diğer 25 hedefte bu hata yok.
- **Kabul ölçütü:** `check.mjs --target afsu-lee --word` `FAIL=0`: ya madde işareti Times New Roman'da çizilir ya da kaynakta Symbol gerçekten isteniyorsa kontrol buna göre düzeltilir (kaynak belge incelenerek karar verilir).

### HE-SB-01 — Dokuz Eylül (FBE YL) ve Ege (Eğitim YL) şablonları kayıt defterinde yok; kaynak-temelli kontrolleri çalıştırıldığında çok sayıda başarısızlık · P2 · DOĞRULANDI
- **Alan:** `Butun-Sablonlar/Ege/Dokuz Eylül Üniversitesi/deu-fbe-master-tr-v1.json`, `Butun-Sablonlar/Ege/Ege Üniversitesi/ege-egitim-master-tr-v1.json`, `engine/src/templates/{deu-fbe,ege-egitim}.js` (var, `registry.js`'te **kayıtlı değil**: uygulamadan seçilemez, `parity/check/golden` araçları görmez).
- **Yeniden üretme:** `engine/src/registry.js`'e geçici olarak iki kayıt eklendi (`load: () => import("./templates/deu-fbe.js")…`), ölçümler alındı, `git checkout -- engine/src/registry.js` ile geri alındı (HEAD ile aynı doğrulandı). `node engine/tools/check.mjs --target deu-fbe --word` → **`FAIL=17 PASS=225`**; `--target ege-egitim --word` → **`FAIL=133 PASS=195`**. Örnek başarısızlıklar: `page-count-parity expected=equal page counts actual=pdf=17 word=15` (DEÜ); `pdf-heading-body-gap … page selector {'find': '^GİRİŞ', 'within': {'label': 'arabic'}} not found`, `inner-cover-line-1-pdf-baseline … no line matched`, `word-table-cell-left expected=55.633 actual=58.385 delta=2.752` (Ege).
- **Not:** "no line matched" türü başarısızlıkların bir kısmı şablonun değil, otomatik üretilen kontrol dosyasının (`engine/specs/<hedef>.checks.json`) beklentisinin (belirli metin/sayfa seçicisi) örnek belgeyle uyuşmamasından olabilir; ayrıştırma yapılmadı. Aynı kontrol türü kayıtlı 26 hedefte 24'ünde `FAIL=0`.
- **Kabul ölçütü:** iki şablon kayıt defterine eklenir (ya da bilinçli olarak kapsam dışı bırakılıp dosyaları taşınır) ve `check.mjs --word` ile `parity.mjs` kapıları geçer.

### HE-SB-02 — Üretilen iki şablonun künyesi yanıltıcı: `status: "official"`, `source.documentName: "official.docx"`, `verifiedAt: 2026-10-22` · P3 · DOĞRULANDI
- **Alan:** iki JSON'un `source` bloğu: `documentName "official.docx"` (gerçek kaynak dosya adı değil), `notes` standart "Source-derived Phase 4 pilot…" cümlesi, `verifiedAt 2026-10-22`. Resmî kaynak dosyalar `Butun-Sablonlar/Ege/Dokuz Eylül Üniversitesi/…` altında adlarıyla duruyor. `validateThesisTemplate` `official` için "belge adı + doğrulama tarihi" ister; bu alanlar üretici tarafından doldurulduğundan doğrulama, kaynağın gerçekten doğrulandığını kanıtlamıyor (HE-SB-01'deki kontroller başarısız).
- **Kabul ölçütü:** üretici `documentName` olarak gerçek kaynak dosya adını yazar; `verifiedAt` yalnız kaynak-temelli kontroller geçince verilir (yoksa `status: "pilot"` benzeri bir değer).

### HE-SB-03 — Kayıt defteri (`registry.js`) elle bakılan, şablon verisini tekrarlayan bir liste · P3 · DOĞRULANDI (bir kayıt tutarsız)
- **Alan:** her kayıt `id, templateVersion, universityId, universityName, instituteId, instituteName, degreeType, language, status, displayName` alanlarını şablon dosyasından **ayrıca** taşır. 34 kayıt şablon verisiyle karşılaştırıldı: yalnız `aku-sbe-phd-en-v1.instituteName` farklı (kayıtta yok, şablonda `Sosyal Bilimler Enstitüsü`); bunun sonucu HE-UI-04. Üretim hattı (`template-add.mjs`) kayıt satırını üretmiyor (GOREVLER.md 7. madde: "kayıt defteri indeksi şablon üst verisinden üretilsin").
- **Kabul ölçütü:** kayıt defteri şablon JSON'larından otomatik üretilir ya da bir birim testi iki kaynağı karşılaştırır.

### HE-SB-05 — Şablon üretim hattı yeni kaynaklarda çoğunlukla "bir insan gerekir" diye duruyor (6 yeni kaynaktan 1'i otomatik) · P2 · DOĞRULANDI (6 yeni kaynak) + BELGEDEN (sınırlar)
- **Ölçüm (§2.8):** daha önce kullanılmamış 6 resmî DOCX (Pamukkale ×2, Muğla, Dumlupınar, Dokuz Eylül SBE, Ege Sağlık): Word çizimi 6/6 ve kaynak çıkarma 6/6 başarılı; `template-add --identity` **yalnız 1/6'sında şablon üretti**; 5'i `NEEDS A PERSON` ile durdu (eksik: `tableCaption`, `figureCaption`, `bibliographyParagraph` ×3, `headingParagraphs`, `bodySourcePage`). Üretilen şablonun editör↔Word eşliği çok iyi (49/49, 51/51, 51/51 sayfa; 0 kayan sayfa), ama otomatik kontrol dosyası 15/226 başarısız.
- **Yeniden üretme:** `orchestration/motor/DOCX_EXTRACTION.md` komutları + `node engine/tools/template-add.mjs --extracted <hedef>.extracted.json --identity <kimlik.json> --write --out-root <dizin>`; kaynak yolları ve kimlikler §2.8 tablosunda.
- **Beklenen (sahibin hedefi):** yeni kaynak ek elle iş olmadan şablona dönüşür ("binlerce şablon"). **Gözlenen:** profil önerisi (`engine/tools/profile-suggest.mjs`) açıklama/kaynakça/başlık paragraflarını her kaynakta bulamıyor; her durma, profili elle tamamlamayı gerektiriyor.
- **Belgelenmiş diğer sınırlar (BELGEDEN, `GOREVLER.md` §0.7 ve `IKI_KAYNAK_DENEMESI_2026-10-22.md`):** yalnız DOCX şablon kaynakları (kılavuz-yalnız/PDF-yalnız kaynaklar, örn. Ege Fen, çoğu Tıp: desteklenmiyor); profil 3 kaynakla ayarlı (ADÜ + DEÜ FBE + Ege Eğitim); her şablonda 66 kaynak gerçeği şablon yoluna yerleştirilemiyor ve 86–109 `UNKNOWN` özellik grubu; dört doğrulama zorunluluğu (`page.numbering.enabled/position`, `toc.showPageNumbers`, `typography.lineSpacing.mode`) bilinçli varsayılansız; gömülü base64 logolar şablon verisinin %64'ü (2,7 MB); yeni kaynak başına depo ~13 MB büyüyor.
- **Kabul ölçütü:** 6 yeni kaynağın en az 5'i otomatik şablon üretir (ya da eksik roller için profil önerisi genelleştirilir); üretilen kontrol dosyasında gövde seçicisi sayfayı bulur (`pdf-body-font actual=[]` hatası gider).

### HE-SB-06 — Şablon klasörlerinde yalnız kaynak belgesi olan 11 üniversite var (bilinen eksik, hata değil) · P4 · DOĞRULANDI (bilgi)
- `Butun-Sablonlar/Ege/` altında 18 üniversite klasörü; yalnız 7'sinde (AKÜ, AFSÜ, ADÜ, DEÜ, Ege, MCBÜ, İYTE) şablon JSON'u var. Dumlupınar, Kütahya SBÜ, Muğla, Pamukkale, Uşak, Yaşar, Bakırçay, Demokrasi, Ekonomi, Kâtip Çelebi ve Tınaztepe'nin yalnız resmî kaynak dosyaları duruyor (backlog).


## 5. Uygulama: veri bütünlüğü (HE-VB)

Uygulama verisi Tauri'de SQLite (`TxtNote/src-tauri/src/db.rs`), tarayıcıda IndexedDB'dir (`TxtNote/services/local/index.ts`). Kayıt akışı: `TxtNote/frontend/src/app/App.jsx` her durum değişikliğinden 120 ms sonra **bütün** anlık görüntüyü (`saveSnapshot`) yazar; ayrıca not başına bir "yerel yedek şeridi" (`features/sync/useNoteSync.js`, 500 ms) `saveNote` çağırır. Rust tarafında `save_snapshot` önce `items`, `trash`, `workspaces` tablolarını **siler**, sonra anlık görüntüdeki satırları geri yazar; ardından `prune_orphans` anlık görüntüde olmayan not gövdelerini ve medya dosyalarını siler.

> Bu bölümdeki tarayıcı kanıtları gerçek uygulamayla (`http://127.0.0.1:5175/`, tarayıcı modu, IndexedDB) alındı: ilk ekranda "Notlara geç (test)" ile kayıt atlanır. Gerçek Tauri penceresiyle bu turda **denenmedi** (HE-SR-01); SQLite katmanı için Rust testiyle ayrıca doğrulandı.

### HE-VB-01 — Okunamayan bir öğe satırı yüklemede sessizce atlanır, sonraki ilk kayıtta öğe ve notu **kalıcı silinir** · P1 · DOĞRULANDI
- **Alan:** `TxtNote/src-tauri/src/db.rs` — `load_items` (satır ~382), `load_workspaces`, `load_trash_rows` (hatalı satırı `eprintln!` ile geçer); `save_snapshot_inner` (~1224), `prune_orphans` (~1029).
- **Yeniden üretme (Rust birim testiyle, geçici test eklenip geri alındı):** bellek-içi veritabanında iki öğe (`n1`, `n2`) ve iki not kaydedilir; `UPDATE items SET data='not json' WHERE id='n2'` ile `n2` bozulur; `load_shell_inner` çağrılır; dönen kabuk aynen `save_snapshot_inner`'a verilir (uygulamanın yaptığı gibi).
- **Beklenen:** bozuk satır kullanıcıya bildirilir ve silinmez (en azından yedeklenir).
- **Gözlenen:** yükleme `items.len()=1` (2 bekleniyordu); kayıt sonrası `items=1`, `notes=1`; `n2`'nin not gövdesi (`notes` satırı), sürümleri ve medya dosyası silindi. Bu kayıt, uygulamada ilk herhangi bir durum değişikliğinden (sekme açmak, not yazmak…) 120 ms sonra kendiliğinden çalışır; kullanıcı hiçbir silme işlemi yapmamıştır.
- **İpucu:** (a) bozuk satırları atlamak yerine hata ver ya da `quarantine` tablosuna taşı; (b) `prune_orphans` yalnız **kullanıcının sildiğini** silsin (silme olayı açık olsun), "anlık görüntüde yok = sil" varsayımı yüklemede atlanan satırı da siler; (c) `save_snapshot_inner`'ın "tabloları boşalt, yeniden yaz" yaklaşımı yerine satır bazlı upsert/delete.
- **Kabul ölçütü:** `db.rs` içine bu senaryoyu denetleyen kalıcı bir test eklenir ve geçer: bozuk satırdan sonra `save` yapıldığında `n2` ve gövdesi veritabanında kalır (ya da açık bir hata/karantina üretilir).

### HE-VB-02 — Bozuk tek bir not satırı bütün anlık görüntü yüklemesini bozar; sonra boş not üzerine yazılır · P1 · DOĞRULANDI
- **Alan:** `db.rs` — `load_notes_inner` (~507): `read_note_row(...)?` hatayı yukarı atar; kabuk tarafı (`load_items` vb.) ise atlar (tutarsız). `TxtNote/services/local/index.ts` — `loadNotes` hatayı yakalayıp `{}` döndürür; `App.jsx` `ensureNoteLoaded` bu durumda **boş not** (`asNote({title})`) oluşturur ve bir sonraki kayıt bozuk satırı bu boş notla `upsert_note` ile ezer.
- **Yeniden üretme (Rust testi):** iki not kaydedilir; `UPDATE notes SET data='{broken' WHERE id='n1'`; `load_snapshot_inner` ve `load_notes_inner` çağrılır.
- **Gözlenen:** `load_snapshot_inner` → `Err` (`ok=false`); `load_notes_inner(["n1"])` → `Err`; `load_notes_inner(["n2"])` → `Ok`. Yani `load_snapshot`/`load_snapshot_json` (uygulamanın yedek okuma yolu) tamamen başarısız olur ve JS tarafı tarayıcı aynasına düşer.
- **Beklenen:** bir satırın bozukluğu diğer notları etkilemez; bozuk satır kullanıcıya gösterilir ve üzerine yazılmaz.
- **Kabul ölçütü:** Rust testi: bozuk satır varken `load_snapshot_inner` `Ok` döner ve geri kalan notlar yüklenir; bozuk satır `save` sonrası da yedek kolonunda korunur; arayüz bozuk notu "okunamadı" olarak gösterir (boş not üretmez).

### HE-VB-03 — Metin/kod dosyası düzenlenince `encoding`, `languageId`, `languageLocked`, `fileId` kaybolur (UTF-16 dosya sessizce UTF-8'e döner) · P1 · DOĞRULANDI
- **Alan:** `TxtNote/frontend/src/features/sync/payload.js` (`buildNotePayload` `extras` yalnız `todos/entries/mindmap/researchData/flashcards/todoDaily` taşır; `noteFromPayload` bunları geri kurar) + `useNoteSync.js` `flushLocal` (`saveNote(noteId, {...noteFromPayload(payload), updatedAt, workspaceId})`) + `db.rs` `upsert_note` (`data` kolonunu **tümüyle** gelen JSON'la değiştirir) + `App.jsx` `asNote` (üçüncü bir alan beyaz listesi).
- **Yeniden üretme (uçtan uca):** (1) `node` betiğiyle UTF-16LE (BOM'lu) bir `.py` dosyası yazılır; (2) uygulamada (tarayıcı modu) "Yükle" ile eklenir ve açılır — durum çubuğunda `UTF-16LE · Python`; (3) metin alanına tıklanıp `Enter` + `print(2)` yazılır; (4) IndexedDB `txtnote-local-db/state/snapshot` içindeki notun anahtarları okunur: düzenlemeden 300 ms sonra `encoding` var, **1200 ms sonra** anahtarlar `title,content,todos,entries,mindmap,updatedAt,workspaceId,createdAt,revision,walletAddress` — `encoding`, `languageId`, `languageLocked`, `fileId` **yok**; (5) sayfa yenilenir, dosya yeniden açılır → durum çubuğunda `UTF-8 · Python`.
- **Beklenen:** düzenleme dosyanın kodlamasını ve elle seçilmiş dili korur ("Dışa aktar" aynı kodlamada yazar).
- **Gözlenen:** kodlama sessizce `utf-8` olur; "Dışa aktar" (`encodeFileText(text, encoding)`) dosyayı UTF-8 yazar (UTF-16 BOM'lu özgün dosya değişir). `languageLocked` (elle dil seçimi) kaybolur, dil dosya adından yeniden tahmin edilir. `payload.js` gidiş-dönüşü ayrıca bir Node betiğiyle denendi: `noteFromPayload(buildNotePayload(note))` → `encoding/languageId/languageLocked` `undefined`.
- **İpucu:** not alanı beyaz listesi **üç yerde** ayrı (App `asNote`, `buildNotePayload`/`NoteSyncPayload`, Rust `note_fingerprint`) ve birbiriyle uyumsuz. Tek bir şema kaynağı kurun; `saveNote` yerel yedek şeridinden değil, tam not nesnesinden beslensin.
- **Kabul ölçütü:** yukarıdaki senaryo tarayıcıda ve `cargo test`te geçer: düzenleme sonrası kayıtlı notta `encoding`, `languageId`, `languageLocked`, `fileId` korunur; yeniden açınca durum çubuğunda `UTF-16LE`.

### HE-VB-04 — "Kalıcı olarak sil" + Geri al (Ctrl+Z): öğe çöp kutusuna döner ama **içeriği boştur** · P1 · DOĞRULANDI
- **Alan:** `App.jsx` `deleteFromTrashForever` (~1500), `emptyTrash`, `toggleTrash`, süpürme: önce `undoHistory.begin("shell")` (geri alınabilir olduğunu söyler), sonra `forgetNotes(...)` — `forgetNote` → Rust `delete_media` (`notes`, `note_versions`, `media` satırları ve medya dosyası) **anında ve geri alınamaz** siler. Geri alma yalnız bellekteki kabuğu (`items/trash/notes` haritası) geri getirir; o oturumda belleğe yüklenmemiş notların gövdesi artık kalmamıştır.
- **Yeniden üretme (uygulamada):** not oluştur, içerik yaz, 2,5 sn bekle, sekmesini kapat, sayfayı yenile (gövde artık bellekte değil) → kenar çubuğunda notun `…işlemleri` menüsünden **Sil** → Çöp kutusu → "kalıcı olarak sil" → onayda "Kalıcı olarak sil" → boş alana tıkla → **Ctrl+Z** → öğe çöp kutusunda yeniden görünür → "geri yükle" → not açılır.
- **Gözlenen:** açılan notta `0 kelime · 0 paragraf · 0 harf` (içerik yok). Karşılaştırma: aynı akış "kalıcı sil" olmadan (yalnız Sil → geri yükle) içeriği korur (`ÖNEMLİ İÇERİK 123`). Not bellekteyken (yenileme yapılmadan) Ctrl+Z içeriği de geri getirir; yani hata yalnız gövdesi yüklü olmayan notlarda ve medya dosyalarında.
- **Beklenen:** ya Ctrl+Z kalıcı silmeyi geri **almaz** (ve arayüz bunu açık söyler), ya da kalıcı silme gerçekten geri alınabilir (silme ertelenir).
- **Kabul ölçütü:** yukarıdaki adımlar sonunda açılan notun içeriği özgün içerikle aynıdır, ya da "kalıcı sil" geri alma yığınına hiç girmez; medya (dosya) içeren bir öğe için de aynı doğrulama yapılır.

### HE-VB-05 — Kayıt hataları kullanıcıya hiç bildirilmez · P1 · DOĞRULANDI (tarayıcı modu); Tauri yolu KOD OKUMA
- **Alan:** `services/local/index.ts`: `enqueueWrite` (`.catch(console.error)`), `writeSqliteSnapshot` (iki yazma denemesi de başarısız olursa yalnız `console.error`), `saveNote` (`catch → console.error`), `forgetNote` (`catch {}`). `App.jsx` `persistNow` bunlara `await` eder ama hata dönmez; `persistNeededRef` yazmadan önce `false` yapılır, bir sonraki değişikliğe kadar yeniden denenmez.
- **Beklenen:** disk dolu, SQLite kilitli, Tauri komutu reddedildi vb. durumlarda kullanıcıya görünür bir uyarı ve yeniden deneme.
- **Koddan:** Tauri yolunda da başarısız yazma sessizdir (`invoke` reddi yalnız `console.error`); uygulama "kaydedildi" varsayar. Tauri yolunu yeniden üretmek için `invoke`'un reddedilmesi gerekir (gerçek uygulamada denenmedi).
- **Yeniden üretme (tarayıcı modu, uygulama açık):** not oluştur; sayfada `Storage.prototype.setItem` ve `IDBObjectStore.prototype.put` `QuotaExceededError` fırlatacak biçimde değiştirilir; nota metin yazılır, 3 sn beklenir. **Gözlenen:** ekranda hiçbir hata göstergesi yok (gövde metninde "kaydedilemedi/hata" yok); yalnız konsolda `localStorage yazılamadı`, `IndexedDB yazılamadı` (`console.error`). Yani depolama doluyken kullanıcı yazmaya devam eder ve veri kaydedilmez.
- **Kabul ölçütü:** `invoke` reddi simüle edilen bir birim testi: `saveSnapshot` hata bildirir/arayüz durumu `kaydedilemedi` olur ve bir sonraki değişiklikte yeniden denenir.

### HE-VB-06 — Her yazma duraklamasında bütün veritabanı yeniden yazılır; kapanışta 1,5 sn'lik yarış · P3 · DOĞRULANDI (Rust ölçümü, debug derleme); kapanış yarışı KOD OKUMA
- **Alan:** `App.jsx` (~735: 120 ms sonra `persistNow`; ~800: pencere kapanışında `Promise.race([persist+flush, 1500 ms])` sonra `appWindow.destroy()`), `db.rs` `save_snapshot_inner` (bütün `items/trash/workspaces` sil + yaz; belleğe yüklü bütün notlar `upsert_note`).
- **Ölçüm (geçici Rust testi, `cargo test` debug profili, dosya tabanlı SQLite, bu makine):** 2000 öğe + 300 not × 200 KB (60 MB) ilk kayıt **3418 ms**; uygulamanın her yazma duraklamasında yaptığı çağrı (2000 öğe satırı yeniden yazılır, bellekte 3 not gövdesi) 10 turda **222–331 ms** (medyan ≈ 232 ms); aynı notun tek `upsert_note` ile yazılması **6 ms**. Maliyet notun boyutundan değil toplam öğe sayısından geliyor. (Debug derlemesi; yayın derlemesi daha hızlı olur — oran korunur.)
- **Beklenen:** veri boyutu arttıkça yazma maliyeti sabit kalır (satır bazlı), kapanışta kayıt tamamlanmadan pencere kapanmaz.
- **Gözlenen (koddan):** maliyet toplam öğe sayısıyla büyür; 1,5 sn'den uzun süren bir kayıt (büyük not + gömülü görseller) yarım kalabilir. **Ölçülmedi** (HE-SR-01'deki gecikme ölçümü bununla ilişkili).
- **Kabul ölçütü:** 80–120 sayfalık MCBÜ tezi + 500 öğeli çalışma alanında `persistNow` süresi ölçülür (medyan/p95) ve kapanış yarışı kaldırılır ya da kayıt bitene kadar beklenir.

### HE-VB-07 — ZIP sınırları açıldıktan **sonra** denetlenir (zip bombası bellek tüketir) · P3 · DOĞRULANDI
- **Alan:** `TxtNote/frontend/src/lib/zipImport.js` `extractZipEntries`: `unzipFromFflate(data)` bütün girdileri bellekte açar; `UPLOAD_ZIP_MAX_UNCOMPRESSED` (200 MB), `UPLOAD_ZIP_MAX_ENTRIES` (2000), `UPLOAD_ZIP_MAX_RATIO` (100) ancak bundan sonra denetlenir. 80 MB'a kadar sıkıştırılmış arşiv kabul edilir.
- **Yeniden üretme (Node, `extractZipEntries` doğrudan):** `fflate.zipSync` ile 400 MB sıfırdan 409 424 baytlık (oran 1024) bir ZIP üretilir ve `extractZipEntries(bomb, {compressedSize})` çağrılır. **Gözlenen:** sonuç doğru biçimde reddedilir (`Arşiv açılınca çok büyüyor. İçindekiler yüklenmedi.`) ama bu, **918 ms** ve **≈ 861 MB tepe RSS** sonra; yani 0,4 MB'lık dosya 0,86 GB bellek tutuyor. 80 MB'lık (izin verilen en büyük) bir sıkıştırılmış dosyada aynı oranla bellek GB'larca olur; WebView'da sekme çökebilir.
- **Beklenen:** sınırlar açmadan önce (fflate `unzip` `filter` seçeneğinde `originalSize`) uygulanır.
- **Kabul ölçütü:** 100 KB'lık, 1 GB'a açılan bir test ZIP'i bellek ayırmadan reddedilir (birim testi `zipImport.test.js`).

### HE-VB-08 — `upsert_note` revizyonu yalnız bazı alanlar değişince artırır · P4 · DOĞRULANDI
- **Alan:** `db.rs` `note_fingerprint` (title, content, todos, entries, mindmap, vault, researchData, flashcards). Rust testiyle: yalnız `languageId`/`encoding` değişen kayıtta `revision` 1 → 1 kalır (veri yine yazılır). Revizyonla çalışacak gelecekteki eşzamanlama bu değişiklikleri görmez. HE-VB-03 ile birlikte tek not şeması altında çözülmelidir.

### HE-VB-09 — Tarayıcı modunda "en zengin" anlık görüntü seçimi yeniliği değil sayıyı esas alır · P4 · KOD OKUMA
- **Alan:** `services/local/index.ts` `richness`/`pickRichest`: iki aynadan (localStorage, IndexedDB) öğe sayısı büyük olan seçilir. `localStorage` kotası dolup yazma sessizce başarısız olursa eski (daha çok öğeli) ayna, silinen öğeleri geri getirip yeni düzenlemeleri kaybettirebilir. Masaüstü (SQLite) yolunu etkilemez.

### HE-VB-10 — Not sürüm geçmişi Tauri'de de `localStorage`'a yazılır (kota) · P4 · KOD OKUMA
- **Alan:** `services/local/index.ts` `appendVersion` → `writeLocalStorageVersions(store)` her sürümde 50'ye kadar yük (kota hatası sessiz `catch`). Gerçek kaynak SQLite olduğundan yan etkisi yalnız gereksiz şişme ve `current[0]?.hash` kıyasının yanlış sonuç vermesi.

### HE-VB-11 — Geri alma yığını her adımda **bütün not nesnelerinin** önce/sonra kopyasını tutar (görselli tezde bellek) · P3 · KOD OKUMA
- **Alan:** `TxtNote/frontend/src/lib/undoHistory.js` `diffNotes`/`diffSnapshots` (`notes[id] = { before: before[id], after: after[id] }` — notun tamamı), `hooks/useUndoHistory.js` (`HISTORY_LIMIT = 100`; yazma patlamaları 500 ms ile birleşir, biçim/yapıştırma/eylem anında yeni adım). Tez notunun `content` dizgesi (gömülü base64 görselleri dahil, `THESIS_IMAGE_MAX_EDGE = 1200` px) her değişimde yeni bir dizgedir; 100 adım = 100 ayrı sürüm.
- **Tahmin (ölçülmedi):** 5 MB'lık bir tez içeriğinde yığın yüzlerce MB bellek tutabilir. Doğrulamak için: gerçek uygulamada görselli büyük bir tez açıp 100 yazma patlaması üretip `Performance.getMetrics` `JSHeapUsedSize` okunmalı.
- **Kabul ölçütü:** yığın bayt bütçesiyle sınırlanır ya da not içeriği için satır/yama (diff) saklanır; 100 adımlık yazma sonrası yığın büyümesi ölçülüp raporlanır.


## 6. Uygulama: arayüz mantığı ve ürün-içi artıklar (HE-UI)

### HE-UI-04 — Şablon seçicide "Enstitü" listesinde AKÜ Sosyal Bilimler boş görünür; "Tez türü"nde `sanatta-yeterlik` ham kimlikle yazılır · P3 · DOĞRULANDI
- **Alan:** `features/templates/ThesisCreator.jsx` (enstitü adı `Map` ile tekilleştirilirken **son** kaydın adı kalır); `engine/src/registry.js` içinde `aku-sbe-phd-en-v1` kaydında `instituteName` **yok** (diğer 33 kayıtta var). `labelForDegree` yalnız `undergraduate/master/phd/specialization` bilir.
- **Yeniden üretme (uygulamada):** Ekle → "Tüm şablonları keşfet" → Üniversite `aku` → Enstitü seçeneklerini oku.
- **Gözlenen:** `Enstitü` seçeneği `sbe=` (**boş etiket**); `Tez türü` seçenekleri `master=Yüksek lisans`, `phd=Doktora`, `sanatta-yeterlik=sanatta-yeterlik`. (`34/34` şablon bu arayüzden oluşturulabildi, konsolda hata yok: `templateIdOnPage` her seferinde doğru çıktı.)
- **Kabul ölçütü:** her kayıt için `instituteName` dolu olduğunu denetleyen birim testi (kayıt defteri ↔ şablon alanları karşılaştırması da: bu turda yalnız `aku-sbe-phd-en-v1.instituteName` farklıydı); seçicide boş etiket yok; `sanatta-yeterlik` için Türkçe etiket.

### HE-UI-05 — "Word içe aktar" ve "PDF içe aktar" düğmeleri ribbon'da duruyor; sahibin kararı (20.10.2026): şimdilik dışarıdan `.docx` içe aktarma özelliği olmayacak · P4 · DOĞRULANDI
- **Alan:** `features/editor/ribbon/FileTab.jsx` (ThesisEditor `onImport` yalnız `onDocumentChange` verilince): gerçek uygulamada tez açıkken **Dosya** sekmesinde `Word içe aktar | PDF içe aktar | PDF | Word | Yazdır` görünür.
- **Not:** GOREVLER.md'deki "Askıda" bölümü içe aktarma kodunun `engine/src/` içinde durduğunu söylüyor ama arayüzden de erişilebildiğini söylemiyor. Karar mı kod mu doğru, sahibine sorulmalı; düzeltme iki yönde de basittir (düğme kaldır / karar belgesini güncelle).

### HE-UI-06 — Pagination "sabit nokta" döngüsü sınırı aşılırsa dışa aktarma engellenir · P4 · KOD OKUMA
- **Alan:** `ThesisEditor.jsx` (~365–545): `INDEX_ITERATION_CAP`, `CONFIRM_FAILURE_CAP = 300`, 30 sn `MATH_WAIT_MS`; sınır aşılınca `Dizin/dipnot sayfalaması kararlı hale gelmedi …; dışa aktarma engellendi` mesajı. Yayında tasarım gereği; ancak bu sayfalama ölçümüne bağlı olduğundan bilinmeyen bir içerik "dışa aktarılamaz" olabilir. Bu turdaki 34 şablonlu ölçümde (varsayılan örnek metin) hiçbirinde tetiklenmedi.

## 7. Güvenlik sertleştirme (HE-GV)

> Bunlar savunma-derinliği bulgularıdır. Masaüstü derlemesinde `script-src 'self'` CSP'si inline betik çalışmasını engeller (CSP `tauri.conf.json`'da); bulguların hepsi **tarayıcı/geliştirme** ortamında (CSP yok) ya da CSP'nin aşıldığı bir durumda sömürülebilir. Tauri penceresinde sömürülmeyi bu turda sınama imkânı olmadı.

### HE-GV-01 — `sanitizeHtml` `javascript:` süzgeci sekme/satır sonu/C0 karakteriyle atlatılır · P3 · DOĞRULANDI
- **Alan:** `TxtNote/frontend/src/lib/richText.js` `sanitizeHtml` (~69): `urlAttrs` değeri `^\s*(javascript|vbscript|data:…)` ile denetlenir. Tarayıcı URL'yi ayrıştırırken sekme, satır sonu ve baştaki C0 kontrol karakterlerini siler, bu yüzden bunlar süzgeci geçer.
- **Yeniden üretme (Chrome, geliştirme sunucusu):** `/tests/thesis.html` sayfasında `import("/src/lib/richText.js")` ile `sanitizeHtml('<a href="jav&#x09;ascript:alert(1)">x</a>')` → çıktı bağlantıyı **olduğu gibi** korur (`href="jav\tascript:alert(1)"`). `jav&#x0A;ascript:` ve `&#x01;javascript:` aynı. Çıktı bir `div`e `innerHTML` ile konup bağlantıya tıklanınca betik **çalıştı** (`window.__x === 1`).
- **Ayrıca:** `child instanceof HTMLElement` denetimi SVG/MathML öğelerini hiç gezmez (`banned` kümesindeki `SVG`/`MATH` etiket adları SVG öğelerinde küçük harfle gelir ve hiç denetlenmez); `<svg onload="…">` ve `<math><mi xlink:href="javascript:…">` süzgeçten **olduğu gibi** geçer (çalışması bu sınamada gözlenmedi: `innerHTML` ile eklenen `svg onload` ateşlenmedi).
- **Beklenen:** kara liste yerine izin listesi (DOMPurify benzeri); URL'ler `new URL()` ile çözülüp şema denetlenir.
- **Kabul ölçütü:** `richText.test.js` içinde yukarıdaki üç girdi + `<svg onload>` + `<a href="&#x6A;avascript:…">` için çıktıda `href`/`on*` kalmaz.

### HE-GV-02 — Belge derleme ve yazdırma yolu notun HTML'ini süzmeden taşır · P3 · DOĞRULANDI
- **Alan:** `engine/src/engine.js` `compileThesisDocument` → `section.html`; `buildThesisPrintHtml` (`engine.js:421`); `ThesisEditor.jsx:853` `frame.srcdoc = buildThesisPrintHtml(...)` aynı kökenli, kum havuzsuz bir `iframe`.
- **Yeniden üretme (Node):** kayıt defterinden MCBÜ şablonu; `compileThesisDocument(t, {}, "B", '<p>a</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(2)">l</a>', [])` → `mainContent` bölümünün `html`'inde ve `buildThesisPrintHtml` çıktısında `<script`, `onerror`, `javascript:` **kalır**.
- **Etki:** normalde içerik düzenleyiciye yüklenirken `ensureHtml → sanitizeHtml` ile temizlenir; ama saklanan (eşzamanlanan/içe aktarılan/eski) bir not doğrudan yazdırılırsa temizlik atlanır (CSP yoksa betik çalışır).
- **Kabul ölçütü:** yazdırma ve DOCX/PDF yolları da aynı izin listesinden geçer; `engine` testi yukarıdaki girdiyle `<script` içermeyen çıktı bekler.

### HE-GV-03 — Güncelleyici uç noktası `http://localhost:3000` ve `dangerousInsecureTransportProtocol: true` üretim yapılandırmasında · P2 · KOD OKUMA
- **Alan:** `TxtNote/src-tauri/tauri.conf.json` `plugins.updater.endpoints`, `dangerousInsecureTransportProtocol`. Yerel bir geliştirme sunucusuna (`scripts/serve-updates.mjs`) yönelik ayardır; dağıtılan her kurulum `localhost:3000`'e güncelleme sorar ve HTTP'ye izin verir (imza doğrulaması var; açık anahtar yapılandırmada). Güncelleme anahtarı/imza mantığına bu belgede bakılmadı.
- **Kabul ölçütü:** yayın yapılandırması ayrı bir dosyada (`tauri.release.conf.json`) gerçek HTTPS uç noktasıyla; `dangerousInsecureTransportProtocol` yok.

## 8. Test ve kapı altyapısı (HE-TS)

### HE-TS-03 — Birim testlerinin bir kısmı makine yazı tiplerine bağlı, yoksa **sessizce atlanır** · P3 · KOD OKUMA + DOĞRULANDI (bu makinede 0 atlanan)
- **Alan:** `TxtNote/frontend/src/lib/thesisSystemFonts.test.js`, `thesisPdfFonts.test.js` (`{ skip: !haveCoreFonts }`, `skip: process.platform !== "win32"`, `existsSync("C:/Windows/Fonts/…")`). Bu makinede 1137/1137, **0 atlanan**; yazı tipi bulunmayan bir makinede/CI'de aynı testler "geçti" görünür ama PDF yazı tipi gömme doğrulanmamış olur. `thesisFootnoteDocxParagraphs.test.js` de `skip: !existsSync(input)` ile bir girdi dosyasına bağlı.
- **Kabul ölçütü:** atlanma sayısı raporlanır ve CI'de 0 değilse başarısız sayılır; ya da yazı tipi bağımlılığı açıkça işaretlenir.

### HE-TS-04 — Tür denetimi, lint ve CI yok; belgelenen "TypeScript koruması" çalışmıyor · P3 · DOĞRULANDI
- `TxtNote/jsconfig.json` `strict: true`, `.ts/.tsx` dosyaları (`TxtNote/types/index.ts`, `services/**/*.ts`, `RegisterPage.tsx`) var; makinede `tsc`, `eslint`, `prettier` **kurulu değil** (ne `node_modules/.bin` ne PATH). Hiçbir betik tür denetimi çalıştırmıyor; Vite yalnız tür siliyor.
- `TxtNote/services/http/index.ts` başlık yorumu: "Keep the mock and this file symmetrical … the TypeScript compiler will make you add it to the other — that is the guard rail" — derleyici hiç çalışmadığı için bu koruma yok.
- Depoda `.github/` (CI) yok; `package.json`'larda `lint`/`typecheck` betiği yok. Üretim derlemesi (`vite build`) tek otomatik kapı.
- **Kabul ölçütü:** `typecheck` ve `lint` betikleri, birim+araç testleri+derleme'yi koşan tek bir CI iş akışı.

### HE-TS-05 — Open XML doğrulayıcısı Office'in "Power Query" eklentisindeki bir DLL'e bağlı · P4 · DOĞRULANDI
- **Alan:** `engine/tools/validate-openxml.ps1`: SDK yolu sabit `C:/Program Files/Microsoft Office/root/Office16/ADDINS/Microsoft Power Query for Excel Integrated/bin/DocumentFormat.OpenXml.dll`. Bu eklenti her Office kurulumunda yoktur; yoksa `UNAVAILABLE`. Bu turda kullanılabildi (34 doğrulama koştu).
- **Kabul ölçütü:** SDK paketi depoya/yerel pakete alınır ya da yol bir ortam değişkeninden okunur.

### HE-TS-06 — `devserver.sh stop/restart` makinedeki **bütün** `vite` süreçlerini sonlandırır · P3 · KOD OKUMA
- **Alan:** `engine/tools/devserver.sh` `stop()`: `ps -eo pid,comm,args | awk '$2=="node" && /vite/ {print $1}' | kill`. Kullanıcının başka bir projedeki ya da `5173`'te çalışan geliştirme sunucusunu da kapatır; `parity.mjs` sunucu bulamazsa `devserver.sh start` çağırır (yalnız `start`).
- **Kabul ölçütü:** yalnız PID dosyasındaki süreç ve onun çocukları kapatılır.

### HE-TS-07 — Masaüstü kabul testi (`desktop-smoke.mjs`) ve gerçek kurulum paketi bu turda çalıştırılmadı; yerel kurulum paketi eski · P2 · DOĞRULANDI (bilgi)
- `TxtNote/dist-installer/` (gitignore'da) `TxtNote_0.1.0_x64-setup.exe` **5 Ekim 2026** tarihli (`BUILD.txt: builtAt=2026-10-05T11:45:14Z`, `packagedSmoke=passed` o günün kodu için); mevcut kod ondan 17 gün ve 14 commit (+ işlenmemiş çalışma ağacı) ilerde. `C:/Users/CASPER/AppData/Local/txtnote-cargo-target/{debug,release}` altında `txtnote.exe` (debug 19 Ekim, release 25 Eylül) var. Bunlarla hiçbir sınama yapılmadı.
- **Kabul ölçütü:** güncel koddan kurulum paketi üretilip `npm run desktop:smoke` geçer.

### HE-TS-08 — `parity.py` şekil açıklamalarını yanlış eşliyor · P4 · BELGEDEN (+ bu turda tutarsız değerler görüldü)
- `orchestration/raporlar/CIKTI_KALITESI_2026-10-22.md`: `captions.figure` ayrıntı bölümü yanlış satırları eşliyor (Şekil 1 için 17 pt fark; PDF'de doğrudan ölçüm 0,1 pt); `figureMaxOffsetPt` özet metriği doğru kabul ediliyor. Bu turun özet tablosunda `afsu-tip` `37,9`, `aku-felsefe-lisans` `26,7`, `aku-felsefe-seminer` `20,6`, `iyte-eee` `17,7` pt şekil konum farkı gösteriyor (diğer 30 şablonda ≤ 0,1); bunların gerçek mi, eşleştirme hatası mı olduğu ayrıştırılmadı.
- **Kabul ölçütü:** `captions.figure` eşleştirmesi şekil numarası + sayfa ile yapılır; dört şablondaki farkların kaynağı belirlenir.

### HE-TS-09 — Test sayıları ve belge ifadeleri geride kalmış (kayıt) · P4 · DOĞRULANDI
- `orchestration/GOREVLER.md` "Durum" bölümü bazı satırlarda 20.10 (1130 test), 22.10 (1133, 1137) sayılarını ardışık veriyor; yeni birim sayısı bu turda 1137. `engine/tools/test_template_add.mjs` 8 test (başka belgede 19 ve "1133" kaydı birleşik sayıdır). Bu bir hata değil, düzeltmeden önce sayıların yeniden okunması gerektiği uyarısıdır.


## 9. Derleme, dağıtım ve masaüstü (HE-SR)

### HE-SR-01 — Gerçek Tauri uygulamasından PDF/Word alma ve yazarken gecikme **hiç ölçülmedi** · P2 · BELGEDEN (+ bu turda da yapılmadı)
- `orchestration/GOREVLER.md` §1: "Gerçek masaüstü uygulamasından PDF hiç alınmadı; Liberation Serif yalnız Rust izin listesi birim testiyle doğrulandı." Bu turda da Tauri penceresi açılmadı (yalnız `cargo test --lib`, `cargo clippy`, tarayıcı modu). Bu yüzden WebView2'ye özgü davranışlar (CSP, `convertFileSrc`, `write_academic_file`, `read_system_font_family` ile yazı tipi okuma, indirme klasörü) **sınanmadı**.
- **Kabul ölçütü:** uygulamadan MCBÜ şablonuyla PDF ve DOCX alınır; PDF'te gömülü yazı tipleri ve sayfa sayısı doğrulanır; sonuç bir rapora yazılır.

### HE-SR-02 — Yazarken gecikme (80–120 sayfalık tez): her tuşta uzun görev, kabul bütçesi yok · P3 · DOĞRULANDI (tarayıcı ölçümü) + BELGEDEN (bütçe)
- **Ölçüm (§2.7, Chrome 155 başsız, yalnız editör, kayıt katmanı yok):** 34 sayfada gecikme medyan 41 ms (p95 62 ms, uzun görev 11); **76 sayfada medyan 64–65 ms, p95 90–123 ms, en büyük 175 ms, 65–67 uzun görev, en büyüğü 233 ms**; 97 sayfada medyan 78 ms, p95 98 ms, 66 uzun görev (en büyük 218 ms, toplam 5,3 sn). Gecikme sayfayla büyüyor.
- `GOREVLER.md` §2: önceki ölçümler yalnız 180 sayfalık içe aktarılmış belgeydi; sayısal hedef (bütçe) kullanıcıyla onaylanmadı (uydurulmaz). Kapanış için gereken: sabit makine/yazı tipi/kod sürümüyle, kullanıcının onayladığı bütçe, ≥20 gerçek yaz/geri al örneği, medyan/p95; doğruluk ve yazı tipi beklemesi devre dışı bırakılmaz. Bu turdaki ölçümde Tauri WebView2, tam uygulama (kayıt + eşzamanlama şeritleri) ve gerçek tez içeriği yok.
- **Kabul ölçütü:** sahibin onayladığı bütçe altında (örn. p95) ölçüm; gerekirse tuş başına derleme/sayfalama ertelenir ya da artımlı yapılır (`ThesisEditor.jsx` 200 ms ertelemeli yeniden derleme zaten var; uzun görevlerin hangi aşamadan geldiği ayrıştırılmadı).

### HE-SR-03 — Paket içeriği: yinelenen parça, gömülü yazı tipleri, şablon görselleri · P4 · DOĞRULANDI
- `vite build` çıktısı (13 MB `assets/`): `pdf-BhN2FHFp.js` ve `pdf-CgcdDLmG.js` **birebir aynı içerik** (md5 `b39a473e…`, 430,95 kB) iki ayrı ad ve iki kez paketlenmiş; `Tinos-*.js` dört dosya (695–797 kB) yazı tiplerini base64 olarak JS içinde taşır (`vite.config.js` `assetsInlineLimit` bilinçli: CSP `connect-src` `.ttf` getirmeyi engelliyor); `afsu-lee-*.js` 629 kB, `afsu-eczacilik-proje-*.js` 419 kB (gömülü base64 logo/kapak görselleri); `pdf.worker.min` 1,27 MB. `services/index.ts` mock yedekleri (`./mock/fixtures`) üretim paketine giriyor (başlık yorumu "kept out of the startup bundle" diyor).
- **Kabul ölçütü:** yinelenen `pdf` parçası tekilleşir; mock fixture'ları üretim girişinden çıkar; derleme uyarısı "500 kB üstü parça" bilinçli kabul edilmiş ya da bölünmüş olur.

### HE-SR-04 — Sayfalama, Chromium'un yeni CSS özelliklerine dayanıyor; en düşük WebView2 sürümü belirtilmemiş · P3 · KOD OKUMA + DOĞRULANDI (Chrome/Edge 155)
- `pageLayout.js`/`footnotes.js`/`ThesisSectionPages.jsx`: `column-wrap`, `column-height`, `padding-bottom: attr(data-x px)` (tipli `attr()`), `box-decoration-break: clone`, `text-box-trim`. Chrome 155 ve Edge 155'te **varsayılan açık** (`CSS.supports(...)` hepsi `true`, bayraksız); fakat araç betikleri (`export.mjs`, bazı e2e) yine de `--enable-blink-features=MulticolColumnWrapping` verir. `tauri.conf.json` `bundle.windows.webviewInstallMode`/en düşük WebView2 sürümü tanımsız; desteklemeyen çalışma zamanında editör "sürekli yüzey" yedeğine düşer ve bu yedek yolun PDF/DOCX çıktısı **hiç sınanmadı**.
- **Kabul ölçütü:** en düşük WebView2 sürümü belirlenip yapılandırmaya yazılır; desteksiz motorda uygulama açık bir uyarı verir ve dışa aktarmayı engeller (ya da yedek yol sınanır).

## 10. Depo, belge ve düzen (HE-DP)

### HE-DP-01 — Çalışma ağacı işlenmemiş; bu belgenin taban aldığı durum commit'te yok · P2 · DOĞRULANDI
- `git status`: **537** girdi (366 silinmiş/taşınmış, 42 değişmiş, 129 izlenmeyen). Yeniden düzenleme (şablon verisi + belge taşıma), `pageLayout.js` düzeltmeleri, DEÜ/Ege şablonları ve 62 üretilmiş fixture dosyası (HE-DP-02) hep bu ağaçta. Sahibi bunları ayrı commit'ler olarak işlemeyi planlıyor; düzeltmeye başlamadan önce bunun yapılmış olması gerekir.

### HE-DP-02 — Depo ağırlığı: izlenen 1 GB üretilmiş fixture; `.git` içinde 88 MB çöp · P3 · DOĞRULANDI
- `TxtNote/frontend/tests/generated/`: HEAD'de **80 izlenen dosya, 1010 MB** (tek tek ~50 MB'a kadar: `SRC09.fixture.json`, `PARETO14_*`, `KERN14_*`…); çalışma ağacında dizin **2,1 GB** (+62 izlenmeyen dosya). HEAD'in toplam izlenen boyutu 1291 MB (2083 dosya); `.git` paketleri 585 MiB.
- `git count-objects -vH`: `garbage: 59`, `size-garbage: 88,56 MiB` — `.git/objects/*/tmp_obj_*` yarım kalmış nesne dosyaları (yarıda kesilmiş git işlemlerinden).
- **Kabul ölçütü:** üretilmiş fixture'lar depodan çıkar (gerektiğinde `make-fixture.mjs`/komutla yeniden üretilir) ya da LFS'e alınır; `git gc --prune=now` çöpü temizler; `.gitignore` bu dizini kapsar.

### HE-DP-03 — Belge çürümesi: yönlendirme bağlantılarının çoğu kırık · P4 · DOĞRULANDI
- `orchestration/` altındaki 240 `.md/.mdc` dosyasında (betikle sayıldı): 192 göreli bağlantıdan **114'ü kırık**; backtick içinde yazılan 383 depo yolundan **232'si mevcut değil**. Çoğu, daha önce silinmiş kanıt ağaçlarına (`orchestration/engine-work/`, `orchestration/reports/`, `orchestration/validation/`, `MISSION.md`, `Missions.md`, `AGENTS.md`, `orchestration/plans/`, `artifacts/<hedef>/…`) işaret eder. Güncel rehber olan `motor/README.md` (13 kırık yol, 1 kırık bağlantı) ve `motor/CAPABILITIES.md` (13 kırık yol, 2 kırık bağlantı) dahildir. `BASLA.md`, `GOREVLER.md`, `KANIT.md`'de kırık bağlantı yok.
- Başka eskimiş ifadeler: `orchestration/BASLA.md` kural 2'de kanıt klasörü "`reports/`" (gerçek: `raporlar/`); `motor/ALTYAPI.md` şablonların `templates/data/<kimlik>.json`'da olduğunu söyler (gerçek: `Butun-Sablonlar/…`); `motor/CHECKER.md` `artifacts/<id>/source/reference/`, `validation/<id>/`, "AGENTS.md 24A", `orchestration/plans/MOTOR.md` anar.
- **Kabul ölçütü:** kırık bağlantı ve yol sayısı 0 (eski kanıt raporlarında "tarihsel not" etiketiyle bırakılacaklar açıkça işaretlenir).

### HE-DP-04 — `.gitattributes` yok; satır sonları karışık · P4 · DOĞRULANDI
- `core.autocrlf=true` (bu makine); dizin (index) tümü LF, çalışma kopyasında 245 dosya CRLF, 23 dosya **karışık** (CRLF+LF), 87 dosya `none` (ikili). `git` her `engine/tools/check.mjs` vb. için "LF will be replaced by CRLF" uyarısı veriyor. Satır sonu davranışı makineye bağlı; farklı makinede aynı dosya farklı yazılır.
- **Kabul ölçütü:** `.gitattributes` (`* text=auto eol=lf`, ikililer `binary`).

### HE-DP-05 — Klasör kuralı ve katman ihlalleri · P4 · DOĞRULANDI
1. **Motor, uygulama kodunu içe aktarıyor** (kural: motor `engine/`, uygulama `TxtNote/`; bağımlılık yönü tek olmalı): `engine/src/engine.js` → `TxtNote/frontend/src/config/format.js`, `…/lib/cspStyles.js`; `engine/src/pageLayout.js` → `…/lib/academicDocument.js`. Uygulama da motoru içe aktarıyor (çift yönlü).
2. **Motor/şablon aracına ait görünen kod `TxtNote/scripts/` içinde** (sahibin ayırması gerekir): `scan-ege-thesis-templates.py`, `download-ege-report-files.py`, `build-ege-content-note.py`, `extract-ege-report-text.py`, `ege-universities.json`, `verify-mcbu-word.ps1`, `verify-layout-word.ps1`, `verify-thesis-blank-pages.ps1`, `verify-layout-fidelity.mjs`, `verify-mcbu-fonts.mjs`, `export-academic-qa.mjs`, `verify-academic-output.py` (şablon kaynağı tarama/indirme, Word doğrulama): "motor kodları yalnız `engine/`" kuralıyla çelişir.
3. **`orchestration/` kural 7'ye ("kod, şablon veya çıktı tutulmaz") rağmen ham çıktı içeriyor:** `raporlar/*.json`, `raporlar/*.log`, `hedefler/references/**/*.txt` (35 metin dökümü), `progress.json` (`orchestration/` toplamı 5 MB).
4. `TxtNote/scripts/__pycache__/` ve `engine/tools/__pycache__/` derlenmiş bayt kodu (gitignore'da) çalışma ağacında duruyor.
- **Kabul ölçütü:** sahip kararıyla ya kurallar güncellenir ya dosyalar taşınır.

### HE-DP-06 — Satır içi yardımcı kod: Windows'a/yerel makineye bağlı yollar · P4 · DOĞRULANDI
- `engine/tools/*` ve 15 e2e dosyası makineye özgü yolları varsayar (`C:/Users/CASPER/...`); `engine/tools/*` Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`), Python (`USERPROFILE/.cache/codex-runtimes/...`), Word (COM) ve Office DLL yollarını varsayar. Linux/macOS'ta hiçbir araç çalışmaz (Word zaten Windows'a özgü).


## 11. Neye bakılmadı, neye bakıldı (dürüst kapsam)

### 11.1 Bilerek bakılmayan (kullanıcı kararı)
- Şifreleme ve anahtar saklama kodu ve testleri (liste §0.1). Ürün/kullanılabilirlik araştırması (`ARASTIRMA_PLANI.md` P/W/S/D başlıkları). Hiçbir hata düzeltilmedi.

### 11.2 Çalıştırılamayan ya da çalıştırılmayan
- **Gerçek Tauri penceresi** (HE-SR-01): kurulu `.exe` yok/eski; WebView2'ye özgü davranış, CSP altındaki gerçek çalışma, `write_academic_file`, yazı tipi komutları, güncelleyici, dosya iletişim kutuları denenmedi.
- `TxtNote/scripts/desktop-smoke.mjs` (NSIS kurulumu), `verify-*.ps1/py/mjs` betikleri (Word ile ek doğrulamalar), `release.mjs`, `serve-updates.mjs`.
- İçe aktarma kodu (`engine/src/importDocx.js`, `importPdf.js`, `docx/*` — "Askıda"); OCR (`tesseract`); matematik (KaTeX/OMML) ayrıntıları; mindmap, flashcards, todo ve günlük editörlerinin işlevsel ayrıntıları (yalnız her birinin açılışı ve konsol hatasızlığı denendi).
- macOS/Linux: araçların hiçbiri çalışmaz (Windows + Word COM + Office DLL); uygulamanın Tauri kısmı derlenir ama PDF yazı tipi okuma yalnız Windows (`system_fonts.rs`: Windows dışında hata döner).
- Gerçek bir tez (yalnız sentetik örnek metin); denklem/uzun tablo/metin içi resim içeren gövde; sabit sayfalarda **uzun jüri/ad listesi**; Windows dışındaki Word sürümleri; tr-TR dışı yerel ayar.

### 11.3 Bu turda satır satır okunan kod
`TxtNote/src-tauri/src/{db,lib,desktop_export,system_fonts}.rs`, `build.rs`, `tauri.conf.json`, `capabilities/`, `permissions/`; `TxtNote/services/local/index.ts` (şifreleme çağrıları atlanarak), `services/index.ts`, `services/http/index.ts`; `frontend/src/app/App.jsx` (kayıt/geri alma/çöp kutusu bölümleri), `hooks/useUndoHistory.js`, `lib/undoHistory.js`, `features/sync/{useNoteSync,localBackup,payload}.js`, `lib/{richText (sanitizeHtml),zipImport,ingestUpload}.js`, `features/templates/ThesisCreator.jsx`, `features/editor/ThesisEditor.jsx` (ilk 700 satır), `ThesisSectionPages.jsx` (başı); `engine/src/{engine,validation,pageLayout,export}.js`, `footnotes.js` (ilk 420 satır), `registry.js`; `engine/tools/{word2pdf.ps1,validate-openxml.ps1,devserver.sh,check.mjs (başı),parity.mjs (başı),export.mjs (başı),golden.mjs (başı)}`.
### 11.4 Okunmayan ya da yalnız taranan (toplam ~54 bin satır uygulama + ~15 bin satır motor kodunun çoğu)
`frontend/src` içindeki geri kalan bileşenler (`Sidebar`, `MindmapCanvas`, `RichTextBody`, `mathFormula*`, `codeBlock`, `HelpView`…), `engine/src` içinde `layoutPdf`, `generatedIndex`, `docx/*`, `import*`, `footnotes.js`'in geri kalanı, `tableContinuation`, `engineCss`; `engine/tools/*.py`, `spec2template`, `profile-suggest`, `template-add` (yalnız araç testleri koştu). Bu dosyalar bu belgedeki bulguların **dışında** hata içerebilir; bulguların yokluğu "temiz" demek değildir.


## 12. Önerilen çalışma sırası (düzeltecek kişi için; karar sahibinindir)

**0. Ön koşul:** HE-DP-01 — çalışma ağacı sahibi tarafından commit edilir; HE-DP-02'nin `.git` çöpü (`git gc --prune=now`) ve üretilmiş fixture kararı bu adımda verilir (düzeltme işlemlerinden önce, aksi hâlde her commit 1 GB'lık dosyaları taşır).

**1. Veri kaybı (P1) — önce bunlar:** HE-VB-01, HE-VB-02 (aynı dosya `db.rs`; tek Rust test paketiyle kapanır), HE-VB-03 (not şeması tek kaynağa; `payload.js`/`App.jsx`/`db.rs`), HE-VB-04 (`deleteFromTrashForever` ve çöp kutusu boşaltma ↔ geri alma), HE-VB-05 (kayıt hatası bildirimi). Hepsinin yeniden üretme adımı bu belgede; hepsi için "kabul ölçütü" bir birim/Rust testidir.

**2. Test/kapı güvenilirliği:** HE-TS-04 (CI + `typecheck` + `lint`), HE-TS-03 (atlanan test sayısını izle).

**3. Word/PDF uyumu (P3):** *Hızlı:* HE-DX-01 (`settings.xml` sırası; tek dosya, 34 şablonun hepsi düzelir). *Sabit sayfa taşmaları:* HE-EW-01, HE-EW-02 (aynı kök: DOCX'te `lineRule="exact"` boşluk yığını + uzun başlık; elastik boşluk mekanizması bu iki şablonda devrede değil). *Tablo/sayfa sığdırma:* HE-EW-03, HE-EW-04. *Yatay kaymalar:* HE-EW-05, HE-EW-08, HE-EW-09 (her biri tek bir sistematik fark: sütun x, başlık girintisi). *Dipnot ve listeler:* HE-EW-06, HE-EW-07 (bilinen, nedeni bulunamamış). Her düzeltmeden sonra `parity.mjs --pad 0/2/4/6` taraması **tüm 34 şablonda** koşulmalı (tek şablonda iyileşirken başkasını bozma riski gerçek: bu turun başındaki düzeltmeler tabloyu düzeltirken `mcbu-tip` yatay kaymasını 5→7'ye çıkarmıştı).

**4. Şablon hattı (P2–P3):** HE-SB-01/02/03 (DEÜ/Ege kaydı ve künye, kayıt defteri üretimi), HE-UI-04 (seçici etiketleri; 5 dakikalık iş), sonra HE-SB-05'teki hat sınırları.

**5. Güvenlik sertleştirme (P3 + P2 yapılandırma):** HE-GV-01/02 (tek izin listesi, üç yol), HE-GV-03/04 (yayın yapılandırması ve Tauri izinleri; gerçek uygulamada doğrulama gerektirir — HE-SR-01 ile birlikte).

**6. Masaüstü doğrulaması:** HE-SR-01/02, HE-TS-07 — güncel koddan kurulum paketi, `desktop-smoke`, PDF/DOCX alma, gecikme ölçümü.

**7. Düzen ve belge (P4):** HE-DP-03…06, HE-UI-05, HE-SR-03/04, HE-VB-07…11 (tek tek küçük).

**Hızlı kazanımlar (≤ yarım gün):** HE-DX-01, HE-UI-04, HE-GV-01 (süzgeç + test), HE-SR-03 (yinelenen `pdf` parçası), HE-DP-04 (`.gitattributes`), HE-TS-06 (`devserver.sh`).

**Bağımlılıklar:** HE-VB-03 ↔ HE-VB-08 (not şeması).

