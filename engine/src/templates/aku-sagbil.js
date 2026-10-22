// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuSagbilMasterData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-sagbil-master-tr-v1.json" with { type: "json" };
import akuSagbilPhdData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-sagbil-phd-tr-v1.json" with { type: "json" };
const akuSagbilPhd = akuSagbilPhdData;
const akuSagbilMaster = akuSagbilMasterData;
export { akuSagbilMaster, akuSagbilPhd };
export default akuSagbilMaster;
