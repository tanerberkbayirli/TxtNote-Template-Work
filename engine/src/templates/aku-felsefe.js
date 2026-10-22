// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuFelsefeLisansData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-felsefe-lisans-tr-v1.json" with { type: "json" };
import akuFelsefeSeminerData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-felsefe-seminer-tr-v1.json" with { type: "json" };
const akuFelsefeLisans = akuFelsefeLisansData;
const akuFelsefeSeminer = akuFelsefeSeminerData;
export { akuFelsefeLisans, akuFelsefeSeminer };
export default akuFelsefeLisans;
