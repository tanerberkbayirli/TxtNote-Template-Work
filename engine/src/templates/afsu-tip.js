// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import afsuTipUzmanlikData from "../../../Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/afsu-tip-uzmanlik-tr-v1.json" with { type: "json" };
import afsuDisHekimligiUzmanlikData from "../../../Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/afsu-dis-hekimligi-uzmanlik-tr-v1.json" with { type: "json" };
const afsuTipUzmanlik = afsuTipUzmanlikData;
const afsuDisHekimligiUzmanlik = afsuDisHekimligiUzmanlikData;
export { afsuTipUzmanlik, afsuDisHekimligiUzmanlik };
export default afsuTipUzmanlik;
