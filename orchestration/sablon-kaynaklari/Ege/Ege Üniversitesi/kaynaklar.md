# Ege Üniversitesi — Kaynaklar & Değişim Notu

**Kontrol Tarihi:** 2026-10-01  
**Depo Kodu:** EGE

## Arşiv Durumu

**Son Kontrol:** 2026-10-01  
Tüm dosyalar üniversiteye ait resmi kaynaklardan (web sayfaları, URL'ler) toplanmıştır. Her klasör kendi `KAYNAK.md` dosyasını içerir.

**Kontrol Sonuçları (gap.json):**
- Sağlık Bilimleri 2018 ve Tıp Uzmanlık 2018 dosyaları newest'dir — aktüel
- Sosyal Bilimler: YL cover yayınlanmamış
- Nükleer, Güneş, TDAE, ATAM, Bağımlılık Enstitüleri: tez kılavuzu bulunamadı
- Su Ürünleri: canlı sayfa listeleme doğrulanmadı (arama sonucu bulundu)

## Dosya Taşıma & Değişiklikler

### 1. Sağlık Bilimleri — Yanlış Atama Düzeltildi

**Sorun:** Dosya `Ege_Sosyal_Bilimler_Tez_Sablonu.docx` olarak depolanmıştı, ancak gerçek kaynağı `sbe.ege.edu.tr/12.docx` (Sağlık Bilimleri Enstitüsü).

**Düzeltme:**
- Dosya taşındı: `Saglik_Bilimleri_Enstitusu_Tez/` klasörüne
- Yeniden adlandırıldı: `EGE_Saglik_Bilimleri_Tez_Sablonu_2018.docx`

### 2. Fen Bilimleri — Eski Versiyon Silindi

2019 versiyonu (`core.xml` 2019-05-07) git rm ile silinmiştir.  
Yerine 2025 sürümü arşivlenmiştir (core 2025-05-26).

### 3. Eğitim Bilimleri — Dosyalar Klasöre Taşındı

Mevcut 3 dosya `Egitim_Bilimleri_Enstitusu_Tez/` klasörüne taşındı.

## Çatışmalar & Notlar — Çözümlenen

- **FBE Versiyonlama:** tr-20104 eski sürümü (2019) hala linkliyor; tr-1874 Tez Yazım sayfası yeni sürüme (2025) sahip. Yeni sürüm tercih edildi.
- **Sağlık Rehberi:** Kapak "Haziran 2018" yazıyor ama metin v2.1 (PDF 2019-01-09). SHA256 canlı sayfayla eşleşiyor.
- **Diş Hekimliği Bitirme Projesi:** ÇÖZÜMLENDI — İçerik "Bitirme Projesi I/II" kural seti hakkında (PDF 2024-03-07, modifiye 2026-05-11). Klasör ve KAYNAK.md yeniden adlandırıldı. Status: CURRENT.

## Henüz Çözülmemiş

- Su Ürünleri lisans tez — canlı sayfa listeleme doğrulanmadı (arama sonucu bulundu)
- Diğer fakülteler bitirme (Edebiyat diğer bölümleri, Mühendislik diğerleri, Ziraat vb.) — sınırlı arama; EAMYO .doc ve Tekstil esaslar biçimlendirmeye odaklı değil
- Sosyal YL cover — enstitü tarafından yayınlanmamış
- Diğer enstitüler (Güneş, TDAE, ATAM, Bağımlılık) — tez kılavuzu bulunamadı

## Klasör Yapısı

- `Fen_Bilimleri_Enstitusu_Tez/` — 9 dosya (Lisansüstü)
- `Saglik_Bilimleri_Enstitusu_Tez/` — 2 dosya (Lisansüstü)
- `Saglik_Bilimleri_Enstitusu_Donem_Projesi/` — 1 dosya (Tezsiz YL)
- `Sosyal_Bilimler_Enstitusu_Tez/` — 3 dosya (Lisansüstü)
- `Egitim_Bilimleri_Enstitusu_Tez/` — 3 dosya (Lisansüstü)
- `Tip_Fakultesi_Uzmanlik_Tezi/` — 2 dosya (Uzmanlık)
- `Dis_Hekimligi_Uzmanlik_Tezi/` — 2 dosya (Uzmanlık)
- `Dis_Hekimligi_Bitirme_Projesi/` — 1 dosya (Bitirme Projesi I/II)
- `Tarih_Bolumu_Bitirme_Tezi/` — 2 dosya (Lisans)
- `Iletisim_Fakultesi_HIT_Bitirme_Tezi/` — 1 dosya (Lisans)
- `Iletisim_Fakultesi_Gazetecilik_Bitirme_Projesi/` — 1 dosya (Lisans)
- `Iletisim_Fakultesi_RTS_Bitirme_Tezi/` — 1 dosya (Lisans)
- `Iletisim_Fakultesi_Reklamcilik_Bitirme_Projesi/` — 1 dosya (Lisans)
- `Su_Urunleri_Fakultesi_Lisans_Tez/` — 1 dosya (Lisans)
- `Muhendislik_Fakultesi_Deri_Bitirme_Tezi/` — 1 dosya (Lisans)
