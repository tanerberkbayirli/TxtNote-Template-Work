import csv, json
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'output/ege-thesis-report-files/download-manifest.csv'
EXTRACT=ROOT/'output/ege-thesis-report-files/extracted-text.jsonl'
DEST=ROOT/'output/Ege_Tez_Belgeleri_Icerik_Notu.txt'

summaries = [
"Afyon Kocatepe Üniversitesi Fen Bilimleri Enstitüsü için Word tez şablonu. Kapak, tez türü (yüksek lisans/doktora), öğrenci ve danışman bilgileri ile tezin ana bölüm yapısını doldurmak için alanlar içeriyor.",
"Dokuz Eylül Üniversitesi Fen Bilimleri Enstitüsü doktora tezi için İngilizce Word şablonu. Başlık sayfası, teşekkür, abstract, şekil/tablo listeleri ve ana tez bölümleri için hazır düzen sağlıyor.",
"Dokuz Eylül Üniversitesi Fen Bilimleri Enstitüsü doktora tezi için Türkçe Word şablonu. Kapak, doktora savunma sonuç formu, teşekkür, özet/abstract, listeler ve bölüm yapısını içeriyor.",
"Dokuz Eylül Üniversitesi Fen Bilimleri Enstitüsü yüksek lisans tezi için İngilizce Word şablonu. Tez kapağı, teşekkür, abstract, listeler ve ana metin bölümlerini düzenliyor.",
"Dokuz Eylül Üniversitesi Fen Bilimleri Enstitüsü yüksek lisans tezi için Türkçe Word şablonu. Kapak, jüri/sınav sonuç sayfası, teşekkür, özetler, listeler ve ana tez bölümleri bulunuyor.",
"Tez/uygulama raporu için yeni yazım şablonu olarak listelenmiş. İndirilen dosya eski .doc biçiminde olduğu ve metin çıkarılamadığı için iç bölümleri doğrulanamadı.",
"Ege Üniversitesi Eğitim Bilimleri Enstitüsü yüksek lisans tezi örnek şablonu. Etik uygunluk beyanı, teşekkür, içindekiler ve girişten başlayan tez bölüm yapısı yer alıyor.",
"Ege Üniversitesi Fen Bilimleri Enstitüsü için tez Word şablonu/yazım planı. Tez değerlendirme ve jüri sayfaları, etik beyan, içindekiler, şekil/tablo listeleri, kaynakça ve ekler için örnekler içeriyor.",
"Ege Üniversitesi Sağlık Bilimleri Enstitüsü tez şablonu. Jüri değerlendirme sayfası, önsöz ve tezin ön/son bölümleri için örnek düzen sunuyor; 10 numaralı kayıtla içerik ve dosya aynı.",
"9 numaralı kayıtla aynı Ege Üniversitesi Sağlık Bilimleri Enstitüsü tez şablonuna çıkan yinelenen bağlantı. Ayrı bir şablon çeşidi değil.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü Hukuk programları için Türkçe tez şablonu. Çok satırlı tez başlığı, öğrenci adı ve tez kapağı/ön sayfaları için düzen sağlıyor.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü genel Türkçe tez şablonu. Kapak, öğrenci ve danışman bilgileri, özetler ve tez bölümleri için hazır yapı içeriyor.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü genel İngilizce tez şablonu. English title page, student information, abstracts and thesis structure için Word düzeni sunuyor.",
"Kütahya Dumlupınar Üniversitesi Lisansüstü Eğitim Enstitüsü tez ve rapor şablonu. Yüksek lisans/doktora seçimi, kapak ve yazar/tez bilgileri için doldurulabilir alanlar içeriyor.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü Türkçe doktora tez şablonu. Enstitü/anabilim dalı, tez başlığı, yazar ve tez ön sayfaları için hazır düzen.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü Türkçe yüksek lisans tez şablonu. Kapak ve tez bölümlerini yüksek lisans çalışmasına göre doldurmak için hazırlanmış; 15 numaraya çok benzer ayrı bağlantı.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü İngilizce doktora tez şablonu. English title page, department/program, author and thesis sections için yapı.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü İngilizce yüksek lisans tez şablonu. İngilizce tez kapağı ve ana tez yapısı için Word düzeni; 17 numaraya benzer ayrı bağlantı.",
"Muğla Sıtkı Koçman Üniversitesi için tez şablonu bağlantısı; raporda verilen adres 404 hatası verdi. Dosya içeriği görülemedi.",
"Muğla Sıtkı Koçman Üniversitesi Sağlık Bilimleri Enstitüsü tez şablonu adayı. Yüksek lisans/doktora, anabilim dalı, başlık ve yazar alanları içeren sağlık bilimleri tez düzeni.",
"Muğla Sıtkı Koçman Üniversitesi Sağlık Bilimleri Enstitüsü tez şablonu. Yüksek lisans/doktora başlık sayfası ve tez metni için hazır düzen; 20 numaralı adayla aynı yapıda/çok benzer.",
"Afyon Kocatepe Üniversitesi Fen Bilimleri Enstitüsü 2020 tez/proje yazım kılavuzu (43 sayfa). Genel yazım planı, biçim kuralları, şekil/çizelge/resim kullanımı ve ekleri açıklıyor.",
"Dokuz Eylül Üniversitesi Turnitin intihal analiz programı kullanım kılavuzu (10 sayfa). Hızlı gönderi/ödev oluşturma ve tez dosyasını sisteme yükleme adımlarını ekran görüntüleriyle anlatıyor; metin çıkarımı görseller nedeniyle kısmi.",
"Dokuz Eylül Üniversitesi Atatürk İlkeleri ve İnkılap Tarihi Enstitüsü tez yazım kılavuzu (13 sayfa). Amaç, kâğıt türü, sayfa düzeni ve temel tez biçim kurallarını açıklıyor.",
"Dokuz Eylül Üniversitesi Fen Bilimleri Enstitüsü 2025 tez yazım kuralları (68 sayfa). Türkçe/İngilizce yazım, tez yapısı, ekler, şekil/tablo örnekleri ve sembol listeleri gibi kapsamlı biçim kuralları içeriyor.",
"Dokuz Eylül Üniversitesi Güzel Sanatlar Enstitüsü 2025 tez/uygulama raporu yazım kılavuzu (34 sayfa). Biçim kuralları, metin içi kaynak gösterme ve örnek kaynak gösterimleri bulunuyor.",
"Ege Üniversitesi Sağlık Bilimleri Enstitüsü 2018 tarihli tez yazım kılavuzu (23 sayfa, v2.1). Tez yapısı, biçim özellikleri, dış kapak ve yazım esaslarını tanımlıyor; eski tarihli sürüm.",
"Ege Üniversitesi Sağlık Bilimleri Enstitüsü tezsiz yüksek lisans dönem projesi hazırlama kılavuzu (1 sayfa). Projenin kapsamı, hazırlanması ve değerlendirilmesine ilişkin esasları özetliyor.",
"Ege Üniversitesi için APA 7 yazım ve kaynak gösterme kılavuzu (28 sayfa). Sayfa sırası, yazı tipi, başlık, metin içi atıf ve kaynakça düzenini anlatıyor.",
"27 numaralı Ege Üniversitesi Sağlık Bilimleri Enstitüsü 2018 tez yazım kılavuzunun ikinci bağlantısı; aynı dosya/içerik tekrar listelenmiş.",
"İzmir Ekonomi Üniversitesi hukuk alanında yazılan tezlere ek açıklamalar. Rapor bağlantısı TLS sertifika hatası verdiği için belgenin içi incelenemedi; özet bağlantı başlığına dayanıyor.",
"İzmir Ekonomi Üniversitesi tez yazım kılavuzunun İngilizce sürümü. Bağlantıdaki dosya SSL sertifika hatası nedeniyle indirilemedi; içerik doğrulanamadı.",
"İzmir Ekonomi Üniversitesi tez yazım kılavuzunun Türkçe sürümü. Bağlantıdaki dosya SSL sertifika hatası nedeniyle indirilemedi; içerik doğrulanamadı.",
"İzmir Yüksek Teknoloji Enstitüsü İngilizce tez yazım kılavuzu (31 sayfa). Tez örneği üzerinden önsöz, içindekiler, şekiller listesi, giriş ve görünüş/biçim kurallarını gösteriyor.",
"İzmir Yüksek Teknoloji Enstitüsü referans sistemlerine ilişkin Senato kararı (1 sayfa). Referans sistemi kullanımına dair kurumsal kararı duyuruyor; çıkarılabilir metin sınırlı.",
"İzmir Yüksek Teknoloji Enstitüsü kaynak gösterme sistemleri rehberi (20 sayfa). ACS başta olmak üzere alanlara göre kaynakça ve metin içi atıf örnekleri içeriyor.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü Türkçe tez yazım kılavuzu. Site robots.txt indirmeye izin vermediğinden dosya içeriği okunamadı; başlığa göre tez biçim/yazım kurallarını açıklıyor.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü 2021-2022 tez kataloğu. Tez yazım şablonu değil, o eğitim döneminde tamamlanan tezleri listeleyen katalog; robots.txt nedeniyle içerik indirilemedi.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü 2022-2023 tez kataloğu. Tez örneklerini/kayıtlarını listeleyen katalog; içerik robots.txt kısıtı nedeniyle doğrulanamadı.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü dönem projesi yazım kılavuzunun İngilizce sürümü. Tezsiz program proje yazım esasları; içerik robots.txt nedeniyle incelenemedi.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü dönem projesi yazım kılavuzunun Türkçe sürümü. Tezsiz program proje biçim/yazım esasları; dosya robots.txt nedeniyle alınamadı.",
"Yaşar Üniversitesi tezsiz program dönem projesi şablonunun İngilizce sürümü. Proje kapağı ve rapor yapısı için şablon; içerik robots.txt kısıtı nedeniyle okunamadı.",
"Yaşar Üniversitesi tezsiz program dönem projesi şablonunun Türkçe sürümü. Proje kapağı ve rapor bölümlerini düzenlemek için şablon; içerik robots.txt nedeniyle okunamadı.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü 2023-2024 tez kataloğu. Tez yazım kuralı değil, tez kayıt/katalog belgesi; robots.txt nedeniyle içeriği alınamadı.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü İngilizce tez yazım kılavuzu. Başlığa göre İngilizce tez biçim ve yazım kuralları; içerik robots.txt tarafından indirmeye kapalı.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü 2024 birim iç değerlendirme raporu (BİDR). Kurumsal değerlendirme belgesi, tez şablonu değil; robots.txt nedeniyle okunamadı.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü 2023 kurum iç değerlendirme raporu (KİDR). Kurumsal kalite/değerlendirme raporu; tez yazım kılavuzu değil, içerik robots.txt nedeniyle erişilemedi.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü dış danışma kurulları belgesi. Kurul/danışma yapısına ilişkin kurum belgesi; tez biçim şablonu değil, içerik indirilemedi.",
"Yaşar Üniversitesi lisansüstü eğitim süreçleri belgesi. Başlığa göre başvuru/öğrenci süreçlerini açıklıyor; tez yazım kılavuzu değil, robots.txt kısıtı nedeniyle içerik okunamadı.",
"Yaşar Üniversitesi Lisansüstü Eğitim Enstitüsü 2024-2025 tez kataloğu. Tez örnekleri/kayıtlarını listeleyen katalog; yazım kılavuzu değil, dosya robots.txt nedeniyle indirilemedi.",
"Kütahya Dumlupınar Üniversitesi Lisansüstü Eğitim Enstitüsü 2026-2027 akademik takvimi (2 sayfa). Güz ve bahar dönemleri için lisansüstü başvuru, kayıt ve akademik tarihleri veriyor; şablon değil.",
"Kütahya Dumlupınar Üniversitesi yüksek lisans/doktora süreç akış şeması (1 sayfa). Tez savunma başvurusu ve ilgili aşamaları/benzerlik kontrolü sürecini görsel akışla gösteriyor.",
"Kütahya Dumlupınar Üniversitesi Fen Bilimleri Enstitüsü 2017 lisansüstü tez yazım kılavuzu (54 sayfa). Etik ilkeler, genel biçim, yazım planı ve tez düzenini açıklıyor; eski tarihli sürüm.",
"Kütahya Dumlupınar Üniversitesi Lisansüstü Eğitim Enstitüsü tez ve rapor yazım kılavuzu. Yüksek lisans/doktora tezlerinin yanı sıra dönem projesi, seminer ve araştırma raporları; kaynak gösterme ve APA kurallarını kapsıyor.",
"Kütahya Dumlupınar Üniversitesi Lisansüstü Eğitim Enstitüsü iş akış şemaları (57 sayfa). Enstitünün yazışma ve idari iş süreçlerini topluyor; tez biçim şablonu/yazım rehberi değil.",
"Kütahya Dumlupınar Üniversitesi Eğitim Bilimleri Enstitüsü tez yazım kılavuzu. APA 6 temelli biçim, kâğıt/kapak, başlıklar ve tez bölümlerinin hazırlanmasını açıklıyor.",
"Kütahya Dumlupınar Üniversitesi Sosyal Bilimler Enstitüsü tez ve rapor yazım kılavuzu. Tez, seminer ve araştırma raporu biçimi; etik, sayfa düzeni, APA ile atıf ve kaynakça kurallarını anlatıyor.",
"Kütahya Dumlupınar Üniversitesi Lisansüstü Eğitim Enstitüsü 2025-2026 akademik takvimi (2 sayfa). Güz/bahar yarıyılı tarihleri; tez yazım içeriği yok.",
"Kütahya Sağlık Bilimleri Üniversitesi Lisansüstü Eğitim Enstitüsü 03.04.2024 revizyon tarihli tez yazım kılavuzu. İstek zaman aşımına uğradığı için dosya içeriği doğrulanamadı; tanım başlığa dayanıyor.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü İngilizce tez/dissertation yazım kılavuzu (46 sayfa, 2021). Tez bölümleri ve genel yazım/biçim kurallarını İngilizce açıklıyor.",
"Muğla Sıtkı Koçman Üniversitesi uzaktan eğitim merkezi Moodle öğrenci kullanım kılavuzu (35 sayfa). Sisteme giriş, parola, profil ve ders yönetim sistemi kullanımını anlatıyor; tez belgesi değil.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü Türkçe dönem projesi Word şablonu. Proje başlığı, yazar, tezsiz yüksek lisans dönemi ve rapor yapısı için düzen sağlıyor.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü Türkçe dönem projesi yazım kılavuzu PDF bağlantısı. Bağlantı zaman aşımına uğradı; içeriği doğrulanamadı.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü dönem projesi Word şablonu bağlantısı. Bağlantı alınırken uzak sunucu bağlantıyı kapattı; dosya içeriği incelenemedi.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü İngilizce dönem projesi Word şablonu. Proje başlığı, program, yazar ve term-project bölümleri için hazır yapı.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü İngilizce term project writing guide (Word, yaklaşık 2022). Dönem projesinin bölümleri ve yazım kurallarını İngilizce açıklıyor.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü İngilizce dönem projesi şablonu. Başlık, yazar ve proje yapısı için ikinci İngilizce Word şablonu.",
"Muğla Sıtkı Koçman Üniversitesi Eğitim Bilimleri Enstitüsü 2021 Türkçe tez yazım kılavuzu (48 sayfa). Genel yazım ve dizin düzeni, tez bölümleri, ekler ve biçim kurallarını kapsıyor.",
"Muğla Sıtkı Koçman Üniversitesi Fen Bilimleri Enstitüsü APA 7 kaynakça yazım kılavuzu (60 sayfa, 2024). APA 7 kaynakça bileşenleri ve farklı kaynak türleri için düzenleme örnekleri veriyor.",
"Muğla Sıtkı Koçman Üniversitesi Fen Bilimleri Enstitüsü APA 7 kaynakça yazım kılavuzunun İngilizce sürümü (61 sayfa). İngilizce kaynak türleri ve APA 7 bibliyografya örnekleri içeriyor.",
"Muğla Sıtkı Koçman Üniversitesi ders kayıt yardım dosyası (3 sayfa). Öğrenci bilgi sisteminde görünmeyen dersleri bulup kaydetme adımlarını anlatıyor; tez yazım belgesi değil.",
"Muğla Sıtkı Koçman Üniversitesi Sağlık Bilimleri Enstitüsü tez yazım kılavuzu (39 sayfa, 2021). Tezin biçimi, bölümleri, yazımı ve ekleri için enstitü kurallarını açıklıyor.",
"Muğla Sıtkı Koçman Üniversitesi ORCID hesabı oluşturma kılavuzu (6 sayfa). ORCID'e kayıt, profil bilgilerini doldurma ve hesap açma adımlarını gösteriyor; tez şablonu değil.",
"Muğla Sıtkı Koçman Üniversitesi Sosyal Bilimler Enstitüsü 2026-2027 güz yarıyılı öğrenci bilgilendirme/kayıt yenileme kılavuzu (9 sayfa). Kayıt ve ders işlemleri hakkında öğrenci duyuruları içeriyor.",
"Muğla Sıtkı Koçman Üniversitesi tezsiz yüksek lisans öğrencileri için bilgilendirme (1 sayfa). Program süresi, AKTS/ders yükü ve dönem projesiyle mezuniyet şartlarını özetliyor.",
"Muğla Sıtkı Koçman Üniversitesi Öğrenci Bilgi Sistemi (OBS) yardım dosyası (19 sayfa). Özlük/iletişim bilgileri ve OBS işlemlerine dair görsel destekli kullanım açıklamaları; tez rehberi değil.",
"Muğla Sıtkı Koçman Üniversitesi Sosyal Bilimler Enstitüsü etik beyanı ve yapay zekâ kullanım beyanı için doldurulabilir metin. Tezde AI kullanılmaması/kullanılması durumlarına uygun beyan seçenekleri veriyor.",
"Muğla Sıtkı Koçman Üniversitesi Sosyal Bilimler Enstitüsü 2025 tezsiz yüksek lisans dönem projesi yazım kılavuzu. Genel düzen, proje bölümleri ve atıf/kaynak gösterme kurallarını açıklıyor.",
"Muğla Sıtkı Koçman Üniversitesi Sosyal Bilimler Enstitüsü lisansüstü süreç rehberi (10 sayfa, 2023). Kayıt silme/dondurma gibi yüksek lisans, doktora ve sanatta yeterlik işlemlerini adım adım gösteriyor.",
"Muğla Sıtkı Koçman Üniversitesi Sosyal Bilimler Enstitüsü tez teslim süreci broşürü (4 sayfa, 2026). Yüksek lisans/doktora tezinin teslimi, başvurusu ve gerekli nüsha/ekleri özetliyor.",
"Muğla Sıtkı Koçman Üniversitesi Sosyal Bilimler Enstitüsü tez kontrol formu (1 sayfa). Kapak, logo, numaralandırma, başlık, punto, satır aralığı ve kaynakça için teslim öncesi kontrol listesi.",
"Muğla Sıtkı Koçman Üniversitesi Sosyal Bilimler Enstitüsü 2025 lisansüstü tez yazım kılavuzu Word dosyası. Tez bölümleri, genel çerçeve/düzen ve atıf-kaynak gösterme esaslarını kapsıyor.",
"Muğla Sıtkı Koçman Üniversitesi Sosyal Bilimler Enstitüsü Temmuz 2023 bülteni (4 sayfa). Enstitü haberleri/etkinlik ve duyurularını içeriyor; tez yazım kılavuzu değil."
]

