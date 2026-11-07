// Ortak uygulama rehberi: üniversite/enstitü/şablondan bağımsız, sürümle yönetilen sabit içerik.
// Yalnız editörde gerçekten bulunan özellikleri anlatır; şablona özgü kural burada yer almaz.
// İçeriği değiştirirken APP_GUIDE_VERSION'ı artırın ve ilgili arayüzü kaynak kodda doğrulayın.

export const APP_GUIDE_VERSION = "2026-10-25";

export const APP_GUIDE_SECTIONS = Object.freeze([
  {
    id: "olusturma",
    title: "Belge oluşturma ve şablon seçimi",
    steps: [
      "Yeni bir tez belgesi açın; belge, seçili üniversite/enstitü şablonunun sayfa ve yazı kurallarıyla görünür.",
      "Şablonu değiştirmek için sağdaki Tez bilgileri panelini açın ve “Tez şablonu” listesinden seçim yapın.",
      "“Belge biçimi” listesi şablon düzenine uyarlamayı veya kaynak belgenin kendi biçimini korumayı seçtirir; seçiminiz yazdığınız metni silmez.",
    ],
  },
  {
    id: "bilgiler",
    title: "Tez bilgilerini doldurma",
    steps: [
      "Sağ sütundaki “Tez bilgileri” düğmesiyle paneli açın; tez adı, öğrenci, danışman, anabilim dalı, şehir ve yıl gibi alanları doldurun.",
      "Girdiğiniz bilgiler kapak, onay, beyan ve özet gibi şablonun ilgili sayfalarına kendiliğinden yansır.",
      "Eksik bilgiler “Belge uyarıları” listesinde görünür; kapak sayfalarındaki sabit metinleri değiştirmek gerekmez.",
    ],
  },
  {
    id: "yazma",
    title: "Editörde yazma ve biçimlendirme",
    steps: [
      "Yalnız düzenlenebilir bölümlerde (örneğin özet, giriş, bölümler) yazarsınız; kapaklar gibi sabit sayfalar Tez bilgilerinden gelir.",
      "Giriş sekmesinde yazı tipi, boyut, kalın/italik, hizalama, liste ve girinti araçları bulunur. Başlık stilleri Stiller galerisinden uygulanır.",
      "Sol üstteki Geri al ve Yinele düğmeleri yaptığınız düzenlemeleri geri çevirir.",
      "Yazım planı paneli bölümleri ve başlıkları listeler; bir başlığa basınca belgede o yere gidersiniz.",
    ],
  },
  {
    id: "icindekiler",
    title: "İçindekiler paneli",
    steps: [
      "Sağ sütundaki “İçindekiler” düğmesiyle paneli açın. Her satırda isteğe bağlı numara, başlık adı ve sayfa etiketi görünür.",
      "Bir satıra basınca ayrıntısı açılır; burada yalnız başlık, sayfa ve silme vardır. Yaptığınız her değişiklik belgeye anında uygulanır, ayrıca onay gerekmez.",
      "“+ Başlık ekle” yeni satır ekler. Numarayı kendiniz başlığın içine yazarsınız (örneğin “2.1 Amaç”); uygulama ikinci bir numara eklemez.",
      "Satırlar sayfa etiketine göre sıralanır: önce Roma rakamları (I, II, IV, IX), sonra normal sayılar (1, 2, 10).",
      "Belgedeki içindekiler satırına basmak, girdiğiniz basılı sayfa etiketine götürür; etiket henüz yoksa bilgi verilir.",
      "Elle düzenlemeyi bırakmak için “Otomatik içindekilere dön” düğmesi kullanılır. Bu panel yalnız şablonu içindekiler paneli destekleyen belgelerde görünür.",
    ],
  },
  {
    id: "kaynaklar",
    title: "Kaynaklar, atıf ve görsel/tablo/denklem",
    steps: [
      "Başvurular sekmesinden Kaynaklar panelini açın; kaynağı kaynak havuzuna ekleyin, ardından metinde imlecin olduğu yere atıf veya dipnot ekleyin.",
      "Kaynakça, metinde kullandığınız kaynaklardan ve şablonun atıf biçiminden oluşturulur; Atıf biçimi listesi şablonun sunduğu seçenekleri gösterir.",
      "Ekle sekmesinden görsel, tablo, denklem, bağlantı, metin çerçevesi ve sayfa sonu eklenir; dipnot ve sonnot Başvurular sekmesindedir. Şablon açıklama biçimi tanımlıyorsa başlıklar o kurala göre numaralanır.",
    ],
  },
  {
    id: "sayfa-ayari",
    title: "Sayfa ayarları",
    steps: [
      "Sayfa ayarları, Tez bilgileri panelinin en altındaki varsayılan olarak kapalı “Sayfa ayarı” başlığındadır; başlığa basarak açarsınız.",
      "Değişikliği hangi kapsamda uygulayacağınızı (örneğin yalnız seçili bölüm) açılan formda seçersiniz; kapalıyken hiçbir ayar belgeyi değiştirmez.",
      "Düzen ve Görünüm sekmelerinde sayfa ölçüleri, cetveller ve sayfa düzeni denetçisi bulunur.",
    ],
  },
  {
    id: "kontrol",
    title: "Kontrol, önizleme ve dışa aktarma",
    steps: [
      "Başvurular sekmesindeki “Belgeyi kontrol et” eksik bilgileri ve şablon uyarılarını listeler. Uyarılar bilgilendirmedir; metninizi kendiliğinden değiştirmez.",
      "Görünüm sekmesindeki yakınlaştırma ve sayfa düzeni araçlarıyla belgeyi sayfa sayfa önizlersiniz.",
      "Dosya sekmesinden Word veya PDF olarak dışa aktarabilir ya da yazdırabilirsiniz. Sayfalama tamamlanmadan dışa aktarma engellenebilir; birkaç saniye bekleyip yeniden deneyin.",
      "Son kontrolde kapak bilgileri, içindekiler sayfa etiketleri, şekil/tablo dizinleri ve kaynakça tutarlılığına bakın.",
    ],
  },
  {
    id: "sorunlar",
    title: "Geri alma ve sık karşılaşılan durumlar",
    steps: [
      "Yanlış bir düzenleme için Geri al (Ctrl+Z) ve Yinele (Ctrl+Y) kullanın; düzen değişiklikleri için ayrı geri al/yinele düğmeleri vardır.",
      "Belge uyarısında eksik bir yazı tipi bildirilirse yazı tipini bu cihaza kurup belgeyi yeniden açın; aksi hâlde satır kırılımları doğrulanamaz.",
      "Şablon kuralları (kenar boşluğu, punto, kelime sınırı vb.) için bu şablonun yazım kurallarına bakın; bunlar şablona göre değişir.",
    ],
  },
]);
