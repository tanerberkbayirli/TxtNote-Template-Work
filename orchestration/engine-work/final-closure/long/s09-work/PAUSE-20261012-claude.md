# Mola kaydı — SRC09 uzun belge uyumu (12.10.2026, Claude)

Kullanıcı mola istedi. Bu kayıttan sonra yeni ölçüm, Word/Chrome deneyi veya kod değişikliği yapılmadı. Genel kabul verilmedi; SRC09 kapanmadı.

## Aktif kod değişikliği (tek dosya)
`engine/src/docx/projection.js` — "ownTerminalLeading" koruması artık tablo hücresi paragraflarına da uygulanıyor (liste maddeleri hariç):
hücre paragrafı için `::after{height:var(--thesis-col-lead);margin-bottom:-var(--thesis-col-lead);break-before:avoid;break-inside:avoid}`.
Gerekçe (gerçek Word ölçümü): Word tablo hücresindeki satıra sayfa sonu "son satır payı" vermiyor (SRC09 s.121 "(C)" kutu alt kenarı 760,7 pt > 759,74 pt → s.122'ye gidiyor). Editör 6,9 pt pay verip satırı 1–3 pt taşırıyordu.
Önceki hâl: `orchestration/engine-work/final-closure/long/s09-work/projection.base.js` (geri almak için bu dosyayı projection.js yerine koy).

## Ölçümler (`s09-work/cycle.sh SRC09 <etiket>`, ölçüm: `s09-work/t*/`)
| Sürüm | Editör/Word sayfa | Kayık açılış (157) |
|---|---|---|
| taban (`s09-now`) | 179/180 | 40 |
| hücre koruması (`t3-cellfull`) | 181/180 | 32 |

s.120–129 kümesi tamamen hizalandı. DİKKAT: sayfa sayısı 181 oldu (taban 179); son sayfalarda (s.180) yeni 4 token kayması var; nedeni araştırılmadı.
**SRC10 ve diğer hedefler için gerileme kontrolü YAPILMADI.** Önceki "hücre terminal-leading" denemesi SRC10'u 8→11 kayığa çıkarmıştı; bu sürüm farklı (kesin Word kuralı + blok pseudo-element) ama doğrulanmadı. Doğrulanmadan kabul edilmemeli.

## Bulgular
- Birim hatası tuzağı: editör `pages.json` y değerleri ekran pikseli; Word pt ile karşılaştırırken `/1.01197` gerekir (`pp.py`, `edpage.py` bunu yapıyor).
- s.83–86, 91 kayıkları büyük oranda grafik metin sırası gürültüsü (editör grafiği yer tutucu çiziyor); gerçek sayfa kırılımı sorunu olmayabilir.
- **s.81 Şekil 3.1 (tek hücreli tablo, `trHeight` 117,35 pt atLeast, içinde iç içe tablo):** editörde tablo 143 pt, Word'de 118 pt. Fark hücre sonundaki boş paragraftan: editör ~29 pt veriyor. Word deneyleri (`s09-work/nest/*.docx`, sonuçlar `orchestration/engine-work/mission08/resume-word/`): iç içe tablodan sonra hücrenin TEK boş son paragrafı yükseklik vermiyor (0 pt, yazı boyutundan bağımsız); iki boş paragraf varsa her biri ~26,3 pt; metinli paragraf ~32,6 pt veriyor. Önerilen düzeltme (yazılmadı): `projection.js` içinde hücre çocukları `[..., table, boş paragraf]` olduğunda o paragrafı sıfır yüksekliğe indir. Bu, hücre koruması sonrası görünen s.82–83 kaymasını da kapatmalı.
- s.49–51: Şekil 2.6 gövdesinde 11 gövde paragrafı + wrapSquare metin kutuları; Word 7. paragrafı 53 pt aşağı itiyor (editör yüzen nesneleri akışa katmıyor). Dokunulmadı.
- Kalan kümeler: s.84–107 (denklem satır yüksekliği = matematik + 6,9 pt), s.158–177 (EK-2 yüzen tablo, 15 sayfa).

## Devam sırası
1. SRC10 + `npm test` + hedefli Word hedefleriyle hücre koruması gerileme kontrolü; s.180/181 sayfa farkının nedeni.
2. Şekil 3.1 boş son paragraf kuralı (yukarıda), ölçüm.
3. Denklem yüksekliği, EK-2 tablo, yüzen şekiller.
4. Güncel kodla yeni tek seri kabul (`accept.ps1`, `verify.mjs`).

## Süreçler
Yeni sunucu başlatılmadı; ölçümler Claude'un mevcut Vite 5210 (PID 10468) sunucusunu kullandı, açık bırakıldı. Playwright Chrome'ları her koşuda kapandı. Word mini deneyleri `word2pdf.ps1` ile kendi örneğini açıp kapattı. Önceden açık WINWORD süreçlerine dokunulmadı. Commit yapılmadı.
