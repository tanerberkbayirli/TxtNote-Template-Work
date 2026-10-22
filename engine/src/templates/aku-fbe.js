// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuFbeMasterData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-fbe-master-tr-v1.json" with { type: "json" };
import akuFbePhdData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-fbe-phd-tr-v1.json" with { type: "json" };
const akuFbePhd = akuFbePhdData;
const akuFbeMaster = akuFbeMasterData;
export { akuFbeMaster, akuFbePhd };
export default akuFbeMaster;
