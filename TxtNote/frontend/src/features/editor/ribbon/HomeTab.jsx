import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Eraser,
  IndentDecrease,
  IndentIncrease,
  List,
  ListOrdered,
  ListTree,
  Lock,
  Printer,
  Redo2,
  Undo2,
} from "lucide-react";
import FontSizeBox, { stepFontSize } from "./FontSizeBox.jsx";
import ColorSplitButton from "./ColorSplitButton.jsx";
import Tool from "./Tool.jsx";
import Group from "./Group.jsx";
import { control } from "./shared.js";
import "./home.css";

const aligns = [
  ["left", "Sola hizala", AlignLeft],
  ["center", "Ortala", AlignCenter],
  ["right", "Sağa hizala", AlignRight],
  ["justify", "İki yana yasla", AlignJustify],
];

export default function HomeTab({
  activeSection,
  actions,
  exporting,
  paginationReady,
  onPrint,
  navigationOpen,
  setNavigationOpen,
  fontFamily,
  remember,
  keep,
  invoke,
  headingOptions,
  paragraphOptions,
  alignmentScope,
  setAlignmentScope,
}) {
  const off = !activeSection || actions.canFormatText === false;
  const blockOff = off || (actions.isStaticTarget && !actions.isLayoutTextTarget);
  const format = actions.activeFormat;
  const currentSize = format?.sizePt ?? format?.sizeComputedPt;
  const styles = [
    { id: "normal", label: "Normal", level: 0, sample: "Gövde metni" },
    ...headingOptions.map((level) => ({ id: `heading-${level}`, label: `Başlık ${level}`, level: Number(level), sample: `Bölüm ${level}` })),
    ...paragraphOptions.map((id) => ({ id: `style-${id}`, label: id, style: id, sample: "Şablon stili" })),
  ];
  const setStyle = (style) =>
    style.style ? actions.runSaved((body) => body?.setBlockType?.(0, style.style)) : invoke("setBlockType", style.level);
  const toggle = (key, label, title, glyph) => (
    <Tool label={label} title={title} disabled={off} pressed={!!format?.[key]} onMouseDown={keep} onClick={() => invoke("toggleStyle", key)}>
      {glyph}
    </Tool>
  );

  return (
    <>
      <Group label="Geri al" className="thesis-home-group">
        <div className="thesis-home-rows is-compact">
          <Tool label="Geri al (Ctrl+Z)" disabled={blockOff || !actions.canTextUndo} onMouseDown={keep} onClick={() => invoke("undo")}>
            <Undo2 size={16} aria-hidden="true" />
          </Tool>
          <Tool label="Yinele (Ctrl+Y)" disabled={blockOff || !actions.canTextRedo} onMouseDown={keep} onClick={() => invoke("redo")}>
            <Redo2 size={16} aria-hidden="true" />
          </Tool>
        </div>
      </Group>
      <Group label="Yazı tipi" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-home-row">
            <span className="thesis-font-lock" title="Yazı tipi şablon tarafından belirlenir ve değiştirilemez">
              <span>{fontFamily || "Şablon yazı tipi"}</span>
              <Lock size={11} aria-hidden="true" />
            </span>
            <FontSizeBox activeFormat={format} remember={remember} keep={keep} invoke={invoke} disabled={off} />
            <Tool label="Yazı boyutunu büyüt" disabled={off} onMouseDown={keep} onClick={() => invoke("applySize", stepFontSize(currentSize, 1))}>
              <span className="thesis-grow">A<sup>▲</sup></span>
            </Tool>
            <Tool label="Yazı boyutunu küçült" disabled={off} onMouseDown={keep} onClick={() => invoke("applySize", stepFontSize(currentSize, -1))}>
              <span className="thesis-grow is-small">A<sup>▼</sup></span>
            </Tool>
          </div>
          <div className="thesis-home-row">
            {toggle("bold", "Kalın", "Kalın (Ctrl+B)", <b>K</b>)}
            {toggle("italic", "İtalik", "İtalik (Ctrl+I)", <i>İ</i>)}
            {toggle("underline", "Altı çizili", "Altı çizili (Ctrl+U)", <u>A</u>)}
            {toggle("strike", "Üstü çizili", "Üstü çizili (Ctrl+Shift+X)", <s>ab</s>)}
            <span className="thesis-home-sep" aria-hidden="true" />
            <ColorSplitButton mode="color" activeFormat={format} remember={remember} keep={keep} invoke={invoke} disabled={off} />
            <ColorSplitButton mode="highlight" activeFormat={format} remember={remember} keep={keep} invoke={invoke} disabled={off} />
            <span className="thesis-home-sep" aria-hidden="true" />
            <Tool label="Biçimi temizle" title="Tüm biçimlendirmeyi temizle" disabled={off} onMouseDown={keep} onClick={() => invoke("clearFormatting")}>
              <Eraser size={15} aria-hidden="true" />
            </Tool>
          </div>
        </div>
      </Group>
      <Group label="Paragraf" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-home-row">
            <Tool label="Madde işaretli liste" disabled={blockOff || actions.isLayoutTextTarget} onMouseDown={keep} onClick={() => invoke("toggleList", false)}>
              <List size={16} aria-hidden="true" />
            </Tool>
            <Tool label="Numaralı liste" disabled={blockOff || actions.isLayoutTextTarget} onMouseDown={keep} onClick={() => invoke("toggleList", true)}>
              <ListOrdered size={16} aria-hidden="true" />
            </Tool>
            <span className="thesis-home-sep" aria-hidden="true" />
            <Tool label="Girintiyi azalt" disabled={blockOff || actions.isLayoutTextTarget} onMouseDown={keep} onClick={() => invoke("changeIndent", "decrease")}>
              <IndentDecrease size={16} aria-hidden="true" />
            </Tool>
            <Tool label="Girintiyi artır" disabled={blockOff || actions.isLayoutTextTarget} onMouseDown={keep} onClick={() => invoke("changeIndent", "increase")}>
              <IndentIncrease size={16} aria-hidden="true" />
            </Tool>
          </div>
          <div className="thesis-home-row">
            {aligns.map(([value, label, Icon]) => (
              <Tool key={value} label={label} title={actions.isLayoutTextTarget ? `${label} · ${alignmentScope === "page" ? "sayfanın yazı alanı" : "metin kutusu"}` : label} disabled={blockOff} pressed={format?.align === value} onMouseDown={keep} onClick={() => invoke("applyAlign", value, alignmentScope)}>
                <Icon size={16} aria-hidden="true" />
              </Tool>
            ))}
            <span className="thesis-home-sep" aria-hidden="true" />
            {actions.isLayoutTextTarget ? <select className={`${control} thesis-block-select`} aria-label="Hizalama alanı"
              disabled={off} value={alignmentScope} onMouseDown={remember} onChange={(event) => setAlignmentScope(event.target.value)}>
              <option value="page">Sayfa yazı alanı</option>
              <option value="box">Metin kutusu</option>
            </select> : <select
              className={`${control} thesis-block-select`}
              aria-label="Paragraf biçimi"
              disabled={blockOff || actions.isLayoutTextTarget}
              value={format?.block ?? ""}
              onMouseDown={remember}
              onChange={(event) => {
                const value = event.target.value;
                if (value.startsWith("style:")) actions.runSaved((body) => body?.setBlockType?.(0, value.slice(6)));
                else if (value !== "") invoke("setBlockType", Number(value));
              }}
            >
              <option value="">Paragraf biçimi</option>
              <option value="0">Normal</option>
              {headingOptions.map((level) => (
                <option key={level} value={level}>
                  Başlık {level}
                </option>
              ))}
              {paragraphOptions.map((id) => (
                <option key={id} value={`style:${id}`}>
                  {id}
                </option>
              ))}
            </select>}
          </div>
        </div>
      </Group>
      <Group label="Stiller" className="thesis-home-group thesis-home-styles">
        <div className="thesis-style-gallery" role="listbox" aria-label="Stil galerisi">
          {styles.map((style) => {
            const isActive = style.style ? format?.block === `style:${style.style}` : format?.block === String(style.level);
            return (
              <button
                key={style.id}
                type="button"
                role="option"
                aria-selected={isActive}
                title={actions.isLayoutTextTarget ? "Paragraf stilleri gövde metninde kullanılabilir" : `${style.label} stilini uygula`}
                className={`thesis-style-card ${style.level ? `is-heading-${style.level}` : ""} ${isActive ? "is-active" : ""}`}
                disabled={blockOff || actions.isLayoutTextTarget}
                onMouseDown={keep}
                onClick={() => setStyle(style)}
              >
                <span>{style.sample}</span>
                <small>{style.label}</small>
              </button>
            );
          })}
        </div>
      </Group>
      <Group label="Düzenleme" className="thesis-home-group">
        <div className="thesis-home-rows">
          <Tool label="Bölüm gezintisini aç/kapat" pressed={navigationOpen} onClick={() => setNavigationOpen(!navigationOpen)}>
            <ListTree size={15} aria-hidden="true" /> Gezinti
          </Tool>
          <Tool label="Yazdır" disabled={!paginationReady || Boolean(exporting)} title={!paginationReady ? "Sayfalar hazırlanırken yazdırma kullanılamaz" : exporting ? "Dışa aktarma sürerken yazdırma kullanılamaz" : "Belgeyi yazdır"} onMouseDown={keep} onClick={onPrint}>
            <Printer size={15} aria-hidden="true" /> Yazdır
          </Tool>
        </div>
      </Group>
    </>
  );
}
