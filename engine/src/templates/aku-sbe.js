// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuSbeMasterData from "./data/aku-sbe-master-tr-v1.json" with { type: "json" };
import akuSbePhdData from "./data/aku-sbe-phd-tr-v1.json" with { type: "json" };
import akuSbeSanattaYeterlikData from "./data/aku-sbe-sanatta-yeterlik-tr-v1.json" with { type: "json" };
import akuSbeMasterEnData from "./data/aku-sbe-master-en-v1.json" with { type: "json" };
import akuSbePhdEnData from "./data/aku-sbe-phd-en-v1.json" with { type: "json" };
const akuSbeMaster = akuSbeMasterData;
const akuSbePhd = akuSbePhdData;
const akuSbePhdEn = akuSbePhdEnData;
const akuSbeMasterEn = akuSbeMasterEnData;
const akuSbeSanattaYeterlik = akuSbeSanattaYeterlikData;
export { akuSbeMaster, akuSbePhd, akuSbeSanattaYeterlik, akuSbeMasterEn, akuSbePhdEn };
export default akuSbeMaster;
