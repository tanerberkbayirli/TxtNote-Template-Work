// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuFbeMasterData from "./data/aku-fbe-master-tr-v1.json" with { type: "json" };
import akuFbePhdData from "./data/aku-fbe-phd-tr-v1.json" with { type: "json" };
const akuFbePhd = akuFbePhdData;
const akuFbeMaster = akuFbeMasterData;
export { akuFbeMaster, akuFbePhd };
export default akuFbeMaster;
