// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuFelsefeLisansData from "./data/aku-felsefe-lisans-tr-v1.json" with { type: "json" };
import akuFelsefeSeminerData from "./data/aku-felsefe-seminer-tr-v1.json" with { type: "json" };
const akuFelsefeLisans = akuFelsefeLisansData;
const akuFelsefeSeminer = akuFelsefeSeminerData;
export { akuFelsefeLisans, akuFelsefeSeminer };
export default akuFelsefeLisans;
