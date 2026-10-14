// Balanced <ul>/<ol> parsing for the non-DOM (Node) fallback of academicDocument.js.
// The DOM path (listBlock) keeps nested lists in `item.lists`; this mirrors that shape.

/** End offset of the balanced close tag for the list opened at `openIndex` (or -1). */
export function balancedListEnd(source, openIndex) {
  const edges = /<\/?(ul|ol)\b[^>]*>/gi;
  edges.lastIndex = openIndex;
  let depth = 0, edge;
  while ((edge = edges.exec(source))) {
    depth += edge[0].startsWith("</") ? -1 : 1;
    if (!depth) return { innerEnd: edge.index, end: edges.lastIndex };
  }
  return null;
}

/** Split list inner HTML into top-level <li> bodies, tracking nested <li>/<ul>/<ol> depth. */
function topLevelItems(inner) {
  const items = [];
  const tokens = /<(\/?)(li|ul|ol)\b[^>]*>/gi;
  let listDepth = 0, liStart = -1, liDepth = 0, token;
  while ((token = tokens.exec(inner))) {
    const closing = token[1] === "/", tag = token[2].toLowerCase();
    if (tag === "li") {
      if (!closing) { if (listDepth === 0 && liStart < 0) { liStart = tokens.lastIndex; liDepth = 1; } else if (liStart >= 0) liDepth += 1; }
      else if (liStart >= 0 && --liDepth === 0) { items.push(inner.slice(liStart, token.index)); liStart = -1; }
    } else if (liStart >= 0) {
      // nested list inside an item: depth tracked implicitly by li counting
    } else listDepth += closing ? -1 : 1;
  }
  return items;
}

/** Parse list inner HTML into the DOM-path item shape. `runsOf`/`textOf` come from the caller. */
export function regexListItems(inner, { runsOf, textOf }) {
  return topLevelItems(inner).map((body) => {
    const parts = [];
    let own = "", cursor = 0;
    const open = /<(ul|ol)\b([^>]*)>/gi;
    let match;
    while ((match = open.exec(body))) {
      const span = balancedListEnd(body, match.index);
      if (!span) break;
      own += body.slice(cursor, match.index);
      parts.push({ ordered: match[1].toLowerCase() === "ol", rawAttr: match[2] || "", inner: body.slice(match.index + match[0].length, span.innerEnd) });
      cursor = span.end;
      open.lastIndex = span.end;
    }
    own += body.slice(cursor);
    return {
      text: textOf(own),
      runs: runsOf(own),
      lists: parts.map((part) => ({ type: "list", ordered: part.ordered, className: (/class\s*=\s*"([^"]*)"/i.exec(part.rawAttr) || [])[1] || "", items: regexListItems(part.inner, { runsOf, textOf }) })),
    };
  });
}
