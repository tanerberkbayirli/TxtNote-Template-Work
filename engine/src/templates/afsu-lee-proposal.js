// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import afsuLeeProposalMasterData from "../../../Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/afsu-lee-proposal-master-tr-v1.json" with { type: "json" };
import afsuLeeProposalPhdData from "../../../Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/afsu-lee-proposal-phd-tr-v1.json" with { type: "json" };
const afsuLeeProposalPhd = afsuLeeProposalPhdData;
const afsuLeeProposalMaster = afsuLeeProposalMasterData;
export { afsuLeeProposalMaster, afsuLeeProposalPhd };
export default afsuLeeProposalMaster;
