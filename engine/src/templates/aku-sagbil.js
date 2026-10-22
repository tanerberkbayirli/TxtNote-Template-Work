// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuSagbilMasterData from "./data/aku-sagbil-master-tr-v1.json" with { type: "json" };
import akuSagbilPhdData from "./data/aku-sagbil-phd-tr-v1.json" with { type: "json" };
const akuSagbilPhd = akuSagbilPhdData;
const akuSagbilMaster = akuSagbilMasterData;
export { akuSagbilMaster, akuSagbilPhd };
export default akuSagbilMaster;
