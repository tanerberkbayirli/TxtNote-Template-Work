# İçindekiler paneli — ürün kararı ve yeni şablona bağlama

Bu belge, kullanıcının 25.10.2026 tarihindeki son içindekiler taleplerinin kalıcı uygulama yönergesidir. **Yeni üniversite/şablon ekleyen, mevcut şablonu düzenleyen veya içindekiler üzerinde çalışan yapay zekâ, işe başlamadan bu belgeyi okumalıdır.** Kullanıcıdan burada karara bağlanmış davranışları tekrar tarif etmesini istemeyin. Kullanıcının daha yeni açık talimatı önceliklidir.

Bu bir açık görev veya kendiliğinden bütün üniversiteleri değiştirme yetkisi değildir. Verilen şablon işinde mevcut ortak bileşeni kullanma kuralıdır. Eski raporlardaki “Uygula”, “Düzey”, otomatik bölüm numarası veya “Sayfaya git” alanları güncel arayüz talimatı değildir.

## Korunacak kullanıcı deneyimi

- İçindekiler düğmesi ve paneli **editörün sağında, sayfadan ayrı bir sütunda** durur. Sayfayı örten sabit/yüzen düğme veya panel yapılmaz; açık panel sayfa alanına yer bırakır.
- Kapalı panelin düğmesi, şeridin hemen altındaki sağ gri alanda yatay `İçindekiler` düğmesidir; en sağ kenarda dikey sekme değildir. Düğme sayfalar kaydırılırken yerinde kalır; sayfa alanını örten absolute/fixed konumlandırma yerine ayrı sağ sütun kullanılır.
- Aynı sağ sütunda İçindekiler'in altında `Tez bilgileri` bulunur. Tez bilgileri ve sayfa ayarları tek paneldedir; sayfa ayarları metadata alanlarının sonunda `Sayfa ayarı` başlıklı, varsayılan olarak kapalı bir genişletme bölümüdür. Ayar alanları genişletmeden render edilmez. Eski ayrı “Tez bilgileri”/“Sayfa ayarları” çekmecelerini yeniden oluşturmayın; şerit kısayolları da bu ortak alana gider. Sayfa ayarlarının mevcut kapsam/uygula işlemleri korunur; içindekilerin anlık uygulama kararı bu ayrı sayfa düzeni formunu otomatik uygulamaya dönüştürmez.
- Kapalı satırda yalnız kullanıcının yazdığı numara (varsa), başlık adı ve sayfa etiketi görünür. Ana başlıklar belirgin; `1.1`, `3.3.3` gibi alt başlıklar küçük, girintili ve çok ince bağlantı çizgisiyle gösterilir. Başlıklar varsayılan olarak görünür; ayrıntılar kapalıdır.
- Satıra tıklayınca yalnız o satırın ayrıntıları açılır; tekrar tıklayınca kapanır. Ayrıntıda **Başlık, Sayfa ve Sil** bulunur. “Düzey”, “Sayfaya git”, yukarı/aşağı taşıma ve “Alt başlık” kontrollerini geri getirmeyin.
- Tek ekleme eylemi `+ Başlık ekle`dir. Numara isteğe bağlıdır: `Özet`, `1. Özet`, `2.1 Amaç`, `3.3.3 Araştırma soruları` yazılabilir. Numarayı kullanıcı adın içine yazar; başlığa ikinci bir numara, yeni sıra veya zorunlu bölüm adı eklenmez. Hiyerarşi yazılmış numara önekinden anlaşılır; kullanıcıya düzey seçtirilmez.
- **Her değişiklik anında belgeye uygulanır.** Bir harf silinince sayfada da silinir. Sayfa değiştirme, ekleme ve silme için “Uygula” düğmesi veya onay yoktur. Ara yazım hâlinde boş başlık/sayfa kabul edilir; canlı güncellemeyi engelleyen zorunlu-alan doğrulaması eklemeyin.
- Yazarken imleç, odak ve açık ayrıntı korunur. Her harfte paneli yeniden mount eden `key`, kopya yerel taslak veya blur/onay bekleyen veri akışı kullanmayın. Sıralama değişince de aynı satırın kalıcı kimliği korunur.
- Kullanıcının yazdığı sayfa etiketi esastır; otomatik başlık konumu ile üzerine yazılmaz. İçindekiler **sayfaya göre** sıralanır: önce geçerli Roma rakamları kendi sayısal değerlerine göre, sonra normal sayılar küçükten büyüğe. Örnek: `I → II → IV → IX → 1 → 2 → 3 → 5 → 10`. `IX`, Arap rakamı `1`den önce gelir; aynı sayı sistemi içinde `2`, `10`dan önce gelir. Küçük/büyük Roma harfleri eşdeğerdir. Aynı sayfalı satırların kendi sırası korunur; boş/geçersiz sayfalar yazım sırasında sona alınır, satır silinmez.
- Çelişkili hiyerarşide kullanıcının değerlerini düzeltmeye çalışmayın: `2 / 10`, `2.1 / 20`, `3 / 15` girdisi **`2 / 10 → 3 / 15 → 2.1 / 20`** olur. `2.1` başka ana başlığın altındaymış gibi yeniden numaralandırılmaz; `2`nin sayfası değiştirilmez. Başlık numarasına göre sayfa sırasını bozmayın. Bu davranış bilinçli olarak girdiyi aynen korur; çelişki düzenlemeyi engellemez.
- Editörde belge üzerindeki içindekiler başlığına tıklama/Enter, girilen **basılı sayfa etiketine** gider; fiziksel sayfa sırası veya kaynak başlığın otomatik konumu kullanılmaz. Hedef henüz yoksa bilgi verilir. Bu özellik panel ayrıntılarına “Sayfaya git” düğmesi ekleme gerekçesi değildir.
- Kullanıcı isterse “Otomatik içindekilere dön” ile otomatik dizine dönebilir.
- **Gövde başlığı bağı (25.10.2026 kararı):** panelde `+ Başlık ekle` ile eklenen satır (`bodyLinked: true`) gövdede de gerçek başlık olur. Başlık ve sayfa girilince, o basılı sayfanın düzenlenebilir bölümünde sayfanın ilk bloğunun önüne `<hN data-toc-row="<satır kimliği>">` eklenir; metni “2.1 Amaç” önekinden arındırılmış addır, düzey önekten (1.1 → 2) çıkar, numarayı **şablon** üretir (gövdeye ikinci numara yazılmaz). Satırın adı değişince başlık yerinde güncellenir, sayfa değişince taşınır, satır silinince yalnız başlık kalkar (altındaki metin kalır). Şablonun sabit/otomatik sayfalarında veya şablonda zaten bulunan başlık adında eklenmez, mesaj verilir. Eski/otomatik satırlar bağlı değildir. Gövdedeki başlığı elle değiştirmek satırı güncellemez. Sayı öneki yazılmamış başlık (ör. “Neden TXTNOTE”, “Özet”) gövdeye `data-unnumbered="true"` ile yazılır: şablon bölüm numarası (“BİRİNCİ BÖLÜM”) ve zorunlu sayfa sonu uygulanmaz, başlık tam girilen sayfada kalır. Önek yazılmışsa (“1 Giriş”, “2.1 Amaç”) şablon kendi numarasını verir; “1” gibi birinci düzey numaralı başlık şablonda bölümdür (başlık + yeni sayfa). **Olmayan sayfa:** bağlı satırın sayfası belgede yoksa (ör. Kaynakça → 20), sayfa alanında Enter veya alandan çıkışta (yazarken değil; her rakamda sayfa üretilmez) ana gövdenin sonuna `<p><br></p>` + sayfa sonu çiftleri eklenip o sayfaya kadar yer açılır; şablonda aynı adlı bölüm varsa (Kaynakça) o bölüm hedef sayfada başlar, yoksa başlık hedef sayfaya konur. En çok 400. sayfa, yalnız normal (Arap) sayfa etiketi; Roma sayfalar için yer açılmaz. Not: ardışık boş sayfa sonları sütun akışında yok sayıldığı için aralarına boş paragraf konur. Kod: [tocBodyHeadings.js](../../TxtNote/frontend/src/features/editor/tocBodyHeadings.js), `onContentsChange` (ThesisEditor.jsx).

