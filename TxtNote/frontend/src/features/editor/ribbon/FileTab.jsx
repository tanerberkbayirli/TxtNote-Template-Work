import { BookOpen, Check, FileText, Printer } from "lucide-react";
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
  paginationReady,
  keep,
}) {
  return (
    <>
      <Group label="Belge bilgisi">
        <div className="thesis-file-context">
          <div className="thesis-file-icon">
            <FileText size={25} />
          </div>
          <div>
            <strong>{title || "Adsız tez"}</strong>
            <span>{template.displayName || template.universityName}</span>
            <small>{activeSection?.title || "Belge genel görünümü"}</small>
          </div>
          <Tool
            label="Tez bilgileri"
            onMouseDown={keep}
            onClick={() => setDetailsOpen(!detailsOpen)}
            pressed={detailsOpen}
          >
            Bilgileri aç
          </Tool>
        </div>
      </Group>
      <Group label="Dışa aktar" className="thesis-ribbon-export-group">
        <div className="thesis-export-tiles">
          <button
            type="button"
            className="thesis-export-tile"
            aria-label="PDF"
            disabled={Boolean(exporting) || !paginationReady}
            onClick={() => onExport("pdf")}
          >
            <span className="thesis-export-icon">PDF</span>
            <span>
              <strong>{exporting === "pdf" ? "Hazırlanıyor…" : "PDF olarak indir"}</strong>
              <small>Sayfa düzeni ve görsellerle</small>
            </span>
          </button>
          <button
            type="button"
            className="thesis-export-tile"
            aria-label="Word"
            disabled={Boolean(exporting) || !paginationReady}
            onClick={() => onExport("docx")}
          >
            <span className="thesis-export-icon is-word">W</span>
            <span>
              <strong>{exporting === "docx" ? "Hazırlanıyor…" : "Word belgesi indir"}</strong>
              <small>Düzenlenebilir .docx</small>
            </span>
          </button>
        </div>
        <span className="thesis-export-ready">
          <Check size={14} />
          {paginationReady ? "Dışa aktarmaya hazır" : "Sayfalar hazırlanıyor"}
        </span>
      </Group>
      <Group label="Yazdırma ve kaynak" className="thesis-ribbon-file-context">
        <div className="thesis-ribbon-feature-tile">
          <Printer size={20} />
          <div>
            <strong>Yazdırma görünümü</strong>
            <small>Belgeyi yazdırma kuyruğuna gönder</small>
          </div>
          <Tool label="Yazdır" onClick={onPrint}>
            Yazdır
          </Tool>
        </div>
        <div className="thesis-ribbon-feature-tile">
          <BookOpen size={20} />
          <div>
            <strong>Şablon</strong>
            <small>{template.source?.documentName || template.source?.url || template.id || "Etkin şablon"}</small>
          </div>
        </div>
      </Group>
    </>
  );
}
