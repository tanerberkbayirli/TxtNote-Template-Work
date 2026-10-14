import { ListTree, ZoomIn, ZoomOut } from "lucide-react";
import Tool from "./Tool.jsx";
import Group from "./Group.jsx";
import { control } from "./shared.js";

export default function ViewTab({
  activeSection,
  pageSettingsOpen,
  setPageSettingsOpen,
  zoomChoice,
  setZoomChoice,
  zoom,
  stepZoom,
  canStepZoom,
  zoomLevels,
  totalPages,
  rulersVisible,
  setRulersVisible,
  navigationOpen,
  setNavigationOpen,
  canNavigate,
  remember,
  keep,
}) {
  return (
    <>
      <Group label="Göster" className="thesis-home-group">
        <div className="thesis-home-rows">
          <Tool label="Gezinti bölmesini aç veya kapat" pressed={navigationOpen} disabled={!canNavigate} onMouseDown={keep} onClick={() => setNavigationOpen(!navigationOpen)}>
            <ListTree size={15} aria-hidden="true" /> Gezinti
          </Tool>
          <Tool label="Cetvelleri göster veya gizle" pressed={rulersVisible} onMouseDown={keep} onClick={() => setRulersVisible(!rulersVisible)}>
            Cetveller
          </Tool>
        </div>
      </Group>
      <Group label="Yakınlaştır" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-home-row is-boxed">
            <Tool label="Uzaklaştır" disabled={!canStepZoom(-1)} onMouseDown={keep} onClick={() => stepZoom(-1)}>
              <ZoomOut size={16} aria-hidden="true" />
            </Tool>
            <select aria-label="Yakınlaştırma düzeyi" className={`${control} thesis-zoom-select`} value={zoomChoice} onMouseDown={remember} onChange={(event) => setZoomChoice(event.target.value)}>
              <option value="fit">Genişliğe sığdır ({Math.round(zoom * 100)}%)</option>
              {zoomLevels?.map((level) => (
                <option key={level} value={String(level)}>
                  %{level}
                </option>
              ))}
            </select>
            <Tool label="Yakınlaştır" disabled={!canStepZoom(1)} onMouseDown={keep} onClick={() => stepZoom(1)}>
              <ZoomIn size={16} aria-hidden="true" />
            </Tool>
          </div>
          <span className="thesis-ribbon-hint">{totalPages} sayfalık belge</span>
        </div>
      </Group>
      <Group label="Belge durumu" className="thesis-home-group">
        <div className="thesis-home-rows">
          <div className="thesis-view-stat">
            <strong>{activeSection?.title || "Belge"}</strong>
            <span>Etkin bölüm · {totalPages} sayfa</span>
          </div>
          <Tool label="Sayfa düzeni denetçisini aç" pressed={pageSettingsOpen} onMouseDown={keep} onClick={() => setPageSettingsOpen(!pageSettingsOpen)}>
            Sayfa ayarları
          </Tool>
        </div>
      </Group>
    </>
  );
}
