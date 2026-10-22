# Thesis ribbon browser smoke

15 October 2026: source management now uses a dedicated workspace panel. The smoke exercises inline citations through that panel and checks that static text cannot receive an inline citation. Rulers start hidden. The writing workflow and its limits are described in [THESIS_WRITING_UX.md](../THESIS_WRITING_UX.md).

Targeted MCBÜ UX checks, including required chapter placement, existing rich bibliography preservation, mobile citation drafts, real downloads and pagination-wrapper highlight removal:

```powershell
node orchestration/validation/thesis-ux-20261015/ux.e2e.mjs
```

Run this targeted script from the repository root with Vite listening on port 5175. Evidence is saved under `orchestration/validation/thesis-ux-20261015/`.

With the frontend Vite server running, run from `TxtNote/frontend`:

```powershell
$env:PLAYWRIGHT_MODULE='C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/node_modules/playwright'
node tests/word-thesis.e2e.mjs http://127.0.0.1:5175
```

The smoke uses the real `ThesisEditor` fixture and checks all six ribbon tabs, keyboard navigation, scrolling access to every ribbon group, control clipping, text selection retention, palette hex and automatic colors, highlight removal, decimal font size commit/cancel, and static-target disabled states. It also exercises table/link/footnote/frame insertion, layout undo/redo, section navigation, persistence after reload, and the responsive dark appearance. It downloads PDF and DOCX through the editor's real export buttons, checks PDF page geometry plus text/font-size evidence, and checks DOCX XML for inserted content and the selected text/highlight colors and size. Screenshots and export evidence are written to `TxtNote/output/word-thesis/` for review.

Invalid or dangerous link schemes and malformed addresses must remain disabled; normalized HTTP(S) and `mailto:` addresses are supported.

The editor keeps its existing continuous-layout fallback in browsers that do not support the paged CSS fragmentation features; this smoke runs in Edge, where the A4 page stack is available.

For a targeted rerun after the ribbon reachability sweep has passed, set `RIBBON_SKIP_REACHABILITY=1`; the default run always checks both representative widths.

## Panel erişimi ve performans regresyonu

```powershell
node tests/ribbon-panels.e2e.mjs http://127.0.0.1:5182
node tests/ribbon-colors.e2e.mjs http://127.0.0.1:5182
node tests/ribbon-cover-format.e2e.mjs http://127.0.0.1:5182
```

Panel testi, üst bilgi çubuğunun kaldırıldığını ve Tez bilgileri/Ayarlar düğmelerinin altı sekmeden erişilebilir olduğunu doğrular. Başlık kaydı, sözcük sayımının yazma ve geri al/yinele sonrası güncellenmesi, geçersiz kenar boşluklarının engellenmesi, sayfa ayarı uygulama ve geçmişi, cetvel birimi/görünürlüğü, zoom eşlemesi ve klavye ile sekme geçişi kontrol edilir. Giriş ve Dosya sekmelerinde gerçek yazdırma belgesi hazırlanır; sistem yazdırma penceresi testte yakalanır, fiziksel yazıcı kullanılmaz. 360, 620, 1024 ve 1380 px genişliklerde panel düğmelerinin görünür alan içinde kaldığı doğrulanır.

Sözcük sayımı, editör render işleminden ayrılmıştır: metin değişimleri 200 ms boyunca birleştirilir ve yalnızca sayaç bileşeni güncellenir. Test, 12 panel açma/kapatma işleminde belge metninin yeniden okunmadığını kontrol eder. Ölçüm ve ekran görüntüleri yerel `TxtNote/output/ribbon-panels/` klasörüne yazılır.

## Hizalama ölçüm regresyonu

```powershell
node tests/ribbon-alignment.e2e.mjs http://127.0.0.1:5183
```

Hizalama düğmeleri, seçili kapak yazısı veya çerçeve için varsayılan olarak sayfanın yazı alanını kullanır. `Hizalama alanı` seçeneğiyle yalnızca kutu içindeki metin hizalanabilir. Test; dar kapak blokları, normal akıştaki başlık, iç içe bloklar ve kullanıcı çerçevesinde gerçek metin/çerçeve konumlarını milimetre cinsinden ölçer. Sağ tık menüsünün tek öğede yatay/dikey yerleşimi, başka metinlere komut sızmaması, kilitli öğeler, geri al/yinele, birleşik altı/üstü çizili biçimleri ve yeniden yükleme sonrası kalıcılık kontrol edilir. Gerçek PDF'deki metin kenarı ve DOCX'teki çerçeve konumu/genişliği de doğrulanır. Kullanılan ölçüler yalnızca test verisidir; üniversite biçim kuralları değildir. Sonuçlar yerel `TxtNote/output/ribbon-alignment/` klasöründedir.
