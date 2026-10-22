// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuSbeMasterData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-sbe-master-tr-v1.json" with { type: "json" };
import akuSbePhdData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-sbe-phd-tr-v1.json" with { type: "json" };
import akuSbeSanattaYeterlikData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-sbe-sanatta-yeterlik-tr-v1.json" with { type: "json" };
import akuSbeMasterEnData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-sbe-master-en-v1.json" with { type: "json" };
import akuSbePhdEnData from "../../../Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/aku-sbe-phd-en-v1.json" with { type: "json" };
const akuSbeMaster = akuSbeMasterData;
const akuSbePhd = akuSbePhdData;
const akuSbePhdEn = akuSbePhdEnData;
const akuSbeMasterEn = akuSbeMasterEnData;
const akuSbeSanattaYeterlik = akuSbeSanattaYeterlikData;
export { akuSbeMaster, akuSbePhd, akuSbeSanattaYeterlik, akuSbeMasterEn, akuSbePhdEn };
export default akuSbeMaster;
