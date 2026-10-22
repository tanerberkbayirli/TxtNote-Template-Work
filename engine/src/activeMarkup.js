import { isDangerousUrl } from "./safeUrl.js";

/**
 * Removes markup that runs script from stored note HTML (HE-GV-02): script-bearing elements, event-handler and
 * srcdoc attributes, and URL attributes with a script scheme. The editor sanitizes what it loads, but a stored,
 * synced or imported note reaches the compiled model, the print frame and the exports without passing the editor;
 * this is the same rule set without a DOM (the engine also runs in Node). Ordinary editor HTML is returned unchanged.
 */
// Fast path: editor HTML (often megabytes of base64 images) is scanned only when something could be active: an
// active element, a handler/srcdoc attribute, a script scheme (possibly split or entity-encoded) or a script data type.
const ACTIVE = /<\/?(?:script|style|template|iframe|object|embed|applet|frameset|frame|noscript|base|meta|link|form|animate|animatemotion|animatetransform|set|handler|listener)\b|\s(?:on[a-z]+|srcdoc)\s*=|script|data:\s*(?:text\/html|image\/svg|application\/xhtml)|&#|&(?:colon|tab|newline);/i;
const CONTAINERS = /<(script|style|template|iframe|object|embed|applet|noscript)\b[\s\S]*?<\/\1\s*>/gi;
const TAGS = /<\/?(?:script|style|template|iframe|object|embed|applet|frameset|frame|noscript|base|meta|link|form|animate|animatemotion|animatetransform|set|handler|listener)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
const TAG = /<([a-zA-Z][\w:-]*)((?:[^"'<>]|"[^"]*"|'[^']*')*)>/g;
const ATTRIBUTE = /(\s+)([^\s=/>]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g;
const URL_ATTRIBUTES = new Set(["href", "src", "xlink:href", "action", "formaction", "poster", "background", "cite"]);

const NAMED = { colon: ":", tab: "\t", newline: "\n", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
const decodeEntities = (value) => value
  .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(Math.min(0x10ffff, parseInt(hex, 16))))
  .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(Math.min(0x10ffff, Number(dec))))
  .replace(/&([a-z]+);/gi, (all, name) => NAMED[name.toLowerCase()] ?? all);

export function stripActiveMarkup(html) {
  const source = String(html ?? "");
  if (!ACTIVE.test(source)) return source;
  return source
    .replace(CONTAINERS, "")
    .replace(TAGS, "")
    .replace(TAG, (tag, name, attributes) => `<${name}${attributes.replace(ATTRIBUTE, (attribute, space, attributeName, assignment = "") => {
      const lower = attributeName.toLowerCase();
      if (/^on[a-z]+$/.test(lower) || lower === "srcdoc") return "";
      if (URL_ATTRIBUTES.has(lower) && isDangerousUrl(decodeEntities(assignment.replace(/^\s*=\s*/, "").replace(/^["']|["']$/g, "")))) return "";
      return attribute;
    })}>`);
}
