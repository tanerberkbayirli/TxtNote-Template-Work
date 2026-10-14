import zipfile,sys
from xml.sax.saxutils import escape
def build(path,paras):
    W='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
    body=''
    for runs,right in paras:
        rs=''.join('<w:r><w:rPr>%s<w:kern w:val="0"/></w:rPr><w:t xml:space="preserve">%s</w:t></w:r>'%('<w:b/>' if b else '',escape(t)) for t,b in runs)
        body+='<w:p><w:pPr><w:spacing w:before="0" w:after="240" w:line="240" w:lineRule="auto"/><w:ind w:left="0" w:right="%d"/><w:jc w:val="both"/></w:pPr>%s</w:p>'%(right,rs)
    body+='<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>'
    doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document %s><w:body>%s</w:body></w:document>'%(W,body)
    styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles %s><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>'%W
    ct='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'
    rels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
    drels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>'
    z=zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED)
    z.writestr('[Content_Types].xml',ct);z.writestr('_rels/.rels',rels);z.writestr('word/document.xml',doc);z.writestr('word/_rels/document.xml.rels',drels);z.writestr('word/styles.xml',styles);z.writestr('word/settings.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>');z.close()
tail=' predictions while comparing the real occurred observations and it contains examples that have been incorrectly classified as negative and are therefore actually positive.'
l1a='False Negative:';l1b=' This value is calculated by finding the model’s “False Negative”'
def variant(name,bold):
    paras=[]
    # text width 411pt = 8220tw. natural line approx 394.5pt. overshoot o -> width = 394.5 - o
    for i in range(0,40):
        o=i*0.5   # pt overshoot beyond natural 0..19.5
        width=394.5-o
        right=round((453.5-width)*20)
        runs=[(l1a,bold),(l1b+tail,False)]
        paras.append((runs,right))
    build(name,paras)
variant('j_bold.docx',True)
variant('j_reg.docx',False)
