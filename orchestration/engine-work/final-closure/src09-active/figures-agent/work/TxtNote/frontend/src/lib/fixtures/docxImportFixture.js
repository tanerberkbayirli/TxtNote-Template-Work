import { strToU8, zipSync } from "fflate";
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
export function docxImportFixture({ body = '<w:p><w:r><w:t>Kaynak metin</w:t></w:r></w:p>', styles = '', numbering = '', relationships = '', parts = {}, finalSection = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1701" w:right="1134"/></w:sectPr>' } = {}) {
  const files = {
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/></Types>',
    '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rDoc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': `<w:document xmlns:w="${W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}${finalSection}</w:body></w:document>`,
    'word/styles.xml': `<w:styles xmlns:w="${W}">${styles}</w:styles>`,
    'word/numbering.xml': `<w:numbering xmlns:w="${W}">${numbering}</w:numbering>`,
    'word/_rels/document.xml.rels': `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rNumbers" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>${relationships}</Relationships>`, ...parts,
  };
  return zipSync(Object.fromEntries(Object.entries(files).map(([name,value])=>[name,typeof value==='string'?strToU8(value):value])));
}
export function styledDocxFixture() {
  return docxImportFixture({ styles: '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:rPr><w:b/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading"><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/><w:spacing w:after="160"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>',
    body: '<w:p><w:pPr><w:pStyle w:val="Heading"/></w:pPr><w:r><w:t>Kaynak başlığı</w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="right"/><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:bottom="1440" w:left="1701" w:right="1134"/></w:sectPr></w:pPr><w:r><w:rPr><w:b w:val="0"/></w:rPr><w:t xml:space="preserve">Ön bölüm ığüşİ. </w:t></w:r></w:p><w:p><w:r><w:t>Son bölüm metni.</w:t></w:r></w:p>',
    finalSection: '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="720" w:bottom="720" w:left="1440" w:right="1440"/><w:pgNumType w:fmt="lowerRoman" w:start="0"/></w:sectPr>' });
}
