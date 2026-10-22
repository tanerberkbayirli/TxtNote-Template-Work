// Template data lives in Butun-Sablonlar (the complete template of each university, only values its official source states).
// Absent keys are filled by the engine (engineDefaults.js), never by another template. Edit the JSON, not this file.
import iyteMasterData from "../../../Butun-Sablonlar/Ege/İzmir Yüksek Teknoloji Enstitüsü/iyte-lee-master-en-v1.json" with { type: "json" };
import iytePhdData from "../../../Butun-Sablonlar/Ege/İzmir Yüksek Teknoloji Enstitüsü/iyte-lee-phd-en-v1.json" with { type: "json" };
import iyteArticlesMasterData from "../../../Butun-Sablonlar/Ege/İzmir Yüksek Teknoloji Enstitüsü/iyte-lee-articles-master-en-v1.json" with { type: "json" };
import iyteArticlesPhdData from "../../../Butun-Sablonlar/Ege/İzmir Yüksek Teknoloji Enstitüsü/iyte-lee-articles-phd-en-v1.json" with { type: "json" };
import iyteEeeData from "../../../Butun-Sablonlar/Ege/İzmir Yüksek Teknoloji Enstitüsü/iyte-eee-undergraduate-en-v1.json" with { type: "json" };
const iyteEee = iyteEeeData;
const iyteMaster = iyteMasterData;
const iytePhd = iytePhdData;
const iyteArticlesPhd = iyteArticlesPhdData;
const iyteArticlesMaster = iyteArticlesMasterData;
export { iyteMaster, iytePhd, iyteArticlesMaster, iyteArticlesPhd, iyteEee };
