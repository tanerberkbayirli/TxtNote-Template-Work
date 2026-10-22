# BASLA — yapay zekâ için tek giriş

Bu klasör iki iş içindir: **(1)** yapılacak görevler, ilerleme, notlar, hatalar → [GOREVLER.md](GOREVLER.md); **(2)** yapay zekânın şimdi izleyeceği adımlar → [prompts/](prompts/). Başka her şey kanıt ve referanstır ([KANIT.md](KANIT.md)).

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
6. Ortak motor davranışına belge ID'si, sayfa numarası veya üniversite adına bağlı koşul eklenmez. Eşik düşürmek, girdiyi budamak, hatalı nesneyi silmek, özgün baytları geri koymak çözüm değildir.
7. Üretim motoru `engine/src/`; arayüz `TxtNote/frontend/`. Kod yalnız `engine/` ve `TxtNote/` altında yazılır; `orchestration/` altında kod, şablon veya çıktı tutulmaz.
8. `Butun-Sablonlar/` (özgün PDF/DOCX), tarihsel kanıtlar ve kullanıcının mevcut değişiklikleri değiştirilmez/geri alınmaz. Eski ölçüm/hash değerleri yeni sonuç gibi yeniden yazılmaz.
9. Word yalnız sahip olunan tek örnekle (PID kaydı, zaman aşımı, `finally`'de `Quit`) çalıştırılır; kullanıcının diğer Word süreçlerine dokunulmaz.
10. İş sonunda kısa kayıt: ne değişti, hangi kontroller çalıştı (komut + sonuç), ne açık kaldı. Açık kalanlar GOREVLER.md'ye gider.

## Hızlı başvuru
- Ortam, komutlar, araçlar, tuzaklar → [KANIT.md#ortam-ve-komutlar](KANIT.md#ortam-ve-komutlar)
- Kanıt/rapor/spec/araç nerede → [KANIT.md](KANIT.md)
