# SRC09 düzenleme ve kaydet/aç tutarlılığı — KAPANDI

12.10.2026, Codex devam oturumu. Bu kayıt yalnız hedefli düzeltmenin kanıtıdır; genel kabul değildir.

## Neden ve düzeltme

`RichTextBody.emitChange` her düzenlemede `decorateAcademicDom` çalıştırıyordu. Tez başlıkları zaten kaynak/şablon motorunca numaralandırıldığı halde bu yardımcı aynı bölümde ikinci numaralama yapıyordu. Gerçek SRC09 yaz/sil denemesi başlığa `academic-h academic-h1`, `data-academic-id`, `data-academic-heading`, `data-number` ekledi. Kaydetme sırasında `prepareThesisNote` bu görünüm niteliklerini kalıcı modele taşıdı. `before.json`: authorRestored=false, documentEqual=false; yalnız başlık nitelikleri ve boş retainedNodes farkı.

`decorateAcademicDom` için varsayılanı açık `headingNumbers` seçeneği eklendi. Tez editörünün `paragraphSemantics` yolunda tüm çağrılar bu seçeneği kapatır. Kaynak başlık nitelikleri değiştirilmez; normal akademik editörün numaralaması korunur. Kullanıcının yazdığı başlık kimlikleri, numaraları ve numarasız işareti silinmez.

## Doğrulama

- `heading-regression.mjs`: gerçek Chrome DOM'unda içe aktarılan başlık iki dekorasyon sonrasında aynı; kullanıcı başlık nitelikleri aynı; normal editörde numaralar 1 / 1.1. PASS.
- `probe.mjs`: gerçek SRC09, gerçek klavye yaz/sil. `after.json`: authorRestored=true, documentEqual=true, editDiff=[], saveDiff=[], 0 tarayıcı hatası, 178 sayfa.
- Tam birim testi: 974 PASS / 0 FAIL / 0 atlama.
- Üretim derlemesi: PASS (`build.log`). Sandbox ilk denemede worker realpath için EPERM verdi; normal dosya erişimiyle aynı derleme geçti.
- `performance/benchmark-SRC09.json`: 20 gerçek klavye yaz/sil örneği tamamlandı; status=MEASURED, twentySamplesRestoreAuthorContent=true, save.documentEqual=true, errors=[]. Gerçek üretim düğmeleriyle DOCX ve PDF indirildi. Başlangıç/son 178 sayfa.
- Yerleşme süresi p50=14968 ms, p95=18592 ms, max=19869 ms. Önceden tanımlanmış sayısal performans sınırı yok; hız sorununun çözüldüğü iddia edilmiyor.
- Son kaynak/harness parmak izi: `9204648029e9577f9c6a56bdc680c622fe81944c3f6eab92542e62509345028b` (870 dosya); inputs-before/after eşit. İlk parmak izi örnek koşusu sürerken, kaynak düzeltmesi tamamlandıktan sonra alınmıştır.

## Açık kalan

SRC09/SRC10 Word sayfa kırılımı uyumu bu düzeltmeyle kapanmadı. SRC09 hâlâ 178/180; tam kırılım karşılaştırması bu oturumda yeniden koşulmadı. Önceki `final-20261012` genel kabul sonucu değiştirilmedi. Yeni sürüm için genel kabul verilmedi. Commit oluşturulmadı.
