// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import mcbuMasterData from "./data/mcbu-lee-master-tr-v1.json" with { type: "json" };
import mcbuPhdData from "./data/mcbu-lee-phd-tr-v1.json" with { type: "json" };
const mcbuPhd = mcbuPhdData;
const mcbuMaster = mcbuMasterData;
export { mcbuMaster, mcbuPhd };
export default mcbuMaster;
