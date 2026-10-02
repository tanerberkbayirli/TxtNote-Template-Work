# AFSÜ LEE ilk geçerli yüksek lisans exportu: ön inceleme

Tarih: 2026-10-02. Durum: FAIL / uygulama sürüyor. Bu kayıt bağımsız çalışan doğrulamasının yerine geçmez.

Gerçek editör çıktısı: `master-self-2.pdf`, `master-self-2.docx`, `master-self-2.layout.json`. PDF 39 fiziksel sayfa içerir. İlk `master-self-1` çıktısı geçersiz şablon nedeniyle genel şablona düştüğü için kanıt olarak kullanılmaz. Ana ajan ikinci PDF'in bütün sayfalarının metnini pypdf ile okumuştur; bu ön inceleme geometri ölçümü değildir.

- ÖZET başlığı ve tez adı fiziksel 6. sayfa, metin 7. sayfa, anahtar kelimeler 8. sayfadır. ABSTRACT aynı şekilde 9–11. sayfalara bölünür. Kılavuzun tek sayfa sınırı karşılanmaz. Metni kısaltarak gereksinimden kaçınmak yerine bölüm/blok sayfa kırılması incelenmelidir; fixture en az 250 kelimeyi korumalıdır.
- Ön sayfaların birçoğu yeniden i ile başlar. Kaynaklar (36), ekler (37–38) ve özgeçmiş (39) Roma rakamına döner. ÖZET i ile başlayıp ön bölüm boyunca devam etmeli; GİRİŞ 1'den başlayıp arka bölüm dahil Arap numarasıyla devam etmelidir.
- Fiziksel 17. sayfada yalnız `1. GİRİŞ` vardır; ilk gövde metni sonraki sayfada görünür. Başlık/metin sayfa kırılması incelenecektir.
- İngilizce tez adı `EXAMİNİNG THE DİGİTAL LİTERACY ...` biçiminde Türkçe noktalı İ içerir. İngilizce başlık büyük harfleri İngilizce metin olarak korunmalıdır.
- İç kapakta boş proje alanına rağmen `(varsa) proje numarası ile desteklenmiştir.` kalıbı görünür. Kaynaktaki isteğe bağlı proje bloğu boş alanlarda basılmamalıdır.

Çalışan bu bulguları almıştır ve dar düzeltme/yeniden export yapmaktadır. İlk gerçek Word render'ı, dereceye özel kapak geometri karşılaştırması, font ölçümü ve bağımsız çalışan doğrulaması henüz tamamlanmamıştır.

Motor regresyon ön kontrolü: 617 testten 615'i geçti; eklenen iki yeni test assertion'ı başarısızdır (konumlu öğeden önce eklenen slot'un yanlış seçilmesi ve derleme başlık parametresinin test metadata başlığını geçersiz kılması inceleniyor). Bunların gerçek davranış hatası mı test fixture hatası mı olduğu düzeltilmiş odak testleriyle doğrulanmalıdır. Vite üretim build'i geçti; mevcut externalized Node modülü ve büyük chunk uyarıları vardır. Testler tamamı geçmeden motor checkpoint'i tamamlanmış sayılmaz.
