// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import afsuLeeMasterData from "../../../Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/afsu-lee-master-tr-v1.json" with { type: "json" };
import afsuLeePhdData from "../../../Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/afsu-lee-phd-tr-v1.json" with { type: "json" };
const afsuLeeMaster = afsuLeeMasterData;
const afsuLeePhd = afsuLeePhdData;
export { afsuLeeMaster, afsuLeePhd };
export default afsuLeeMaster;
