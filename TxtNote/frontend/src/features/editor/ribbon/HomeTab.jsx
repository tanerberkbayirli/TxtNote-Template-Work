import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  IndentDecrease,
  IndentIncrease,
  List,
  ListOrdered,
  Printer,
  Redo2,
  Search,
  Undo2,
  TextCursorInput,
} from "lucide-react";
import FontSizeBox from "./FontSizeBox.jsx";
import ColorSplitButton from "./ColorSplitButton.jsx";
import Tool from "./Tool.jsx";
import Group from "./Group.jsx";
import { control } from "./shared.js";

export default function HomeTab({
  title,
  activeSection,
  actions,
  onPrint,
  navigationOpen,
  setNavigationOpen,
  fontFamily,
  remember,
  keep,
  invoke,
  headingOptions,
  paragraphOptions,
}) {
  return (
    <>
      <Group label="Geçmiş" className="thesis-ribbon-history-group">
        <div className="thesis-ribbon-button-row">
          <Tool label="Geri al (Ctrl+Z)" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("undo")}>
            <Undo2 size={15} aria-hidden="true" />
          </Tool>
          <Tool label="Yinele (Ctrl+Y)" disabled={!activeSection} onMouseDown={keep} onClick={() => invoke("redo")}>
            <Redo2 size={15} aria-hidden="true" />
          </Tool>
        </div>
      </Group>
      <Group label="Yazı tipi" className="thesis-ribbon-font-group">
        <span className="thesis-ribbon-font-name" title="Yazı tipi şablon tarafından belirlenir">
          {fontFamily || "Şablon yazı tipi"}
        </span>
        <FontSizeBox
          activeFormat={actions.activeFormat}
          remember={remember}
          keep={keep}
          invoke={invoke}
          disabled={!activeSection}
        />
        <div className="thesis-ribbon-button-row">
          <Tool
            label="Kalın"
            disabled={!activeSection}
            pressed={actions.activeFormat?.bold}
            onMouseDown={keep}
            onClick={() => invoke("toggleStyle", "bold")}
          >
            <b>B</b>
          </Tool>
          <Tool
            label="İtalik"
            disabled={!activeSection}
            pressed={actions.activeFormat?.italic}
            onMouseDown={keep}
            onClick={() => invoke("toggleStyle", "italic")}
          >
            <i>I</i>
          </Tool>
          <Tool
            label="Altı çizili"
            disabled={!activeSection}
            pressed={actions.activeFormat?.underline}
            onMouseDown={keep}
            onClick={() => invoke("toggleStyle", "underline")}
          >
            <u>U</u>
          </Tool>
          <Tool
            label="Üstü çizili"
            disabled={!activeSection}
            pressed={actions.activeFormat?.strike}
            onMouseDown={keep}
            onClick={() => invoke("toggleStyle", "strike")}
          >
            <s>S</s>
          </Tool>
        </div>
        <div className="thesis-ribbon-button-row">
          <ColorSplitButton
            mode="color"
            activeFormat={actions.activeFormat}
            remember={remember}
            keep={keep}
            invoke={invoke}
            disabled={!activeSection}
          />
          <ColorSplitButton
            mode="highlight"
            activeFormat={actions.activeFormat}
            remember={remember}
            keep={keep}
            invoke={invoke}
            disabled={!activeSection}
          />
        </div>
      </Group>
      <Group label="Paragraf" className="thesis-ribbon-paragraph-group">
        <select
          className={control}
          aria-label="Paragraf biçimi"
          disabled={!activeSection}
          value={actions.activeFormat?.block ?? ""}
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
        </select>
        <div className="thesis-ribbon-button-row">
          <Tool
            label="Sola hizala"
            disabled={!activeSection}
            pressed={actions.activeFormat?.align === "left"}
            onMouseDown={keep}
            onClick={() => invoke("applyAlign", "left")}
          >
            <AlignLeft size={15} />
          </Tool>
          <Tool
            label="Ortala"
            disabled={!activeSection}
            pressed={actions.activeFormat?.align === "center"}
            onMouseDown={keep}
            onClick={() => invoke("applyAlign", "center")}
          >
            <AlignCenter size={15} />
          </Tool>
          <Tool
            label="Sağa hizala"
            disabled={!activeSection}
            pressed={actions.activeFormat?.align === "right"}
            onMouseDown={keep}
            onClick={() => invoke("applyAlign", "right")}
          >
            <AlignRight size={15} />
          </Tool>
          <Tool
            label="İki yana yasla"
            disabled={!activeSection}
            pressed={actions.activeFormat?.align === "justify"}
            onMouseDown={keep}
            onClick={() => invoke("applyAlign", "justify")}
          >
            <AlignJustify size={15} />
          </Tool>
          <Tool
            label="Madde işaretli liste"
            disabled={!activeSection}
            onMouseDown={keep}
            onClick={() => invoke("toggleList", false)}
          >
            <List size={15} />
          </Tool>
          <Tool
            label="Numaralı liste"
            disabled={!activeSection}
            onMouseDown={keep}
            onClick={() => invoke("toggleList", true)}
          >
            <ListOrdered size={15} />
          </Tool>
        </div>
        <div className="thesis-ribbon-button-row">
          <Tool
            label="Girintiyi azalt"
            disabled={!activeSection}
            onMouseDown={keep}
            onClick={() => invoke("changeIndent", "decrease")}
          >
            <IndentDecrease size={15} />
          </Tool>
          <Tool
            label="Girintiyi artır"
            disabled={!activeSection}
            onMouseDown={keep}
            onClick={() => invoke("changeIndent", "increase")}
          >
            <IndentIncrease size={15} />
          </Tool>
        </div>
      </Group>
      <Group label="Stiller" className="thesis-ribbon-style-group">
        <div className="thesis-style-gallery">
          {[
            { id: "normal", label: "Normal", level: 0, sample: "Gövde metni" },
            ...headingOptions.map((level) => ({
              id: `heading-${level}`,
              label: `Başlık ${level}`,
              level: Number(level),
              sample: `Bölüm ${level}`,
            })),
            ...paragraphOptions.map((id) => ({ id: `style-${id}`, label: id, style: id, sample: "Şablon stili" })),
          ].map((style) => {
            const isActive = style.style
              ? actions.activeFormat?.block === `style:${style.style}`
              : actions.activeFormat?.block === String(style.level);
            return (
              <button
                key={style.id}
                type="button"
                className={`thesis-style-card ${style.level ? `is-heading-${style.level}` : ""} ${isActive ? "is-active" : ""}`}
                aria-pressed={isActive}
                disabled={!activeSection}
                onMouseDown={keep}
                onClick={() =>
                  style.style
                    ? actions.runSaved((body) => body?.setBlockType?.(0, style.style))
                    : invoke("setBlockType", style.level)
                }
              >
                <span>{style.sample}</span>
                <small>{style.label}</small>
              </button>
            );
          })}
        </div>
      </Group>
      <Group label="Düzenleme" className="thesis-ribbon-edit-group">
        <div className="thesis-ribbon-feature-tile">
          <Search size={19} />
          <div>
            <strong>Bölüm gezintisi</strong>
            <small>Başlıklar ve metin bölümleri</small>
          </div>
          <Tool
            label="Araçlarda bölüm gezintisi"
            onClick={() => setNavigationOpen(!navigationOpen)}
            pressed={navigationOpen}
          >
            Gezintiyi {navigationOpen ? "kapat" : "aç"}
          </Tool>
        </div>
        <div className="thesis-ribbon-feature-tile">
          <TextCursorInput size={19} />
          <div>
            <strong>Biçim temizle</strong>
            <small>Seçimdeki doğrudan biçim</small>
          </div>
          <Tool
            label="Biçimi temizle"
            disabled={!activeSection}
            onMouseDown={keep}
            onClick={() => invoke("clearFormatting")}
          >
            Temizle
          </Tool>
        </div>
        <Tool label="Yazdır" onClick={onPrint}>
          <Printer size={16} /> Yazdır
        </Tool>
      </Group>
    </>
  );
}
