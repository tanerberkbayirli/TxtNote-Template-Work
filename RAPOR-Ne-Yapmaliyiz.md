# Rapor — Şablonları Uygulamada Kullanılabilir Hale Getirme: Ne Yapmalıyız?

**Tarih:** 2026-09-30
**Kapsam:** TxtNote / TxtEngine tez şablonu işinin teslim stratejisi (15 üniversite, 32 target, 74 resmi kaynak)
**Dayanak:** `orchestration/progress.json`, `orchestration/README.md` (policy 2026-09-28), `AGENTS.md`, `failures/aku-fbe/*`, `specs/*.json`

---

## 1. Amaç ve teslim tanımı

### Gerçek amaç (doğru tanımlanmış hali)

Tez şablonlarını, kullanıcı uygulamada tezini yazdığında **enstitünün reddetme sebeplerinin hiçbirinin oluşmadığı** çıktı üretecek hale getirmek.

Reddedilme sebepleri somuttur: fazla punto, kaymış kenar boşluğu, yanlış font, yanlış satır aralığı, hatalı başlık formatı, yanlış sayfa numarası yeri. Bunların tamamı **ölçülebilir kural değerleridir**; sayfa görüntüsünün birebir kopyası olması değildir.

### Bu nedenle teslim edilecek ürün üç parçadır

