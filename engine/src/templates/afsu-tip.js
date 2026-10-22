// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import afsuTipUzmanlikData from "./data/afsu-tip-uzmanlik-tr-v1.json" with { type: "json" };
import afsuDisHekimligiUzmanlikData from "./data/afsu-dis-hekimligi-uzmanlik-tr-v1.json" with { type: "json" };
const afsuTipUzmanlik = afsuTipUzmanlikData;
const afsuDisHekimligiUzmanlik = afsuDisHekimligiUzmanlikData;
export { afsuTipUzmanlik, afsuDisHekimligiUzmanlik };
export default afsuTipUzmanlik;
