# KANIT — hangi şey nerede (yalnız harita, görev yok)

`orchestration/` yalnız yapay zekânın okuyup başladığı yerdir: bu dosya, [BASLA.md](BASLA.md), [GOREVLER.md](GOREVLER.md), [ARASTIRMA_PLANI.md](ARASTIRMA_PLANI.md), [prompts/](prompts/) ve `progress.json` (hedef başına durum). Kod, şablon, ölçüm, çıktı ve kanıt burada **tutulmaz**; aşağıdaki yerlerdedir. Hiçbir dosya iki yerde bulunmaz.

## Yerler
| Ne | Nerede |
|---|---|
| Motor: çalışma zamanı (otomasyon ve kapı araçları aşağıda `engine/tools/`) | `engine/src/` |
| Motor belgeleri (README, ALTYAPI, [yetenek kataloğu](motor/CAPABILITIES.md), LAYOUT, araç kılavuzları) | `orchestration/motor/` |
| Tarihli kapanış/teşhis raporları, hedef başına kaynak raporları, `KURAL_SOZLUGU.md`, AKÜ-FBE başarısızlık kayıtları | `orchestration/raporlar/` |
| Kaynaktan çıkarılan biçim kuralları (`<hedef>.json`), fixture'lar, hedef envanteri `manifest.json` | `engine/specs/` |
| Hedef bağlam paketleri (`<hedef>.CONTEXT.md`), referans kılavuz dökümleri | `orchestration/hedefler/` |
| Kontrol/ölçüm/dışa aktarım araçları (`check.mjs`, `export.mjs`, `docx2spec.py`, `word2pdf.ps1`, …), [CHECKER.md](motor/CHECKER.md), [DOCX_EXTRACTION.md](motor/DOCX_EXTRACTION.md) | `engine/tools/` |
| Resmî kaynaktan türetilmiş referans render/ölçüm önbelleği (`<hedef>/source/`) | `engine/references/` |
| Uygulama (arayüz, backend, Tauri) ve belgeleri | `TxtNote/`, `orchestration/uygulama/` |
| Test girdileri (fixture'lar, örnek DOCX) | `TxtNote/frontend/tests/` (`generated/`, `fixtures/`) |
| **Bütün şablonlar:** resmî üniversite belgeleri, motorun yüklediği şablon JSON'ları (`Ege/<üniversite>/<kimlik>.json`, `Genel/generic.json`), eski şablon kaynakları (`eski-js/`) | `Butun-Sablonlar/` |
| Her şablon klasörünün künyesi ve köken notu (`KAYNAK.md`, `README.md`, `metadata.json`) | `orchestration/sablon-kaynaklari/` |
| Yapay zekâ komutları | `orchestration/prompts/` (Cursor kuralı dahil) |
| Doğrulama çıktıları (üretilir, depoya girmez) | `.test-tmp/validation/<iş>-<tarih>/` |

## Doğrulama yöntemi (özet)
Resmî kaynak → kaynak temelli kurallar (spec) → şablon → gerçek PDF/DOCX dışa aktarım → ölçüm/karşılaştırma → regresyon. `PASS` yalnız ilgili kaynak temelli kontroller başarılıysa; `FAIL` desteklenen bir gereksinime aykırılık; `BLOCKED` gerçek kaynak/teknik engel; belirsiz her şey `UNKNOWN`. Üniversite sırası: `progress.json.universityOrder`.

## Ortam ve komutlar
- Windows. Mevcut bağımlılıklar kullanılır, ağ indirmesi yapılmaz.
- Node: `C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`; Python: `.../dependencies/python/python.exe`; pwsh: `.../dependencies/native/powershell/pwsh.exe`; Playwright: aynı runtime'ın `node_modules/playwright`; Cargo: `C:/Users/CASPER/.cargo/bin/cargo.exe`.
- Kurulum: `npm ci --prefix engine`, `npm ci --prefix TxtNote/frontend` (ağsız: `node engine/tools/seed-engine-dependencies.cjs`).
- Test ve derleme (`TxtNote/frontend` içinde): `node --test 'src/lib/*.test.js' 'src/features/mindmap/*.test.js' 'src/features/workarea/*.test.js' 'src/features/sync/*.test.js' '../../engine/src/*.test.js' '../../engine/src/templates/*.test.js'` ve `node node_modules/vite/bin/vite.js build`. Native: `TxtNote/src-tauri` içinde `cargo test system_fonts --lib --offline`.
- Hedef kontrolü (dev sunucusu açıkken, proje kökünden): `node engine/tools/check.mjs --target <kimlik> [--word]`, `--all --word`.
- Word/şema: `engine/tools/word2pdf.ps1 -In -Out [-Refreshed] [-RenderInfo]` (kendi görünmez Word örneğini yönetir; COM `80070520` sandbox hatası belge bozukluğu sayılmaz), `engine/tools/validate-openxml.ps1 -In -Out` (SDK 2.9.1/Office2016).
- Test arayüzü: `TxtNote/frontend/tests/thesis-long.html?id=<fixtureName>`; fixture'lar `tests/generated/<id>.fixture.json`.

## Bilinen tuzaklar
- Yalnız toplam sayfa sayısının eşit olması kabul değildir (açılış sayfaları ve kapsam ayrıca ölçülür).
- Eski önbellekli Word sayfa sayısı yeni alan güncellemesinin oracle'ı değildir.
- Tarihli rapordaki sayılar kendi kod sürümüne aittir; "geçti" demeden önce son kodla yeniden ölçün.
