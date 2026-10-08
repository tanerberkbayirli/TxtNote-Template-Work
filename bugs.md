# Uygulama hata taraması

Tarih: 8 Ekim 2026. Durum: **4 doğrulanmış hata düzeltildi.** Aşağıdaki yeniden üretme ve gerçek sonuç açıklamaları, düzeltme öncesi hata kayıtlarıdır.

Test ortamı: Windows, Microsoft Edge/Playwright, Vite geliştirme sunucusu ve gerçek `ThesisEditor` bileşenini kullanan `/tests/thesis.html` test sayfası. Test belgeleri gerçek kullanıcı belgelerinden ayrıdır. Bulgular mevcut çalışma ağacına aittir; ilgili kaynakların SHA-256 kayıtları [source-hashes.json](bugs/evidence/source-hashes.json) dosyasındadır.

Öncelikler: P1 = yazılan içeriğin kaybolması; P2 = işlevin çalışmaması veya seçilmeyen içeriğin değişmesi. Aşağıdaki maddeler tarayıcıda yeniden üretildi; yalnızca kaynak kodundan çıkarılan şüpheler hata sayılmadı.

## BUG-001 — P1 — Çerçeveye yazılan metin, biçimlendirme sonrası yeniden açınca kayboluyor

**Durum: Düzeltildi.** Araç çubuğu/layout işlemleri bekleyen çerçeve metnini aynı kayıt işlemine dahil ediyor. İtalik, kalın ve ortalama sonrası yeniden açılışta metin korunuyor.

**Alan:** Metin çerçevesi / kayıt / Giriş araç çubuğu.

**Yeniden üretme:**

1. Tezde bir metin çerçevesi oluşturun; başlangıç metni `Çerçeve başlangıcı` olsun.
2. Çerçeveye çift tıklayıp düzenlemeye girin.
3. Çerçeve içindeki metni seçip `YENI YAZILAN METIN` yazın.
4. Enter ile düzenlemeyi bitirmeden Giriş → **İtalik** düğmesine tıklayın.
5. Sayfayı yeniden yükleyin.

**Beklenen:** Ekranda görünen yeni metin ve italik biçim birlikte kaydedilir; yeniden açınca yeni metin korunur.

**Gerçek:** İtalik biçim kaydediliyor; çerçevenin kayıtlı `text` ve `content` alanları eski metinde kalıyor. Ekranda hâlâ yeni metin görünmesine rağmen yeniden yüklemede `Çerçeve başlangıcı` geri geliyor. Bu, anında ekranda geri dönme hatası değildir; **kayıt ile ekranın ayrışması ve yeniden açmada veri kaybıdır**. İki ayrı italik koşusunda tekrarlandı.

**Etki:** Kullanıcı yazdığı içeriğin kaydedildiğini sanabilir ve yeniden açmada metni kaybedebilir.

**İlgili kod:** [useLayoutInteraction.js](TxtNote/frontend/src/features/editor/useLayoutInteraction.js), `onDoubleClick` (385), `finishTextEdit` (401), `blurText` (411). Çerçeve metni blur/Enter ile işleniyor; araç çubuğunun italik komutu bu bekleyen metni kayda dahil etmiyor.

**Kanıt:** [JSON: frame-edit-format ve frame-edit-format-reopen](bugs/evidence/exploratory.json), [ekran görüntüsü](bugs/evidence/frame-edit-format.png).

## BUG-002 — P2 — Gövde metninde “İki yana yasla” çalışmıyor

**Durum: Düzeltildi.** `justify` ortak hizalama seçeneklerine ve canlı CSS kurallarına eklendi. Sağ/orta/iki yana geçişleri, etkin düğme ve yeniden açılış doğrulandı.

**Alan:** Giriş → Paragraf → İki yana yasla.

**Yeniden üretme:**

1. Gövdeye birkaç satırlık bir paragraf yazın.
2. Paragrafı sağa hizalayın.
3. **İki yana yasla** düğmesine tıklayın.

**Beklenen:** Paragraf `justify` hizalamasına geçer ve bu seçim kaydedilir.

**Gerçek:** HTML ve kayıt `fmt-align-right` olarak kalıyor; hesaplanan CSS `text-align: right`. “İki yana yasla” düğmesinin `aria-pressed` değeri de `false`. Komut görünür ve etkin olmasına rağmen paragrafı değiştirmiyor.

**Etki:** Kullanıcı gövde paragrafını araç çubuğuyla iki yana yaslayamıyor. Kapak/kutu hizalama testinin geçmesi bu gövde hatasını kapsamıyor.

