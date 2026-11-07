"""Source passages reread during the regional rebuild.

Every decision must match the full extracted source at the recorded location. Values
here override both a guide's own typography and regex candidates taken out of scope.
Permitted alternatives are choices for this draft, not exclusive university rules.
"""


def body(font='Times New Roman',size=12,line=None):
    result={'typography.body.fontFamily':font,'typography.body.fontSizePt':size}
    if line is not None:
        result['typography.body.lineHeight']=line
    return result


def margins(top,bottom,left,right):
    return {f'page.margins.{side}Mm':value for side,value in zip(('top','bottom','left','right'),(top,bottom,left,right))}


def ieu_headings():
    return {f'typography.headings.{level}.{field}':value for level in (1,2,3,4)
            for field,value in {'fontFamily':'Times New Roman','fontSizePt':14 if level==1 else 12,
                                'fontWeight':700,'lineHeight':1.5,'italic':level>1}.items()}


# key, location, literal passage fragment, changes, explanation
DECISIONS = [
 ('ad922ef8bdd422cd','sayfa 7','Times New Roman karakteri ve 12 punto',body(),'Fen Bilimleri Türkçe gövde; kapak ölçüsü kullanılmadı.'),
 ('ad922ef8bdd422cd','sayfa 9','Sonra (6 nk)',{'typography.body.align':'justify','typography.body.lineHeight':1.5,'typography.paragraph.firstLineIndentMm':10,'typography.paragraph.spaceBeforePt':0,'typography.paragraph.spaceAfterPt':6,'typography.footnotes.lineHeight':1},'2.4 paragraf ayarları; dipnot için aynı sayfadaki tek satır kuralı.'),
 ('ad922ef8bdd422cd','sayfa 10','alt kenarında 2,0',margins(30,20,30,30),'Türkçe kılavuzun 2.5 bölümündeki dört kenar.'),
 ('ad922ef8bdd422cd','sayfa 11','sayfa ortasına hizalı',{'page.numbering.position':'bottom','page.numbering.align':'center'},'2.8 sayfa numarası konumu.'),
 ('ad922ef8bdd422cd','sayfa 12','Dipnotlar 10 punto',{'typography.footnotes.fontSizePt':10},'Daha küçük boyuta izin var; taslak için açık 10 punto seçildi.'),
 ('ad922ef8bdd422cd','sayfa 30','Özel (asılı), Değer (1 cm)',{'bibliography.heading':'KAYNAKLAR','bibliography.style.fontFamily':'Times New Roman','bibliography.style.fontSizePt':12,'bibliography.style.hangingIndentMm':10,'bibliography.style.lineHeight':1.5,'bibliography.style.spaceBeforePt':0,'bibliography.style.spaceAfterPt':6,'bibliography.style.align':'justify'},'Kaynaklar bölümünün kendi paragraf kuralı; genel tek satır ifadesinden daha özel.'),
 ('ad922ef8bdd422cd','sayfa 19','çizelgenin üstüne',{'tables.position':'above','tables.label':'Çizelge','figures.position':'below','figures.label':'Şekil'},'Çizelge açıklaması üstte, şekil/resim açıklaması altta.'),
 ('cb0356781f972753','sayfa 9','Value (1 cm)',{'typography.body.align':'justify','typography.body.lineHeight':1.5,'typography.paragraph.firstLineIndentMm':10,'typography.paragraph.spaceBeforePt':0,'typography.paragraph.spaceAfterPt':6,'typography.footnotes.lineHeight':1},'English guide §2.4; body paragraph settings and single-spaced footnotes.'),
 ('cb0356781f972753','sayfa 11','aligned to the center of the page',{'page.numbering.position':'bottom','page.numbering.align':'center'},'English guide §2.8.'),
 ('cb0356781f972753','sayfa 12','10-point font',{'typography.footnotes.fontSizePt':10},'English guide §2.11 allows smaller footnotes if needed.'),
 ('cb0356781f972753','sayfa 31','Custom (Hanging), Value (1 cm)',{'bibliography.heading':'REFERENCES','bibliography.style.fontFamily':'Times New Roman','bibliography.style.fontSizePt':12,'bibliography.style.hangingIndentMm':10,'bibliography.style.lineHeight':1.5,'bibliography.style.spaceBeforePt':0,'bibliography.style.spaceAfterPt':6},'Specific references paragraph rule, rather than the general single-spacing statement.'),
 ('cb0356781f972753','sayfa 19','written above the table',{'tables.position':'above','tables.label':'Table','figures.position':'below','figures.label':'Figure'},'Explicit caption placement.'),
 ('82acb26bace466a8','sayfa 22','sağ kenarında 2.3 cm',margins(25,25,30,23),'Tıp kılavuzunun kendine özgü 2,3 cm sağ kenarı.'),
 ('82acb26bace466a8','sayfa 23','sağ kenar hizasına',{'page.numbering.position':'bottom','page.numbering.align':'right','typography.body.lineHeight':1.5,'typography.paragraph.firstLineIndentMm':12.5,'typography.footnotes.lineHeight':1,'typography.footnotes.fontSizePt':10},'Sayfa numarası sağ altta; ana metin 1,5 satır ve 1,25 cm girinti. Dipnot 10 veya daha küçük; 10 seçildi.'),
 ('82acb26bace466a8','sayfa 34','tablonun üstüne',{'tables.position':'above','tables.label':'Tablo','figures.position':'below','figures.label':'Şekil'},'Tıp fakültesinin tablo ve şekil açıklaması konumları.'),
 ('cb0356781f972753','sayfa 9','2.0 cm on the bottom edge',margins(30,20,30,30),'English guide: the 2 cm value belongs to the bottom edge, not the top.'),
 ('d639bf58f3de0bd1','paragraf 125','kenarından 3,3 cm',margins(25,25,33,20),'Ana metin kenarları; sayfa numarasının 1,5 cm uzaklığı alt kenar boşluğu değildir.'),
 ('82acb26bace466a8','sayfa 21','12 punto',body(),'Ana metin yazı tipi ve boyutu; kapak 14 puntosu gövdeye uygulanmaz.'),
 ('3b764e6398668dc0','sayfa 1','12 puntoyla',body(),'Tez metni 12 punto, dipnot 10 punto.'),
 ('5ff0a5776a7ee76f','paragraf 70','Yazıların 12 punto',body(line=1.5),'Kapak örneklerinin 14 ve 18 puntosu ana metin değildir.'),
 ('5ff0a5776a7ee76f','paragraf 147','alt kısmına ortalanarak',{'page.numbering.position':'bottom','page.numbering.align':'center','page.numbering.style.fontFamily':'Times New Roman','page.numbering.style.fontSizePt':10},'Ön ve ana metin numaraları alt ortada.'),
 ('533e09574495f272','sayfa 7','12 punto ve iki yana yaslı',body(line=1.5),'Genel metin kuralı; görsel künye ve dipnot boyutları farklıdır.'),
 ('47497e80d25f3162','paragraf 184','üst, alt ve sol kenardan üçer cm',margins(30,30,30,20),'Aynı paragrafta sağ kenar iki cm.'),
 ('47497e80d25f3162','paragraf 184','12 punto Arial, Tahoma, Times New Roman',body(line=1.5),'İzin verilen fontlardan Times New Roman seçildi; Arial, Tahoma ve Courier de izinlidir.'),
 ('47497e80d25f3162','paragraf 184','Paragraf başlangıçları bir cm',{'typography.paragraph.firstLineIndentMm':10,'typography.body.align':'justify'},'Sayfa düzeni paragrafında açık kural.'),
 ('fd1e4fb83687ef4b','sayfa 2','sol kenardan 4.0 cm',margins(30,30,40,25),'Makina bitirme kılavuzunun kendi kenar ölçüleri.'),
 ('fd1e4fb83687ef4b','sayfa 3','11 punto büyüklükte',body(size=11,line=1.5),'Ana metin 11 punto; kapak 12,14,18 punto örnekleri değildir.'),
 ('ca2521081fc1e522','sayfa 6','alt ve üst kenarlarında 3 cm',margins(30,30,40,25),'Numaranın alt kenardan 2 cm uzaklığı metnin alt kenarı değildir.'),
 ('ca2521081fc1e522','sayfa 7','12 punto, Times New Roman',body(line=1.5),'Metin kuralı 3.2 Satır Aralıkları.'),
 ('ca2521081fc1e522','sayfa 7','Paragraf başlangıçları 1 cm',{'typography.paragraph.firstLineIndentMm':10},'Sağlık Bilimleri Enstitüsü paragraf girintisi.'),
 ('64e2ce5bccef388a','sayfa 7','sol kenarında 4 cm',margins(30,30,40,25),'Tıp Fakültesi 2.4 Sayfa Düzeni.'),
 ('64e2ce5bccef388a','sayfa 7','Ana metnin harf büyüklüğü 12 punto',body(line=1.5),'Ana metin ölçüleri.'),
 ('6424207fa76764c0','sayfa 1','sağ, sol ve alt',margins(30,25,25,25),'Mezuniyet projesinin 3 cm üst ve 2,5 cm diğer kenarları.'),
 ('6424207fa76764c0','sayfa 1','en altında ve ortada',{'page.numbering.position':'bottom','page.numbering.align':'center'},'Bitirme projesi numaraları.'),
 ('364cf62f9c734e05','paragraf 151','Ayrıca sol kenarında 2 cm cilt payı',margins(25,25,50,20),'3 cm metin kenarına 2 cm cilt payı eklendi; motor ayrı cilt payı tutmuyor. Tek yönlü eşdeğer geometri.'),
 ('364cf62f9c734e05','paragraf 160','Times New Roman',{'typography.body.fontFamily':'Times New Roman'},'2.5 Kullanılacak Yazıların Niteliği.'),
 ('364cf62f9c734e05','paragraf 167','12 pt',{'typography.body.fontSizePt':12},'Tablodaki Tez metninde satırının değeridir (paragraf 166-167).'),
 ('364cf62f9c734e05','paragraf 399','1,5 aralık (18 pt)',{'typography.body.lineHeight':1.5},'Satır aralığı; tek satırlı özel bölümlerden ayrıldı.'),
 ('364cf62f9c734e05','paragraf 154','sayfanın ortasına',{'page.numbering.position':'top','page.numbering.align':'center'},'Üst kenara 1 cm numara konumu.'),
 ('a34d1c80bbf914b0','sayfa 5','on iki (12) punto',body(font='Calibri'),'HİT metni Calibri 12; şekil, tablo ve dipnot 9/10 puntosu gövde değildir.'),
 ('40e12a6c07efc878','paragraf 94','metin alanlarında 12 punto',body(),'Reklamcılık raporu metni; kapak 14 punto.'),
 ('40e12a6c07efc878','paragraf 95','tüm kenar boşlukları ise 2,5',margins(25,25,25,25),'Belgede birim yazılmamış; 2,5 değeri cm olarak yorumlandı, yorum kaynak notunda korunur.'),
 ('533e3496b9a00454','paragraf 340','alt kısmında ise 2 santim',margins(25,20,35,25),'Sol 2,5 cm + açıkça belirtilen 1 cm cilt boşluğu; tek yönlü eşdeğer.'),
 ('533e3496b9a00454','paragraf 340','Times New Roman ve 12 punto',body(line=1.5),'RTS yazılı tez biçimi; yönergenin kendi Calibri yazımı değildir.'),
 ('8ccd8bc04c2860a8','sayfa 1','üst kenarından 4',margins(40,25,35,25),'Deri Mühendisliği lisans tezinin sayfa kenarları.'),
 ('8ccd8bc04c2860a8','sayfa 1','Times New Roman',body(),'Ana metin boyut listesi görsel kaynakla ayrıca kontrol edilmelidir.'),
 ('c762b554829a2fcd','paragraf 147','Times New Roman kullanılmalı ve 12 punto',body(),'Ege Sosyal Bilimler ana metin kuralı.'),
 ('c224ace66ee2a3d6','paragraf 90','yazı karakteri olarak 12 punto',body(),'Bakırçay ana metin kuralı; tablo/görsel/uzun alıntı 10 pt.'),
 ('c224ace66ee2a3d6','paragraf 1004','altında ve ortasındadır',{'page.numbering.position':'bottom','page.numbering.align':'center','page.numbering.style.fontFamily':'Times New Roman','page.numbering.style.fontSizePt':11},'Kılavuz içindeki kontrol çizelgesinde açık konum ve boyut.'),
 ('bd63121cf0408f6e','sayfa 4','Ana metnin harf büyüklüğü 12 punto',body(line=1.5),'Bakırçay Tıp ana metin; kapak ve dipnot boyutları farklıdır.'),
 ('9e64410aff772527','paragraf 138','making a total of 3.5 cm',margins(25,25,35,25),'İngilizce kılavuzda sol kenar cilt payı dahil 3,5 cm.'),
 ('9e64410aff772527','paragraf 141','12-point font size',body(line=1.5),'English guide general text rule.'),
 ('77e637ea9db809ab','paragraf 138','toplam 3,5 cm',margins(25,25,35,25),'Türkçe kılavuzda sol kenar cilt payı dahil 3,5 cm.'),
 ('77e637ea9db809ab','paragraf 141','12 punto',body(line=1.5),'Türkçe kılavuzda tüm metin kuralı.'),
 ('222344bdc8851210','sayfa 1','12-point Times New Roman',body(line=2),'Gastronomi bitirme projesi çift satır; lisansüstü tezin 1,5 satırı uygulanmaz.'),
 ('222344bdc8851210','sayfa 1','2.5 cm wide minimum',margins(25,25,25,25),'Asgari 2,5 cm koşulunu sağlayan seçim; tek zorunlu kesin ölçü olarak sunulmaz.'),
 ('12fdf8a63ce153e9','sayfa 5','font size 12',body(line=1.5),'İzmir Ekonomi İngilizce kılavuzu 2.2.'),
 ('12fdf8a63ce153e9','sayfa 5','Chapter Headings',ieu_headings(),'Chart 1: bölüm başlığı 14 punto kalın; alt başlıklar 12 punto kalın italik; tamamı 1,5 satır.'),
 ('208c8cf4cf17a535','sayfa 6','Bölüm Başlıkları',ieu_headings(),'Tablo 1: kullanılmamış Word Calibri başlık stili yerine kılavuzdaki başlık ölçüleri.'),
 ('208c8cf4cf17a535','sayfa 9','alt orta bölgesinde',{'page.numbering.position':'bottom','page.numbering.align':'center','page.numbering.style.fontFamily':'Times New Roman','page.numbering.style.fontSizePt':12},'İzmir Ekonomi bütün sayfa numaraları.'),
 ('36955cc0b4523e0f','paragraf 269','metin içeriği “12 punto”',body(line=1.5),'Tınaztepe gövde 12; özet/kaynaklar için ayrı kurallar var.'),
 ('36955cc0b4523e0f','paragraf 276','alt ve üst kenarda 3cm',margins(30,30,40,25),'Normal sayfa kenarları; ana başlık sayfalarının 7 cm üst boşluğu ayrı istisnadır.'),
 ('36955cc0b4523e0f','paragraf 279','sayfanın alt ortasına',{'page.numbering.position':'bottom','page.numbering.align':'center','page.numbering.style.fontFamily':'Times New Roman','page.numbering.style.fontSizePt':10},'Sayfa numarası konum ve boyutu.'),
 ('88a75dfb7533e9fd','sayfa 2','Yazım metni 12 punto',body(),'DPU Endüstri ana metin 12; kapak örneği 13 punto değildir.'),
 ('44d21d3f2f1b2b6c','paragraf 50','Tek yönlü baskı için',margins(25,25,40,20),'DPU tek yönlü baskı seçildi; çift yönlü kenarlar için ayrı motor desteği gerekir.'),
 ('44d21d3f2f1b2b6c','paragraf 63','12 punto boyutlarında',body(),'Şablonda yönerge kutularının merkezli profili gövde değildir.'),
 ('44d21d3f2f1b2b6c','paragraf 71','Satır aralığı ise 1,5',{'typography.body.lineHeight':1.5,'typography.paragraph.spaceBeforePt':6,'typography.paragraph.spaceAfterPt':6},'Tez genel paragraf ve satır aralığı.'),
 ('44d21d3f2f1b2b6c','paragraf 79','iki yana yasla',{'typography.body.align':'justify','typography.paragraph.firstLineIndentMm':15},'Yönerge kutusunun merkezli ölçüm profili yerine açık ana metin kuralı.'),
 ('a3a5063828629bc3','paragraf 118','alt kenarında ise 2 cm',margins(30,20,40,27.5),'Üstte numaranın üzerinde 2 cm mesafe gövde üst kenarı değildir.'),
 ('a3a5063828629bc3','paragraf 140','Times New Roman ya da Arial',body(),'İzin verilen fontlardan Times New Roman seçildi; gövde 12.'),
 ('a3a5063828629bc3','paragraf 150','1,5 satır aralığı',{'typography.body.lineHeight':1.5},'Kaynak örneklerinin 1,15 ve kılavuzun kendi 2 satırı gövde kuralı değildir.'),
 ('ec794dd818cad60d','sayfa 4','11 veya 12 punto',body(line=1.5),'İzin verilen font ve boyutlardan Times New Roman 12 seçildi; tek seçenek olduğu iddia edilmez.'),
 ('a8590fd1337a28e9','sayfa 3','Ana metnin harf büyüklüğü 12 punto',body(line=1.5),'Arial veya Times New Roman seçeneklerinden Times New Roman 12 seçildi.'),
 ('6db5785cd40aaccc','paragraf 66','ana metin için 12 punto',body(),'PAÜ Diş ana metni; 16 punto kapak boyutudur.'),
 ('6db5785cd40aaccc','paragraf 76','1,2 cm içeriden',{'typography.paragraph.firstLineIndentMm':12,'typography.body.lineHeight':1.5},'Diş kılavuzundaki girinti 1,2 cm; 1,25 cm varsayılmadı.'),
 ('8a810c61bbd3c421','sayfa 1','Times New Roman 12 punto veya Arial 11',body(line=1.5),'İzin verilen eşleşmelerden Times New Roman 12 seçildi; Arial seçilirse 11 punto olmalı.'),
 ('ef3893c166e0710b','sayfa 27','Times New Roman yazı tipi (12 punto)',body(),'Uşak Diş ana metin kuralı.'),
 ('623db68eb8bf6e65','sayfa 5','Ana metin 12 punto',body(),'İKÇÜ Diş ana metin; dipnot 10 ve kapak 14/16 ayrı kurallardır.'),
 ('8dd44bbf848babd2','sayfa 3','Ayrıca sol kenarında 2 cm',margins(25,25,50,20),'3 cm metin kenarı + 2 cm cilt payı. Tek yönlü eşdeğer; çift yönlü cilt payı motor sınırlaması olarak korunur.'),
 ('8dd44bbf848babd2','sayfa 4','Tez metninde',body(),'Tablodaki Tez metninde 12 pt satırı; dipnot ve başlık değerleri ayrıldı.'),
 ('d6b2dcd08fe368c9','paragraf 98','Metin ve kaynakça için yazı boyutu 12',body(),'Dipnot 10 puntosu ana metin olarak yanlış çıkarılmıştı.'),
 ('d6b2dcd08fe368c9','paragraf 102','sağ alt kenarında',{'page.numbering.position':'bottom','page.numbering.align':'right','page.numbering.style.fontFamily':'Times New Roman','page.numbering.style.fontSizePt':12},'Kaynak açıkça kapaklar, onay, beyan, özet ve abstractı numarasız tutar.'),
 ('42c48d6f01da825e','paragraf 179','en az 2.5 cm',{'page.margins.rightMm':25},'En az 2,5 cm koşulunu sağlayan seçim.'),
 ('ec3786d07e8975f1','sayfa 46','on i k i (12) punto',body(line=1.5),'PAÜ Sağlık doktora DOCX içindeki 9 punto örnek paragraf gövde kuralı değildir; kılavuz kontrol listesi 12 punto/1,5 satırı doğrular.'),
]


def decisions():
    # Empty entries are explicit pending rereads, never applied.
    return [row for row in DECISIONS if row[3]]
