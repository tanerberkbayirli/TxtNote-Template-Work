# Manisa Celal Bayar Üniversitesi (MCBÜ) — resmi kaynaklar

Kontrol tarihi: **2026-10-01**. Ayrıntılı dosya/sha256 bilgisi için ilgili klasörün `KAYNAK.md`, makine-okur dizin için `metadata.json`, AI özeti için `README.md`.

## Resmi sayfalar
- Lisansüstü Eğitim Enstitüsü (LEE): https://lee.mcbu.edu.tr/ (ÖĞRENCİ menüsü, "Tez Yazım Klavuzu (Word)")
- LEE tezli YL formları: https://lee.mcbu.edu.tr/Sayfa/httpsleemcbuedutrformlartezliyukseklisansformlaritrhtml
- Tıp Fakültesi "Tez ile İlişkili Belgeler": https://tip.mcbu.edu.tr/mezuniyet-sonrasi-egitim/tez-ile-iliskili-belgeler.60014.tr.html

## Arşivlenen dosyalar
| Klasör | Dosya | Resmi URL | Durum / Kanıt |
|---|---|---|---|
| `Lisansustu_Egitim_Enstitusu_Tez/` | `MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx` | https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-JUIK221020251432.docx | CURRENT. Yükleme 22.10.2025; canlı LEE sayfasında listelenen tek tez kılavuzu; sha256 canlı resmi dosya ile aynı. |
| `Tip_Fakultesi_Uzmanlik_Tezi/` | `MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf` | https://tip.mcbu.edu.tr/db_images/file/asistantezyazimkilavuzu-43TR.pdf | CURRENT (sayfada bağlantılı en yeni/tek kılavuz). Belge metninde tarih yok; PDF metadata creation/mod 2014-08-27 (MEASURED); eski "Celal Bayar Üniversitesi" adını taşır. |

## İndirilemeyen (MANUEL_INDIRME_GEREKLI)
LEE sitesi WAF (SafeLine) komut satırı istemcilerine 403 veriyor; atlatılmadı.
- LEE tez kılavuzu PDF (22.10.2025): https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-GTSM221020251445.pdf — sha256 `cb7a4a6d433d360e0087f24d27ab8c40aece4c2e8be0819ab63cf19e91a6055f`
- Tezsiz YL Dönem Projesi Yazım Kılavuzu DOCX: https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-HWQY221020251426.docx — sha256 `2e7b96fed9089476f65aa0862fafaf9d84464f1e5e3184868ade59c25d25a2ea`
- Tezsiz YL Dönem Projesi Yazım Kılavuzu PDF: https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-QEWX221020251458.pdf — sha256 `b76dcbeafc9ce5bf4167980ddb323a36dd8733fcbd4b3b2a633f395557247a5a`

## Kaldırılan / güncel olmayan öğeler
Depodan kaldırılan dosya yok (depodaki tek kaynak dosya güncel; yalnızca yeniden adlandırıldı: `MCBU_Lisansustu_Tez_Yazim_Kilavuzu.docx` → `Lisansustu_Egitim_Enstitusu_Tez/MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx`). Aşağıdakiler SUPERSEDED (INFERRED) olduğundan arşive alınmadı:
- Fen Bilimleri Enstitüsü: 2022 tez yazım kılavuzu (fbe.mcbu.edu.tr/db_images/file/tez-yazim-kilavuzu-3652TR.pdf), TR şablon DOCX/PDF 2022 (tez-yazim-sablonu-448TR), EN Guidelines DOCX 2022.
- Sosyal Bilimler Enstitüsü: 2020 kılavuz DOCX/PDF, 2016 kılavuz PDF (sbe.mcbu.edu.tr).
- Sağlık Bilimleri Enstitüsü: 2021 ve 2015 kılavuz PDF (saglikbe.mcbu.edu.tr, cbuadmin.cbu.edu.tr).

Gerekçe: FBE/SBE/Sağlık BE siteleri Aralık 2023–Ocak 2024'te donmuş; LEE'ye yönlendirme duyuruları var (saglikbe 15.12.2023, fbe 03.01.2024). Açık bir "geçersiz" ifadesi bulunamadı, bu nedenle durum INFERRED. Tam URL/sha256 listesi `metadata.json` içindeki `removed_outdated` alanındadır.
Ayrıca eski `kaynaklar.md`/`metadata.json` içeriği (yalnız LEE; Tıp Fak. kılavuzu ve eski enstitü kılavuzları eksik) bu sürümle değiştirildi. LEE ARŞİV menüsündeki (/Arsiv/1/66, /Arsiv/2/66) sayfalar eski sürümlerdir.

## Bilinmeyenler
- LEE kılavuzu kapağında yer tutucu yıl "Manisa, 2023" (yükleme 2025).
- Lisans bitirme tezi için fakülte düzeyinde kılavuz bulunamadı (tüm birimler taranmadı).
- Diş Hekimliği Fakültesi sitesi (dishekimligi.mcbu.edu.tr) çözümlenemiyor (ERR_NAME_NOT_RESOLVED; dis/dishek/disfakultesi varyantları da); uzmanlık tez kılavuzu alınamadı, başka ağdan yeniden denenmeli.
- LEE Doktora formları sayfası ve Tıp Fak. idari formları incelenmedi.