**İlgili kod:** [format.js](TxtNote/frontend/src/config/format.js), `FORMAT_ALIGNS` (56) yalnız left/center/right içeriyor. [richTextAlign.js](TxtNote/frontend/src/lib/richTextAlign.js), `ALIGN_IDS` (12), `applyAlignToRange` (215) bu liste dışındaki `justify` komutunu reddediyor.

**Kanıt:** [JSON: body-justify](bugs/evidence/exploratory.json), [ekran görüntüsü](bugs/evidence/body-justify.png).

## BUG-003 — P2 — Bir tablo hücresini hizalamak diğer hücreyi de değiştiriyor

**Durum: Düzeltildi.** Hücreler ve hücre içindeki paragraflar ayrı hedefleniyor. Diğer hücreler korunuyor; farklı satırlara taşan seçimin kapsamı ve `table-cell` görünümü doğrulandı.

**Alan:** Tablo içi paragraf hizalama.

**Yeniden üretme:**

1. Bir satır ve iki sütundan oluşan tablo ekleyin.
2. Hücrelere `Birinci hücre` ve `İkinci hücre` yazın.
3. Yalnız birinci hücreye tıklayın; ikinci hücreyi seçmeyin.
4. Giriş → **Ortala** düğmesine tıklayın.

**Beklenen:** Yalnız aktif hücredeki paragrafın hizalaması değişir.

**Gerçek:** Tablonun tamamı `div.fmt-align-center` içine alınıyor; **iki hücre de** `text-align: center` oluyor. Tablodan önceki ve sonraki paragraflar değişmiyor; yanlış kapsam tablonun tamamı.

**Etki:** Seçilmeyen tablo hücrelerinin biçimi istemeden değişiyor.

**İlgili kod:** [richTextAlign.js](TxtNote/frontend/src/lib/richTextAlign.js), `isAlignHost` (22), `collectWrapNodes` (94), `wrapNodes` (171). Hizalama hedefi hücredeki paragraf yerine editörün üst düzey tablo sarmalayıcısına yükseliyor.

**Kanıt:** [JSON: table-cell-alignment](bugs/evidence/exploratory.json), [ekran görüntüsü](bugs/evidence/table-cell-alignment.png).

## BUG-004 — P2 — Tek liste maddesinin hizalaması bütün listeye uygulanıyor

**Durum: Düzeltildi.** Tek liste maddesi doğrudan hedefleniyor. Madde işaretli/numaralı listelerde komşu madde, liste işareti ve Enter davranışı korundu; yeniden açılış geçti.

**Alan:** Madde işaretli liste / paragraf hizalama.

**Yeniden üretme:**

1. İki maddeli bir liste oluşturun: `Birinci madde`, `İkinci madde`.
2. Yalnız ilk maddeye tıklayın; tüm listeyi seçmeyin.
3. Giriş → **Sağa hizala** düğmesine tıklayın.

**Beklenen:** Yalnız aktif liste maddesinin paragrafı sağa hizalanır.

**Gerçek:** `ul` bütünü `div.fmt-align-right` içine alınıyor. Birinci ve ikinci maddenin ikisi de sağa hizalanıyor. Listeden sonraki normal paragraf değişmiyor.

**Etki:** Kullanıcının seçmediği liste maddesinin biçimi bozuluyor.

**İlgili kod:** [richTextAlign.js](TxtNote/frontend/src/lib/richTextAlign.js), `isAlignHost` / `collectWrapNodes` / `wrapNodes`. Tablo bulgusuyla ortak hedef seçimi problemi var; kullanıcıdaki etkisi ayrı olarak kaydedildi.

**Kanıt:** [JSON: list-item-alignment](bugs/evidence/exploratory.json).

## Geçen kontroller ve kapsam

- **740/740 birim testi** geçti: [birim testi günlüğü](bugs/evidence/unit-tests.log).
- Üretim derlemesi geçti: [derleme günlüğü](bugs/evidence/build.log).
- Sekmeler, seçim korunması, yazı biçimleri, tablo/bağlantı/dipnot/çerçeve ekleme, kaydet/aç ve gerçek PDF/DOCX indirme: [word-thesis](bugs/evidence/word-thesis.log).
- Panel erişimi, belge ayarları, sözcük sayacı, klavye gezinmesi ve farklı ekran genişlikleri: [ribbon-panels](bugs/evidence/ribbon-panels.log).
- Renk/vurgu paletleri, HEX girişleri ve açık/koyu görünüm: [ribbon-colors](bugs/evidence/ribbon-colors.log).
- Kapak biçimleri, kalıcılık ve gerçek dışa aktarma: [ribbon-cover-format](bugs/evidence/ribbon-cover-format.log).
- Sağ/sol/orta geçişleri, yakınlaştırma ve yeniden açma: [alignment-transitions](bugs/evidence/ribbon-alignment-transitions.log).
- Kutu/yazı alanı hizalama, kilitler, geri al/yinele, PDF/DOCX konumları: [ribbon-alignment](bugs/evidence/ribbon-alignment.log).
- Sayfalama, sayfa numaraları, bölüm sırası ve hata konsolu: [thesis-pagination](bugs/evidence/thesis-pagination.log).
- Seçim çerçevesi, kaydırma, sürükleme/boyutlandırma ve kapak satırlarının çakışmaması: [overlay](bugs/evidence/overlay-rerun.log).

