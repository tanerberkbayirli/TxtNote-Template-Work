# Motor varsayılanları ölçümü — 22.10.2026

Soru: şablonların yazdığı kural değerlerinden hangileri motorun zaten kendiliğinden yaptığı şeydir? (Karar: motor esas, şablon yalnız
kaynağın söylediğini taşır; bkz. [ALTYAPI.md](../ALTYAPI.md).) Hiçbir şablon değiştirilmedi.

**Araç:** `node engine/tools/templates-defaults.mjs [--only <id>] [--out <json>]` (ham sonuç: [MOTOR_VARSAYILANLARI_2026-10-22.json](MOTOR_VARSAYILANLARI_2026-10-22.json)).
**Yöntem:** her kural değeri (page, typography, tables, figures, equations, toc, footnotes ve her bölümün `overrides`'ı) şablonun bir
kopyasından silinir; gerçek derleyici (`compileThesisDocument`) bir probe belgesiyle (başlık 1–4, dipnot, liste, açıklamalı tablo ve
şekil, iki bölüm) yeniden çalışır ve model + ondan üretilen CSS (`buildThesisCss`) karşılaştırılır.
`NO_EFFECT` = çıktı aynı, `DIFFERENT` = çıktı değişti, `REQUIRED` = doğrulama şablonu reddetti, `UNPROBED` = probe belgesinde o kuralın
içeriği yok (bir şey iddia edilmez: kaynakça, denklem, resim türleri, adlandırılmış paragraf stilleri). Tek tek etkisiz çıkan değerler
birbirini örtebileceği için ardından birikimli eleme yapılır (önce bölüm geçersiz kılmaları, sonra şablon düzeyi); sonuç
`jointlyRemovable`: birlikte silinebilen küme.

## Sonuç (34 şablon, 10 162 kural değeri; ikiz yüksek lisans/doktora şablonları ayrı sayılır)
| Sınıf | Değer | Oran |
|---|---|---|
| NO_EFFECT (tek tek) | 3174 | %31 |
| DIFFERENT | 4573 | %45 |
| REQUIRED | 1566 | %15 |
| UNPROBED | 849 | %8 |

- **Birlikte silinebilen: 3125 değer (%31).** 49'u birbirini örtüyordu (MCBÜ'de 54 tek tek etkisizden 47'si birlikte silinebildi). Bunların
  **2795'i** bölüm geçersiz kılması (`sections.*.overrides.…`) ve yalnız o bölümün zaten devraldığı değeri yeniden yazıyor; **330'u** şablon
  düzeyi.
- Şablon düzeyindeki etkisizlik iki kaynaktan gelir:
  1. **`typography.paragraph.*` gövdenin kopyası:** 34/34 şablonda gövdeyle aynı (paragraf yoksa gövdeye düşer). Saf tekrar.
  2. **Motorun gerçekten yaptığı varsayılanlar:** `page.header.heightMm = 0` (24/24), `footnotes.placement = "pageBottom"` (23/23),
     `footnotes.fontFamily` = gövde yazı tipi (29/29), `footnotes.firstLineIndentMm = 0`, `footnotes.align = "left"`, `widowControl = true`,
     üst/alt bilgi mesafesi 12,5 mm (şablonların yarısında). Üst/alt bilgi yüksekliği ve mesafesi `engineDefaults.js` ile, dipnot
     yerleşimi `schema.d.ts` varsayılanıyla uyumludur.
- **Herkesin aynı değeri yazdığı ve doğrulamanın zorunlu tuttuğu yollar** (41 yol ≥20 şablonda `REQUIRED`; tek değerli olanlar):
  `page.orientation = "portrait"`, `tables/figures.numbering.sequence = "arabic"`, `toc.showPageNumbers = true`,
  `typography.lineSpacing.mode = "word"`, `page.numbering.enabled = true`, `page.numbering.position = "bottom"`.
  Doğrulama bunları zorunlu tuttuğu için kaynak bir şey söylemese bile üretici bir değer **uydurmak zorunda kalır**. Motorun ilkesine
  ("kaynağın tanımlamadığı kurala uydurma değer zorlanmaz") en çok aykırı olan bu boşluktur.
- ≥%90 aynı olup etkili olan değerler (A4, 210×297, Times New Roman 12 pt, satır aralığı 1,5, iki yana yaslı, 1,15 em) **üniversite
  gereksinimidir**, motor varsayılanı yapılmaz.

## Yorum: ne yapılmamalı
- **3125 değeri toptan silmek doğru değildir.** `NO_EFFECT` "bu değeri motor zaten böyle yapıyor ya da şablon başka yerden devralıyor"
  demektir; kaynağın o değeri söylemediği anlamına gelmez. Bölüm geçersiz kılmalarının çoğu kaynağın söylediği değerin açık yazımıdır
  (örn. özel sayfalarda gövde satır aralığı 1, girinti 0); silmek menşei kaybettirir ve davranışı devralma zincirine bağlar. 33 eski şablonun
  değer başına kaynak gerçeği yoktur (yalnız ADÜ Sağlık için var), bu yüzden hangisinin "kaynak sessizdi" olduğu bilinemez.
- Dolayısıyla ölçüm bir **silme listesi değil, motorun gerçek varsayılanlarının haritasıdır.**

## Sınırlar
- Karşılaştırma model + CSS düzeyindedir; DOCX/PDF yazıcıları ve gerçek Word bu çalışmada çalıştırılmadı. Herhangi bir değer şablondan
  çıkarılmadan önce altın (`golden.mjs`), `parity.mjs` ve `check.mjs --word` kapılarından geçmelidir.
- Probe tek gövde bölümünde dipnot içerir; birden çok bölümde dipnot gerektiren davranış göremez. **`footnotes.numbering = "document"`
  16/16 etkisiz çıktı ama probe bunu ayıramaz; sonucu güvenme.** Ayrıca `schema.d.ts` (satır 321) varsayılanı `"section"` diye yazıyor,
  `engine.js` yorumu `"document"` diyor: belge ile kod çelişiyor, ayrı doğrulanmalı.
- `UNPROBED` 849 değer için hiçbir şey söylenmez.
- Değerlerin sayımı şablon örneği başınadır (13 ikiz şablon iki kez geçer).

## Önerilen sonraki adım (karar bekliyor)
1. **Doğrulamadaki zorunluluğu motor varsayılanına çevir** (yukarıdaki tek değerli 6 yol, önce en güvenlisi: `page.orientation`,
   `numbering.sequence = "arabic"`): `engineDefaults.js` yalnız **eksik** anahtarı doldurur, `validation.js` bunları artık zorunlu
   saymaz. Mevcut şablonlar değişmez; yeni şablon kaynak sessizse uydurmak zorunda kalmaz. Davranış değişmez (kapılar).
2. `schema.d.ts` / `engine.js` arasındaki dipnot numaralandırma varsayılanı çelişkisini giderip çok bölümlü probe ile ölç.
3. Mevcut şablonlardaki etkisiz değerlere dokunma; yalnız yeni üretimde (`template-add`) motor varsayılanıyla aynı olan, **kaynakta
   bulunmayan** değer yazılmaz.
