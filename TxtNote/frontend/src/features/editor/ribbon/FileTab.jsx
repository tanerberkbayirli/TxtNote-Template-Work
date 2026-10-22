import { Check, FileText, Loader2, Printer } from "lucide-react";
import Tool from "./Tool.jsx";
import Group from "./Group.jsx";

export default function FileTab({
  title,
  activeSection,
  template,
  detailsOpen,
  setDetailsOpen,
  exporting,
  onExport,
  onPrint,
  onImport,
  onImportPdf,
  paginationReady,
  keep,
}) {
  const unavailable = exporting ? "Başka bir dosya işlemi sürüyor; tamamlanmasını bekleyin." : !paginationReady ? "Sayfalar hazırlanıyor; tamamlanmasını bekleyin." : undefined;
  return (
    <>
      <Group label="Belge bilgisi" className="thesis-home-group">
        <div className="thesis-file-context">
          <div className="thesis-file-icon">
            <FileText size={25} />
          </div>
          <div>
            <strong title={title || "Adsız tez"}>{title || "Adsız tez"}</strong>
            <span>{template.displayName || template.universityName}</span>
            <small>{activeSection?.title || "Belge genel görünümü"}</small>
          </div>
        </div>
        <div className="thesis-home-row is-boxed">
          <Tool label="Tez bilgileri" onMouseDown={keep} onClick={() => setDetailsOpen(!detailsOpen)} pressed={detailsOpen}>
            Tez bilgileri
          </Tool>
        </div>
      </Group>
      {onImport ? <Group label="İçe aktar" className="thesis-home-group"><Tool label="Word içe aktar" onClick={onImport} disabled={Boolean(exporting)}>Word içe aktar</Tool>{onImportPdf?<Tool label="PDF içe aktar" onClick={onImportPdf} disabled={Boolean(exporting)}>PDF içe aktar</Tool>:null}<small className="thesis-ribbon-hint">Word · PDF · Taranmış sayfalar</small></Group> : null}
      <Group label="Dışa aktar" className="thesis-home-group">
        <div className="thesis-export-tiles">
          <button type="button" className="thesis-export-tile" aria-label="PDF" title={unavailable || "PDF olarak indir"} aria-description={unavailable} aria-busy={exporting === "pdf"} disabled={Boolean(exporting) || !paginationReady} onMouseDown={keep} onClick={() => onExport("pdf")}>
            <span className="thesis-export-icon">PDF</span>
            <span>
              <strong>{exporting === "pdf" ? "Hazırlanıyor…" : "PDF olarak indir"}</strong>
              <small>Sayfa düzeni ve görsellerle</small>
            </span>
          </button>
          <button type="button" className="thesis-export-tile" aria-label="Word" title={unavailable || "Word belgesi indir"} aria-description={unavailable} aria-busy={exporting === "docx"} disabled={Boolean(exporting) || !paginationReady} onMouseDown={keep} onClick={() => onExport("docx")}>
            <span className="thesis-export-icon is-word">W</span>
            <span>
              <strong>{exporting === "docx" ? "Hazırlanıyor…" : "Word belgesi indir"}</strong>
              <small>Düzenlenebilir .docx</small>
            </span>
          </button>
        </div>
        <span className="thesis-export-ready" role="status" aria-atomic="true" data-ready={paginationReady && !exporting ? "true" : "false"}>
          {paginationReady && !exporting ? <Check size={13} aria-hidden="true" /> : <Loader2 size={13} className="thesis-spin" aria-hidden="true" />}
          {exporting === "import" ? "Belge içe aktarılıyor…" : exporting ? `${exporting === "pdf" ? "PDF" : "Word"} hazırlanıyor…` : paginationReady ? "Dışa aktarmaya hazır" : "Sayfalar hazırlanıyor"}
        </span>
      </Group>
      <Group label="Yazdır" className="thesis-home-group">
        <div className="thesis-home-rows">
          <Tool label="Yazdır" disabled={!paginationReady || Boolean(exporting)} disabledReason={unavailable} title="Belgeyi yazdır" onMouseDown={keep} onClick={onPrint}>
            <Printer size={15} aria-hidden="true" /> Yazdır
          </Tool>
          <small className="thesis-ribbon-hint">{template.source?.documentName || template.source?.url || template.id || "Etkin şablon"}</small>
        </div>
      </Group>
    </>
  );
}
