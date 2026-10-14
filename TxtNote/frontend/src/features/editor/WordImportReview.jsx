import { setDocumentFormatMode } from "../../../../../engine/src/contentModel.js";

export function WordImportReport({ document }) {
  const source = document?.source;
  if (source?.format !== "docx") return null;
  const issues = source.unsupported || [];
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ fileName: source.fileName, sha256: source.sha256, ...source.importReport, issues }, null, 2)], { type: "application/json" }));
    const link = window.document.createElement("a"); link.href = url; link.download = "word-aktarim-raporu.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <details className="border-t border-neutral-200 p-3 text-xs dark:border-neutral-700" aria-label="Word aktarım raporu">
    <summary>Word aktarım raporu · {source.fileName} · {issues.length} bildirim</summary>
    <p className="my-2">{document.sections.length} kaynak bölüm korundu. Bildirilen özelliklerin kaynak verileri saklandı; görsel yerleşimleri doğrulanmadı.</p>
    <button type="button" className="rounded border px-2 py-1" onClick={download}>Tam aktarım raporunu indir</button>
    <ul className="mt-2 max-h-40 overflow-auto">{issues.slice(0, 50).map((issue, index) => <li className="mb-2" key={index}>{issue.message}<small className="block break-all text-neutral-500">{issue.locator}</small></li>)}</ul>
    {issues.length > 50 ? <p>İlk 50 bildirim gösteriliyor. Tamamı indirilen raporda.</p> : null}
  </details>;
}

export function WordImportReview({ note, onChange, onCancel, onApply }) {
  const thesis = note.researchData.thesis, document = thesis.document;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5" role="dialog" aria-modal="true" aria-labelledby="word-import-title">
    <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900">
      <h2 id="word-import-title" className="text-lg font-semibold">Word belgesini içe aktar</h2>
      <p className="my-3 text-sm">{document.source.fileName} · {document.sections.length} bölüm. Uyguladığınızda bu tezin içeriği seçilen belgeyle değişir. İptal ederseniz mevcut içerik korunur.</p>
      <label className="block text-sm">İçe aktarılan belgenin biçimi<select className="mx-2 rounded border bg-transparent p-2" value={document.formatMode} onChange={e => onChange({ ...note, researchData: { ...note.researchData, thesis: setDocumentFormatMode(thesis, e.target.value) } })}>
        <option value="source">Kaynak biçimini koru</option><option value="template">Üniversite şablonuna uyarla</option>
      </select></label>
      <WordImportReport document={document} />
      <div className="mt-4 flex justify-end gap-3"><button type="button" className="rounded border px-4 py-2" onClick={onCancel}>İptal</button><button type="button" className="rounded bg-blue-600 px-4 py-2 text-white" onClick={onApply}>İçe aktar ve belgeyi değiştir</button></div>
    </div>
  </div>;
}
