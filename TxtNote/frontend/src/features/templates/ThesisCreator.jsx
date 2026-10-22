import { useMemo, useState } from "react";
import { THESIS_TEMPLATE_REGISTRY } from "../../../../../engine/src/registry.js";

const labelForDegree = { undergraduate: "Lisans", master: "Yüksek lisans", phd: "Doktora", specialization: "Uzmanlık", "sanatta-yeterlik": "Sanatta yeterlik" };

export function ThesisCreator({ onCreate }) {
  const [universityId, setUniversityId] = useState(THESIS_TEMPLATE_REGISTRY[0].universityId);
  const [instituteId, setInstituteId] = useState(THESIS_TEMPLATE_REGISTRY[0].instituteId);
  const [degreeType, setDegreeType] = useState(THESIS_TEMPLATE_REGISTRY[0].degreeType);
  const [language, setLanguage] = useState(THESIS_TEMPLATE_REGISTRY[0].language);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const universities = useMemo(() => [...new Map(THESIS_TEMPLATE_REGISTRY.map((item) => [item.universityId, item.universityName])).entries()], []);
  const institutes = THESIS_TEMPLATE_REGISTRY.filter((item) => item.universityId === universityId);
  const degrees = institutes.filter((item) => item.instituteId === instituteId);
  const languages = degrees.filter((item) => item.degreeType === degreeType);
  const selection = { universityId, instituteId, degreeType, language };
  const selectedTemplate = languages.find(item => item.language === language);

  const chooseUniversity = (id) => {
    const next = THESIS_TEMPLATE_REGISTRY.find((item) => item.universityId === id);
    setUniversityId(id); setInstituteId(next.instituteId); setDegreeType(next.degreeType); setLanguage(next.language);
  };
  const chooseInstitute = (id) => {
    const next = institutes.find((item) => item.instituteId === id);
    setInstituteId(id); setDegreeType(next.degreeType); setLanguage(next.language);
  };
  const chooseDegree = (degree) => {
    const next = degrees.find((item) => item.degreeType === degree);
    setDegreeType(degree); setLanguage(next.language);
  };
  const create = async () => {
    setBusy(true); setError("");
    try { await onCreate?.(selection); }
    catch (cause) { setError(cause?.message || "Tez oluşturulamadı."); }
    finally { setBusy(false); }
  };

  return <section className="mt-7 rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/20">
    <p className="mb-2 text-[10px] font-semibold tracking-widest text-blue-700 dark:text-blue-300">TEZ ÇALIŞMA ALANI</p>
    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Tezinize doğru şablonla başlayın</h2>
    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">Üniversitenizi ve tez türünüzü seçin. Bölüm planı, kaynakça ve otomatik içindekiler yazarken yanınızda olsun.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-xs font-medium">Üniversite<select aria-label="Üniversite" className="mt-1 w-full rounded border p-2 text-sm text-neutral-900" value={universityId} onChange={(event) => chooseUniversity(event.target.value)}>{universities.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="text-xs font-medium">Enstitü<select aria-label="Enstitü" className="mt-1 w-full rounded border p-2 text-sm text-neutral-900" value={instituteId} onChange={(event) => chooseInstitute(event.target.value)}>{[...new Map(institutes.map((item) => [item.instituteId, item.instituteName])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="text-xs font-medium">Tez türü<select aria-label="Tez türü" className="mt-1 w-full rounded border p-2 text-sm text-neutral-900" value={degreeType} onChange={(event) => chooseDegree(event.target.value)}>{[...new Set(degrees.map((item) => item.degreeType))].map((id) => <option key={id} value={id}>{labelForDegree[id] || id}</option>)}</select></label>
      <label className="text-xs font-medium">Dil<select aria-label="Dil" className="mt-1 w-full rounded border p-2 text-sm text-neutral-900" value={language} onChange={(event) => setLanguage(event.target.value)}>{[...new Set(languages.map((item) => item.language))].map((id) => <option key={id} value={id}>{id === "tr" ? "Türkçe" : id === "en" ? "English" : id}</option>)}</select></label>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={() => void create()} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-blue-500">{busy ? "Çalışma alanı hazırlanıyor…" : "Tez oluştur"}</button><span className="text-xs text-neutral-500 dark:text-neutral-400">Sonraki adım: tez bilgilerinizi tamamlayın ve yazmaya başlayın.</span></div>
    <p className="mt-3 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{selectedTemplate?.status === 'official' ? 'Şablon, üniversitenin yayımladığı yazım kaynaklarından hazırlanmıştır. Şablon notlarına çalışma alanından ulaşabilirsiniz.' : 'Seçtiğiniz şablon genel bir taslaktır. Üniversitenizin yazım kurallarını ayrıca kontrol edin.'}</p>
    {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
  </section>;
}
