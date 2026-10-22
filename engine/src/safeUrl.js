/**
 * A URL attribute value whose scheme runs script (HE-GV-01). The browser drops ASCII tab/newline anywhere and C0
 * controls/spaces at the ends before reading a scheme, so "jav&#x09;ascript:" is "javascript:"; they are dropped
 * here too. No DOM, no dependencies: the editor sanitizer and the engine's print path share it.
 */
export function isDangerousUrl(value) {
  const compact = String(value ?? "").replace(/[\u0000- \u007F]+/g, "").toLowerCase();
  return /^(javascript|vbscript):/.test(compact) || /^data:(text\/html|image\/svg|application\/xhtml)/.test(compact);
}
