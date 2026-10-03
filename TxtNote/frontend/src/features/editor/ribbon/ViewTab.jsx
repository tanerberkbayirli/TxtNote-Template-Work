import { ScanEye, Search, ZoomIn, ZoomOut } from "lucide-react";
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
  keep,
}) {
  return (
    <>
      <Group label="Gezinti">
        <div className="thesis-view-action-row">
          <Tool
            label="Gezinti bölmesini aç veya kapat"
            pressed={navigationOpen}
            disabled={!canNavigate}
            onClick={() => setNavigationOpen(!navigationOpen)}
          >
            <Search size={15} /> Gezinti
          </Tool>
          <Tool
            label="Cetvelleri göster veya gizle"
            pressed={rulersVisible}
            onClick={() => setRulersVisible(!rulersVisible)}
          >
            Cetveller
          </Tool>
        </div>
        <span className="thesis-ribbon-hint">
          {activeSection?.title || "Belge genel görünümü"} · cetvel {rulersVisible ? "açık" : "kapalı"}
        </span>
      </Group>
      <Group label="Yakınlaştır" className="thesis-ribbon-zoom-group">
        <div className="thesis-zoom-feature">
          <ScanEye size={22} />
          <div>
            <strong>Sayfa görünümü</strong>
            <small>{totalPages} sayfalı belge</small>
          </div>
          <div className="thesis-ribbon-button-row">
            <Tool label="Uzaklaştır" disabled={!canStepZoom(-1)} onMouseDown={keep} onClick={() => stepZoom(-1)}>
              <ZoomOut size={16} />
            </Tool>
            <select
              aria-label="Yakınlaştırma düzeyi"
              className={control}
              value={zoomChoice}
              onChange={(event) => setZoomChoice(event.target.value)}
            >
              <option value="fit">Genişliğe sığdır ({Math.round(zoom * 100)}%)</option>
              {zoomLevels?.map((level) => (
                <option key={level} value={String(level)}>
                  %{level}
                </option>
              ))}
            </select>
            <Tool label="Yakınlaştır" disabled={!canStepZoom(1)} onMouseDown={keep} onClick={() => stepZoom(1)}>
              <ZoomIn size={16} />
            </Tool>
          </div>
        </div>
      </Group>
      <Group label="Belge durumu" className="thesis-ribbon-view-info">
        <div className="thesis-view-stat">
          <strong>{activeSection?.title || "Belge"}</strong>
          <span>Etkin metin bölümü</span>
        </div>
        <div className="thesis-view-stat">
          <strong>{totalPages}</strong>
          <span>Sayfa</span>
        </div>
        <Tool label="Sayfa düzeni denetçisini aç" onClick={() => setPageSettingsOpen(!pageSettingsOpen)}>
          Sayfa ayarları
        </Tool>
      </Group>
    </>
  );
}
