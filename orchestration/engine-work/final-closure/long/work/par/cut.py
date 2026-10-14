import json,re,zipfile,sys
from xml.dom import minidom
c=json.load(open('orchestration/engine-work/mission01/corpus.json',encoding='utf8'))
src=[s for s in c['sources'] if s['id']=='SRC09'][0]['path']
zin=zipfile.ZipFile(src)
FILES=[(i.filename,zin.read(i.filename)) for i in zin.infolist()]
x=zin.read('word/document.xml').decode('utf8')
# find end of 16th sectPr (index 15 -> S15 end), 17th sectPr = S16
ends=[m.end() for m in re.finditer(r'</w:sectPr>',x)]
starts=[m.start() for m in re.finditer(r'<w:sectPr',x)]
s16=x[starts[16]:ends[16]]
# cut after S15 paragraph end
cut=x.index('</w:p>',ends[15])+6
# include heading paragraph and the next 2 paragraphs
pos=cut
for _ in range(3):
    pos=x.index('</w:p>',pos)+6
head=x[:pos]
def variant(name,s16mod):
    doc=head+s16mod+'</w:body></w:document>'
    with zipfile.ZipFile(name,'w',zipfile.ZIP_DEFLATED) as zo:
        for fn,data in FILES:
            if fn=='word/document.xml': data=doc.encode('utf8')
            zo.writestr(fn,data)
variant('orchestration/engine-work/final-closure/long/work/par/c1.docx',s16)
variant('orchestration/engine-work/final-closure/long/work/par/c2.docx',s16.replace('<w:type w:val="oddPage"/>','<w:type w:val="nextPage"/>'))
variant('orchestration/engine-work/final-closure/long/work/par/c3.docx',re.sub(r'<w:pgNumType[^>]*/>','',s16))
print(s16[:300]); print(len(head))
# bisect
s15=x[starts[15]:ends[15]]
# document ending at S15's last paragraph: need to remove the sectPr from the pPr of the SAW paragraph and make it final
end15=x.index('</w:p>',ends[15])+6
head15=x[:end15]
head15_nosect=head15.replace(s15,'',1)
def variant2(name,body):
    doc=body+'</w:body></w:document>'
    with zipfile.ZipFile(name,'w',zipfile.ZIP_DEFLATED) as zo:
        for fn,data in FILES:
            if fn=='word/document.xml': data=doc.encode('utf8')
            zo.writestr(fn,data)
variant2('orchestration/engine-work/final-closure/long/work/par/c4.docx',head15_nosect+s15)
# c5: S16 type continuous
variant2('orchestration/engine-work/final-closure/long/work/par/c5.docx',head+s16.replace('<w:type w:val="oddPage"/>','<w:type w:val="continuous"/>'))
variant('orchestration/engine-work/final-closure/long/work/par/c6.docx',re.sub(r'<w:footerReference[^>]*/>','',s16))
variant('orchestration/engine-work/final-closure/long/work/par/c7.docx',re.sub(r'<w:formProt[^>]*/>|<w:docGrid[^>]*/>','',s16))
variant('orchestration/engine-work/final-closure/long/work/par/c8.docx',re.sub(r'<w:footerReference[^>]*/>|<w:formProt[^>]*/>|<w:docGrid[^>]*/>|<w:pgNumType[^>]*/>','',s16).replace('w:header="0"','w:header="709"').replace('w:footer="851"','w:footer="709"'))
# c9: S15 reduced to its sectPr paragraph only
s14_end=ends[14]
# find end of paragraph containing sectPr idx14 (S14 end), S15 content starts after that paragraph
p14_end=x.index('</w:p>',s14_end)+6
# S15 sectPr paragraph start: last '<w:p ' before starts[15]
p15_start=max(x.rfind('<w:p ',0,starts[15]),x.rfind('<w:p>',0,starts[15]))
p15_end=x.index('</w:p>',ends[15])+6
reduced=x[:p14_end]+x[p15_start:p15_end]+x[p15_end:pos]
variant2('orchestration/engine-work/final-closure/long/work/par/c9.docx',reduced+s16)
print(p14_end,p15_start,p15_end,pos)
