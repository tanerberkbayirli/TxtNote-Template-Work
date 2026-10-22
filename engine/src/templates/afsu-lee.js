// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import afsuLeeMasterData from "./data/afsu-lee-master-tr-v1.json" with { type: "json" };
import afsuLeePhdData from "./data/afsu-lee-phd-tr-v1.json" with { type: "json" };
const afsuLeeMaster = afsuLeeMasterData;
const afsuLeePhd = afsuLeePhdData;
export { afsuLeeMaster, afsuLeePhd };
export default afsuLeeMaster;