with MANIFEST.open(encoding='utf-8-sig',newline='') as f:
    rows=list(csv.DictReader(f))
entries=[json.loads(line) for line in EXTRACT.read_text(encoding='utf-8').splitlines()]
if len(rows)!=83 or len(entries)!=83 or len(summaries)!=83:
    raise SystemExit(f'Record mismatch: rows={len(rows)} extracts={len(entries)} summaries={len(summaries)}')

out=[]
out.extend([
'EGE BÖLGESİ RAPORUNDAKİ BELGELERİN İÇERİK NOTU',
'',
'Kapsam: Ege Bölgesi tarama raporundaki her dosya bağlantısı sırayla numaralandırılmış, indirilebilen belgelerin metni incelenmiştir.',
'Rapor sayımı: CSV dosyasında 84 satır görünür; ilk satır sütun başlığıdır. Gerçek belge/bağlantı kaydı 83 adettir: 20 şablon, 1 şablon adayı ve 62 kılavuz olarak etiketlenen kayıt.',
'İçerik erişimi: 83 bağlantı kaydının 62’sinde yerel dosya bulundu. Bunlar 61 yerel dosya yoluna ve dosya özetiyle kontrol edildiğinde 60 ayrı içeriğe karşılık geliyor. 21 bağlantı indirilemedi. İndirilemeyenlerde özet, bağlantı başlığına ve rapor kaydına dayanır; dosyanın içeriği doğrulanmış sayılmaz.',
'Önemli sınıflandırma notu: “Kılavuz” olarak işaretlenen 62 kayıt teze yazım kuralı anlatan 62 ayrı kılavuz demek değildir. İçlerinde akademik takvim, tez kataloğu, öğrenci sistemi/Moodle, ORCID, idari süreç, kayıt rehberi ve bülten gibi farklı belgeler de var. Bu nedenle aşağıdaki tür açıklaması belge içeriğine göre yazılmıştır.',
'Yinelenen kayıtlar: 9 ve 10 aynı dosya yoluna çıkıyor; 27 ve 30 ayrı yollarda dursa da indirilen dosyaların SHA-256 özeti aynıdır. 15-18 ile 20-21 farklı dil/tez türü veya enstitü bağlantılarıdır.',
'Not: Bu liste bir içerik özeti ve ilk envanterdir; üniversite kurallarının güncellik/onay denetimi değildir. Özellikle 2017/2018/2021 tarihli kılavuzlar güncel sürümle karşılaştırılmalıdır.',
'',
'NUMARALI BELGE ENVANTERİ',
''
])
for idx,(row,ex,summary) in enumerate(zip(rows,entries,summaries),1):
    raw=row.get('link_text','').strip()
    url=row.get('document_url','').strip()
    filename=Path(unquote(urlsplit(url).path)).name if url else ''
    filename=unquote(filename)
    title=raw if raw and raw.casefold() not in {'tıklayınız.','tıklayınız','word (tr)','word (eng)','pdf (tr)','pdf (eng)'} else filename
    title=title.replace('|',' ').strip() or f"Rapor kaydı {idx}"
    status=row.get('analysis_download_status','')
    local=row.get('analysis_local_path','').strip()
    if status=='başarısız':
        reason=row.get('analysis_download_error','').strip()
        if 'robots.txt' in reason:
            access='İçerik okunamadı: kaynak sitenin robots.txt kuralı indirmeye izin vermedi.'
        elif '404' in reason:
            access='İçerik okunamadı: kaynak bağlantı 404 verdi.'
        elif reason:
            access=f"İçerik okunamadı: {reason}."
        else:
            access='İçerik okunamadı; indirme başarısız.'
    elif local and Path(local).suffix.lower()=='.doc' and not (ex.get('text') or '').strip():
        access='Dosya indirildi; eski .doc biçimi nedeniyle metin otomatik çıkarılamadı.'
    elif local and idx==23:
        access='Dosya indirildi; görsel ağırlıklı sayfalarda metin çıkarımı kısmi.'
    elif local and idx==35 and not (ex.get('text') or '').strip():
        access='Dosya indirildi; tek sayfalı belgeden metin çıkarılamadı, başlık kaydı esas alındı.'
    elif local:
        page_count=ex.get('page_count')
        page_label=f' ({page_count} sayfa)' if page_count else ''
        access=f"İçerik incelendi{page_label}."
    else:
        access='İçeriği doğrulanamadı; rapor bağlantı kaydı esas alındı.'
    out.extend([
        f"{idx:02d}. {row.get('university','')} — {title}",
        f"    Tür: {row.get('classification','')} / {row.get('file_type','').upper() or 'dosya'} | {access}",
        f"    İçerik: {summary}",
        f"    Kaynak: {url}",
        ''
    ])
out.extend([
'KISA SAYIM',
'83 kayıt içinde 21 şablon kaydı (20 açık şablon + 1 aday) ve 62 kılavuz etiketi vardır. 62 erişilebilir kayıt 61 yerel dosya yoluna, içerik özetiyle doğrulanan 60 ayrı dosya içeriğine karşılık gelir; tekrarlar ayrıca belirtilmiştir. 21 bağlantıda içerik alınamadığından bunlar başlık/rapor bilgisiyle sınırlı özetlenmiştir.',
'Envanter, arama botunun bulduğu bağlantılardır; Ege Bölgesi üniversitelerindeki bütün tez şablonlarının eksiksiz toplamı değildir.',
''
])
DEST.write_text('\n'.join(out),encoding='utf-8-sig')
print(f'{DEST} | {len(summaries)} numaralı kayıt | {DEST.stat().st_size} bayt')
