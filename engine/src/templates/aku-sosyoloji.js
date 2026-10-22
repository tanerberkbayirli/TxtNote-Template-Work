// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import akuSosyolojiLisansData from "./data/aku-sosyoloji-lisans-tr-v1.json" with { type: "json" };
const akuSosyolojiLisans = akuSosyolojiLisansData;
export { akuSosyolojiLisans };
export default akuSosyolojiLisans;