Eski `thesis-image.e2e.mjs` bağımsız koşusu `playwright-core` bağımlılığı ve farklı çalıştırma sözleşmesi nedeniyle başlatılamadı; **uygulama hatası olarak sayılmadı**. Genel şerit testinin görsel ekleme adımı geçti; büyük görsel stres testi bu taramada tamamlanmış sayılmıyor. Overlay testinin sabit 5175 portu, yalnız geçici bir test kopyasında çalışan 5184 portuna yönlendirildi; kaynak test dosyası değiştirilmedi.

Bu sonuçlar tez editörü içindir. Hesap/giriş, gerçek bulut senkronizasyonu, Tauri masaüstü dosya izinleri, diğer editörlerin tam etkileşimleri ve bütün üniversite şablonlarının resmî Word uygunluğu bu koşunun kapsamı değildir. Uygulamanın tamamen hatasız olduğu iddia edilmez.

## Yeniden çalıştırma

### Ayrı gözlem: ResizeObserver uyarısı

Test sunucusunun konsolunda `ResizeObserver loop completed with undelivered notifications` mesajları görüldü (14:28:11–14:28:47; Vite client hata kaydı). Hangi etkileşimin tetiklediği izole edilmedi; belirli bir üründe veri kaybı veya donma bu mesajla ilişkilendirilmedi. Bu nedenle yukarıdaki **4 doğrulanmış hata sayısına dahil edilmedi**. İlgili tarayıcı testlerinin kendi sonuçları PASS olsa da bu sunucu gözlemi ayrıca araştırılmalıdır.

### Komut

Proje kökünden, frontend geliştirme sunucusu çalışırken:

```powershell
node bugs/evidence/reproduce.cjs http://127.0.0.1:5184
```

Script yalnız test sayfasının yerel test belgesini kullanır; gerçek kullanıcı notlarını açmaz. Yeni kanıtlar `bugs/evidence/rerun/` altına yazılır. İlk taramada düzeltme uygulanmadı; kullanıcının sonraki talebi üzerine dört hata düzeltildi.

## Düzeltme doğrulaması — 8 Ekim 2026

- [Yeni regresyon testi](TxtNote/frontend/tests/bug-report-regressions.e2e.mjs): dört bulgunun özgün senaryoları, kalıcılık, farklı satırlardaki hücreler, hücre içi paragraflar, madde işaretli ve numaralı listeler. [Sonuç günlüğü](bugs/evidence/fix-regressions.log).
- 740 frontend + 27 servis testi geçti; toplam **767/767**. [Günlük](bugs/evidence/fix-unit-tests.log).
- Üretim derlemesi geçti. [Günlük](bugs/evidence/fix-build.log).
- Mevcut sağ/sol/orta geçişleri ve yakınlaştırma testi geçti. [Günlük](bugs/evidence/fix-alignment-transitions.log).
- Mevcut tez şeridi, ekleme, kayıt/açma ve PDF/DOCX indirme testi geçti. [Günlük](bugs/evidence/fix-word-thesis.log).
- Özgün gözlem scriptinin düzeltme sonrası çıktısı: [JSON](bugs/evidence/rerun/exploratory.json). Önceki hata kanıtları korundu.

Ana uygulama taramasında çalışma alanı oluşturma, standart not yazma/Türkçe karakterler/yeniden açılış, normal To-Do çoklu satır ekleme, başarılı/başarısız durumları ve ondalıklı hedef kaydı denendi. Ayarlar, profil, görünüm, Premium, yardım ve çöp kutusu ekranları açıldı: [ekran envanteri](bugs/evidence/app-panels.json). Bu ek turda yeni doğrulanmış hata kaydedilmedi. Kullanıcının isteğiyle tarama durdurulup dört hatanın düzeltmesine geçildi; bütün uygulamanın tam test edildiği iddia edilmez.
