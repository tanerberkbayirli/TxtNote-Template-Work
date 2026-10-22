"""Compact view of a normalized spec: rules, sections (with layouts), decisions, gaps, checks."""
import json, sys
spec = json.load(open(sys.argv[1]))
part = sys.argv[2] if len(sys.argv) > 2 else "all"
short = lambda v, n=90: (json.dumps(v, ensure_ascii=False) if not isinstance(v, str) else v)[:n]
if part in ("all", "rules"):
    for r in spec.get("rules", []):
        print(f"{r['key']:<48} {short(r.get('value'),60):<60} {r.get('unit','') or '':<4} {r.get('confidence','')[:4]} {short(r.get('appliesTo'),30)}")
if part in ("all", "sections"):
    for s in spec.get("sections", []):
        print(f"\n## {s.get('id')} [{s.get('kind')}] '{s.get('title')}' req={s.get('required')} applies={short(s.get('appliesTo'),40)} pn={short(s.get('pageNumbering'),80)} toc={s.get('inToc')} newPage={s.get('startsNewPage')}")
        for b in s.get("layout", []) or []:
            print("   ", {k: v for k, v in b.items() if k not in ("evidence",) and v not in (None, "", [])})
if part in ("all", "decisions"):
    for c in spec.get("conflicts", []):
        print("CONFLICT", c.get("topic"), "=>", short(c.get("decision"), 200), "needsConfirmation" if c.get("needsConfirmation") else "")
    for u in spec.get("unknowns", []):
        print("UNKNOWN", short(u, 200))
    for g in spec.get("engineGaps", []):
        print("GAP", short(g.get("requirement"), 120), "|", short(g.get("suggestedGenericCapability"), 100))
if part in ("all", "checks"):
    for c in spec.get("measurableChecks", []):
        print("CHECK", c.get("id"), short(c.get("expected"), 40), c.get("unit"), c.get("tolerance"), short(c.get("what"), 100))
