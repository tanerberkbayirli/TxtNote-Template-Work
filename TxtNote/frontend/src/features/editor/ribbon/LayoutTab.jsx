import Tool from "./Tool.jsx";
import Group from "./Group.jsx";
import { control } from "./shared.js";

export default function LayoutTab({
  pageSettingsOpen,
  setPageSettingsOpen,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  totalPages,
  rulersVisible,
  setRulersVisible,
  rulerUnit,
  setRulerUnit,
  page,
  remember,
  keep,
}) {
  const margins = [
    ["Sol", page?.margins?.leftMm],
    ["Sağ", page?.margins?.rightMm],
    ["Üst", page?.margins?.topMm],
    ["Alt", page?.margins?.bottomMm],
  ].filter(([, value]) => value !== undefined);
  return (
    <>
      <Group label="Sayfa ayarları" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-home-row is-boxed">
            <Tool label="Sayfa düzeni denetçisini aç" pressed={pageSettingsOpen} onMouseDown={keep} onClick={() => setPageSettingsOpen(!pageSettingsOpen)}>
              Kenar boşlukları
            </Tool>
            <Tool label="Cetvelleri göster veya gizle" pressed={rulersVisible} onMouseDown={keep} onClick={() => setRulersVisible(!rulersVisible)}>
              Cetveller
            </Tool>
          </div>
          <label className="thesis-ribbon-field">
            Cetvel birimi
            <select className={control} aria-label="Cetvel birimi" value={rulerUnit} onMouseDown={remember} onChange={(event) => setRulerUnit(event.target.value)}>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="pt">pt</option>
            </select>
          </label>
        </div>
      </Group>
      <Group label="Sayfa ölçüleri" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-page-measure">
            <span className="thesis-page-mini" aria-hidden="true" />
            <div>
              <strong>{page?.widthMm && page?.heightMm ? `${page.widthMm} × ${page.heightMm} mm` : "Şablon ölçüleri"}</strong>
              <small>{totalPages} sayfa</small>
            </div>
          </div>
          {margins.length ? (
            <div className="thesis-layout-margins">
              {margins.map(([label, value]) => (
                <span key={label}>
                  {label} <strong>{value} mm</strong>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Group>
      <Group label="Yerleşim geçmişi" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-home-row is-boxed">
            <Tool label="Düzen değişikliğini geri al" disabled={!canUndo} onMouseDown={keep} onClick={onUndo}>
              Geri al
            </Tool>
            <Tool label="Düzen değişikliğini yinele" disabled={!canRedo} onMouseDown={keep} onClick={onRedo}>
              Yinele
            </Tool>
          </div>
          <span className="thesis-ribbon-hint">Yalnızca sayfa ve çerçeve yerleşimi</span>
        </div>
      </Group>
    </>
  );
}
