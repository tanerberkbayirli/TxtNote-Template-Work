# Prompt: GOREVLER.md'den bir görevi yap

Önce [../BASLA.md](../BASLA.md) kurallarını okuyun. Size verilen görev kodu: `<örn. A3>`.

1. [../GOREVLER.md](../GOREVLER.md)'de yalnız o bölümü okuyun. Görev başka bir bölüme bağlıysa yalnız oraya bakın.
2. Bağlam: ilgili `engine/docs/reports/` kaydı, `engine/docs/CAPABILITIES.md` (motor değişecekse), gerekiyorsa `engine/specs/<hedef>.CONTEXT.md`. Tüm geçmişi taramayın.
3. Önce mevcut durumu **şimdiki kodla** ölçün (eski rakam kanıt değildir). Kök nedeni ölçümle bulun; tahminle düzeltmeyin.
4. Düzeltmeyi ortak/genel tutun (belge ID'si, sayfa numarası, üniversite adı koşulu yok). Eşik düşürmeyin, içeriği budamayın.
5. Çalıştırın: ilgili testler + derleme (komutlar: [../KANIT.md](../KANIT.md#ortam-ve-komutlar)); yerleşim değiştiyse gerçek Word/PDF karşılaştırması. Çalışan testlerin (ve ilgili E2E/Word kontrolünün) gerilemediğini gösterin.
6. Kanıtı `.test-tmp/validation/<iş>-<tarih>/` altına, kısa raporu `engine/docs/reports/` altına yazın (≤1 sayfa: ne değişti, komut+sonuç, sınırlar).
7. [../GOREVLER.md](../GOREVLER.md)'yi güncelleyin: kapanan maddeyi silin, kalanı/yeni bulguyu aynı dosyaya yazın. Başka yere görev yazmayın.
8. Son yanıt ≤15 satır: değişenler, çalışan kontroller (sonuçla), açık kalanlar. Kullanıcı istemedikçe commit yok.
