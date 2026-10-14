/** Native DOCX adapter. Uninterpreted XML remains in its source part and is located
 * in the import report; it is never inserted into the executable editor DOM. */
import { runFormatAttributes, fieldMarkerAttributes } from "./docx/runFormat.js";
import { createContentDocument, installContentDocument } from "./contentModel.js";
import { attr, base64, child, children, descendants, elements, escapeHtml, isWord, M, mm, readDocxPackage, val } from "./docx/importPackage.js";
import { numberingLevel, readNumbering, readParagraphProperties, readRunProperties, readSectionProperties, readStyles } from "./docx/properties.js";

import { readChromeText, projectSourceChrome, readPositionedPage } from "./docx/chromeImport.js";
import { readDrawingShape } from "./docx/shapes.js";
import { readPictureAttributes } from "./docx/images.js";
import { equationPreview, equationMathSettings, inlineEquationContext } from "./docx/equationPreview.js";
import { chartPreview, drawingGroupPreview, drawingTheme } from "./docx/drawingPreview.js";

const textNode = text => ({ type: "text", text: escapeHtml(text) });
const localAttr = (node, name) => Array.from(node?.attributes || []).find(a => a.localName === name)?.value || "";
const safeLink = value => /^(?:https?:|mailto:|tel:|#)/i.test(value) ? value : "";
const census = root => {
  const counts = {};
  const walk = node => { if (node.nodeType === 1) { const key = `{${node.namespaceURI}}${node.localName}`; counts[key] = (counts[key] || 0) + 1; } for (const c of elements(node)) walk(c); };
  walk(root); return counts;
};

export async function importThesisDocx(buffer, { fileName = "belge.docx", formatMode = "source" } = {}) {
  const started = performance.now(), pkg = await readDocxPackage(buffer), rels = pkg.relationships(pkg.mainPart);
  const related = suffix => Object.values(rels).find(r => r.type.endsWith('/'+suffix) && !r.external)?.part;
  const settings = pkg.xml(related("settings"))?.documentElement;
  const defaultTabTwips = Number(val(settings, "defaultTabStop"));
  const mathSettings = equationMathSettings(settings);
  const issues = [], issueKeys = new Set();
  const report = (code, node, message, location) => {
    const locator = location || pkg.location(node) || pkg.mainPart;
    const key = code+":"+locator;
    if (!issueKeys.has(key)) { issueKeys.add(key); issues.push({ code, locator, message, preserved: true }); }
  };
  const styles = readStyles(pkg, related("styles"), report, related("theme")), numbering = readNumbering(pkg, related("numbering"));
  const shapeTheme = drawingTheme(pkg.xml(related("theme"))?.documentElement);
  const auditProperties = (pr, supported) => {
    for (const n of elements(pr)) if (!supported.includes(n.localName)) report("unmapped-property", n, `Biçim özelliği korundu; uygulaması desteklenmiyor: ${n.nodeName}`);
  };
  const resources = {}, notes = {}, references = {}, sourceCounts = {}, mappedCounts = {};
  let nextId = 1;
  const make = (type, tag, native, attrs = {}, kids = [], properties = {}) => {
    const id = 'docx-'+nextId++;
    if (native) { const key = `{${native.namespaceURI}}${native.localName}`; mappedCounts[key] = (mappedCounts[key] || 0) + 1; }
    return { id, type, tag, attributes: attrs, children: kids,
      properties: { ...(native ? { nativeName: native.localName, nativeNamespace: native.namespaceURI, locator: pkg.location(native),
        nativeAttributes: Object.fromEntries(Array.from(native.attributes || []).map(a => [a.name, a.value])) } : {}), ...properties } };
  };
  const partRelations = new Map([[pkg.mainPart, rels]]);
  const relationships = part => { if (!partRelations.has(part)) partRelations.set(part, pkg.relationships(part)); return partRelations.get(part); };
  const resource = (part, id, node) => {
    const relation = relationships(part)[id];
    if (!relation) { report("missing-relationship", node, `İlişki bulunamadı: ${id}`); return null; }
    const key = part+'#'+id;
    if (!Object.hasOwn(resources, key)) {
      resources[key] = { ...relation, ownerPart: part, contentType: relation.part ? pkg.type(relation.part) : "", ...(relation.part && pkg.files[relation.part] ? { bytesBase64: base64(pkg.files[relation.part]) } : {}) };
      if (relation.external) report("external-relationship", node, "Dış kaynak otomatik yüklenmedi");
      else if (!pkg.files[relation.part]) report("missing-package-part", node, `Paket parçası bulunamadı: ${relation.part}`);
    }
    return { key, ...resources[key] };
  };
  const isAlternative = node => node?.localName === "AlternateContent" && node.namespaceURI === "http://schemas.openxmlformats.org/markup-compatibility/2006";
  const alternative = (node, context, block) => {
    const branches = elements(node), fallback = branches.find(n => n.localName === "Fallback");
    const supportedChartEx = branch => {
      const drawing = descendants(branch, n => isWord(n, "drawing"))[0], chart = descendants(drawing, n => n.localName === "chart" && n.namespaceURI === "http://schemas.microsoft.com/office/drawing/2014/chartex")[0];
      if (!chart) return false;
      const relation = relationships(context.part)[localAttr(chart,"id")], shape = readDrawingShape(drawing,shapeTheme);
      return !relation?.external && !!shape && !!chartPreview(pkg.xml(relation?.part)?.documentElement,shape,shapeTheme);
    };
    const selected = branches.find(n => n.localName === "Choice" && String(n.getAttribute("Requires") || "").split(/\s+/).filter(Boolean).every(prefix => {
      const ns = n.lookupNamespaceURI(prefix); return ns === M || /\/wordprocessingml\/|\/drawingml\/2006\/main$/.test(ns || "") || ["http://schemas.microsoft.com/office/word/2010/wordprocessingShape", "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"].includes(ns) || ["http://schemas.microsoft.com/office/drawing/2014/chartex", "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex"].includes(ns) && supportedChartEx(n);
    })) || fallback || branches[0];
    report("alternative-content", node, "Alternatif Word gösterimi seçildi; diğer dalın kaynak yapısı gizli olarak korundu");
    // A ChartEx Choice is re-emitted as a native drawing on export; its Fallback picture is only the
    // cached stand-in for that same object and must not be exported as a second, separate figure.
    const chartExChoice = branches.some(n => n.localName === "Choice" && descendants(n, g => g.localName === "graphicData" && g.getAttribute("uri") === "http://schemas.microsoft.com/office/drawing/2014/chartex").length);
    const markFallback = (nodes) => { for (const n of nodes) { if (n.tag === "img") n.attributes["data-docx-native-fallback"] = ""; markFallback(n.children || []); } };
    const result = make("alternative", block ? "div" : "span", node, {}, branches.map(branch => make("alternativeBranch", block ? "div" : "span", branch,
      branch === selected ? {} : { hidden: "" }, block ? blocks(branch, context) : elements(branch).flatMap(n => inline(n, context)), { selected: branch === selected })));
    if (chartExChoice) result.children.filter(b => b.properties.nativeName === "Fallback").forEach(b => markFallback(b.children));
    return result;
  };
  const inline = (node, context) => {
    const { part, paragraphStyle } = context;
    if (isAlternative(node)) return [alternative(node, context, false)];
    if (isWord(node, "rPr") || isWord(node, "pPr")) return [];
    if (isWord(node, "r")) {
      const pr = child(node, "rPr"), styleId = val(pr, "rStyle"), direct = readRunProperties(pr, styles.theme);
      auditProperties(pr, ["rStyle", "rFonts", "sz", "b", "i", "strike", "caps", "smallCaps", "vanish", "u", "color", "highlight", "vertAlign", "spacing", "lang"]);
      if (attr(child(pr, "color"), "themeColor")) report("theme-color", child(pr, "color"), "Tema rengi kaydedildi; renk dönüşümü doğrulanmadı");
      if (attr(child(pr, "rFonts"), "eastAsia") || attr(child(pr, "rFonts"), "cs")) report("script-font", child(pr, "rFonts"), "Yazı sistemine özel font kaydedildi; font seçimi doğrulanmadı");
      return [make("run", "span", node, runFormatAttributes({ ...(styleId ? styles.resolve(styleId).run : {}), ...direct }), elements(node).flatMap(n => inline(n, context)),
        { styleId, paragraphStyleId: paragraphStyle, direct, resolvedSource: styles.run(paragraphStyle, styleId, direct), runPropertiesXml: pkg.serialize(pr) })];
    }
    if (isWord(node, "t") || isWord(node, "delText")) {
      return [make("textRun", "span", node, {}, [textNode(node.textContent || "")], { xmlSpace: localAttr(node, "space") })];
    }
    if (isWord(node, "tab")) return [make("tab", "span", node, {}, [textNode("\t")])];
    if (isWord(node, "br") || isWord(node, "cr")) return [make("break", "br", node, { ...(attr(node, "type") ? { 'data-docx-break': attr(node, "type") } : {}) })];
    if (isWord(node, "noBreakHyphen")) return [make("symbol", "span", node, {}, [textNode("\u2011")])];
    if (isWord(node, "softHyphen")) return [make("symbol", "span", node, {}, [textNode("\u00ad")])];
    if (isWord(node, "sym")) { report("symbol-font", node, "Özel font sembolünün çizimi doğrulanmadı"); return [make("symbol", "span", node, {}, [textNode(String.fromCodePoint(parseInt(attr(node, "char") || "fffd", 16)))])]; }
    if (isWord(node, "instrText") || isWord(node, "fldChar")) {
      if (attr(node, "fldCharType") === "begin") report("field-refresh", node, "Alan ve önbellek içeriği saklandı; alan yenileme Görev 12 kapsamında");
      return [make("field", "span", node, { 'data-docx-field': node.localName, hidden: "", ...fieldMarkerAttributes(node, attr) }, [], { instruction: node.textContent || "", fieldType: attr(node, "fldCharType") })];
    }
    if (isWord(node, "lastRenderedPageBreak")) return [];
    if (isWord(node, "bookmarkStart") || isWord(node, "bookmarkEnd")) {
      const nativeId = attr(node, "id"), name = attr(node, "name"), bookmarkId = 'docx-bookmark-'+nativeId;
      if (isWord(node, "bookmarkStart")) references[bookmarkId] = { nativeId, name, locator: pkg.location(node) };
      const result = make("bookmark", "span", node, { ...(name ? { 'data-academic-id': bookmarkId, 'data-docx-bookmark-name': name } : {}), 'data-docx-bookmark-id': nativeId }, []);
      if (name) references[bookmarkId].nodeId = result.id;
      return [result];
    }
    if (isWord(node, "hyperlink")) {
      const id = localAttr(node, "id"), anchor = attr(node, "anchor"), rel = id ? resource(part, id, node) : null;
      const href = anchor ? '#'+anchor : safeLink(rel?.target || "");
      if (rel && !href) report("unsafe-link", node, "Bağlantı adresi etkinleştirilmedi");
      return [make("link", "a", node, href ? { href } : {}, elements(node).flatMap(n => inline(n, context)), { relationshipId: id, anchor })];
    }
    if (isWord(node, "footnoteReference") || isWord(node, "endnoteReference")) {
      const kind = isWord(node, "footnoteReference") ? "footnote" : "endnote", nativeId = attr(node, "id"), id = kind+":"+nativeId;
      if (!notes[id]) report("missing-note", node, `Not gövdesi bulunamadı: ${id}`);
      return [make(kind+"Reference", "sup", node, { class: kind === "footnote" ? "academic-footnote" : "academic-endnote", 'data-fn-id': id, 'data-fn-text': notes[id]?.text || "", contenteditable: "false" }, [textNode(nativeId)], { noteId: id, nativeId })];
    }
    if (node.namespaceURI === M && ["oMath", "oMathPara"].includes(node.localName)) {
      report("equation-layout", node, "Yerel Word denklemi düzenlenebilir OMML olarak korunur; tarayıcı denklem yerleşimi doğrulanmadı");
      const text = descendants(node, n => n.namespaceURI === M && n.localName === "t").map(n => n.textContent || "").join("");
      const display = node.localName === "oMathPara" ? "block" : "inline", omml = pkg.serialize(node);
      const preview = (part) => part.text !== undefined ? textNode(part.text) : make("mathPresentation", part.tag, null, part.attributes, part.children.map(preview));
      return [make("equation", "span", node, { class: `math-formula${display === "block" ? " math-formula--block" : ""}`, 'data-native-object': "equation", 'data-docx-omml': omml, 'data-display': display, contenteditable: "false", title: "Word denklemi; yerleşim doğrulanmadı" }, [preview(equationPreview(node, { ...mathSettings, inlineMath: context.inlineMath }))], { display, omml, text, mathFont: mathSettings.mathFont || "Cambria Math" })];
    }
    if (isWord(node, "drawing") || isWord(node, "pict") || isWord(node, "object")) {
      const imageNodes = descendants(node, n => n.localName === "blip" || n.localName === "imagedata");
      const imageKids = [];
      for (const image of imageNodes) {
        const id = localAttr(image, "embed") || localAttr(image, "link") || localAttr(image, "id"), res = resource(part, id, image);
        const mime = res?.contentType || "";
        const safeImage = /^(?:image\/(?:png|jpeg|gif|webp|bmp))$/i.test(mime) && res?.bytesBase64;
        if (!safeImage) report("image-format", image, "Görsel kaynağı saklandı; bu biçimin çizimi desteklenmiyor");
        imageKids.push(make("image", safeImage ? "img" : "span", image, safeImage ? { src: `data:${mime};base64,${res.bytesBase64}`, ...readPictureAttributes(node, image) } : { 'data-native-object': "image" }, [], { resourceId: res?.key || id }));
      }
      if (descendants(node, n => n.localName === "anchor").length && imageKids.some(k => k.tag !== "img" || !k.attributes["data-img-h"])) report("anchored-image", node, "Yüzen görselin kaynak konumu saklandı; yerleşimi doğrulanmadı");
      if (descendants(node, n => n.localName === "srcRect").length && imageKids.some(k => k.tag === "span" && k.type === "image")) report("image-crop-layout", node, "Görsel kırpma verisi saklandı; çizimi doğrulanmadı");
      if (isWord(node, "object")) report("embedded-object", node, "Gömülü nesne çalıştırılmadı; kaynak paketinde saklandı");
      const textboxes = descendants(node, n => isWord(n, "txbxContent"));
      if (textboxes.length) {
        report("text-box-layout", node, "Metin kutusu içeriği korundu; konumu doğrulanmadı");
        const inlineProjection = node => { if (!["span", "img", "br", "sup", "a", "del"].includes(node.tag) && node.tag) { node.tag = "span"; node.attributes['data-docx-box-block'] = ""; } (node.children || []).forEach(inlineProjection); };
        for (const box of textboxes) { const nodes = blocks(box, context); nodes.forEach(inlineProjection); imageKids.push(...nodes); }
      }
      const shape = readDrawingShape(node, shapeTheme);
      const native = shape && shape.graphic !== "picture" && !imageNodes.length && ["drawing", "pict"].includes(node.localName);
      if (native) {
        const previewNode = (view) => view.text !== undefined ? textNode(view.text) : make("drawingPreview", view.tag, null, view.attributes, view.children.map(previewNode));
        let view = null, source = node;
        const chart = descendants(node, (n) => n.localName === "chart" && /\/(?:chart|chartex)$/.test(n.namespaceURI || ""))[0];
        const diagram = descendants(node, (n) => n.localName === "relIds")[0];
        if (chart) {
          const res = resource(part, localAttr(chart, "id"), chart);
          source = pkg.xml(res?.part)?.documentElement;
          if (res?.part && Object.values(pkg.relationships(res.part)).some((r) => r.external && /\/(?:package|oleObject)$/.test(r.type))) report("chart-external-data", chart, "Dış çalışma kitabı otomatik bağlanmaz; DOCX'te önbellek serileri düzenlenebilir kalır, özgün bağlantı kaynak paketinde korunur");
          view = chartPreview(source, shape, shapeTheme);
          report("chart-preview", chart, view ? "Grafik önbelleğindeki veri çizildi; eksen/stil eşliği doğrulanmadı" : "Bu grafik türünün yerleşimi desteklenmiyor; önbellek içeriği gösteriliyor, Word nesnesi korunuyor");
        } else if (diagram) {
          const res = resource(part, localAttr(diagram, "dm"), diagram);
          const dataRoot = pkg.xml(res?.part)?.documentElement;
          const extension = descendants(dataRoot, (n) => n.localName === "dataModelExt")[0];
          const cacheId = extension?.getAttribute("relId");
          const cached = cacheId && pkg.relationships(part)[cacheId] || res?.part && Object.values(pkg.relationships(res.part)).find((r) => /\/diagramDrawing$/.test(r.type) && !r.external);
          source = pkg.xml(cached?.part || res?.part)?.documentElement;
          view = drawingGroupPreview(source, shape, shapeTheme);
          report("smartart-preview", diagram, view ? "SmartArt önbellek çizimi gösteriliyor; yerleşim eşliği doğrulanmadı" : "SmartArt çizim önbelleği yok; düğüm metinleri gösteriliyor, Word nesnesi korunuyor");
        } else if (shape.shapes > 1 || /Group/.test(shape.graphic || "")) view = drawingGroupPreview(source, shape, shapeTheme);
        if (view) { imageKids.splice(0, imageKids.length, previewNode(view)); shape.hasPreview = true; }
        else if (chart || diagram) {
          const content = descendants(source, (n) => ["t", "v"].includes(n.localName)).map((n) => n.textContent || "").filter(Boolean);
          imageKids.splice(0, imageKids.length, make("drawingSummary", "span", null, { role: "note" }, [textNode(`${chart ? "Grafik" : "SmartArt"} — yerleşim önizlemesi desteklenmiyor: ${content.join(" · ") || "önbellek içeriği yok"}`)]));
          shape.hasPreview = true;
          // The note only stands in for the object: the frame keeps the object's extent and clips the note, otherwise the
          // inline-block's baseline follows the (taller) note text and the line grows far beyond the object's own height.
          shape.placeholder = true;
        }
      }
      return [make("drawing", "span", node, { 'data-native-object': "drawing", ...(native ? { "data-docx-drawing": pkg.serialize(node), "data-docx-part": part, contenteditable: "false" } : {}) }, imageKids, shape ? { shape } : {})];
    }
    const knownWrapper = isWord(node) && ["smartTag", "sdt", "sdtContent", "customXml", "fldSimple", "ins", "del", "moveFrom", "moveTo", "dir", "bdo"].includes(node.localName);
    if (isWord(node, "fldSimple")) report("field-refresh", node, "Alan ve önbellek içeriği saklandı; alan yenileme Görev 12 kapsamında");
    if (isWord(node) && ["sdtPr", "sdtEndPr", "customXmlPr", "proofErr", "permStart", "permEnd", "commentRangeStart", "commentRangeEnd", "commentReference", "footnoteRef", "endnoteRef", "separator", "continuationSeparator"].includes(node.localName)) {
      return [make("annotation", "span", node, { hidden: "" })];
    }
    if (!knownWrapper) report("unmapped-element", node, `Öğe kaynak XML ile korundu: ${node.nodeName}`);
    if (isWord(node) && ["ins", "del", "moveFrom", "moveTo"].includes(node.localName)) report("tracked-change", node, "Değişiklik izleme kaydı korundu; kabul/reddet işlemi uygulanmadı");
    return [make("container", isWord(node, "del") ? "del" : "span", node, isWord(node, "fldSimple") ? fieldMarkerAttributes(node, attr) : {}, elements(node).flatMap(n => inline(n, context)))];
  };
  const paragraph = (p, context) => {
    const pr = child(p, "pPr"), styleId = val(pr, "pStyle") || styles.defaultParagraphId;
    auditProperties(pr, ["pStyle", "jc", "ind", "spacing", "keepNext", "keepLines", "pageBreakBefore", "widowControl", "contextualSpacing", "bidi", "outlineLvl", "numPr", "tabs", "rPr", "sectPr"]);
    if (child(pr, "tabs")) report("tab-layout", child(pr, "tabs"), "Sekme durakları saklandı; satır yerleşimi Görev 05 kapsamında");
    if (Array.from(child(pr, "ind")?.attributes || []).some(a => a.localName.endsWith("Chars"))) report("character-indent", child(pr, "ind"), "Karakter birimli girinti saklandı; ölçü dönüşümü doğrulanmadı");
    const direct = readParagraphProperties(pr), resolvedSource = styles.paragraph(styleId, direct);
    const numPr = resolvedSource.numbering, list = numPr?.numId && numPr.numId !== "0" ? numberingLevel(numbering, numPr.numId, numPr.level || 0) : null;
    if (numPr?.numId && numPr.numId !== "0" && !list) report("missing-numbering", p, `Numaralandırma tanımı bulunamadı: ${numPr.numId}`);
    const outline = resolvedSource.outlineLevel, tag = Number.isInteger(outline) && outline < 6 ? 'h'+(outline+1) : "p";
    const inlineMath = inlineEquationContext(p);
    return make("paragraph", tag, p, { ...(styleId ? { 'data-docx-style': styleId } : {}) }, elements(p).flatMap(n => inline(n, { ...context, paragraphStyle: styleId, inlineMath })),
      { styleId, explicitStyleId: val(pr, "pStyle"), direct, resolvedSource, paragraphPropertiesXml: pkg.serialize(pr), ...(list ? { list } : {}), paragraphMarkRun: readRunProperties(child(pr, "rPr"), styles.theme) });
  };
  const table = (tbl, context) => {
    if (child(tbl, "tblPr")) report("table-layout", child(tbl, "tblPr"), "Tablo özellikleri saklandı; ayrıntılı çizim Görev 10 kapsamında");
    const grid = child(tbl, "tblGrid"), widths = children(grid, "gridCol").map(n => mm(attr(n, "w"))), activeMerges = new Map();
    const rows = children(tbl, "tr").map(tr => {
      let col = Number(val(child(tr, "trPr"), "gridBefore") || 0);
      const cells = children(tr, "tc").map(tc => {
        const pr = child(tc, "tcPr"), span = Number(val(pr, "gridSpan") || 1), merge = child(pr, "vMerge"), mode = merge ? attr(merge, "val") || "continue" : "";
        const direction = val(pr, "textDirection"), attrs = { ...(span > 1 ? { colspan: String(span) } : {}), ...(["btLr", "tbRl"].includes(direction) ? { "data-docx-text-dir": direction } : {}) };
        const cell = make("cell", "td", tc, attrs, blocks(tc, context), { gridColumn: col, gridSpan: span, verticalMerge: mode, cellPropertiesXml: pkg.serialize(pr) });
        if (mode === "continue") {
          const origin = activeMerges.get(col);
          if (origin) { origin.attributes.rowspan = String(Number(origin.attributes.rowspan || 1) + 1); attrs['data-docx-vmerge'] = "continue"; }
          else report("orphan-vertical-merge", tc, "Dikey birleşmenin başlangıç hücresi bulunamadı");
        } else for (let c = col; c < col + span; c++) { if (mode === "restart") activeMerges.set(c, cell); else activeMerges.delete(c); }
        col += span; return cell;
      });
      // Word row properties the DOCX writer re-emits (w:tblHeader repeat-header row, w:cantSplit), stamped on <tr> so they survive the HTML view.
      const trPr = child(tr, "trPr"), on = (name) => { const n = child(trPr, name); return !!n && !["false", "0", "off"].includes(attr(n, "val")); };
      const height = child(trPr, "trHeight"), exactHeight = height && attr(height, "hRule") === "exact" && Number(attr(height, "val")) > 0;
      return make("row", "tr", tr, { "data-docx-row": "1", "data-docx-header": on("tblHeader") ? "1" : "0", "data-docx-cantsplit": on("cantSplit") ? "1" : "0", ...(exactHeight ? { "data-docx-exact": "1" } : {}) }, cells, { rowPropertiesXml: pkg.serialize(child(tr, "trPr")) });
    });
    const body = make("tableBody", "tbody", null, {}, rows);
    // Rows whose cells end on different grid lines (a 5-cell row above a 3-cell row with spans) cannot be laid out by the browser's
    // automatic column algorithm the way Word's tblGrid does: the columns are then fixed to the grid through a <colgroup>
    // (widths ride on data-col-width, the authored-width mechanism of tableSemantics.js) and `table-layout:fixed`.
    const edges = rows.map(row => new Set(row.children.flatMap(cell => [cell.properties.gridColumn, cell.properties.gridColumn + cell.properties.gridSpan])));
    const allEdges = new Set(edges.flatMap(set => [...set]));
    const irregular = widths.length > 1 && widths.every(w => w > 0) && edges.some(set => set.size !== allEdges.size);
    const colgroup = irregular ? [make("element", "colgroup", null, {}, widths.map(w => make("element", "col", null, { "data-col-width": String(+w.toFixed(3)) })))] : [];
    const rangeMarkers = elements(tbl).filter(n => isWord(n, "bookmarkStart") || isWord(n, "bookmarkEnd")).flatMap(n => inline(n, context));
    const markers = rangeMarkers.length ? [make("annotation", "caption", null, { hidden: "" }, rangeMarkers)] : [];
    return make("table", "table", tbl, widths.length && widths.every(w => w > 0) ? { "data-docx-grid": widths.map(w => +w.toFixed(3)).join(",") } : {}, [...markers, ...colgroup, body], { gridWidthsMm: widths, ...(irregular ? { gridIrregular: true } : {}), tablePropertiesXml: pkg.serialize(child(tbl, "tblPr")), styleId: val(child(tbl, "tblPr"), "tblStyle") });
  };
  const listCounters = new Map();
  function groupLists(nodes) {
    const result = []; let stack = [];
    for (const node of nodes) {
      const list = node.properties?.list;
      if (!list) { result.push(node); stack = []; continue; }
      const key = list.numId, depth = Math.min(8, list.level);
      if (!stack.length || stack[0].numId !== key) stack = [];
      // Word counts a level used without its parents as if each missing parent level had occurred once (first use = its start value); the next
      // parent item then continues from there ("5.1.1" without a "5.1" makes the following level-2 heading "5.2"). Counters are per numId.
      { const seen = listCounters.get(key) || {}; for (let l = 0; l < depth; l++) if (seen[l] === undefined) seen[l] = numberingLevel(numbering, key, l)?.start ?? 1; listCounters.set(key, seen); }
      while (stack.length && stack.at(-1).level > depth) stack.pop();
      if (!stack.length || stack.at(-1).level !== depth) {
        const counters = listCounters.get(key) || {};
        const start = counters[depth] === undefined ? list.start : counters[depth] + 1;
        const bullet = list.format === "bullet";
        const attrs = bullet ? {} : { start: String(start), ...(list.format === "lowerLetter" ? { type: "a" } : list.format === "upperLetter" ? { type: "A" } : list.format === "lowerRoman" ? { type: "i" } : list.format === "upperRoman" ? { type: "I" } : {}) };
        const container = make("list", bullet ? "ul" : "ol", null, attrs, [], { numId: key, level: depth, definition: list });
        if (stack.length) { const parent = stack.at(-1).node; parent.children.at(-1).children.push(container); }
        else result.push(container);
        stack.push({ numId: key, level: depth, node: container });
      }
      const counters = listCounters.get(key) || {};
      counters[depth] = counters[depth] === undefined ? list.start : counters[depth]+1;
      for (const d of Object.keys(counters)) if (Number(d) > depth) delete counters[d];
      listCounters.set(key, counters);
      stack.at(-1).node.children.push(make("listItem", "li", null, {}, [node], { numId: key, level: depth, ordinal: counters[depth] }));
    }
    return result;
  }
  function blocks(parent, context, grouped = true) {
    const result = elements(parent).flatMap(n => {
      if (isAlternative(n)) return [alternative(n, context, true)];
      if (isWord(n, "p")) return [paragraph(n, context)];
      if (isWord(n, "tbl")) return [table(n, context)];
      if (isWord(n) && ["bookmarkStart", "bookmarkEnd", "r", "t", "hyperlink", "proofErr", "permStart", "permEnd", "commentRangeStart", "commentRangeEnd"].includes(n.localName)) return inline(n, context);
      if (isWord(n) && ["tcPr", "trPr", "tblPr", "tblGrid", "sectPr", "sdtPr", "sdtEndPr"].includes(n.localName)) return [];
      if (isWord(n, "altChunk")) { const rel = resource(context.part, localAttr(n, "id"), n); report("alt-chunk", n, "Ek belge parçası çalıştırılmadı; kaynağı korundu"); return [make("unsupported", "p", n, { 'data-native-object': "altChunk" }, [], { resourceId: rel?.key })]; }
      if (isWord(n) && ["sdt", "sdtContent", "customXml"].includes(n.localName)) return [make("container", "div", n, {}, blocks(n, context))];
      report("unmapped-block", n, `Blok kaynak XML ile korundu: ${n.nodeName}`);
      return [make("container", "div", n, {}, blocks(n, context))];
    });
    return grouped ? groupLists(result) : result;
  }
  for (const kind of ["footnote", "endnote"]) {
    const part = related(kind+"s"); if (!part) continue;
    const root = pkg.xml(part)?.documentElement;
    for (const note of children(root, kind)) {
      const id = attr(note, "id"), type = attr(note, "type") || "normal";
      const nodes = blocks(note, { part }), text = descendants(note, n => isWord(n, "p")).map(p => descendants(p, n => isWord(n, "t")).map(n => n.textContent || "").join("")).join("\n");
      if (type === "normal") report("note-layout", note, "Not gövdesi ve biçimi saklandı; ayrıntılı yerleşim Görev 08 kapsamında");
      notes[kind+":"+id] = { kind, nativeId: id, type, nodes, text, ooxml: pkg.serialize(note), locator: pkg.location(note) };
    }
  }
  listCounters.clear();
  const main = pkg.xml(pkg.mainPart), body = child(main?.documentElement, "body");
  if (!body) throw new Error("Word gövdesi bulunamadı");
  for (const sect of descendants(body, n => isWord(n, "sectPr"))) {
    const parent = sect.parentNode;
    if (parent !== body && parent?.parentNode?.parentNode !== body && !(isWord(parent?.parentNode?.parentNode, "sdtContent") && parent.parentNode.parentNode.parentNode?.parentNode === body) && !pkg.location(sect).includes("PrChange")) report("nested-section", sect, "İç içe içerik denetimindeki bölüm ayarları saklandı; bölüm ayırımı doğrulanmadı");
  }
  const sections = [], sectionsNodes = []; let inheritedRefs = {};
  const finish = sect => {
    const props = readSectionProperties(pkg, sect, rels, inheritedRefs); inheritedRefs = props.headerFooterReferences;
    if (props.columns?.count > 1) report("multi-column-layout", sect, "Çok sütunlu bölüm saklandı; yerleşimi doğrulanmadı");
    if (["continuous"].includes(props.breakType)) report("section-break-layout", sect, "Bölüm geçiş türü saklandı; sayfa yerleşimi doğrulanmadı");
    const id = sections.length ? 'docx-section-'+(sections.length+1) : "main";
    const defaults = styles.run(styles.defaultParagraphId, "", {}), normal = styles.paragraph(styles.defaultParagraphId, {});
    const bodyRule = { ...normal, align: normal.align || "left", firstLineIndentMm: normal.firstLineIndentMm || 0, leftIndentMm: normal.leftIndentMm || 0, rightIndentMm: normal.rightIndentMm || 0, spaceBeforePt: normal.spaceBeforePt || 0, spaceAfterPt: normal.spaceAfterPt || 0, lineSpacing: { rule: "auto", value: 1, ...normal.lineSpacing, baseline: "word" } };
    if (["Arial", "Calibri", "Times New Roman"].includes(defaults.fontFamily)) bodyRule.fontFamily = defaults.fontFamily;
    else if (defaults.fontFamily) report("font-metrics", sect, `Kaynak fontu saklandı; metrikleri Görev 05 kapsamında: ${defaults.fontFamily}`);
    bodyRule.fontSizePt = defaults.fontSizePt || 10;
    bodyRule.fontWeight = defaults.bold ? 700 : 400;
    bodyRule.italic = Boolean(defaults.italic);
    sections.push({ id, type: sections.length ? "custom" : "mainContent", nodes: groupLists(sectionsNodes.splice(0)), properties: { ...props, rules: { page: structuredClone(props.page), body: bodyRule }, nativeSectionIndex: sections.length } });
  };
  // A content control (the table-of-contents gallery wraps each list page in one) may hold paragraphs that carry the section
  // properties. Word ends the section there even though the paragraph is not a direct child of the body: the control is split
  // at each such paragraph, every piece keeps the control's wrapper, and the section breaks stay in order.
  const sdtSplitsSections = n => isWord(n, "sdt") && elements(child(n, "sdtContent")).some(m => isWord(m, "p") && child(child(m, "pPr"), "sectPr"));
  for (const n of elements(body)) {
    if (isWord(n, "sectPr")) { finish(n); continue; }
    if (sdtSplitsSections(n)) {
      let piece = [];
      const flush = () => { if (piece.length) sectionsNodes.push(make("container", "div", n, {}, piece)); piece = []; };
      for (const m of elements(child(n, "sdtContent"))) {
        piece.push(...blocks({ childNodes: [m] }, { part: pkg.mainPart }, false));
        const inner = isWord(m, "p") && child(child(m, "pPr"), "sectPr");
        if (inner) { flush(); finish(inner); }
      }
      flush();
      continue;
    }
    sectionsNodes.push(...blocks({ childNodes: [n] }, { part: pkg.mainPart }, false));
    const sect = isWord(n, "p") && child(child(n, "pPr"), "sectPr");
    if (sect) finish(sect);
  }
  if (sectionsNodes.length || !sections.length) finish(null);
  // Relationship inventories include images, fields, headers/footers, notes and
  // embedded payloads even when their visual interpretation is deferred.
  for (const part of Object.keys(pkg.files).filter(p => /\.xml$/i.test(p) && !p.endsWith(".rels"))) {
    const root = pkg.xml(part)?.documentElement; if (!root) continue;
    sourceCounts[part] = census(root);
    for (const r of Object.values(relationships(part))) resource(part, r.id, root);
  }
  for (const section of sections) for (const kind of ["header", "footer"]) for (const ref of Object.values(section.properties.headerFooterReferences[kind])) {
    if (ref.part && pkg.files[ref.part]) {
      const root = pkg.xml(ref.part)?.documentElement;
      ref.nodes = blocks(root, { part: ref.part });
      ref.text = descendants(root, n => isWord(n, "t")).map(n => n.textContent || "").join("");
      const positioned = readPositionedPage(root, section.properties.page, styles, report);
      ref.displayText = positioned?.text ?? readChromeText(root, report);
      const p = descendants(root, n => isWord(n, "p"))[0], pr = child(p, "pPr"), pid = val(pr, "pStyle") || styles.defaultParagraphId;
      const para = styles.paragraph(pid, readParagraphProperties(pr));
      const run = styles.run(pid, "", readRunProperties(child(descendants(p, n => isWord(n, "r"))[0], "rPr"), styles.theme));
      ref.displayParagraphs = positioned ? [{ text: positioned.text, style: { ...positioned.style, lineSpacing: { rule: "auto", value: 1 } } }] : descendants(root, n => isWord(n, "p")).map(p => {
        const pr = child(p, "pPr"), pid = val(pr, "pStyle") || styles.defaultParagraphId;
        const para = styles.paragraph(pid, readParagraphProperties(pr));
        const run = styles.run(pid, "", readRunProperties(child(descendants(p, n => isWord(n, "r"))[0], "rPr"), styles.theme));
        return { text: readChromeText(p, report), style: { ...para, fontFamily: run.fontFamily || "Times New Roman", fontSizePt: run.fontSizePt || 10, fontWeight: run.bold ? 700 : 400, italic: Boolean(run.italic), lineSpacing: para.lineSpacing || { rule: "auto", value: 1 } } };
      });
      if (positioned) ref.displayPosition = positioned.position;
      ref.displayStyle = positioned?.style || { align: para.align || "left", fontFamily: run.fontFamily || "Times New Roman", fontSizePt: run.fontSizePt || 10, fontWeight: run.bold ? 700 : 400, italic: Boolean(run.italic) };
    }
  }
  const switchedOn = name => Boolean(child(settings, name) && !["0", "false", "off"].includes(val(settings, name)));
  // Mirrored margins make the sheet side (odd = right-hand) meaningful, so Word then aligns odd/even section starts to the
  // physical sheet like it does with separate even headers (measured: u3 vs u3 + w:mirrorMargins; SRC09/SRC10 carry both).
  projectSourceChrome(sections, switchedOn("evenAndOddHeaders"), switchedOn("mirrorMargins"));
  // Retain the original compressed package once. Repeating full ancestor XML at
  // every paragraph/run magnifies a long thesis and exhausts storage unnecessarily.
  const parts = Object.fromEntries(Object.entries(pkg.files).map(([name, bytes]) => [name, { contentType: pkg.type(name), size: bytes.length }]));
  const original = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const digest = await crypto.subtle.digest("SHA-256", original);
  const sha256 = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, "0")).join("");
  const document = createContentDocument({ nextId, formatMode, mainSectionId: "main", sectionKeys: Object.fromEntries(sections.slice(1).map(s => [s.id, s.id])),
    sections, styles: styles.styles, numbering, notes, resources, references,
    source: { format: "docx", fileName, sha256, mainPart: pkg.mainPart, ...(Number.isFinite(defaultTabTwips) && defaultTabTwips > 0 ? { defaultTabStopMm: mm(defaultTabTwips) } : {}), packageBase64: base64(original), parts, unsupported: issues, nativeCounts: sourceCounts, mappedCounts,
      importReport: { version: 1, status: issues.length ? "IMPORTED_WITH_NOTICES" : "IMPORTED", sections: sections.length, issues: issues.length, elapsedMs: Math.round(performance.now()-started) } } });
  return document;
}

