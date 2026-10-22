# BASLA — yapay zekâ için tek giriş

Bu klasör iki iş içindir: **(1)** yapılacak görevler, ilerleme, notlar, hatalar → [GOREVLER.md](GOREVLER.md); **(2)** yapay zekânın şimdi izleyeceği adımlar → [prompts/](prompts/). Başka her şey kanıt ve referanstır ([KANIT.md](KANIT.md)).

**Motor (`engine/`) nedir:** binlerce üniversite ve tez şablonunu eklemeyi **kolaylaştırmak**, çıktıyı (editör, yazdırma, PDF, DOCX) **tutarlı** yapmak ve tekrar eden işleri **otomatize etmek** için vardır. Hem çalışma zamanı (`engine/src/`) hem otomasyon ve kapı araçları (`engine/tools/`) motorun parçasıdır. Ayrıntı: [orchestration/motor/ALTYAPI.md](motor/ALTYAPI.md).

## Klasör kuralları (kullanıcı kararı, 22.10.2026; her yeni dosya buna göre yerleşir)
1. **Şablonların tamamı `Butun-Sablonlar/` içindedir, başka hiçbir yerde değil, ve orada şablondan başka bir şey olmaz.** Orada: üniversitelerin resmî kaynak belgeleri (DOCX/DOC/PDF/ZIP/RAR), motorun yüklediği şablon verisi (`Ege/<üniversite>/<kimlik>.json`, yedek şablon `Genel/generic.json`) ve eski şablon kaynakları (`eski-js/`). Not, rapor, künye, açıklama yazısı orada durmaz.
2. **Motor kodu yalnız `engine/` içindedir** (çalışma zamanı `engine/src/`, otomasyon ve kapılar `engine/tools/`, kaynaktan türetilen veri `engine/specs/`, `engine/references/`). **Uygulama kodu ve geri kalan her kod `TxtNote/` içindedir** (arayüz, Tauri, servisler).
3. **Orkestrasyon, bilgi, detay, plan, rapor, belge ve bütün yapay zekâ komutları yalnız `orchestration/` içindedir.** Dışarıda not, bilgilendirme, açıklama yazısı, rapor ya da komut dosyası bulunmaz. Düzen: `motor/` (motor belgeleri), `raporlar/` (ölçüm ve kapanış raporları), `uygulama/` (uygulama belgeleri), `hedefler/` (hedef bağlamları ve referans dökümleri), `sablon-kaynaklari/` (her şablon klasörünün künyesi), `prompts/` (yapay zekâ komutları).
Kapsam notu: kod dosyalarındaki satır yorumları koda aittir, belge sayılmaz. Uygulamayla birlikte dağıtılan üçüncü taraf lisans metni (`TxtNote/frontend/public/`) yasal zorunlulukla yerinde kalır. `.claude/launch.json` ve `.cargo/config.toml` aracın kendi yapılandırmasıdır, yerinde kalır. Taşıma haritası: [raporlar/tasinma-haritasi-2026-10-22.json](raporlar/tasinma-haritasi-2026-10-22.json).

## Okuma sırası (bu kadarı yeter)
1. Bu dosya.
2. [GOREVLER.md](GOREVLER.md) — yalnız size verilen görevin bölümü.
3. [prompts/](prompts/) içinden görev türüne uygun tek dosya: `GOREV_YAP.md`, `DOGRULA.md` veya `KAYNAK_INCELE.md`.
4. Gerekirse [KANIT.md](KANIT.md)'den ilgili raporu/aracı bulun. Tüm geçmişi taramayın.


## Kurallar
1. Kullanıcının son talimatı esastır. Kullanıcı istemedikçe commit, push, deploy ve geniş süreç kapatma yok; kullanıcı komut verene kadar araştırma başlıkları işlenmez.
2. **Açık görev, hata, ertelenen kapı ve "sonraki adım" yalnız GOREVLER.md'ye yazılır.** Başka dosyaya açık iş yazmayın; kapanan görev oradan silinir, kanıtı bir rapora yazılır (`reports/`).
3. Resmî üniversite kaynakları esastır. Şablon XML/örnek yapısı, kılavuz düzyazısından önce gelir; iki tarafı da kaydedin. Kanıtlanmayan her şey `UNKNOWN`'dur; değer ya da varyant uydurulmaz.
4. Sıra: kaynak → spec → uygulama → **gerçek dışa aktarım** → bağımsız doğrulama → regresyon. Birim testin geçmesi Word/PDF yerleşiminin ya da ürün kabulünün geçtiği anlamına gelmez. Kendi kendine PASS vermek bağımsız PASS değildir.
5. Açık ölçülerde tolerans yalnız ölçüm gürültüsüdür (varsayılan ≤0,5 mm, güvenilirse ≤0,25 mm); geçsin diye genişletilmez. Dışa aktarılan **gerçek** font doğrulanır; ikame font tam uygunluk sayılmaz.
6. Ortak motor davranışı genel tutulur; belge ID'sine veya sayfa numarasına bağlı koşul eklenmez (bunlar sınama belgesine uydurma çözümdür). **Üniversite adının kodda geçmesi yasak da zorunlu da değildir**: hangisi daha iyi çözümse (daha az elle iş, daha tutarlı çıktı, daha kolay bakım) o seçilir ve gerekçesi koda ya da [ALTYAPI.md](motor/ALTYAPI.md)'ye yazılır. Eşik düşürmek, girdiyi budamak, hatalı nesneyi silmek, özgün baytları geri koymak çözüm değildir.
7. Kod yalnız `engine/` (motor) ve `TxtNote/` (uygulama) altında yazılır; şablon verisi `Butun-Sablonlar/`da, belge ve komut `orchestration/`dadır (Klasör kuralları). `orchestration/` altında kod, şablon veya çıktı tutulmaz.
8. `Butun-Sablonlar/` içindeki özgün resmî belgeler (PDF/DOCX/DOC), tarihsel kanıtlar ve kullanıcının mevcut değişiklikleri değiştirilmez/geri alınmaz. Eski ölçüm/hash değerleri yeni sonuç gibi yeniden yazılmaz.
9. Word yalnız sahip olunan tek örnekle (PID kaydı, zaman aşımı, `finally`'de `Quit`) çalıştırılır; kullanıcının diğer Word süreçlerine dokunulmaz.
10. İş sonunda kısa kayıt: ne değişti, hangi kontroller çalıştı (komut + sonuç), ne açık kaldı. Açık kalanlar GOREVLER.md'ye gider.

## Hızlı başvuru
- Ortam, komutlar, araçlar, tuzaklar → [KANIT.md#ortam-ve-komutlar](KANIT.md#ortam-ve-komutlar)
- Kanıt/rapor/spec/araç nerede → [KANIT.md](KANIT.md)
