# turkiye-kaynak-taramasi dalı — arşiv (yüklenmez)

Bu dal (son commit `1afc2c20`, 2026-10-07) `main` ile birleştirildiğinde `main` tez motorunu
`TxtNote/frontend/src/thesis/` konumundan `engine/src/` konumuna taşımış, şablonları da
`Butun-Sablonlar/` altında JSON veriye çevirmişti. Birleştirmede çakışan her dosyada `main` korundu.
Dalın eski motora bağlı parçaları burada saklanır; uygulama bunları **yüklemez**.

## İçerik

| Yol | Ne |
| --- | --- |
| `eski-motor-degisiklikleri.patch` | Dalın `TxtNote/frontend/src` ve `tests` altındaki tüm motor/editör değişiklikleri (merge-base `2eec65ce` → `1afc2c20`), üretilmiş şablonlar ve fontlar hariç. Yeni motora taşırken başvuru kaynağı. |
| `uretilmis-sablonlar/` | Resmî DOCX/kılavuzdan üretilmiş taslak şablonlar (eski JS biçimi, `export default {…}`) ve `demo-d.js`. Her dosyanın `source.review` alanında UNKNOWN / INFERRED / CONFLICT kayıtları vardır. |
| `eski-motor-testleri/` | Eski motoru içe aktaran birim ve e2e testleri (uyum paneli, düzenlenebilir özel sayfa, dışa aktarma kapısı). |
| `fontlar/` | LiberationSans (OFL) — eski `academicFonts.js` değişikliğinin PDF yedek fontu. |

Patch'teki başlıca özellikler: şablon uyum paneli (`compliance.js`: bilinmeyen alanlar, çıkarımlar,
şablon↔kılavuz çelişkileri, kapı sonucu), `layoutMode: "editable"` özel sayfa tohumlama
(`specialPages.js`, `document.js`), PDF'e gerçek sistem fontu (`systemPdfFonts.js`, `academicFonts.js`),
dışa aktarmada DOCX bölüm sırası ve numara onarımı (`export.js`).

## Hâlâ çalışan / çalışmayan betikler

`TxtNote/scripts/` altındaki kaynak tarama ve çıkarma betikleri (`build-turkey-universities.py`,
`fetch-manual-sources.py`, `organize-scan-sources.py`, `extract-docx-spec.py`, `extract-guide-rules.py`,
`merge-guide-rules.py`, `docx-spec-to-template.py`, `batch-template-drafts.py`, `guide-only-drafts.py`)
motordan bağımsızdır.

Eski motora bağlı olanlar (yeni motora taşınana kadar çalışmaz): `install-template-draft.mjs`
(çıktıyı `frontend/src/thesis/templates/generated/` altına yazar), `batch-gate.py` ve `pass-gate.py`
(`tests/thesis-export-gate.e2e.mjs` üzerinden dışa aktarır).

## Ham kaynaklar

`Butun-Sablonlar/**/kaynaklar*.md` ve `Butun-Sablonlar/turkiye-kaynak-manifest.json` her kaynağın URL'sini
ve SHA-256'sını tutar. Ham PDF/DOCX dosyaları (birkaç GB) depoya eklenmedi.
