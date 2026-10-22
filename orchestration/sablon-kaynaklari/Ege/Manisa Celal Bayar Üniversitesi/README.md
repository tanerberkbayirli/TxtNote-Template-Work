# Manisa Celal Bayar Üniversitesi (MCBÜ, short_code: MCBU) — Arşiv indeksi / Archive index

Kontrol tarihi / checked: 2026-10-01. Bu klasör bir ARŞİVDİR, spesifikasyon değildir; biçim değerleri (kenar boşluğu, font vb.) burada çıkarılmamıştır. / This is an archive, not a spec: no formatting values are extracted here.
Makine-okur dizin: `metadata.json`. Kaynak URL'leri: `kaynaklar.md`. Dosya başına ayrıntı: her klasördeki `KAYNAK.md`.

## 1. Lisansustu_Egitim_Enstitusu_Tez/
- **Kapsam / scope:** LEE tezli yüksek lisans ve doktora tez yazımı (Fen, Sosyal ve Sağlık Bilimleri enstitüleri LEE altında birleşti).
- **Dil / language:** tr
- **Dosyalar:**

  | Dosya | Rol | Durum |
  |---|---|---|
  | `MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx` | kilavuz (kural metni, Word; ayrı sablon yok) | CURRENT |

- **Biçim değerleri için yetkili dosya / authoritative:** `MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.docx` (tek güncel kaynak; kapak/onay sayfaları kılavuz içinde).
- **Tarih/sürüm:** yükleme 22.10.2025. **Kaynak:** https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-JUIK221020251432.docx
- **Bilinenler/belirsizlikler:**
  - Kapakta yer tutucu yıl "Manisa, 2023"; güncellik kanıtı yükleme tarihidir (dosya/HTTP metaverisi).
  - Eski FBE/SBE/Sağlık BE kılavuzları LEE ile SUPERSEDED (INFERRED; açık iptal metni yok); bazı programlar hâlâ enstitü dönemi kurallarını izliyorsa çelişki olasılığı UNKNOWN.
  - Ayrı İngilizce kılavuz LEE'de yok (yalnız eski FBE EN kılavuzu vardı, arşive alınmadı).

## 2. Tip_Fakultesi_Uzmanlik_Tezi/
- **Kapsam / scope:** Tıp Fakültesi tıpta uzmanlık (asistan) tezi; LEE kapsamı dışında.
- **Dil:** tr
- **Dosyalar:**

  | Dosya | Rol | Durum |
  |---|---|---|
  | `MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf` | kilavuz (kural metni, PDF) | CURRENT |

- **Yetkili dosya:** `MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf` (tek dosya; Tıp Fak. sayfasında bağlantılı en yeni kılavuz).
- **Tarih/sürüm:** belge metninde tarih yok; PDF metadata creation/modification 2014-08-27 (MEASURED); başlıkta eski "Celal Bayar Üniversitesi" adı geçer. **Kaynak:** https://tip.mcbu.edu.tr/db_images/file/asistantezyazimkilavuzu-43TR.pdf
- **Bilinenler/belirsizlikler:** Tıp Fak. sayfasında hâlâ listeleniyor (2023 formlarıyla birlikte) ve sayfadaki bağlantılı en yeni kılavuzdur (daha yenisi yok); açık bir geçerlilik/iptal beyanı yok; LEE ile ilişkisi UNKNOWN. Diş Hekimliği Fakültesi sitesi (dishekimligi.mcbu.edu.tr) DNS ile çözümlenemedi; kılavuzu bilinmiyor.

## MANUEL_INDIRME_GEREKLI
`lee.mcbu.edu.tr` WAF 403 veriyor; tarayıcıdan indirin, adı ve sha256'yı doğrulayın. Placeholder dosya yok.

| Hedef klasör / dosya adı | URL | Beklenen sha256 |
|---|---|---|
| `Lisansustu_Egitim_Enstitusu_Tez/MCBU_Lisansustu_Tez_Yazim_Kilavuzu_2025.pdf` (LEE kılavuzu PDF karşılığı) | https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-GTSM221020251445.pdf | `cb7a4a6d433d360e0087f24d27ab8c40aece4c2e8be0819ab63cf19e91a6055f` |
| (kapsam dışı/isteğe bağlı) Tezsiz YL Dönem Projesi kılavuzu DOCX | https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-HWQY221020251426.docx | `2e7b96fed9089476f65aa0862fafaf9d84464f1e5e3184868ade59c25d25a2ea` |
| (kapsam dışı/isteğe bağlı) Tezsiz YL Dönem Projesi kılavuzu PDF | https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-QEWX221020251458.pdf | `b76dcbeafc9ce5bf4167980ddb323a36dd8733fcbd4b3b2a633f395557247a5a` |

## Genel açık konular / Open issues
- Lisans bitirme tezi için fakülte düzeyinde kılavuz bulunamadı (tüm birimler taranmadı).
- İdari FR-xxx formları ve LEE Doktora formları sayfası arşive alınmadı (biçim şablonu değil / incelenmedi).
