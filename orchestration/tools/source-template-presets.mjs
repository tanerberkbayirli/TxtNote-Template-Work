// Shared engine semantics only. University dimensions/fonts/sizes never live here.
import { WORD_FONT_METRICS } from '../../TxtNote/frontend/src/thesis/wordBaseline.js';
export function wordFlowPreset(fontFamily) {
  const metrics = WORD_FONT_METRICS[String(fontFamily).toLowerCase()];
  if (!metrics) throw new Error(`Unknown Word baseline metrics: ${fontFamily}`);
  return { mode: 'word', singleLineEm: metrics.ascent + metrics.descent + metrics.lineGap, baseline: 'word', paragraphSpacing: 'additive' };
}
