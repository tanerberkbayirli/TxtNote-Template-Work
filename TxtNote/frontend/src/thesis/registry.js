import generic from "./templates/generic.js";
import { validateThesisRegistry, validateThesisTemplate } from "./validation.js";

/** Selection reads only these small descriptors. The template module loads on demand. */
export const THESIS_TEMPLATE_REGISTRY = Object.freeze([
  { id: "demo-university-a-master-tr-v1", templateVersion: "1.0.0", universityId: "demo-university-a", universityName: "DEMO Üniversite A", instituteId: "graduate", instituteName: "DEMO Lisansüstü Enstitüsü", degreeType: "master", language: "tr", status: "demo", selectors: {}, load: () => import("./templates/demo-a.js") },
  { id: "demo-university-b-master-tr-v1", templateVersion: "1.0.0", universityId: "demo-university-b", universityName: "DEMO Üniversite B", instituteId: "science", instituteName: "DEMO Fen Enstitüsü", degreeType: "master", language: "tr", status: "demo", selectors: {}, load: () => import("./templates/demo-b.js") },
  { id: "demo-university-c-phd-en-v1", templateVersion: "1.0.0", universityId: "demo-university-c", universityName: "DEMO University C", instituteId: "research", instituteName: "DEMO Research Institute", degreeType: "phd", language: "en", status: "demo", selectors: {}, load: () => import("./templates/demo-c.js") },
  // One data module, two degree variants (degree lines and the doctorate-only CV differ).
  { id: "mcbu-lee-master-tr-v1", templateVersion: "1.0.0", universityId: "mcbu", universityName: "Manisa Celal Bayar Üniversitesi", instituteId: "lee", instituteName: "Lisansüstü Eğitim Enstitüsü", degreeType: "master", language: "tr", status: "official", displayName: "Manisa Celal Bayar Üniversitesi · Lisansüstü Eğitim Enstitüsü · Yüksek Lisans", selectors: {}, load: () => import("./templates/mcbu.js").then((module) => ({ default: module.mcbuMaster })) },
  { id: "mcbu-lee-phd-tr-v1", templateVersion: "1.0.0", universityId: "mcbu", universityName: "Manisa Celal Bayar Üniversitesi", instituteId: "lee", instituteName: "Lisansüstü Eğitim Enstitüsü", degreeType: "phd", language: "tr", status: "official", displayName: "Manisa Celal Bayar Üniversitesi · Lisansüstü Eğitim Enstitüsü · Doktora", selectors: {}, load: () => import("./templates/mcbu.js").then((module) => ({ default: module.mcbuPhd })) },
  { id: "mcbu-tip-uzmanlik-tr-v1", templateVersion: "1.0.0", universityId: "mcbu", universityName: "Manisa Celal Bayar Üniversitesi", instituteId: "tip", instituteName: "Tıp Fakültesi", degreeType: "specialization", language: "tr", status: "official", displayName: "Manisa Celal Bayar Üniversitesi · Tıp Fakültesi · Tıpta Uzmanlık Tezi", selectors: {}, load: () => import("./templates/mcbu-tip.js").then((module) => ({ default: module.mcbuTipUzmanlik })) },
  // One data module, two degree variants (only the degree strings differ).
  { id: "aku-fbe-master-tr-v1", templateVersion: "1.0.0", universityId: "aku", universityName: "Afyon Kocatepe Üniversitesi", instituteId: "fbe", instituteName: "Fen Bilimleri Enstitüsü", degreeType: "master", language: "tr", status: "official", displayName: "Afyon Kocatepe Üniversitesi · Fen Bilimleri Enstitüsü · Yüksek Lisans", selectors: {}, load: () => import("./templates/aku-fbe.js").then((module) => ({ default: module.akuFbeMaster })) },
  { id: "aku-fbe-phd-tr-v1", templateVersion: "1.0.0", universityId: "aku", universityName: "Afyon Kocatepe Üniversitesi", instituteId: "fbe", instituteName: "Fen Bilimleri Enstitüsü", degreeType: "phd", language: "tr", status: "official", displayName: "Afyon Kocatepe Üniversitesi · Fen Bilimleri Enstitüsü · Doktora", selectors: {}, load: () => import("./templates/aku-fbe.js").then((module) => ({ default: module.akuFbePhd })) },
  { id: "aku-sbe-master-tr-v1", templateVersion: "1.0.0", universityId: "aku", universityName: "Afyon Kocatepe Üniversitesi", instituteId: "sbe", instituteName: "Sosyal Bilimler Enstitüsü", degreeType: "master", language: "tr", status: "official", displayName: "Afyon Kocatepe Üniversitesi · Sosyal Bilimler Enstitüsü · Yüksek Lisans", selectors: {}, load: () => import("./templates/aku-sbe.js").then((module) => ({ default: module.akuSbeMaster })) },
  { id: "aku-sbe-phd-tr-v1", templateVersion: "1.0.0", universityId: "aku", universityName: "Afyon Kocatepe Üniversitesi", instituteId: "sbe", instituteName: "Sosyal Bilimler Enstitüsü", degreeType: "phd", language: "tr", status: "official", displayName: "Afyon Kocatepe Üniversitesi · Sosyal Bilimler Enstitüsü · Doktora", selectors: {}, load: () => import("./templates/aku-sbe.js").then((module) => ({ default: module.akuSbePhd })) },
  { id: "aku-sagbil-master-tr-v1", templateVersion: "1.0.0", universityId: "aku", universityName: "Afyon Kocatepe Üniversitesi", instituteId: "sagbil", instituteName: "Sağlık Bilimleri Enstitüsü", degreeType: "master", language: "tr", status: "official", displayName: "Afyon Kocatepe Üniversitesi · Sağlık Bilimleri Enstitüsü · Yüksek Lisans", selectors: {}, load: () => import("./templates/aku-sagbil.js").then((module) => ({ default: module.akuSagbilMaster })) },
  { id: "aku-sagbil-phd-tr-v1", templateVersion: "1.0.0", universityId: "aku", universityName: "Afyon Kocatepe Üniversitesi", instituteId: "sagbil", instituteName: "Sağlık Bilimleri Enstitüsü", degreeType: "phd", language: "tr", status: "official", displayName: "Afyon Kocatepe Üniversitesi · Sağlık Bilimleri Enstitüsü · Doktora", selectors: {}, load: () => import("./templates/aku-sagbil.js").then((module) => ({ default: module.akuSagbilPhd })) },
  { id: "aku-mbg-lisans-tr-v1", templateVersion: "1.0.0", universityId: "aku", universityName: "Afyon Kocatepe Üniversitesi", instituteId: "fef-mbg", instituteName: "Fen Edebiyat Fakültesi · Moleküler Biyoloji ve Genetik Bölümü", degreeType: "undergraduate", language: "tr", status: "official", displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Moleküler Biyoloji ve Genetik Bölümü · Bitirme Tezi", selectors: {}, load: () => import("./templates/aku-mbg.js").then((module) => ({ default: module.akuMbgLisans })) },
  { id: "aku-cografya-lisans-tr-v1", templateVersion: "1.0.0", universityId: "aku", universityName: "Afyon Kocatepe Üniversitesi", instituteId: "fef-cografya", instituteName: "Fen Edebiyat Fakültesi · Coğrafya Bölümü", degreeType: "undergraduate", language: "tr", status: "official", displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Coğrafya Bölümü · Bitirme Tezi", selectors: {}, load: () => import("./templates/aku-cografya.js").then((module) => ({ default: module.akuCografyaLisans })) },
  { id: "aku-kimya-lisans-tr-v1", templateVersion: "1.0.0", universityId: "aku", universityName: "Afyon Kocatepe Üniversitesi", instituteId: "fef-kimya", instituteName: "Fen Edebiyat Fakültesi · Kimya Bölümü", degreeType: "undergraduate", language: "tr", status: "official", displayName: "Afyon Kocatepe Üniversitesi · Fen Edebiyat Fakültesi · Kimya Bölümü · Bitirme Tezi", selectors: {}, load: () => import("./templates/aku-kimya.js").then((module) => ({ default: module.akuKimyaLisans })) },
]);

const cache = new Map();

function matches(entry, selection) {
  for (const key of ["universityId", "instituteId", "degreeType", "language"]) {
    if (entry[key] && entry[key] !== selection?.[key]) return false;
  }
  for (const [key, value] of Object.entries(entry.selectors || {})) {
    if (selection?.[key] !== value && selection?.selectors?.[key] !== value) return false;
  }
  return true;
}

export function findThesisTemplateDescriptor(selection, registry = THESIS_TEMPLATE_REGISTRY) {
  if (selection?.templateId) return registry.find((entry) => entry.id === selection.templateId) || null;
  const candidates = registry.filter((entry) => matches(entry, selection));
  candidates.sort((a, b) => Object.keys(b.selectors || {}).length - Object.keys(a.selectors || {}).length || String(b.templateVersion || "").localeCompare(String(a.templateVersion || ""), undefined, { numeric: true }) || a.id.localeCompare(b.id));
  return candidates[0] || null;
}

/** Invalid/missing definitions fall back visibly; callers never receive malformed rules. */
export async function resolveThesisTemplate(selection, registry = THESIS_TEMPLATE_REGISTRY) {
  const registryErrors = validateThesisRegistry(registry);
  if (registryErrors.length) return { template: generic, fallback: true, reason: registryErrors.join("; ") };
  const descriptor = findThesisTemplateDescriptor(selection, registry);
  if (!descriptor) return { template: generic, fallback: true, reason: "Bu seçim için kayıtlı tez şablonu bulunamadı." };
  try {
    let template = cache.get(descriptor.id);
    if (!template) {
      const module = await descriptor.load();
      template = module.default ?? module;
      const errors = validateThesisTemplate(template);
      for (const key of ["id", "templateVersion", "universityId", "instituteId", "degreeType", "language"]) {
        if ((template[key] || "") !== (descriptor[key] || "")) errors.push(`${key}: registry ile şablon farklı`);
      }
      if (errors.length) throw new Error(errors.join("; "));
      cache.set(descriptor.id, template);
    }
    return { template, fallback: false, reason: "" };
  } catch (error) {
    return { template: generic, fallback: true, reason: `Şablon yüklenemedi: ${error?.message || error}` };
  }
}
