# Afyon Kocatepe Üniversitesi (AKÜ) — Tez/Şablon Arşivi

short_code: AKU · checked_at: 2026-10-01 · language: tr (İngilizce sürüm yok)

Bu klasör bir **arşivdir**, şartname değildir: biçim değerleri (kenar boşlukları, punto, aralık vb.) burada çıkarılmamıştır. Değerler için ilgili kılavuz/şablon dosyası kaynak kabul edilir (bkz. AGENTS.md: EXPLICIT / MEASURED / INFERRED / UNKNOWN).

Dizinler:
- `metadata.json` — makine okunur dizin (dosya yolu, doc_type, sürüm, status, source_url, sha256)
- `kaynaklar.md` — resmî sayfa/dosya URL'leri, kontrol tarihi, güncellik kanıtı, kaldırılanlar/dışarıda bırakılanlar
- `<klasör>/KAYNAK.md` — dosya bazında rol, kaynak URL, sürüm, durum + kanıt, sha256

doc_type sözlüğü: `kilavuz` = kurallar metni · `sablon` = düzenlenebilir Word/LaTeX şablonu · `ornek` = örnek belge · `form` = biçimle ilgili form/kontrol listesi.
status: `CURRENT` = resmî sayfada sunulan güncel sürüm (sha256 yeniden indirmeyle doğrulandı veya sayfada tek sürüm) · `UNVERIFIED` = güncel resmî sayfadan hâlâ bağlantılı ama diğer belgelerle tutarlılığı doğrulanamadı.

## Şablon grupları

### 1. `Fen_Bilimleri_Enstitusu_Tez/` — Fen Bilimleri Enstitüsü, yüksek lisans + doktora tezi
| dosya | rol | tarih | status |
|---|---|---|---|
| AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf | kilavuz | Ocak 2020 geçerlilikli (Last-Modified 14.12.2020) | CURRENT |
| AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx | sablon (Word) | 2025-01-23 | CURRENT |
| AKU_Fen_Bilimleri_Tez_LaTeX_Sablonu_2020.rar | sablon (LaTeX) | 2020-01-13 | UNVERIFIED |
| AKU_Fen_Bilimleri_Tez_Sekil_Inceleme_Formu_2026.doc | form (FB_YLDR-07 Rev.1) | 2026-05-20 | CURRENT |

Biçim değerleri için yetkili kaynak: kılavuz (PDF); Word şablonu uygulama örneğidir. Çelişki/belirsizlik: LaTeX şablonu Aralık 2020 kılavuzundan önce yüklenmiş, uyumu doğrulanmadı; kılavuz (2020) ile şablon (2025) arasındaki tutarlılık denetlenmedi.

### 2. `Fen_Bilimleri_Is_Guvenligi_Tezsiz_Proje/` — FBE İş Güvenliği (İ.Ö.) tezsiz yüksek lisans dönem projesi
- AKU_Fen_Bilimleri_Is_Guvenligi_Donem_Projesi_Sablonu_2022.doc — sablon (eski .doc), 2022-08-02, CURRENT. Ayrı kılavuz yok; tez değil dönem projesi.

### 3. `Sosyal_Bilimler_Enstitusu_Tez/` — Sosyal Bilimler Enstitüsü, yüksek lisans + doktora tezi (10 dosya)
- kilavuz: AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf (2026-02, CURRENT) — **yetkili biçim kaynağı**
- ornek: Ornek_Tez_Metni_2026.pdf, Ornek_Tez_Kapagi_ve_Icindekiler_2026.pdf, Ic_Kapak_100_2000_2026.pdf (PDF görünüm)
- sablon (Word iç kapaklar): Ic_Kapak_3_Uyeli_2026.docx, Ic_Kapak_5_Uyeli_2026.docx, Ic_Kapak_100_2000_2026.docx
- form: Tez_Kontrol_Listesi_2023.docx, Enstitu_Onayi_Formu_2024.docx, Etik_Beyan_Formu_2022.docx
- Hepsi CURRENT. Çelişki: kılavuz PDF kapağında "AFYONKARAHİSAR 2023" yazıyor; yükleme yolu/Last-Modified/sayfa etiketi 2026 (içerik değişikliği UNKNOWN). Tam gövde şablonu (Word) yok; yalnızca iç kapak şablonları var.