## Üniversite biçimi ve çıktı

Ortak panelin davranışı üniversiteden bağımsızdır. Font, punto, girinti, satır aralığı, noktalı lider, sayfa sütunu ve diğer çıktı biçimleri **seçili şablonun kendi `generatedIndex` ve tipografi kurallarından** gelir. MCBÜ geometrisini AKÜ/AFSÜ veya başka üniversiteye kopyalamayın. Resmî kuralların araştırılması ve güncellik doğrulaması için [BASLA.md](../BASLA.md) kaynak önceliği geçerlidir; bu rehber resmî tez kılavuzunun yerine geçmez.

Elle yazılmış başlık/numara ve sayfa, PDF ve Word'de korunmalıdır. Word'de bu listeyi yeniden hesaplanacak yerel `TOC`/`PAGEREF` alanına çevirmeyin. Kullanıcının sayfa etiketi Word alan yenilemesiyle değişmemeli; otomatik şekil/tablo dizinleri ise mevcut otomatik işleyişini sürdürebilir. Ad içindeki isteğe bağlı numarayı şablonun bölüm sayacı ile yeniden üretmeyin. Şablonun tipografik büyük/küçük harf kuralları ile kullanıcının yazdığı numarayı ayırın.

## Mevcut kodun tek bağlantı noktaları