| # | Teslimat | Ne işe yarar |
|---|---|---|
| T1 | **Normalize kural tabanı** (ortak şema + her üniversite için kanıt bağlantılı spec'ler + coverage matrisi) | Yüzlerce şablonun yönetilebilir hale gelmesi |
| T2 | **Şablon üretimi** (motor + veri modülleri; her üniversite bir delta dosyası) | Uygulamada kullanılabilirlik |
| T3 | **Conformance checker** (çıktıyı ölçen, "enstitü şu maddeden reddeder" diyen doğrulayıcı) | Reddedilme garantisi + otomatik doğrulama |

Teslimin tanımı ("done"): her hedef için **kayıtlı kanıta sahip yüksek riskli kuralların tamamı ölçülmüş ve PASS**, kalanlar açıkça etiketli (UNKNOWN / varsayılan davranış), çıktı gerçek uygulama pipeline'ından üretilmiş ve bağımsız doğrulanmış.

---

## 2. Mevcut durum (ölçülmüş)

- **32 target / 15 üniversite** planlandı (`progress.json.universityOrder`).
- **Durum dağılımı:** 1 BLOCKED (`aku-fbe`), 1 IN_PROGRESS (`aku-sagbil`), 30 PENDING.
- **Analiz:** yalnız AKÜ'nün 5 target'ı spec'e bağlandı (`specs/` altında 5 dosya, hepsi AKÜ).
- **`aku-fbe`:** 5 doğrulama denemesi sonucunda BLOCKED. Tıkanma nedeni motor eksikliği değil; **kaynağın kural tanımlamadığı kenar durumlar** (89 karakterlik başlık + 7 jüri onay sayfası taşması) ve bu host'ta Word/LibreOffice yeniden sayfalandırmasının olmayışı.
- **Motor:** 490 test geçiyor; bilinen 9 kısıt var (ayna margin yok, font değişimi, DOM sayfalama bağımlılığı, kaynakça stili uygulanmıyor vb.).
- **Birim maliyet gözlemi:** bir target (en iyi kaynaklı hedef) tam pipeline'da 5 denemede tıkandı, diğer 31'i başlamadı. Bu maliyetle yüzlerce şablona ulaşmak mümkün değil.

---

## 3. Teşhis — üç kök sorun

**S1. Hedef tanımı gereğinden geniş.**
"Her kural milimetrik aynılıkta" hedefi, kaynaklarda kural olmayan yerlerde (uzun başlık taşması, jüri sayısı artışı, örnek şablonda gösterilmemiş durumlar) tanım gereği çözülemez. Mevcut politika "UNKNOWN üstüne uydurma" diyor (doğru), ama aynı belge FAIL sayılıp çözülmeye çalışılıyor. Yüzlerce şablonda bu durum binlerce kez tekrarlanacak.

**S2. Doğrulama hedefi yanlış katmanda.**
Sayfa düzeyinde görsel birebirlik, akışkan içerikte hem imkansız hem de reddedilme sebebi değil. Reddedilme **kural değeri** ihlalinden olur. Sabit formlu sayfalar (kapak, onay, jüri imza bloğu) istisnadır: orada geometri gerçekten milimetrik olmalı.

**S3. Süreç ölçeklenemiyor.**
Her target için elle analiz + bespoke modül + 3-5 denemeli bağımsız doğrulama yapılıyor. Birim maliyet düşmeden hızlanmak imkansız. Ek olarak tarayıcı DOM sayfalama deterministik değil (equation `pad-after` hatası: +7 mm sapma, layout geçişine bağlı) ve Word yeniden sayfalandırma bu ortamda doğrulanamıyor.

---

## 4. Kararlar (onayınıza sunulur)

| # | Karar | Öneri | Alternatif / riski |
|---|---|---|---|
| D1 | Doğrulama hedefi | **Kural uyumu + sabit sayfalarda geometri.** Gövdede sayfa birebirliği VAAT EDİLMEZ. | İnatla sayfa birebirliği istenirse bu bir renderer projesidir; ürün değil, maliyet ve süre katlanır. |
| D2 | Reddedilme güvencesi | Her kurala `rejectionRisk: high/medium/low` alanı; checker önce high'ları ölçer. | Bu alan yoksa doğrulama her şeye aynı önceliği verir ve yine tıkanır. |
| D3 | Çıktı kanonikliği | **DOCX kanonik** (referans = Word semantiği/şablon XML'i), PDF DOCX'ten üretilir (LibreOffice/Word headless). | Mevcut yol (DOM→PDF + ayrı DOCX) iki ayrı referans yaratır; 40/41 sayfa çelişkisi gibi hataların kaynağıdır. |
| D4 | AI'ın yeri | AI yalnız **çıkarma** aşamasında (kaynak → spec). Çalışma zamanında kural yorumlaması yasak. Motor deterministik koddur. | "AI'ın anlayacağı dil" hedefi runtime belirsizliği üretir; determinizm biter. |
| D5 | Şema yapısı | **Ortak taban + üniversite delta.** Taban = "kaynak sustuğunda uygulamanın belgelenmiş varsayılanı" (etiketli). Delta'daki her değer kanıt taşır. | AGENTS.md §6'ya aykırı DEĞİLDİR: delta değerleri kopyalanmaz, kanıtlanır. |
| D6 | Tier politikası | T1 geometri/tipografi (≤0.5 mm, otomatik ölçüm), T2 yapı, T3 içerik lint'i, T4 tanımsız kenar davranış (belgelenmiş varsayılan + uyarı, **target kilitlemez**). | Bu olmadan her üniversite sonsuz deneme döngüsüne girer. |

---

## 5. Yol haritası

### Faz 0 — Omurga (2-3 hafta, tek seferlik yatırım)

1. **Kural sözlüğü (taxonomy):** 20-30 kural tipi (margin, font ailesi/puntosu, satır aralığı, girinti, space-before/after, başlık formatı+numaralandırma, sayfa numarası konumu, kapak blok geometrisi, tablo/şekil açıklaması, dipnot, kaynakça...).
2. **Spec şeması v2:** her kural `{id, category, value, unit, appliesTo, evidence{file,page/style/xpath,quote}, confidence, tolerance, check, rejectionRisk}`.
3. **Migrasyon pilotu:** mevcut 5 AKÜ spec'ini v2'ye taşı; şemayı gerçek veriyle test et.
4. **Coverage matrisi:** üniversite × kural tipi — EXPLICIT / TEMPLATE / MEASURED / INFERRED / UNKNOWN / çıkarılmamış. Bu matris olmadan ölçek planı kör.
5. **Ortam:** LibreOffice kurulumu (DOCX→PDF yeniden sayfalandırma); Word doğrulama zinciri çalışır hale gelir.
6. **AKÜ-FBE kapanışı:** Tier-4 kararı ile (uzun başlık/jüri durumu = belgelenmiş varsayılan davranış + uyarı) BLOCKED durumu çözülür, target kapanır veya açıkça `PASS_WITH_DOCUMENTED_DEFAULT` olarak yeniden tanımlanır.

### Faz 1 — Ürünleştirme (3-4 hafta)

7. **DOCX→spec otomatik analyzer:** resmi DOCX şablonlarından `styles.xml`/section XML ile kural değerlerini otomatik çıkar (MEASURED). Kılavuz PDF'inden yalnız delta elle.
8. **Conformance checker:** çıktıyı ölçer, high-risk ihlalleri madde madde raporlar. Üç amaçla kullanılır: red güvencesi, otomatik doğrulama, regression.
9. **Motor determinizmi:** DOM sayfalama tek ölçüm geçişine bağlanır (blok-boşluk tablosu), equation sweep regresyon testi eklenir — ya da D3 seçilirse DOM sayfalama doğrulama referansı olmaktan çıkar.
10. **Taban+delta yapısının motora bağlanması:** yeni üniversite = delta dosyası + analyzer çıktısı.

### Faz 2 — Kitlesel aktarım (süre: kapsam kadar)

11. Üniversiteleri **kılavuz soyağacına göre partile** (ortak YÖK türevi kılavuzlar birlikte).
12. Her parti: analyzer → delta → checker PASS → checkpoint. Elle iş yalnız analyzer'ın çıkaramadığı delta ve Tier-1 çelişkileri.
13. Bitiş kapısı her hedef için: `kayıtlı kanıt + high-risk kurallar PASS + UNKNOWN envanteri + gerçek export + bağımsız doğrulama + regresyon + commit`.

---

## 6. Teslim paketi (görevi teslim ederken elinde ne olmalı)

1. Bu rapor (yol haritası + karar kaydı).
2. Kural sözlüğü + spec şeması v2 dokümanı.
3. Coverage matrisi (kaç kural, kaçı kanıtlı, kaçı UNKNOWN).
4. Pilot: en az 1 üniversite tamkręcicek bitmiş (AKÜ-FBE + AKÜ-SAGBİL), checker çıktıları ekte.
5. Conformance checker demo çıktısı (örnek bir tez için "red riski" raporu).
6. Açık riskler listesi (aşağıda) ve istenen kaynak talepleri (örn. resmi uzun başlık örneği, Word render ortamı).

---

## 7. Riskler ve açık sorular

| Risk | Etki | Azaltma |
|---|---|---|
| Kaynaklar tanımsız (Tier-4) | Her şablonda tekrarlar | Varsayılan davranış + uyarı; asla kilitleme (D6) |
| Kılavuz-şablon çelişkisi | Doğrulama çıkmazı | Çelişki kaydı + güncellik/özgüllük kuralı; çözülemeyen = documented conflict |
| Font (Arial/Calibri vb.) gerçek font gömme | Tier-1 red riski | DOCX'te gerçek font adı; PDF'te gömme doğrulaması; mümkün değilse açıkça rapor |
| DOCX'in Word'de farklı sayfalanması | Kullanıcı Word'de görünüm farkı | D3 (Word semantiği referans); sabit formlu sayfalar Word render ile doğrulanır |
| El işçiliği sürerse | Teslim gecikmesi | Faz 1 (analyzer+checker) olmadan Faz 2'ye başlanmaz |

**Açık sorular (karar gerekiyor):**
1. D1 onayı: gövde metninde sayfa birebirliği vaat edilmeyecek — kabul mü?
2. "Teslim" dediğin görevin kapsamı ve tarihi ne? (Tüm 32 target mı, 1 üniversite pilotu mu, belli bir tarih mi?) Buna göre Faz 2'nin kesilme noktası değişir.
3. Word/LibreOffice render ortamı: bu Windows host'a LibreOffice kurulabilir mi, yoksa kurumsal kısıt mı var?

---

## 8. İlk hafta (somut, sıralı)

1. Gün: D1-D6 kararlarını onayla; bu raporu teslim dokümanı olarak kullan.
2. Gün: Kural sözlüğü (taxonomy) taslağı + spec şeması v2.
3-4. Gün: 5 AKÜ spec'ini v2'ye migrate et; coverage matrisinin ilk hali.
5. Gün: LibreOffice kurulumu + DOCX→PDF doğrulama zinciri testi; AKÜ-FBE Tier-4 kararıyla kapanış yazımı.

---

*Bu rapor `orchestration/` politikasıyla (2026-09-28 revizyonu) uyumludur; tek fark, Tier-4 "belgelenmiş varsayılan davranış" kavramının resmileştirilmesidir — mevcut `PASS_WITH_GAPS` durumunun yerine geçer.*