### 4. `Saglik_Bilimleri_Enstitusu_Tez/` — Sağlık Bilimleri Enstitüsü, lisansüstü tez
- AKU_Saglik_Bilimleri_Enstitusu_Tez_Yazim_Kilavuzu_2022.pdf — kilavuz, 10.02.2022 "SON", CURRENT.
- Şablon (DOCX) sunulmuyor. Kapakta "AFYONKARAHİSAR 2020" yazıyor ve Senato tarihi alanı boş.

### 5. `Cografya_Bolumu_Bitirme_Tezi/` — Fen-Edebiyat Fak. Coğrafya, lisans bitirme tezi
- Yazim_Kilavuzu_2024.pdf (kilavuz) + Sablonu_2024.docx (sablon, 3.6 MB). Her ikisi CURRENT, 2024-03.

### 6. `MBG_Lisans_Bitirme_Tezi/` — Fen-Edebiyat Fak. Moleküler Biyoloji ve Genetik, lisans bitirme tezi
- Kilavuzu_2025.pdf (kilavuz) + Sablonu_2025.docx (sablon). CURRENT, 2025-05.

### 7. `Kimya_Bolumu_Bitirme_Tezi/` — Fen-Edebiyat Fak. Kimya, lisans bitirme tezi
- Yazim_Kilavuzu_2023.pdf (kilavuz, 2023-12) + Sablonu_2026.docx (sablon, 2026-02). CURRENT. Kılavuz-şablon eşleşmesi kaynaklarda belirtilmiyor (şablon daha yeni).

### 8. `Matematik_Bolumu_Bitirme_Tezi/` — Fen-Edebiyat Fak. Matematik, lisans tezi
- AKU_Matematik_Lisans_Tez_Sablonu_2025.docx — sablon, 2025-10. CURRENT. Ayrı kılavuz yok.

### 9. `Sosyoloji_Bolumu_Bitirme_Tezi/` — Fen-Edebiyat Fak. Sosyoloji, lisans tez/seminer/ödev
- AKU_Sosyoloji_Lisans_Tez_Yazim_Kilavuzu_2022.docx — kilavuz; 2022-04'te yüklendi, içerik core.xml'e göre 2014/2015. CURRENT (bölümün sunduğu sürüm). Şablon yok.

### 10. `Felsefe_Bolumu_Tez_ve_Seminer/` — Fen-Edebiyat Fak. Felsefe, lisans bitirme tezi + seminer
- Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx (kilavuz, tez) · Seminer_Hazirlama_Kilavuzu_2019.docx (kilavuz, seminer — tez değil). CURRENT, 2019. Şablon yok.

## Bilinen belirsizlikler / kapsam sınırları (UNKNOWN)
- Tüm dosyalar Türkçe; İngilizce sürüm bulunamadı.
- AKÜ'de Tıp Fakültesi yok; AFSÜ'ye devredildi. 2016 tarihli 'AKÜ Tıp Fakültesi Tıpta Uzmanlık Tezi Yazım ve Basım Yönergesi' (tip.afsu.edu.tr, 2016/02/tezyaz.pdf) AFSÜ Tıp sitesindedir ve Temmuz 2021 AFSÜ Tıp/Diş Hekimliği Uzmanlık Tez Yazım Kılavuzu ile geçersiz kılınmıştır (kılavuz AFSÜ klasöründe arşivli: `Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/`). 2016 PDF arşivlenmedi.
- Teknoloji Fakültesi 2014 kılavuz bağlantısı 404.
- Bölüm kapsamı best-effort; birçok bölüm alt alan adı çözümlenmiyor veya kılavuz yayımlamıyor. Daha derin gezinmede başka kılavuzlar olabilir.
- Kimya Mühendisliği (2017), Turizm (2016), Maden Mühendisliği (2020) kılavuzları güncel resmî sayfadan bağlantılı olmadığı için **arşive alınmadı** (bkz. `kaynaklar.md` "Dışarıda bırakılanlar").
- Biçim değerleri bu arşivde çıkarılmamıştır; başka üniversitelere değer kopyalanmamalıdır (AGENTS.md §6).