- [manualToc.js](../../engine/src/manualToc.js): `contentsPanelUniversity(templateId)` desteklenen üniversiteyi ve panel adını belirler; `contentsTitleParts` yazılmış numarayı ayırır; `normalizeManualTocRows` eksik/yinelenen eski kimlikleri sıralamadan önce güvenli biçimde onarır; `sortManualTocRows` sayfaya göre sıralar; `manualTocEntries` ortak satır modelini üretir. `contentsPageKey` gezinmede basılı etiketleri eşleştirir (ör. `Ⅱ` = `II`, `002` = `2`; Roma `II` ile normal `2` farklıdır).
- [ThesisContentsPanel.jsx](../../TxtNote/frontend/src/features/editor/ThesisContentsPanel.jsx) ve [thesisContents.css](../../TxtNote/frontend/src/features/editor/thesisContents.css): ortak sağ panel. Üniversite başlığı `universityName` prop'undan gelir; bileşene sabit üniversite adı yazılmaz.
- [ThesisEditor.jsx](../../TxtNote/frontend/src/features/editor/ThesisEditor.jsx): paneli sağ flex sütununa bağlar; desteklenen şablonda gerçek `generatedIndex.kind === "toc"` bölümü varsa gösterir. Canlı veri `thesis.manualToc` üzerinden okunur ve değişiklikte belgeye yazılır.
- [engine.js](../../engine/src/engine.js) ve [generatedIndex.js](../../engine/src/generatedIndex.js): aynı destek denetimiyle elle girilen listeyi derler, seçili bölümün dizin sunumunu üretir; bu sayfaları otomatik kaynak eşlemesinin zorunlu hedefleri yapmaz.
- [export.js](../../engine/src/export.js), [docx/body.js](../../engine/src/docx/body.js): manuel listeyi Word'de sabit girilmiş sayfalarla üretir. [export.mjs](../../engine/tools/export.mjs) gerçek dışa aktarım kontrolünde manuel etiketleri otomatik sayfa haritası yerine girilen etiketle karşılaştırır.

Kalıcı yeni satır biçimi:

```js
thesis.manualToc = {
  enabled: true,
  rows: [
    { id: "kalici-benzersiz-kimlik", title: "2.1 Amaç", page: "10", literalTitle: true }
  ]
};
```

`id` başlık veya sayfa değişince değişmez; sıralama indeksi kimlik yapılmaz. `title` kullanıcının tam girdisidir; yazarken boşlukları silerek imleci bozmayın. Yeni kayıtlarda `literalTitle: true` kullanın. Eski `level` tabanlı veriler için mevcut uyumluluk yolunu koruyun; yeni arayüzde otomatik numaralandırmayı yeniden başlatmayın. Otomatik moda dönüş manuel alanı kaldırır.

Bozuk/eski kayıt onarımında eksik kimlik için özgün yükleme sırasından kararlı bir kimlik üretilebilir; onarım **sıralamadan önce** yapılır ve bir sonraki belge değişikliğinde onarılmış kimlikler saklanır. Yinelenen kimlik yüzünden bir satırı silmek diğer satırı silemez. Boş/kısmi kayıt tüm editörü çökertmemelidir. Word'den kopyalanan `Ⅱ`, `Ⅸ` gibi karakterler sıralama ve gezinmede normalleştirilir; kullanıcının yazdığı etiket çıktı için korunur. Büyük sayılarda `Number` yuvarlaması/taşması ile sıra belirlenmez.

## Yeni şablonda uygulanacak sıra