export async function importThesisWordFile(file, note, options) {
  if (!file) throw new Error("Dosya seçilmedi");
  const name = String(file.name || "");
  if (/\.doc$/i.test(name)) { const error = new Error("Eski .doc biçimi doğrudan açılamıyor. Word veya LibreOffice'te Farklı Kaydet → Word Belgesi (.docx) seçin, ardından .docx dosyasını içe aktarın. Kaynak dosya değiştirilmez."); error.code = "LEGACY_DOC_CONVERSION_REQUIRED"; throw error; }
  if (!/\.docx$/i.test(name)) throw new Error("Word belgesi (.docx) seçin");
  const buffer = await file.arrayBuffer();
  const importOptions = { formatMode: options?.formatMode || "source", fileName: name };
  let document;
  if (options?.useWorker && typeof Worker !== "undefined") {
    document = await new Promise((resolve, reject) => {
      const worker = new Worker(new URL("./docx/import.worker.js", import.meta.url), { type: "module" });
      const signal = options.signal;
      const finish = (error, value) => { signal?.removeEventListener("abort", abort); worker.terminate(); error ? reject(error) : resolve(value); };
      const abort = () => finish(new DOMException("İçe aktarma iptal edildi", "AbortError"));
      if (signal?.aborted) { abort(); return; }
      signal?.addEventListener("abort", abort, { once: true });
      worker.onmessage = ({ data }) => data.error ? finish(Object.assign(new Error(data.error), { code: data.code })) : finish(null, data.document);
      worker.onerror = () => finish(new Error("Word içe aktarma işlemi başlatılamadı"));
      worker.postMessage({ buffer, options: importOptions }, [buffer]);
    });
  } else document = await importThesisDocx(buffer, importOptions);
  return installContentDocument({ ...note, title: note?.title || name.replace(/\.docx$/i, "") }, document);
}
