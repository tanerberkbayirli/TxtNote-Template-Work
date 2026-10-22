// Official XML/Word facts -> reviewable template, checks, fixture and gap inventory.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { WORD_FONT_METRICS } from '../../engine/src/wordBaseline.js';
import { validateThesisTemplate } from '../../engine/src/validation.js';
import { wordFlowPreset } from './source-template-presets.mjs';

const mm = twips => Number(twips) * 25.4 / 1440;
const child = (node, tag) => node?.children?.find(c => c.tag === `w:${tag}`);
const val = (node, key = 'val') => node?.attributes?.[`w:${key}`];
const attrs = node => node?.attributes || {};
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const regex = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Separately anchored Word text boxes can omit spaces in PDF text extraction;
// glyph positions remain the measured comparison, and all source letters remain required.
const fixedRegex = s => regex(s).replace(/\s+/g, '\\s*');
const cleanTitle = s => s.trim().replace(/^\d+(?:\.\d+)*\.\s*/, '');
const bool = node => node && !['0', 'false', 'off'].includes(val(node));

const headingParagraphsLevels = profile => Array.from({ length: profile.headingParagraphs.length }, (_, i) => i + 1);

export function generate(extracted, profile) {
  if (extracted.target !== profile.target || !extracted.wordRender?.pages?.length) throw new Error('Target mismatch or verified Word geometry missing');
  if (extracted.source.sha256 !== extracted.wordRender.provenance.sourceSha256) throw new Error('Source and Word hashes differ');
  const styles = new Map(extracted.styles.map(s => [s.id, s]));
  const facts = [], gaps = [];
  const fact = (key, value, locator) => { if (!locator) throw new Error(`Missing source locator: ${key}`); facts.push({ key, value, source: { file: extracted.source.file, locator }, evidence: 'MEASURED' }); return value; };
  const merge = (a = {}, b = {}) => {
    const out = { ...a };
    for (const item of b.children || []) out[item.tag] = { ...out[item.tag], ...item, attributes: { ...out[item.tag]?.attributes, ...item.attributes } };
    return out;
  };
  function styleProperties(id, seen = new Set()) {
    if (!id) return { p: merge({}, child(extracted.docDefaults, 'pPrDefault') && child(child(extracted.docDefaults, 'pPrDefault'), 'pPr')), r: merge({}, child(child(extracted.docDefaults, 'rPrDefault'), 'rPr')) };
    if (seen.has(id)) throw new Error(`Style inheritance cycle: ${id}`);
    const style = styles.get(id); if (!style) throw new Error(`Missing style: ${id}`);
    const base = styleProperties(val(child(style.properties, 'basedOn')), new Set([...seen, id]));
    return { p: merge(base.p, child(style.properties, 'pPr')), r: merge(base.r, child(style.properties, 'rPr')) };
  }
  const normalId = profile.bodyStyle;
  function paragraphProperties(index) {
    const p = extracted.paragraphs.find(p => p.index === index);
    if (!p) throw new Error(`Missing source paragraph ${index}`);
    const base = styleProperties(val(child(p.properties.pPr, 'pStyle')) || normalId);
    return { p: merge(base.p, p.properties.pPr), r: merge(base.r, p.runProperties[0]), paragraph: p };
  }
  function mappedText(properties, prefix) {
    const { p, r } = properties, result = {};
    const set = (key, value, node) => { if (value !== undefined && value !== null) result[key] = fact(`${prefix}.${key}`, value, node.locator); };
    const font = r['w:rFonts'];
    const fontName = val(font, 'ascii') || val(font, 'hAnsi');
    if (fontName) set('fontFamily', fontName, font);
    else gaps.push({ key: prefix + '.fontFamily', reason: 'Theme/default font requires explicit review', locator: font?.locator });
    if (r['w:sz']) set('fontSizePt', Number(val(r['w:sz'])) / 2, r['w:sz']);
    if (r['w:b']) set('fontWeight', bool(r['w:b']) ? 700 : 400, r['w:b']);
    if (r['w:i']) set('italic', Boolean(bool(r['w:i'])), r['w:i']);
    if (r['w:color'] && /^[0-9A-F]{6}$/i.test(val(r['w:color']))) set('color', '#' + val(r['w:color']), r['w:color']);
    const jc = p['w:jc']; if (jc) set('align', ({ both: 'justify', left: 'left', right: 'right', center: 'center' })[val(jc)], jc);
    const spacing = p['w:spacing'];
    for (const [attribute, key] of [['before', 'spaceBeforePt'], ['after', 'spaceAfterPt']]) if (val(spacing, attribute) !== undefined) set(key, Number(val(spacing, attribute)) / 20, spacing);
    if (val(spacing, 'line') !== undefined) {
      const rule = val(spacing, 'lineRule') || 'auto';
      set('lineSpacing', { rule, value: Number(val(spacing, 'line')) / (rule === 'auto' ? 240 : 20) }, spacing);
      if (rule === 'auto') set('lineHeight', Number(val(spacing, 'line')) / 240, spacing);
    }
    const indent = p['w:ind'];
    for (const [attribute, key] of [['firstLine', 'firstLineIndentMm'], ['left', 'leftIndentMm'], ['right', 'rightIndentMm'], ['hanging', 'hangingIndentMm']]) if (val(indent, attribute) !== undefined) set(key, mm(val(indent, attribute)), indent);
    for (const [tag, key] of [['keepNext', 'keepWithNext'], ['keepLines', 'keepLines'], ['pageBreakBefore', 'pageBreakBefore'], ['widowControl', 'widowControl']]) if (p[`w:${tag}`]) set(key, Boolean(bool(p[`w:${tag}`])), p[`w:${tag}`]);
    return result;
  }
  const body = mappedText(paragraphProperties(profile.bodyParagraph), 'typography.body');
  if (!body.fontFamily || !body.fontSizePt) throw new Error('Unresolved body font');
  const metrics = WORD_FONT_METRICS[body.fontFamily.toLowerCase()]; if (!metrics) throw new Error('Unknown Word baseline metrics');
  const single = metrics.ascent + metrics.descent + metrics.lineGap;
  const pitch = body.fontSizePt * single * body.lineHeight;
  const headings = {};
  profile.headingParagraphs.forEach((index, i) => {
    const source = paragraphProperties(index), style = mappedText(source, `typography.headings.${i + 1}`);
    let blankCount = 0;
    for (let n = index + 1; extracted.paragraphs[n - 1] && !extracted.paragraphs[n - 1].text.trim(); n++) blankCount++;
    style.spaceAfterPt = fact(`typography.headings.${i + 1}.spaceAfterPt`, (style.spaceAfterPt || 0) + blankCount * pitch, source.paragraph.locator + '; following empty paragraphs');
    style.numbering = { enabled: true, format: Array.from({ length: i + 1 }, (_, n) => `{${n + 1}}`).join('.') + '.' };
    if (i === 0) style.pageBreakBefore = true; // reviewed chapter boundaries in Word page inventory
    headings[i + 1] = style;
  });
  // The table of contents lists the heading levels the source really has.
  const tocLevels = headingParagraphsLevels(profile);
  const section = extracted.sections[profile.bodySection - 1]; if (!section) throw new Error('Missing body section');
  const m = section.measurements.pgMar, size = section.measurements.pgSz;
  // Page number placement comes from the source: the footer paragraph that holds the PAGE field and its justification.
  const footerField = extracted.pageFields.find(f => /footer/i.test(f.locator));
  if (!footerField) throw new Error('Page number must be in a footer (no footer PAGE field in the source)');
  const numberJc = child(footerField.paragraphProperties.pPr, 'jc');
  const sourceNumberAlign = ({ left: 'left', start: 'left', center: 'center', right: 'right', end: 'right' })[val(numberJc)];
  if (!sourceNumberAlign) throw new Error('Footer PAGE alignment must be source-backed');
  const margins = Object.fromEntries(['top', 'bottom', 'left', 'right'].map(k => [`${k}Mm`, fact(`page.margins.${k}Mm`, m[k].value, m[k].locator)]));
  const page = { size: 'A4', widthMm: fact('page.widthMm', size.w.value, size.w.locator), heightMm: fact('page.heightMm', size.h.value, size.h.locator), orientation: 'portrait', margins,
    header: { heightMm: 0, distanceMm: fact('page.header.distanceMm', m.header.value, m.header.locator) }, footer: { heightMm: 0, distanceMm: fact('page.footer.distanceMm', m.footer.value, m.footer.locator) },
    numbering: { enabled: true, position: 'bottom', align: sourceNumberAlign, format: 'arabic', startAt: 1, restart: true, style: { fontFamily: body.fontFamily, fontSizePt: body.fontSizePt } } };
  const sourceBodyPage = extracted.wordRender.pages[profile.bodySourcePage - 1];
  const sourceNumber = sourceBodyPage.lines.at(-1);
  if (!/^\d+$/.test(sourceNumber.text)) throw new Error('Body source page has no numeric footer');
  page.numbering.baselineFromTopMm = fact('page.numbering.baselineFromTopMm', sourceNumber.baseline, sourceNumber.locator);
  fact('page.numbering.align', page.numbering.align, numberJc.locator);
  const checks = [];
  const check = (id, kind, params, expected, locator, tolerance = .5, category = 'geometry') => checks.push({ id, kind, params, expected, tolerance, source: { file: extracted.source.file, locator }, evidence: 'MEASURED', tier: 1, category });
  check('page-a4', 'page_size', { pages: 'all' }, [page.widthMm, page.heightMm], section.locator);
  for (const key of ['top', 'bottom', 'left', 'right', 'header', 'footer']) check(`docx-margin-${key}`, 'docx_section', { field: `margins.${key}`, sections: 'all' }, m[key].value, m[key].locator);
  check('word-opens', 'word_opens', {}, true, 'official DOCX; valid editable Word output', 0, 'structure');
  check('page-count-parity', 'page_count_match', {}, true, 'official document structure; editor/Word physical-page parity', 0, 'structure');
  check('page-label-parity', 'page_labels_match', {}, true, 'official pgNumType/front/body structure', 0, 'structure');
  const fontNames = { 'Times New Roman': ['TimesNewRomanPSMT', 'TimesNewRomanPS-BoldMT', 'TimesNewRomanPS-ItalicMT', 'TimesNewRomanPS-BoldItalicMT'], Arial: ['ArialMT', 'Arial-BoldMT', 'Arial-ItalicMT', 'Arial-BoldItalicMT'], Calibri: ['Calibri', 'Calibri-Bold', 'Calibri-Italic', 'Calibri-BoldItalic'] };
  if (!fontNames[body.fontFamily]) throw new Error('Unknown embedded font identities');
  const mainRegex = '^' + regex(extracted.paragraphs[profile.bodyParagraph - 1].text.trim().split(/\s+/).slice(0, 2).join(' '));
  for (const source of ['pdf', 'word']) {
    const params = { source, pages: { label: 'arabic' }, regex: mainRegex };
    check(`${source}-body-font`, 'fonts', params, fontNames[body.fontFamily], paragraphProperties(profile.bodyParagraph).paragraph.locator, .1, 'typography');
    check(`${source}-body-size`, 'font_size', params, body.fontSizePt, paragraphProperties(profile.bodyParagraph).paragraph.locator, .1, 'typography');
    check(`${source}-body-first-indent`, 'line_attr', { ...params, attr: 'x0', agg: 'first' }, margins.leftMm + body.firstLineIndentMm, paragraphProperties(profile.bodyParagraph).paragraph.locator);
    check(`${source}-page-number-y`, 'page_number_attr', { source, pages: { label: 'arabic' }, attr: 'baseline' }, sourceNumber.baseline, sourceNumber.locator);
    check(`${source}-body-pitch`, 'line_pitch', { source, pages: { label: 'arabic' } }, pitch * 25.4 / 72, paragraphProperties(profile.bodyParagraph).paragraph.locator, .25, 'typography');
    for (const [i, index] of profile.headingParagraphs.entries()) {
      check(`${source}-heading-${i + 1}-size`, 'font_size', { source, pages: { label: 'arabic' }, regex: regex(cleanTitle(extracted.paragraphs[index - 1].text)) }, headings[i + 1].fontSizePt, extracted.paragraphs[index - 1].locator, .1, 'typography');
    }
  }
  const sourceHeading = sourceBodyPage.lines[0], sourceFirstBody = sourceBodyPage.lines[1];
  for (const source of ['pdf', 'word']) check(`${source}-heading-body-gap`, 'line_gap', { source, page: { find: '^' + regex(extracted.paragraphs[profile.headingParagraphs[0] - 1].text.trim()), within: { label: 'arabic' } }, a: '^' + regex(extracted.paragraphs[profile.headingParagraphs[0] - 1].text.trim()), b: mainRegex }, sourceFirstBody.baseline - sourceHeading.baseline, sourceHeading.locator + '; ' + sourceFirstBody.locator, .25, 'typography');
  const fixed = new Map(profile.fixedPages.map(p => [p.id, p]));
  const sections = [];
  const gapInventory = new Map();
  function addFixed(rule) {
    const sourcePage = extracted.wordRender.pages[rule.sourcePage - 1];
    if (!sourcePage) throw new Error('Missing source fixed page');
    const blocks = [];
    sourcePage.lines.forEach((line, lineIndex) => {
      if (/^(?:\d+|[ivxlcdm]+)$/.test(line.text.trim()) && line.baseline > 270) return;
      line.words.forEach((word, wordIndex) => {
        const family = /TimesNewRoman/i.test(word.font) ? 'Times New Roman' : /Arial/i.test(word.font) ? 'Arial' : /Calibri/i.test(word.font) ? 'Calibri' : null;
        if (!family) throw new Error(`Unmapped source fixed-page font: ${word.font}`);
        const fontSizePt = Math.round(word.size * 2) / 2;
        const fm = WORD_FONT_METRICS[family.toLowerCase()];
        blocks.push({ id: `${rule.id}-l${lineIndex + 1}-w${wordIndex + 1}`, type: 'text', value: word.text, layoutMode: 'absolute', wordBaseline: true,
          xMm: word.x0, yMm: word.baseline - (fm.ascent + fm.lineGap) * fontSizePt * 25.4 / 72,
          widthMm: word.x1 - word.x0 + 1, heightMm: fontSizePt * single * 25.4 / 72 + 1, flowHeightMm: 0,
          style: { fontFamily: family, fontSizePt, fontWeight: word.bold ? 700 : 400, italic: word.italic, align: 'left', firstLineIndentMm: 0, lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0 } });
      });
      // Every measured fixed-page line is checked against both real exports.
      for (const source of ['pdf', 'word']) for (const attr of ['baseline', 'x0', 'size']) {
        const selector = rule.group === 'cover' ? { page: rule.sourcePage } : { find: '^' + fixedRegex(rule.title), within: rule.group === 'back' ? { label: 'arabic' } : { label: 'roman' } };
        const locator = line.locator;
        const nth = sourcePage.lines.slice(0, lineIndex).filter(prior => prior.text.trim() === line.text.trim()).length;
        check(`${rule.id}-line-${lineIndex + 1}-${source}-${attr}`, 'line_attr', { source, pages: selector, regex: '^' + fixedRegex(line.text.trim()) + '$', attr, agg: 'first', nth }, line[attr], locator, attr === 'size' ? .1 : .5, 'fixed-pages');
      }
    });
    return { id: rule.id, type: rule.type, title: rule.title, status: 'required', group: rule.group, mode: 'static', tocEntry: rule.group === 'cover' ? 'none' : 'title', blocks,
      overrides: { page: { numbering: rule.group === 'cover' ? { enabled: false } : { enabled: true, format: rule.group === 'back' ? 'arabic' : 'roman-lower', ...(rule.id === 'approval' ? { startAt: 1, restart: true } : { restart: false }) } } } };
  }
  const sectionContent = {};
  for (const rule of profile.sections) {
    if (fixed.has(rule.id)) { sections.push(addFixed(fixed.get(rule.id))); continue; }
    if (rule.id === 'main') {
      sections.push({ id: 'main', type: 'mainContent', title: rule.title, status: 'required', group: 'body', mode: 'editable', showTitle: false,
        overrides: { page: { numbering: { enabled: true, format: 'arabic', startAt: 1, restart: true } } } });
      continue;
    }
    const titleStyle = rule.titleParagraph ? mappedText(paragraphProperties(rule.titleParagraph), `sections.${rule.id}.title`) : headings[1];
    const indexStyle = rule.styleId ? mappedText(styleProperties(rule.styleId), `sections.${rule.id}.index`) : body;
    sections.push({ id: rule.id, type: rule.type, title: rule.title, status: 'required', group: rule.group || 'front', mode: rule.indexKind ? 'generated' : 'editable', showTitle: true,
      tocEntry: rule.indexKind ? 'none' : 'title',
      ...(rule.indexKind ? { generatedIndex: { kind: rule.indexKind, title: rule.title, levels: tocLevels, includePageNumbers: true, leader: 'dots', style: indexStyle } } : {}),
      overrides: { page: { numbering: { enabled: true, format: rule.group === 'back' ? 'arabic' : 'roman-lower', restart: false } },
        headings: { 1: { ...titleStyle, numbering: { enabled: false }, firstLineIndentMm: 0, pageBreakBefore: false } } } });
    if (rule.paragraphs) sectionContent[rule.id] = rule.paragraphs.map(index => `<p>${escape(extracted.paragraphs[index - 1].text)}</p>`).join('');
  }
  let main = profile.chapterParagraphs.map((index, chapter) => {
    const title = cleanTitle(extracted.paragraphs[index - 1].text);
    const sub = chapter === 1 ? profile.headingParagraphs.slice(1).map((n, level) => `<h${level + 2}>${escape(cleanTitle(extracted.paragraphs[n - 1].text))}</h${level + 2}><p>${escape(extracted.paragraphs[profile.bodyParagraph - 1].text)}</p>`).join('') : '';
    return `<h1>${escape(title)}</h1><p>${escape(extracted.paragraphs[profile.bodyParagraph - 1].text)}</p><p>${escape(extracted.paragraphs[profile.bodyParagraph].text)}</p>${sub}`;
  }).join('');
  const tables = { label: 'Tablo', position: 'above', style: mappedText(paragraphProperties(profile.tableCaption), 'tables.style'), numbering: { scope: 'document', format: '{n}', sequence: 'arabic' } };
  const figures = { label: 'Şekil', position: 'below', style: mappedText(paragraphProperties(profile.figureCaption), 'figures.style'), numbering: { scope: 'document', format: '{n}', sequence: 'arabic' } };
  const paragraphStyles = {};
  if (profile.tableProbe) {
    const table = extracted.tables[profile.tableProbe.table - 1];
    const defaultTable = extracted.styles.find(s => s.type === 'table' && ['1', 'true'].includes(s.default));
    const padding = child(child(defaultTable?.properties, 'tblPr'), 'tblCellMar');
    if (!padding) throw new Error('Table padding requires source XML');
    tables.cellPadding = Object.fromEntries(['top', 'bottom', 'left', 'right'].map(side => {
      const node = child(padding, side); if (!node || val(node, 'type') !== 'dxa') throw new Error('Unresolved table cell margins');
      return [side + 'Mm', fact('tables.cellPadding.' + side + 'Mm', mm(val(node, 'w')), node.locator)];
    }));
    paragraphStyles.sourceTable = { ...mappedText(paragraphProperties(profile.tableProbe.firstCellParagraph), 'typography.paragraphStyles.sourceTable'), fontWeight: 400 };
    tables.cellStyle = paragraphStyles.sourceTable;
    const cols = table.properties.tblGrid.children.map(c => Number(val(c, 'w'))), total = cols.reduce((a, b) => a + b, 0);
    const rows = table.rows.map(row => '<tr>' + row.cells.map(cell => '<td>' + extracted.paragraphs.filter(p => p.locator.startsWith(cell.locator + '/')).map(p => `<p data-thesis-style="sourceTable">${escape(p.text)}</p>`).join('') + '</td>').join('') + '</tr>').join('');
    const caption = extracted.paragraphs[profile.tableCaption - 1].text.replace(/^Tablo\s+\d+\.\s*/, '');
    const tableHtml = `<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><colgroup>${cols.map(c => `<col data-col-width="${100 * c / total}">`).join('')}</colgroup><caption>${escape(caption)}</caption><tbody>${rows}</tbody></table></div>`;
    main += tableHtml;
    const sourceCell = extracted.paragraphs[profile.tableProbe.firstCellParagraph - 1];
    const sourceLine = extracted.wordRender.pages.flatMap(p => p.lines).find(l => l.text.startsWith(sourceCell.text.trim()));
    if (!sourceLine) throw new Error('Table probe has no official rendered line');
    for (const source of ['pdf', 'word']) {
      check(`${source}-table-cell-left`, 'line_attr', { source, regex: '^' + regex(sourceCell.text.trim()), pages: { label: 'arabic' }, attr: 'x0', agg: 'first' }, sourceLine.x0, sourceLine.locator, .5, 'tables');
      check(`${source}-table-cell-size`, 'font_size', { source, regex: '^' + regex(sourceCell.text.trim()), pages: { label: 'arabic' } }, sourceLine.size, sourceLine.locator, .1, 'tables');
    }
  }
  // Retain every unmapped source property by tag+attribute, with an example locator.
  const mappedTags = new Set(['w:rFonts', 'w:sz', 'w:b', 'w:i', 'w:color', 'w:jc', 'w:spacing', 'w:ind', 'w:keepNext', 'w:keepLines', 'w:pageBreakBefore', 'w:widowControl', 'w:pgSz', 'w:pgMar', 'w:pgNumType']);
  function inventory(node) {
    if (!node || typeof node !== 'object') return;
    if (node.tag && !mappedTags.has(node.tag) && Object.keys(attrs(node)).length) {
      const key = node.tag + ':' + Object.keys(attrs(node)).join(',');
      if (!gapInventory.has(key)) gapInventory.set(key, { key, locator: node.locator, attributes: attrs(node), disposition: 'REVIEW: source property preserved; not silently applied as a university rule' });
    }
    for (const c of node.children || []) inventory(c);
  }
  for (const s of extracted.styles) inventory(s.properties);
  for (const t of extracted.tables) { for (const n of Object.values(t.properties)) inventory(n); for (const r of t.rows) { for (const n of Object.values(r.properties)) inventory(n); for (const c of r.cells) for (const n of Object.values(c.properties)) inventory(n); } }
  inventory(extracted.numbering); inventory(extracted.settings);
  // HE-SB-02: a generated template is official, with a verification date, only once a person recorded that its source-based
  // checks passed (profile.verifiedAt); the profile's review date is not a verification. The document name is the source's own.
  const template = { schemaVersion: 1, templateVersion: '1.0.0', ...profile.identity, status: profile.verifiedAt ? 'official' : 'generic', source: { type: 'official', documentName: (extracted.source.originalFile || extracted.source.file).split('/').at(-1), ...(profile.verifiedAt ? { verifiedAt: profile.verifiedAt } : {}), notes: ['Source-derived Phase 4 pilot. XML/example structure has precedence; unresolved source properties are retained in the mapping inventory. Fixed-page text nodes remain editable in layout and Word; long replacement text needs layout review.'] },
    page, typography: { body, paragraph: body, headings, paragraphStyles, lineSpacing: wordFlowPreset(body.fontFamily) }, placeholders: {}, sections, tables, figures,
    captionKinds: { photo: { ...figures, label: 'Resim' } }, bibliography: { heading: 'KAYNAKLAR', style: mappedText(paragraphProperties(profile.bibliographyParagraph), 'bibliography.style') },
    toc: { heading: 'İÇİNDEKİLER', levels: tocLevels, showPageNumbers: true } };
  const errors = validateThesisTemplate(template); if (errors.length) throw new Error(errors.join('\n'));
  const fixture = { title: 'ADÜ Sağlık Bilimleri kaynak temelli doğrulama pilotu', content: main,
    researchData: { thesis: { templateId: template.id, templateVersion: template.templateVersion, selection: { universityId: template.universityId, instituteId: template.instituteId, degreeType: template.degreeType, language: template.language }, values: {}, sectionContent, enabledSections: [] } } };
  return { template, fixture, checks, mapping: { schemaVersion: 1, target: profile.target, sourceSha256: extracted.source.sha256, facts, engineGaps: [...gaps, ...gapInventory.values()], limitations: ['Fixed pages reproduce reviewed source sample as editable positioned text; replacement titles/jury names require layout review.', 'Theme and conditional table styles not used as universal rules. Additional variants and Tier 2 cases require source review.'] } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [extractedPath, profilePath, outDirectory] = process.argv.slice(2);
  if (!outDirectory) throw new Error('usage: spec2template.mjs extracted.json profile.json output-directory');
  const extracted = JSON.parse(readFileSync(extractedPath, 'utf8')), profile = JSON.parse(readFileSync(profilePath, 'utf8'));
  const result = generate(extracted, profile), out = resolve(outDirectory); mkdirSync(out, { recursive: true });
  const save = (suffix, data) => writeFileSync(resolve(out, profile.target + suffix), JSON.stringify(data, null, 2) + '\n');
  writeFileSync(resolve(out, profile.target + '.js'), '// Generated from official source by spec2template.mjs; review the mapping inventory.\nexport default ' + JSON.stringify(result.template, null, 2) + ';\n');
  save('.fixture.json', result.fixture); save('.checks.json', result.checks); save('.mapping.json', { ...result.mapping, extractedSha256: createHash('sha256').update(readFileSync(extractedPath)).digest('hex'), profileSha256: createHash('sha256').update(readFileSync(profilePath)).digest('hex') });
  writeFileSync(resolve(out, profile.target + '.CONTEXT.md'), `# ${profile.target} generated draft\n- Source: ${extracted.source.file}; SHA256 ${extracted.source.sha256}.\n- Status: draft, Tier 1 PENDING; no PASS from generation.\n- Engine gaps: see ${profile.target}.mapping.json (${result.mapping.engineGaps.length} preserved property groups).\n- Next: review source conflicts, register reviewed draft, real export and Word checker.\n`);
  console.log(JSON.stringify({ target: profile.target, checks: result.checks.length, mappedFacts: result.mapping.facts.length, unresolvedPropertyGroups: result.mapping.engineGaps.length, out }));
}
