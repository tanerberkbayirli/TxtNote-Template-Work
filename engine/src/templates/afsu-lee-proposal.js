// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import afsuLeeProposalMasterData from "./data/afsu-lee-proposal-master-tr-v1.json" with { type: "json" };
import afsuLeeProposalPhdData from "./data/afsu-lee-proposal-phd-tr-v1.json" with { type: "json" };
const afsuLeeProposalPhd = afsuLeeProposalPhdData;
const afsuLeeProposalMaster = afsuLeeProposalMasterData;
export { afsuLeeProposalMaster, afsuLeeProposalPhd };
export default afsuLeeProposalMaster;
