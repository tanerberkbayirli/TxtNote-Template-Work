import Tool from "./Tool.jsx";
import Group from "./Group.jsx";

export default function LayoutTab({
  actions,
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
}) {
  return (
    <>
      <Group label="Sayfa düzeni">
        <div className="thesis-layout-actions">
          <Tool
            label="Sayfa düzeni denetçisini aç"
            pressed={pageSettingsOpen}
            onClick={() => setPageSettingsOpen(!pageSettingsOpen)}
          >
            Kenar boşlukları
          </Tool>
          <Tool
            label="Cetvelleri göster veya gizle"
            pressed={rulersVisible}
            onClick={() => setRulersVisible(!rulersVisible)}
          >
            Cetveller {rulersVisible ? "Açık" : "Kapalı"}
          </Tool>
        </div>
        <div className="thesis-layout-margins">
          {[
            ["Sol", page?.margins?.leftMm],
            ["Sağ", page?.margins?.rightMm],
            ["Üst", page?.margins?.topMm],
            ["Alt", page?.margins?.bottomMm],
          ]
            .filter(([, value]) => value !== undefined)
            .map(([label, value]) => (
              <span key={label}>
                {label}
                <strong>{value} mm</strong>
              </span>
            ))}
        </div>
        <label className="thesis-ribbon-field">
          Cetvel birimi{" "}
          <select aria-label="Cetvel birimi" value={rulerUnit} onChange={(event) => setRulerUnit(event.target.value)}>
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="pt">pt</option>
          </select>
        </label>
      </Group>
      <Group label="Sayfa ölçüleri" className="thesis-ribbon-page-group">
        <div className="thesis-page-measure">
          <span className="thesis-page-mini" aria-hidden="true" />
          <div>
            <strong>
              {page?.widthMm && page?.heightMm ? `${page.widthMm} × ${page.heightMm} mm` : "Şablon ölçüleri"}
            </strong>
            <small>{totalPages} sayfa · etkin bölüm</small>
          </div>
        </div>
        <Tool label="Sayfa düzeni denetçisini aç" onClick={() => setPageSettingsOpen(!pageSettingsOpen)}>
          Sayfa ayarlarını aç
        </Tool>
      </Group>
      <Group label="Yerleşim geçmişi">
        <Tool label="Düzen değişikliğini geri al" disabled={!canUndo} onClick={onUndo}>
          Yerleşimi geri al
        </Tool>
        <Tool label="Düzen değişikliğini yinele" disabled={!canRedo} onClick={onRedo}>
          Yerleşimi yinele
        </Tool>
        <span className="thesis-ribbon-hint">Sayfa ve çerçeve yerleşimi</span>
      </Group>
    </>
  );
}
