import { ImportedXmlComponent } from './runtime.js';
import { fieldXmlText } from './xml.js';
/** Conditional PAGE fields keep a per-sheet override from repeating on every
 * sheet sharing a footer. Values remain live fields, never literal numbers. */
export function conditionalPageNumberRuns(style, onlyLabel, excludeLabels = []) {
  const font = fieldXmlText(style.fontFamily || 'Times New Roman');
  const size = Math.round((style.fontSizePt || 12) * 2);
  const pr = `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:sz w:val="${size}"/>${style.fontWeight >= 600 ? '<w:b/>' : ''}${style.italic ? '<w:i/>' : ''}${/^#[\da-f]{6}$/i.test(style.color || '') ? `<w:color w:val="${style.color.slice(1)}"/>` : ''}</w:rPr>`;
  const instruction = text => `<w:r>${pr}<w:instrText xml:space="preserve">${fieldXmlText(text)}</w:instrText></w:r>`;
  const field = (code, cache = '') => `<w:r>${pr}<w:fldChar w:fldCharType="begin"/></w:r>${code}<w:r>${pr}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${pr}<w:t>${fieldXmlText(cache)}</w:t></w:r><w:r>${pr}<w:fldChar w:fldCharType="end"/></w:r>`;
  const page = () => field(instruction(' PAGE '));
  const label = value => {
    if (!/^[\p{L}\d]+$/u.test(String(value))) throw new Error('Koşullu sayfa numarası için geçerli sayfa etiketi gerekli.');
    return String(value);
  };
  let content = page();
  if (onlyLabel !== undefined) {
    const target = label(onlyLabel);
    content = field(instruction(' IF "') + page() + instruction(`" = "${target}" "`) + page() + instruction('" "" '), target);
  } else for (const target of [...new Set(excludeLabels)].reverse()) {
    content = field(instruction(' IF "') + page() + instruction(`" = "${label(target)}" "" "`) + content + instruction('" '));
  }
  const wrapper = ImportedXmlComponent.fromXmlString(`<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${content}</w:p>`);
  const holder = wrapper.root.find(child => child instanceof ImportedXmlComponent) || wrapper;
  return holder.root.filter(child => child instanceof ImportedXmlComponent);
}
