// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import afsuEczacilikProjeData from "./data/afsu-eczacilik-proje-lisans-tr-v1.json" with { type: "json" };
const afsuEczacilikProje = afsuEczacilikProjeData;
export { afsuEczacilikProje };
export default afsuEczacilikProje;
