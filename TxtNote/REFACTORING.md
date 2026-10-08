# REFACTORING.md

Completed and started work, and the rules that keep it from re-collapsing. Unstarted Sidebar and shell-hook extraction tasks were removed at user request on 2026-10-08.

---

## Starting point

One file: `App.jsx`, 3,159 lines, 118 KB. 55 top-level declarations. No
backend, no API calls, no persistence, no storage — the entire app was React
state seeded from three hard-coded arrays.

That last point matters for the brief. There was no frontend/backend coupling
to break, because there was no backend. The context problem was **one file too
big to attach**, and a **missing service seam**, so the second half of the work
below builds the seam rather than splitting an existing one.

---

## Phase 1 — Mechanical split ✅ done

Every top-level declaration moved to a module owned by exactly one concern.
Imports resolved automatically from the reference graph. **Zero behaviour
change** — the extracted code is byte-identical apart from `export` keywords
and import headers, and all 32 modules parse clean.

3,159 lines → 32 files, median 52 lines.

### How to verify before you trust it

```bash
npx tsc --noEmit --noResolve --allowJs --jsx preserve \
  $(find frontend/src -name '*.js*')        # syntax
npx tsc --noEmit --strict services/**/*.ts types/*.ts   # types
npm run dev                                             # then click through
```

Click-through matters more than the compilers here: the split preserves
references, not React semantics. Check tab switching, workspace deletion with
open tabs, and restoring from the bin — those three touch the most state.

---

## Phase 3 — Move the app onto the service layer

Right now `App.jsx` and `Sidebar.jsx` still `import { DEFAULT_ITEMS } from
"@services/mock/fixtures"` — seed arrays reaching straight into components.
That was correct for Phase 1 (no behaviour change) and is wrong to keep.

Replace each with a call through `@shared/services`:

| Today | Becomes |
| --- | --- |
| `useState(DEFAULT_ITEMS)` | `useEffect` → `services.content.listByWorkspace(id)` |
| `useState(DEFAULT_TRASH)` | `services.trash.list()` |
| `useState(DEFAULT_WORKSPACES)` | `services.workspaces.list()` |
| inline `setTrash(filter(...))` | `services.trash.purge(id)` then refetch |
| `FileReader` in the avatar dialog | `services.background.uploadAvatar(file)` |
| the `setInterval` sweep in `App` | `services.background.sweepExpiredTrash()` |

The mock adapter has a deliberate 180 ms latency. Every one of these calls
therefore needs a loading state and an error path — that is the point, and it
is much cheaper to build them now than to retrofit them the week the real
backend lands. Leave `LATENCY_MS` alone in development; set it to `0` in tests.

Nothing under `frontend/` may import `services/mock` or `services/http` after
this phase. Only `@shared/services`.

---

## Phase 5 — TypeScript, incrementally

`types/index.ts` and all of `services/` are already TypeScript and pass
`--strict`. The components are `.jsx` and do not have to move in one go.

Type a `.jsx` file today, no build change, no rename:

```jsx
/** @type {import("@shared/types").ContentItem[]} */
const items = ...;
```

To convert properly, work leaf-first — `lib/`, then `hooks/`, then
`components/ui/`, then features, then `app/`. Renaming a leaf breaks nothing;
renaming `App.tsx` first makes every downstream error land at once. Turn on
`checkJs` in `jsconfig.json` when the leaves are done.

---

## The rules that keep it split

**One export per file, named after the file.** Constants and styles used by a
single component stay in that component's file. The moment a second file needs
them, they move to `config/` or `lib/`.

**Size budget.** 200 lines is the line to think at, 300 is the line to stop at.
Not a lint rule, a smell — a 250-line component is usually two components and a
hook.

**Dependency direction is one-way.** `types → services → features → app`. The
graph has no cycles today; the import rules in `ARCHITECTURE.md` are what keep
it that way, and each is a single grep.

**New backend work starts in `services/contracts.ts`.** Add the method, add it
to the mock, build the UI against the mock, then implement it in `http/` and
`backend/`. TypeScript will not let the two adapters drift.

**Update `ARCHITECTURE.md` in the same commit.** It is the file that gets
attached to every future prompt. Stale is worse than absent — an out-of-date map
produces confidently wrong answers rather than obviously missing ones.
