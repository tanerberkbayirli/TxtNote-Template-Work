// Template data: engine/src/templates/data/*.json holds the complete template (only values the official source states; engine/docs/ALTYAPI.md).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import iyteMasterData from "./data/iyte-lee-master-en-v1.json" with { type: "json" };
import iytePhdData from "./data/iyte-lee-phd-en-v1.json" with { type: "json" };
import iyteArticlesMasterData from "./data/iyte-lee-articles-master-en-v1.json" with { type: "json" };
import iyteArticlesPhdData from "./data/iyte-lee-articles-phd-en-v1.json" with { type: "json" };
import iyteEeeData from "./data/iyte-eee-undergraduate-en-v1.json" with { type: "json" };
const iyteEee = iyteEeeData;
const iyteMaster = iyteMasterData;
const iytePhd = iytePhdData;
const iyteArticlesPhd = iyteArticlesPhdData;
const iyteArticlesMaster = iyteArticlesMasterData;
export { iyteMaster, iytePhd, iyteArticlesMaster, iyteArticlesPhd, iyteEee };
