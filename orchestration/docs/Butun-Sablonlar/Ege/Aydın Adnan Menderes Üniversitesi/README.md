# Aydın Adnan Menderes Üniversitesi (ADÜ) — tez/şablon arşivi

Kısa kod: ADU · Kontrol tarihi: 2026-10-01 · Bu klasör bir ARŞİVDİR, spesifikasyon değildir. Biçim değerleri (kenar boşluğu, yazı tipi, aralık vb.) burada çıkarılmamıştır; kaynak dosyalardan okunmalıdır. Her alt klasörde `KAYNAK.md` (URL, sürüm, kanıt, sha256) vardır. Makine okunur özet: `metadata.json`; kaynak/URL/dışlama günlüğü: `kaynaklar.md`.

Rol sözlüğü: kilavuz = kurallar metni; sablon = düzenlenebilir şablon; form = idari/destekleyici form.

## Şablonlar

### 1. Fen_Bilimleri_Enstitusu_Tez — Fen Bilimleri Enstitüsü, YL/Doktora
- ADU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2023.pdf — kilavuz, tr, 2023-12-22 — YETKİLİ dosya (TR)
- ADU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_EN_2023.pdf — kilavuz, en, 2023-12 — İngilizce karşılık (TR ile tutarlılığı denetlenmedi)
- ADU_Fen_Bilimleri_Tez_Kontrol_Beyan_Listesi_2021.pdf — form, tr, 2021-04-15 — yalnızca destekleyici kontrol listesi
- Durum: CURRENT. UNKNOWN: Word/LaTeX şablonu yok (enstitü sitesinde yayımlanmamış).

### 2. Sosyal_Bilimler_Enstitusu_Tez — Sosyal Bilimler Enstitüsü, YL/Doktora
- ADU_Sosyal_Bilimler_Tez_Yazim_Kilavuzu_2025.docx — kilavuz, tr, 2025-09-03 — YETKİLİ dosya (kılavuz DOCX biçiminde)
- ADU_Sosyal_Bilimler_Tez_Onay_Sayfasi_Formu_2024.docx — form (FORM_16 Tez Onay Sayfası), tr, 2024-02-27
- Durum: CURRENT. UNKNOWN: ayrı tez şablonu bulunamadı.

### 3. Saglik_Bilimleri_Enstitusu_Tez — Sağlık Bilimleri Enstitüsü, YL/Doktora (seminer, tez, dönem projesi)
- ADU_Saglik_Bilimleri_Seminer_Tez_Donem_Projesi_Yazim_Kilavuzu_2025.doc — kilavuz, tr, 2025-10-22 yükleme — kurallar metni
- ADU_Saglik_Bilimleri_Tez_Sablonu_2026.docx — sablon, tr, 2026-08-05
- Durum: CURRENT. UNKNOWN: şablon (2026-08) kılavuzdan (2025-10) yeni; ikisi arasındaki tutarlılık denetlenmedi, çelişirse hangisinin geçerli olduğu belirlenmedi. Kapak aracı etkileşimlidir (arşivde yok).

### 4. Tip_Fakultesi_Uzmanlik_Tezi — Tıp Fakültesi, tıpta uzmanlık tezi
- ADU_Tip_Fakultesi_Tipta_Uzmanlik_Tez_Yazim_Kilavuzu_2023.pdf — kilavuz, tr, Fakülte Kurulu 23.01.2023 / Senato 08.02.2023, 2023-05-24 yüklemesi
- Durum: CURRENT (canlı sayfadan bağlı sürüm) ve **tek bağlı sürümdür** (eski CONFLICT çözüldü: Mart 2023 yüklemesi canlı sayfadan artık bağlı değil).
  - Mart 2023 yüklemesi (20230310...): sol 4 / üst-alt 3 / sağ 2,5 cm; sha256 `0232ca264feefee62987e3afc43cab9c82d7eda2bd659da5f6be77d132806b1c`; arşivde YOK (tam URL kaydedilmedi).
  - Mayıs 2023 yüklemesi (bu klasördeki, şu an bağlı): sol 3 / üst-alt 2,5 / sağ 2,3 cm; sha256 `7ef2667ce6287a16ccbce826931bc1ead274111719b81ce04c00bdeb64504673`; URL https://fakulte.adu.edu.tr/med/webfolders/files/20230524120526-DPJYNOJHPO395CEOAXSE-EBRU.KAYA-704424629.pdf
  - Mart sürümü ayrıca tanımlar bölümüne 'alfabetik sıra' ibaresini ekler.
- UNKNOWN: Word şablonu yok (kılavuz 'fakülte şablonu'ndan söz eder ama yalnızca etkileşimli kapak aracı bulundu).
- Silindi: 2008 kılavuzu (OUTDATED; eski sayfalar hâlâ bağlıyor).

### 5. Ziraat_Fakultesi_Lisans_Tezi — Ziraat Fakültesi, lisans diploma/bitirme tezi
- ADU_Ziraat_Lisans_Tez_Yazim_Kilavuzu_2025.docx — kilavuz, tr, yükleme 2025-05-29 (kural seti Fakülte Kurulu 31.01.2017 kaynaklı)
- Durum: CURRENT. UNKNOWN: belge içi sürüm/tarih basılı değil; '2025' dosya metadata/yükleme tarihidir.

### 6. Muhendislik_Fakultesi_Lisans_Bitirme_Tezi — Mühendislik Fakültesi, lisans bitirme tezi
- ADU_Muhendislik_Lisans_Bitirme_Tezi_Sablonu_2018.docx — sablon, en (Türkçe Özet ile), 2018-07-19
- Durum: CURRENT (daha yenisi yok). UYARI: dosya Google Drive'da barındırılıyor (adu.edu.tr değil), resmî fakülte sayfasından bağlı; 2018 tarihli.

## Bilinen eksikler / belirsizlikler
- Fen: Word/LaTeX şablonu yok. Tıp: Word şablonu yok. Sosyal: ayrı şablon yok.
- Tıp kenar boşluğu çelişkisi ÇÖZÜLDÜ: Mart 2023 yüklemesi artık bağlı değil; Mayıs 2023 tek bağlı sürüm.
- Sağlık şablon-kılavuz tutarlılığı denetlenmedi.
- Mühendislik şablonu Google Drive'da, 2018.
- Fakülte kapsamı en iyi çabadır: Veteriner, Sağlık Bilimleri Fakültesi, Siyasal Bilgiler, Eğitim, İlahiyat, Diş Hekimliği, Fen-Edebiyat, İİBF için tez/bitirme kılavuzu bulunamadı (yokluk kanıtlanmadı). Not: Diş Hekimliği, Fen-Edebiyat ve İİBF için ADÜ'de ayrı fakülte sitesi yoktur (fakülte listesinde yok). Veteriner 'Öğrenci Bitirme Ödevi Yazım Kılavuzu' Veteriner Yönergesi'nde anılır ama yayımlanmamıştır.
- Arşiv dışı: eski/geçersiz sürümler (Fen 2021, Sosyal 2017, Sağlık 2024-12, Tıp 2008 ve Mart-2023) ve idari formlar; ayrıntı `kaynaklar.md`.
