import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_TEXT_ALIGNMENT_SCOPE } from "../../../../../engine/src/layoutInteraction.js";
import { AlertTriangle, PanelRightOpen, Redo2, Undo2, X } from "lucide-react";
import { tabs } from "./ribbon/shared.js";
import HomeTab from "./ribbon/HomeTab.jsx";
import FileTab from "./ribbon/FileTab.jsx";
import InsertTab from "./ribbon/InsertTab.jsx";
import LayoutTab from "./ribbon/LayoutTab.jsx";
import ReferencesTab from "./ribbon/ReferencesTab.jsx";
import ViewTab from "./ribbon/ViewTab.jsx";
import "./ribbon/home.css";
export default function ThesisRibbon({
  tab,
  setTab,
  panelContent,
  title,
  activeSection,
  template,
  actions,
  detailsOpen,
  setDetailsOpen,
  pageSettingsOpen,
  setPageSettingsOpen,
  exporting,
  onExport,
  onPrint,
  onImport,
  onImportPdf,
  paginationReady,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoomChoice,
  setZoomChoice,
  zoom,
  stepZoom,
  canStepZoom,
  zoomLevels,
  totalPages,
  warningCount,
  warningsOpen,
  setWarningsOpen,
  validationIssues,
  missingFields,
  warning,
  indexWarning,
  message,
  onImage,
  captionKinds,
  pickedFigure,
  onFigureKind,
  pickedEquation,
  onEquationNumber,
  citableItems,
  onInsertCitation,
  onAddFrame,
  rulersVisible,
  setRulersVisible,
  rulerUnit,
  setRulerUnit,
  navigationOpen,
  setNavigationOpen,
  canNavigate,
  fontFamily,
  page,
  workspacePanel,
  onOpenWorkspace,
  onCheckDocument,
  sourceCount,
}) {
  const ribbonTabs = tabs;
  const sidePanels = ["Yazım planı", "Kaynaklar", "Rehber", "Sayfa ayarları", "Öğe", "Tez bilgileri"];
  const extendedPanel = !tabs.includes(tab);
  // Side panels open in a drawer; the ribbon keeps showing the last regular tab.
  const lastMainTab = useRef("Giriş");
  if (!extendedPanel) lastMainTab.current = tab;
  const shownTab = extendedPanel ? lastMainTab.current : tab;
  const lastSidePanel = useRef(sidePanels[0]);
  if (extendedPanel) lastSidePanel.current = tab;
  const closeDrawer = () => setTab(lastMainTab.current);
  const drawerRef = useRef(null);
  const panelToggleRef = useRef(null);
  const returnFocusRef = useRef(null);
  useEffect(() => {
    if (!extendedPanel) return;
    returnFocusRef.current = document.activeElement === document.body ? panelToggleRef.current : document.activeElement;
    drawerRef.current?.querySelector('button')?.focus({ preventScroll: true });
    return () => {
      // Keep deliberate focus moves to the ribbon or document; only restore
      // focus when closing would otherwise leave it inside the hidden drawer.
      if (document.activeElement !== document.body && !drawerRef.current?.contains(document.activeElement)) return;
      const target = returnFocusRef.current;
      const destination = target?.isConnected && !target.closest('[hidden]') ? target : panelToggleRef.current;
      destination?.focus({ preventScroll: true });
    };
  }, [extendedPanel]);
  // Alignment changes the paragraph inside its existing template frame unless
  // the writer explicitly chooses the page or writing area.
  const [alignmentScope, setAlignmentScope] = useState(DEFAULT_TEXT_ALIGNMENT_SCOPE);
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
  const clampInt = (str, min, max, fallback) => {
    const num = Number(str);
    return isNaN(num) || str.trim() === "" ? fallback : Math.max(min, Math.min(max, num));
  };
  const handleTableRowsBlur = () => setTableRows(String(clampInt(tableRows, 1, 30, 3)));
  const handleTableRowsKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setTableRows(String(clampInt(tableRows, 1, 30, 3)));
    }
  };
  const handleTableColsBlur = () => setTableCols(String(clampInt(tableCols, 1, 12, 3)));
  const handleTableColsKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setTableCols(String(clampInt(tableCols, 1, 12, 3)));
    }
  };
  const [tableCaption, setTableCaption] = useState("");
  const [linkHref, setLinkHref] = useState("");
  const [linkText, setLinkText] = useState("");
  const [footnoteText, setFootnoteText] = useState("");
  const ids = useId();
  const remember = actions.saveSelection;
  const keep = actions.keepSelection;
  const invoke = (name, ...args) => actions.runSaved((body) => body?.[name]?.(...args));
  const headingOptions = Object.keys(activeSection?.rules.headings || template.typography.headings || {});
  const paragraphOptions = Object.keys(template.typography.paragraphStyles || {});
  const quickOff = !activeSection || actions.canFormatText === false || (actions.isStaticTarget && !actions.isLayoutTextTarget);

  return (
    <header className="thesis-ribbon" aria-label="Tez belge araçları">
      <div className="thesis-ribbon-toprow">
      <div role="tablist" aria-label="Şerit sekmeleri" className="thesis-tabs">
        {ribbonTabs.map((item) => (
          <button
            key={item}
            role="tab"
            id={`${ids}-thesis-tab-${encodeURIComponent(item)}`}
            aria-selected={shownTab === item}
            aria-controls={`${ids}-thesis-ribbon-panel`}
            tabIndex={shownTab === item ? 0 : -1}
            className={shownTab === item ? "is-active" : ""}
            onMouseDown={keep}
            onClick={(event) => {
              event.currentTarget.focus();
              setTab(item);
            }}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const index = ribbonTabs.indexOf(shownTab);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? ribbonTabs.length - 1
                    : (index + (event.key === "ArrowRight" ? 1 : -1) + ribbonTabs.length) % ribbonTabs.length;
              setTab(ribbonTabs[next]);
              event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
              event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus();
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="thesis-ribbon-quick">
        <button type="button" className="thesis-quick-btn" title="Geri al (Ctrl+Z)" aria-label="Geri al (Ctrl+Z)" disabled={quickOff || !actions.canTextUndo} onMouseDown={keep} onClick={() => invoke("undo")}><Undo2 size={16} aria-hidden="true" /></button>
        <button type="button" className="thesis-quick-btn" title="Yinele (Ctrl+Y)" aria-label="Yinele (Ctrl+Y)" disabled={quickOff || !actions.canTextRedo} onMouseDown={keep} onClick={() => invoke("redo")}><Redo2 size={16} aria-hidden="true" /></button>
        {warningCount > 0 && (
          <div className="thesis-ribbon-warning">
            <details open={warningsOpen} onToggle={(event) => setWarningsOpen(event.currentTarget.open)}>
              <summary title="Belge uyarılarını göster">
                <AlertTriangle size={14} aria-hidden="true" />
                {validationIssues.length ? `${validationIssues.length} uyarı` : `${warningCount} uyarı`}
              </summary>
              <div>
                {warning && <p>{warning}</p>}
                {missingFields?.length ? <p>Eksik tez bilgisi: {missingFields.join(", ")}</p> : null}
                {indexWarning && <p>{indexWarning}</p>}
                {validationIssues.map((issue, index) => (
                  <p key={index}>{issue.message}{template.placeholders?.[issue.field] ? <button type="button" className="thesis-panel-link" onClick={() => setDetailsOpen(true)}>Bilgiyi tamamla</button> : null}</p>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
      </div>
      <div
        id={`${ids}-thesis-ribbon-panel`}
        role="tabpanel"
        aria-labelledby={`${ids}-thesis-tab-${encodeURIComponent(shownTab)}`}
        className={`thesis-ribbon-panel thesis-ribbon-panel--${tabs.indexOf(shownTab)}`}
        data-ribbon-tab={shownTab}
      >
        {shownTab === "Giriş" && (
          <HomeTab
            title={title}
            activeSection={activeSection}
            actions={actions}
            exporting={exporting}
            paginationReady={paginationReady}
            onPrint={onPrint}
            navigationOpen={navigationOpen}
            setNavigationOpen={setNavigationOpen}
            fontFamily={fontFamily}
            remember={remember}
            keep={keep}
            invoke={invoke}
            headingOptions={headingOptions}
            paragraphOptions={paragraphOptions}
            alignmentScope={alignmentScope}
            setAlignmentScope={setAlignmentScope}
          />
        )}
        {shownTab === "Dosya" && (
          <FileTab
            onImport={onImport}
            onImportPdf={onImportPdf}
            title={title}
            activeSection={activeSection}
            template={template}
            detailsOpen={detailsOpen}
            setDetailsOpen={setDetailsOpen}
            exporting={exporting}
            onExport={onExport}
            onPrint={onPrint}
            paginationReady={paginationReady}
            keep={keep}
          />
        )}
        {shownTab === "Ekle" && (
          <InsertTab
            activeSection={activeSection}
            canInsertInline={actions.canInsertInline}
            template={template}
            onImage={onImage}
            captionKinds={captionKinds}
            pickedFigure={pickedFigure}
            onFigureKind={onFigureKind}
            pickedEquation={pickedEquation}
            onEquationNumber={onEquationNumber}
            onAddFrame={onAddFrame}
            tableRows={tableRows}
            setTableRows={setTableRows}
            tableCols={tableCols}
            setTableCols={setTableCols}
            clampInt={clampInt}
            handleTableRowsBlur={handleTableRowsBlur}
            handleTableRowsKeyDown={handleTableRowsKeyDown}
            handleTableColsBlur={handleTableColsBlur}
            handleTableColsKeyDown={handleTableColsKeyDown}
            tableCaption={tableCaption}
            setTableCaption={setTableCaption}
            linkHref={linkHref}
            setLinkHref={setLinkHref}
            linkText={linkText}
            setLinkText={setLinkText}
            remember={remember}
            keep={keep}
            invoke={invoke}
            headingOptions={headingOptions}
          />
        )}
        {shownTab === "Düzen" && (
          <LayoutTab
            actions={actions}
            pageSettingsOpen={pageSettingsOpen}
            setPageSettingsOpen={setPageSettingsOpen}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
            remember={remember}
            keep={keep}
            totalPages={totalPages}
            rulersVisible={rulersVisible}
            setRulersVisible={setRulersVisible}
            rulerUnit={rulerUnit}
            setRulerUnit={setRulerUnit}
            page={page}
          />
        )}
        {shownTab === "Başvurular" && (
          <ReferencesTab
            activeSection={activeSection}
            canInsertInline={actions.canInsertInline}
            citableItems={citableItems}
            onInsertCitation={onInsertCitation}
            onInsertEndnote={(text) => invoke("insertEndnote", text)}
            navigationOpen={navigationOpen}
            setNavigationOpen={setNavigationOpen}
            footnoteText={footnoteText}
            setFootnoteText={setFootnoteText}
            remember={remember}
            keep={keep}
            onManageSources={() => onOpenWorkspace('sources')}
            onCheckDocument={onCheckDocument}
            numeric={template.bibliography?.citationStyle === 'numeric'}
          />
        )}
        {shownTab === "Görünüm" && (
          <ViewTab
            activeSection={activeSection}
            pageSettingsOpen={pageSettingsOpen}
            setPageSettingsOpen={setPageSettingsOpen}
            zoomChoice={zoomChoice}
            setZoomChoice={setZoomChoice}
            zoom={zoom}
            stepZoom={stepZoom}
            canStepZoom={canStepZoom}
            zoomLevels={zoomLevels}
            totalPages={totalPages}
            rulersVisible={rulersVisible}
            setRulersVisible={setRulersVisible}
            navigationOpen={navigationOpen}
            setNavigationOpen={setNavigationOpen}
            canNavigate={canNavigate}
            remember={remember}
            keep={keep}
          />
        )}
      </div>
      {message ? (
        <div className="thesis-ribbon-message" role="status" aria-atomic="true">
          <span>{message}</span>
        </div>
      ) : null}
      <button ref={panelToggleRef} type="button" className={`thesis-side-fab ${extendedPanel ? "is-open" : ""}`} aria-expanded={extendedPanel} aria-controls={`${ids}-side-drawer`} title="Yan panelleri aç/kapat" onMouseDown={keep} onClick={() => (extendedPanel ? closeDrawer() : setTab(lastSidePanel.current))}>
        <PanelRightOpen size={18} aria-hidden="true" />
        <span>Paneller</span>
      </button>
      <aside ref={drawerRef} id={`${ids}-side-drawer`} className="thesis-side-drawer" hidden={!extendedPanel} aria-label="Yan paneller" data-ribbon-tab={extendedPanel ? tab : undefined} onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          event.stopPropagation();
          closeDrawer();
        }
      }}>
        <div className="thesis-side-drawer-head">
          <strong>{extendedPanel ? tab : lastSidePanel.current}</strong>
          <button type="button" aria-label="Paneli kapat" title="Paneli kapat" onClick={closeDrawer}><X size={16} aria-hidden="true" /></button>
        </div>
        <nav className="thesis-side-drawer-nav" aria-label="Panel seç">
          {sidePanels.map((item) => (
            <button key={item} type="button" className={tab === item ? "is-active" : ""} aria-current={tab === item ? "page" : undefined} onMouseDown={keep} onClick={() => setTab(item)}>{item}</button>
          ))}
        </nav>
        <div className="thesis-side-drawer-body thesis-ribbon-workspace-body">{panelContent}</div>
      </aside>
    </header>
  );
}
