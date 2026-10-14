import json,re,zipfile
c=json.load(open('orchestration/engine-work/mission01/corpus.json',encoding='utf8'))
src=[s for s in c['sources'] if s['id']=='SRC09'][0]['path']
zin=zipfile.ZipFile(src)
FILES=[(i.filename,zin.read(i.filename)) for i in zin.infolist()]
x=zin.read('word/document.xml').decode('utf8')
sp=[m.group(0) for m in re.finditer(r'<w:sectPr.*?</w:sectPr>',x,re.S)]
head=x[:x.index('<w:body>')+8]
def P(t,sect=''):
    return f'<w:p><w:pPr><w:pStyle w:val="GvdeMetni1"/>{sect}</w:pPr><w:r><w:t>{t}</w:t></w:r></w:p>'
H=lambda t:f'<w:p><w:pPr><w:pStyle w:val="Balk1"/></w:pPr><w:r><w:t>{t}</w:t></w:r></w:p>'
def build(name,body,final):
    doc=head+body+final+'</w:body></w:document>'
    with zipfile.ZipFile('orchestration/engine-work/final-closure/long/work/par/'+name+'.docx','w',zipfile.ZIP_DEFLATED) as zo:
        for fn,data in FILES:
            if fn=='word/document.xml': data=doc.encode('utf8')
            zo.writestr(fn,data)
s0,s14,s15,s16=sp[0],sp[14],sp[15],sp[16]
# m1: A(s0) S14 S15 BODY(s16 final)  + extra END
end=sp[18]  # landscape section 'next'
nxt=lambda s:s.replace('oddPage','nextPage')
build('m1',P('A',s0)+P('S14',s14)+P('S15',s15)+H('BODY')+P('text',s16)+P('END'),end)
build('m2',P('A',s0)+P('S14',s14)+P('S15',s15)+H('BODY')+P('text',nxt(s16))+P('END'),end)
build('m3',P('A',s0)+P('S14',s14)+P('S15',s15)+P('BODYP')+P('text',s16)+P('END'),end)
def simple(typ,fmt=None,start=None,extra=''):
    pg=''
    if fmt or start is not None:
        pg='<w:pgNumType'+(f' w:fmt="{fmt}"' if fmt else '')+(f' w:start="{start}"' if start is not None else '')+'/>'
    return f'<w:sectPr><w:type w:val="{typ}"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="2268" w:header="709" w:footer="709" w:gutter="0"/>{pg}{extra}</w:sectPr>'
build('m4',P('A',s0)+P('S14',simple('oddPage','lowerRoman'))+P('S15',simple('oddPage','lowerRoman'))+H('BODY')+P('text',simple('oddPage',None,1))+P('END'),end)
build('m5',P('A',simple('nextPage'))+P('S14',s14)+P('S15',s15)+H('BODY')+P('text',s16)+P('END'),end)
build('m6',P('A',s0)+P('S14',s14)+P('S15',s15)+P('BODYP')+P('text',simple('oddPage',None,1))+P('END'),end)
build('m7',P('A',s0)+P('S14',s14)+P('S15',simple('oddPage','lowerRoman'))+P('BODYP')+P('text',s16)+P('END'),end)
