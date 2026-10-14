# Parked experiments — 2026-10-11

The user deferred long-document parity, remaining PDF/ChartEx export, and final general acceptance. These snapshots are diagnostic work, not active engine code or accepted output. Only this agent's exact-row wrapper and minimum-first-fragment additions were removed from active source; earlier user/agent edits were retained.

Retained validated fixes: imported list marker strut uses its own paragraph metrics; imported cell vertical alignment; native VML shape ID remapping/shared cross-run shapetype references; removal of obsolete gfxdata cache from emitted XML while original package remains preserved.

Long parity baseline before parked additions: SRC09 editor187/Word180. Exact inner-wrapper experiment174 (not accepted); isolated last table30→24/Word26. Adding minimum first-fragment constraint gave25/Word26 and matched the first nine page openings. Mixed exact/vMerge redistribution and later page drift remain unresolved. Browser table-cell height is only a minimum, so exact clipping needs an inner wrapper; Word additionally requires the declared atLeast row height to fit before starting its first fragment. Snapshot files retain this incomplete design and its persistence test, but are deliberately outside src.

ChartEx binary isolation: native mixed edit/save/reopen fails at Word SaveAs2 with RPC0x800706BE; removing only ChartEx passes (`no-chartex-word-edit.json`). SmartArt-only passes and independent XML confirms edited text in data/drawing parts. Valid source-derived SmartArt+ChartEx copy, without engine export, also fails at save (`chartex-source-word-edit.json`). Source ChartEx has fifteen cached points and an unavailable external oleObject workbook path. No workbook synthesis or new export behavior was installed.

Independent full SRC09 VML audit and Office2016 SDK validation: schema0,237uniqueIDs,146references,0unresolved,0duplicates,0gfxdata; see `../SRC09.schema.json` and `../SRC09.vml-audit.json`. These are structure/reference evidence, not final long-layout acceptance.

All completed measurement browsers close in finally. Own Vite5183/5184 sessions were stopped; owned Word test PIDs10172,31960,22128,21644 no longer exist. The earlier interrupted height-probe run may have left an unidentified browser; no unrelated browser/Word process was killed.