1. Hedef üniversitenin mevcut kayıtlarını ve şablonunu inceleyin. İçindekiler bölümünün resmî kurallarla tanımlanmış `generatedIndex.kind: "toc"` üretmesini sağlayın. Şablon kaydı/normalleştirme hattını kullanın; ortak panel için ayrı bir içindekiler sayfası veya ikinci veri modeli oluşturmayın.
2. Üniversite `contentsPanelUniversity` içinde zaten varsa yeni varyant aynı ortak yolu kullanır. Yeni üniversiteyse **yalnız bu ortak eşlemeye** gerçek şablon kimliği önekini ve görünen kısaltmayı ekleyin. Arayüz ve motor aynı yardımcıyı kullanır; bunlara ayrı ayrı yeni üniversite listeleri eklemeyin. Mevcut eşleme MCBÜ, AKÜ ve AFSÜ'dür; evrensel otomatik etkinleştirme yapılmış varsaymayın.
3. Ortak `ThesisContentsPanel` bileşenini kullanın. Üniversiteye özel panel, form, sayaç, sıralayıcı veya kopya JSX üretmeyin. Yeni üniversite için mevcut kullanıcı deneyimini yeniden sormayın; doğrulanamayan **resmî biçim kuralı** farklı bir belirsizliktir.
4. İçindekiler gerektirmeyen belgelerde (örneğin mevcut bazı tez önerisi/seminer varyantları) sırf panel açmak için içindekiler sayfası uydurmayın. Hedefte gerçekten gerekli olup eksikse resmî kaynağa göre şablonu tamamlayın; kapsamı kaydedin. Sabit varyant sayıları yerine kayıt defterindeki güncel kapsamı denetleyin.
5. Değişikliği doğrulayın; yalnız haritaya ekleyip “tamamlandı” demeyin.

## Doğrulama ve kabul

Komutlar proje kökünden:

```powershell
node --test engine/src/manualToc.test.js engine/src/manualTocStress.test.js engine/src/presentationLayout.test.js engine/src/layoutOutput.test.js
npm --prefix TxtNote/frontend run build
```

Yeni üniversite/variyant için [manualToc.test.js](../../engine/src/manualToc.test.js) kapsamını genişletin. İsimlerin/isteğe bağlı numaraların korunmasını, Roma → normal sayı sırasını, aynı sayfada kararlılığı, sayfalama sonrası manuel etiketin değişmemesini, Word'de manuel hedeflere `PAGEREF` yazılmamasını ve şablonun kendi dizin kuralının korunmasını denetleyin. İçindekiler olmayan varyantı da ayırt edin.

[manualTocStress.test.js](../../engine/src/manualTocStress.test.js) çelişkili başlık sırası, büyük sayılar, yapıştırılmış Roma karakterleri, çok satırlı adlar, eksik/yinelenen kimlikler, bozuk kayıt, metin kaçışları ve tekrarlı ekleme/düzenleme/silme senaryolarını kapsar. Bu testleri gevşeterek veya satırları silerek hata kapatmayın.

Gerçek editörde paneli açın; bir başlığın son harfini silin, adını tamamen boşaltın, sayfasını `IX`ten `10`a değiştirin. Belge ve panel anında eşleşmeli; satır doğru yere taşınmalı, odak ve açık ayrıntı kaybolmamalıdır. `1. Özet` ve `3.3.3 Amaç` örneklerinde ikinci numara üretilmemeli; girinti anlaşılmalıdır. PDF/DOCX çıktısında girilen sayfa ve sıra korunmalı; şablona ait lider ve sayfa sütunu bozulmamalıdır. Gezinmeyi basılı etiket üzerinden kontrol edin.

Gerçek editör kontrolü için mevcut [panel fixture'ı](../../TxtNote/frontend/tests/mcbu-contents-review.jsx) `tests/mcbu-contents-review.html?template=<gerçek-şablon-id>` ile hedefi yükleyebilir. Adındaki MCBÜ ifadesi kapsam sınırlaması değildir. Gerçek dışa aktarım için `engine/tools/export.mjs` ve [CHECKER.md](../motor/CHECKER.md) yolunu kullanın. Yeni çıktı biçimi eklenmişse gerçek PDF ve Word görünümünü inceleyin; yalnız birim testi tam görsel uygunluk kanıtı değildir.

Kanıtları ve sonucu [BASLA.md](../BASLA.md) yerleşimine göre kaydedin. Tarihli ekran görüntüleri veya önceki PASS sayıları yeni şablonun geçtiği anlamına gelmez. Bu rehberdeki teknik yolları uygulama değişince güncel tutun.
