import { useId, useState } from "react";
import { tabs } from "./ribbon/shared.js";
import Tool from "./ribbon/Tool.jsx";
import HomeTab from "./ribbon/HomeTab.jsx";
import FileTab from "./ribbon/FileTab.jsx";
import InsertTab from "./ribbon/InsertTab.jsx";
import LayoutTab from "./ribbon/LayoutTab.jsx";
import ReferencesTab from "./ribbon/ReferencesTab.jsx";
import ViewTab from "./ribbon/ViewTab.jsx";
export default function ThesisRibbon({
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
  citeText,
  setCiteText,
  citeOpen,
  setCiteOpen,
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
}) {
  const [tab, setTab] = useState("Giriş");
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
  const submitCitation = (event) => {
    event.preventDefault();
    onInsertCitation(footnoteText);
    setFootnoteText("");
  };

  return (
    <header className="thesis-ribbon" aria-label="Tez belge araçları">
      <div className="thesis-titlebar">
        <div className="thesis-brand">
          <span className="thesis-brand-mark" aria-hidden="true">
            T
          </span>
          <div>
            <strong>TxtNote</strong>
            <span>Tez düzenleyicisi</span>
          </div>
        </div>
        <div className="thesis-titlebar-actions">
          <span className="thesis-save-indicator">
            <i /> Otomatik kayıt
          </span>
        </div>
        <div className="thesis-document-name" title={title || "Adsız tez"}>
          {title || "Adsız tez"}
          <span> · {template.displayName || template.universityName}</span>
        </div>
        <div className="thesis-titlebar-actions thesis-titlebar-right">
          <button
            type="button"
            className="thesis-detail-button"
            onMouseDown={keep}
            onClick={() => setDetailsOpen(!detailsOpen)}
            aria-expanded={detailsOpen}
          >
            Tez bilgileri
          </button>
          <Tool
            label="Sayfa düzeni"
            pressed={pageSettingsOpen}
            onMouseDown={keep}
            onClick={() => setPageSettingsOpen(!pageSettingsOpen)}
          >
            ⚙
          </Tool>
        </div>
      </div>
      <div role="tablist" aria-label="Şerit sekmeleri" className="thesis-tabs">
        {tabs.map((item) => (
          <button
            key={item}
            role="tab"
            id={`${ids}-thesis-tab-${item}`}
            aria-selected={tab === item}
            aria-controls={`${ids}-thesis-ribbon-panel`}
            tabIndex={tab === item ? 0 : -1}
            className={tab === item ? "is-active" : ""}
            onMouseDown={keep}
            onClick={(event) => {
              event.currentTarget.focus();
              setTab(item);
            }}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const index = tabs.indexOf(tab);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? tabs.length - 1
                    : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
              setTab(tabs[next]);
              event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus();
            }}
          >
            {item}
          </button>
        ))}
        {activeSection ? (
          <span className="thesis-active-section" title={activeSection.title}>
            {activeSection.title}
          </span>
        ) : (
          <span className="thesis-active-section is-muted">Düzenlemek için bir metin bölümüne tıklayın</span>
        )}
      </div>
      <div
        id={`${ids}-thesis-ribbon-panel`}
        role="tabpanel"
        aria-labelledby={`${ids}-thesis-tab-${tab}`}
        className={`thesis-ribbon-panel thesis-ribbon-panel--${tabs.indexOf(tab)}`}
        data-ribbon-tab={tab}
      >
        {tab === "Giriş" && (
          <HomeTab
            title={title}
            activeSection={activeSection}
            actions={actions}
            onPrint={onPrint}
            navigationOpen={navigationOpen}
            setNavigationOpen={setNavigationOpen}
            fontFamily={fontFamily}
            remember={remember}
            keep={keep}
            invoke={invoke}
            headingOptions={headingOptions}
            paragraphOptions={paragraphOptions}
          />
        )}
        {tab === "Dosya" && (
          <FileTab
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
        {tab === "Ekle" && (
          <InsertTab
            activeSection={activeSection}
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
        {tab === "Düzen" && (
          <LayoutTab
            actions={actions}
            pageSettingsOpen={pageSettingsOpen}
            setPageSettingsOpen={setPageSettingsOpen}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
            totalPages={totalPages}
            rulersVisible={rulersVisible}
            setRulersVisible={setRulersVisible}
            rulerUnit={rulerUnit}
            setRulerUnit={setRulerUnit}
            page={page}
          />
        )}
        {tab === "Başvurular" && (
          <ReferencesTab
            activeSection={activeSection}
            detailsOpen={detailsOpen}
            setDetailsOpen={setDetailsOpen}
            citableItems={citableItems}
            onInsertCitation={onInsertCitation}
            citeText={citeText}
            setCiteText={setCiteText}
            citeOpen={citeOpen}
            setCiteOpen={setCiteOpen}
            navigationOpen={navigationOpen}
            setNavigationOpen={setNavigationOpen}
            footnoteText={footnoteText}
            setFootnoteText={setFootnoteText}
            remember={remember}
            keep={keep}
            submitCitation={submitCitation}
          />
        )}
        {tab === "Görünüm" && (
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
            keep={keep}
          />
        )}
      </div>
      {warningCount > 0 && (
        <div className="thesis-ribbon-warning">
          <details open={warningsOpen} onToggle={(event) => setWarningsOpen(event.currentTarget.open)}>
            <summary>
              {validationIssues.length ? `${validationIssues.length} belge uyarısı` : `${warningCount} uyarı`}
            </summary>
            <div>
              {warning && <p>{warning}</p>}
              {missingFields?.length ? <p>Eksik tez bilgisi: {missingFields.join(", ")}</p> : null}
              {indexWarning && <p>{indexWarning}</p>}
              {validationIssues.map((issue, index) => (
                <p key={index}>{issue.message}</p>
              ))}
            </div>
          </details>
        </div>
      )}
      {message ? (
        <div className="thesis-ribbon-message" role="status">
          {message}
        </div>
      ) : null}
    </header>
  );
}
