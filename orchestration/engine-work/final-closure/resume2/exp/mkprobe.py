import zipfile,sys
def build(path,fill,last_after,last_before=0,next_before=0,prev_after=0,last_lines=1):
    W='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
    body=''
    for i in range(fill):
        body+='<w:p><w:pPr><w:spacing w:before="0" w:after="%d" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t>F%d</w:t></w:r></w:p>'%(prev_after if i==fill-1 else 0,i)
    body+='<w:p><w:pPr><w:spacing w:before="%d" w:after="%d" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t>LAST</w:t></w:r></w:p>'%(last_before,last_after)
    body+='<w:p><w:pPr><w:spacing w:before="%d" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:t>NEXT</w:t></w:r></w:p>'%next_before
    body+='<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>'
    doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document %s><w:body>%s</w:body></w:document>'%(W,body)
    styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles %s><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>'%W
    ct='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'
    rels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
    drels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
    z=zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED)
    z.writestr('[Content_Types].xml',ct);z.writestr('_rels/.rels',rels);z.writestr('word/document.xml',doc);z.writestr('word/_rels/document.xml.rels',drels);z.writestr('word/styles.xml',styles);z.close()
if __name__=='__main__':
    pass
