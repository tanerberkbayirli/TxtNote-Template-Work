# Afyonkarahisar Sağlık Bilimleri Üniversitesi (AFSÜ) — şablon arşivi

Bu klasör bir ARŞİVDİR, spesifikasyon değildir. Biçim değerleri burada çıkarılmamıştır; her değer ilgili resmi dosyadan (EXPLICIT/MEASURED) alınmalıdır. Kontrol tarihi: 2026-10-01. Ayrıntılar: `metadata.json` (makine okunur), `kaynaklar.md` (URL ve güncellik kanıtı), her alt klasörde `KAYNAK.md` (dosya başına URL, sürüm, kanıt, sha256).

Tüm belgeler Türkçe. İngilizce resmi kılavuz/şablon bulunamadı. Hiçbir dosya OUTDATED değil; hiçbiri silinmedi.

## 1. Lisansustu_Egitim_Enstitusu_Tez/ — Lisansüstü Eğitim Enstitüsü (yüksek lisans + doktora)

Yetkili biçim kaynağı: `AFSU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx` (YL ve doktora için ortak). Şablonlar derece başına ayrı.

| Dosya | Rol | Derece | Sürüm/tarih | Durum |
|---|---|---|---|---|
| AFSU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx | kilavuz (YETKİLİ) | YL + Doktora | Kapak Aralık 2025; LEE Kurulu 20/10/2025, 04/04 | CURRENT |
| AFSU_Lisansustu_Yuksek_Lisans_Tez_Sablonu_2026.docx | sablon | YL | sayfa 24.09.2026 | CURRENT |
| AFSU_Lisansustu_Doktora_Tez_Sablonu_2026.docx | sablon | Doktora | sayfa 24.09.2026 | CURRENT |
| AFSU_Lisansustu_Tez_Kapak_Formatlari_2024.doc | form (kapak formatları, .doc) | YL + Doktora | upload 2024-07; OLE metadata: created 2020-04-30, last saved 2024-07-23 (MEASURED) | CURRENT |
| AFSU_Lisansustu_YL_Kabul_Onay_Sayfasi_2026.docx | form (kabul/onay sayfası) | YL | 2026 | CURRENT |
| AFSU_Lisansustu_Doktora_Kabul_Onay_Sayfasi_2026.docx | form (kabul/onay sayfası) | Doktora | 2026 | CURRENT |
| AFSU_Lisansustu_YL_Tez_Yazim_Kontrol_Listesi_Savunma_Oncesi_2026.docx | form (LEE.FR.28) | YL | 2026 | CURRENT |
| AFSU_Lisansustu_YL_Tez_Yazim_Kontrol_Listesi_Savunma_Sonrasi_2026.docx | form (LEE.FR.31) | YL | 2026 | CURRENT |
| AFSU_Lisansustu_Doktora_Tez_Yazim_Kontrol_Listesi_Savunma_Oncesi_2026.docx | form (LEE.FR.58) | Doktora | 2026 | CURRENT |
| AFSU_Lisansustu_Doktora_Tez_Yazim_Kontrol_Listesi_Savunma_Sonrasi_2026.docx | form (LEE.FR.61) | Doktora | 2026 | CURRENT |
| AFSU_Lisansustu_Tez_Onerisi_Hazirlama_Kilavuzu_2025.pdf | kilavuz (tez ÖNERİSİ) | YL + Doktora | Kapak Aralık 2025 | CURRENT |

Notlar ve bilinmeyenler:
- Kontrol listeleri ve kabul/onay sayfaları ikincil çapraz kontrol kaynağıdır; kılavuz/şablonla çelişirse kayıt altına alın, sessizce seçmeyin.
- Tez önerisi kılavuzu tez yazım biçimi için yetkili değildir; ilgisi doğrulanmadı (muhtemelen sınırlı).
- Kapak Formatları .doc: OLE metadata created 2020-04-30, last saved 2024-07-23 (MEASURED; HTTP Last-Modified 23 Jul 2024 ile uyumlu). Resmi sitedeki 2020 tarihli JPG kapak görselleri indirilmedi.
- "Geçerli 16.02.2026" ifadesi (eski kaynaklar.md/metadata.json) belgede yoktur; doğrulanmış kabul edilmemelidir.

## 2. Tip_Dis_Hekimligi_Uzmanlik_Tezi/ — Tıp ve Diş Hekimliği Fakülteleri (uzmanlık tezi)

| Dosya | Rol | Sürüm/tarih | Durum |
|---|---|---|---|
| AFSU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf | kilavuz (tip.afsu.edu.tr kopyası, 33 s.) | Kapak Temmuz 2021; PDF 2021-08-26 | CURRENT |
| AFSU_Dis_Hekimligi_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf | kilavuz (dhf.afsu.edu.tr kopyası, 32 s.) | Kapak Temmuz 2021; PDF 2021-09-21 | CURRENT |

- Aynı kılavuzun iki PDF dışa aktarımı; gövde metni aynı (kelime düzeyinde fark yok), İÇİNDEKİLER sayfa numaraları ve ek örnekleri farklı. Üniversite hangisinin asıl olduğunu belirtmiyor: asıl kopya UNKNOWN. DHF kopyası daha sonraki dışa aktarım. Biçim değeri çıkarırken ikisini de karşılaştırın; ek örnekleri sayısal karşılaştırılmadı.
- Şablon (docx) yok; yalnız kılavuz.

## 3. Eczacilik_Arastirma_Projesi/ — Eczacılık Fakültesi

| Dosya | Rol | Sürüm/tarih | Durum |
|---|---|---|---|
| AFSU_Eczacilik_Arastirma_Projesi_Dersleri_Yonergesi_2024.pdf | yonerge (rapor yazım kuralları içerir; 13 s.) | 16.01.2024 | CURRENT |

- Tez kılavuzu değil; araştırma projesi dersleri yönergesi, madde 1.3-1.5 civarında rapor yazım kuralları gömülü. Bağımsız şablon yok. Tez şablonu hedefi için kapsam uygunluğu ayrıca değerlendirilmelidir.

## Genel açık sorunlar
- Sağlık Bilimleri Fakültesi (sbf.afsu.edu.tr; 8 sayfa tarandı) ve MYO (ashmyo, bolvadinshmyo) bitirme tezi kılavuzu bulunamadı; Şuhut MYO sitesi (suhutmyo.aku.edu.tr, aku.edu.tr alan adı) formlar/öğrenci formları/yönerge sayfaları kontrol edildi: yazım kılavuzu yok (yalnız staj yönergesi, formlar). Tam tarama değil.
- İngilizce kılavuz/şablon yok.
- Diş Hekimliği sitesinde yalnız uzmanlık kılavuzu var (şablon yok).
- Üniversiteler arası izolasyon: bu klasördeki hiçbir değer başka üniversiteye taşınmamalı.
