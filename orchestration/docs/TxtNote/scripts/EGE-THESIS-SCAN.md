# Ege üniversiteleri tez şablonu taraması

`scan-ege-thesis-templates.py`, `ege-universities.json` içindeki 18 kurumun resmî alan adlarında tez şablonu dosyalarına giden bağlantıları arar. Yazım kılavuzlarını ayrı sayar ve her bulguya kaynak sayfasını ekler.

## Çalıştırma

Windows'ta Python 3 ile:

```powershell
py -3 scripts/scan-ege-thesis-templates.py --download-files
```

Raporlar `output/ege-thesis-template-scan.json` ve `.csv` dosyalarına yazılır. Şablon dosyaları kurum klasörleri altında `output/ege-thesis-template-scan-files/` dizinine indirilir. Sadece bağlantı envanteri için `--download-files` seçeneğini çıkar. Bot kurum başına varsayılan 40 sayfa tarar; sayfa sınırına gelirse kurumu kısmi olarak işaretler. Tarama kapsamını `--max-pages 300` ile artırabilir, çıktıyı `--output C:\rapor\ege-tez` ile değiştirebilirsin.

## Sayımın anlamı

- **Açık şablon:** İndirme bağlantısı tez/thesis ile birlikte şablon/template/taslak ifadesi taşıyor.
- **Şablon adayı:** Bağlantı tez yazımı, kapağı veya formatı işaret ediyor ama dosya adında şablon olduğu kesinleşmiyor.
- **Kılavuz:** Tez yazım kılavuzu/yönergesi; şablon sayısına eklenmez.

Bu sayılar indirilebilir dosya bağlantılarını sayar. Tezsiz dönem projesi şablonları ana tez sayımına alınmaz. Bir dosyanın yüksek lisans, doktora, dil veya enstitü için ayrı profil olup olmadığını ve aynı şablonun farklı dosya biçimleriyle tekrarlanıp tekrarlanmadığını rapordaki kaynak bağlantılarından doğrulamak gerekir.

Bot, taradığı her alan adının `robots.txt` kurallarına uyar ve aynı kurum sitesine istekler arasında kısa bekleme koyar. JavaScript ile sonradan yüklenen, oturum gerektiren veya site haritasında ve erişilen sayfalarda bağlantısı olmayan dosyaları bulamayabilir; sıfır sonuç, o kurumda şablon olmadığı anlamına gelmez.
