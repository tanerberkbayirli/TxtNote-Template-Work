# Motor ve araçlar

Çalışma zamanı `engine/src/`, otomasyon `engine/tools/`, makine spec/fixture verisi `engine/specs/`, türetilmiş kaynak verisi `engine/references/` altındadır. Şablon JSON ve özgün belgeler `Butun-Sablonlar/`, ham kontrol çıktıları `.test-tmp/validation/<iş>-<tarih>/` altında tutulur. Motor bazı frontend yardımcılarına bağlıdır; bağımsız paket değildir.

## Başvuru

- [ALTYAPI.md](ALTYAPI.md): tasarım ve üretim hattı.
- [LAYOUT.md](LAYOUT.md): ortak yerleşim modeli.
- [CAPABILITIES.md](CAPABILITIES.md): desteklenen anahtarlar ve teknik sınırlar.
- [CHECKER.md](CHECKER.md): gerçek çıktı ölçümü, Word eşliği, altın karşılaştırma.
- [DOCX_EXTRACTION.md](DOCX_EXTRACTION.md): resmî DOCX'ten veri çıkarımı.
- [Uygulama](../uygulama/README.md): ürün davranışı; [hedefler](../hedefler/README.md): kaynağa özgü kararlar.

## Komutlar

Proje kökünden, projenin bağımlılıkları ve bu oturumda sağlanan uygun Node/Python çalıştırıcısıyla yürütülür. Paket betikleri için ilgili `package.json` esas alınır.

- Arayüz: `npm run dev --prefix TxtNote`; masaüstü geliştirme: `npm run desktop --prefix TxtNote`.
- Test: `npm test --prefix TxtNote`, `npm test --prefix engine`.
- Derleme: `npm run build --prefix TxtNote`; tip denetimi: `npm run typecheck --prefix TxtNote`.
- Paketleme: `npm run desktop:build --prefix TxtNote` yalnız kullanıcı isterse.
- Hedef kontrolü: `node engine/tools/check.mjs --target <kimlik> --word --out .test-tmp/validation/<iş>-<tarih>`.
- DOCX çıkarımı: `python engine/tools/docx2spec.py`; seçenekler [çıkarım rehberinde](DOCX_EXTRACTION.md).
- Word dönüşümü: `engine/tools/word2pdf.ps1`; OpenXML şeması: `engine/tools/validate-openxml.ps1`.

Komutun belgede bulunması çalıştırıldığı anlamına gelmez. Yalnız değişikliğe uygun kontrol seçilir. Kurallar [BASLA.md](../BASLA.md), açık işler [GOREVLER.md](../GOREVLER.md) içindedir.
