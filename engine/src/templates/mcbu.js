// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import mcbuMasterData from "../../../Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/mcbu-lee-master-tr-v1.json" with { type: "json" };
import mcbuPhdData from "../../../Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/mcbu-lee-phd-tr-v1.json" with { type: "json" };
const mcbuPhd = mcbuPhdData;
const mcbuMaster = mcbuMasterData;
export { mcbuMaster, mcbuPhd };
export default mcbuMaster;
