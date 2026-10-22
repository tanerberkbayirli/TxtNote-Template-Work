// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuKimyaLisansData from "./data/aku-kimya-lisans-tr-v1.json" with { type: "json" };
const akuKimyaLisans = akuKimyaLisansData;
export { akuKimyaLisans };
export default akuKimyaLisans;
