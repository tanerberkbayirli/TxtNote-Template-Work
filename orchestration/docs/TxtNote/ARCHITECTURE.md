# ARCHITECTURE.md

Attach this file instead of the codebase. It is deliberately short: a map, not
a mirror. If a change makes this file wrong, the change is not done.

---

## What this is

A workspace notes app, Turkish UI. Three panes: a sidebar (workspace switcher +
content list + nav rail), a tab bar, and a canvas that renders either a note
editor, the bin, or a placeholder. Content lives in workspaces; deleting it
moves it to a 30-day bin unless the bin is switched off.

**Stack:** React 19, Tailwind, `lucide-react` for icons. Desktop shell is
**Tauri 2** (`src-tauri/`). Global styles live in `frontend/src/index.css`.
No router, no state library.

**Persistence:** SQLite file in the Tauri app data directory (`txtnote.sqlite`).
Workspaces, notes, extras, trash, session and note history survive restart.
Note bodies are AES-256-GCM sealed with a key derived from the local Web3
wallet. The private key lives in the OS credential store (Windows Credential
Manager / Keychain), never in SQLite, localStorage, IndexedDB or an app file.
The public address is local metadata. The browser `vite` fallback uses IndexedDB
with the same snapshot and an in-memory wallet (no at-rest encryption there).
Crash-recovery IndexedDB writes remain as a secondary lane. Peer fan-out is
local-only until a real backend exists. Cloud-interval backups append rows to
`note_versions`.

---

## Directory map

```
types/            Every shared data shape. Imports nothing.
services/         The backend seam. Imports types only.
  contracts.ts      Interfaces the UI codes against
  wallet/           Temporary local-keyring Web3 provider (Privy-swappable)
  crypto/           Vault key (HKDF from wallet signature) + AES-256-GCM
  local/            SQLite (Tauri) / IndexedDB (browser) — the default
  mock/             In-memory implementation
  http/             Real implementation (stubbed, not wired)
  index.ts          Adapter selection — the only entry the UI may import
src-tauri/        Tauri 2 desktop shell. Builds the Windows installer.
frontend/src/
  app/              Shell: owns cross-feature state, wires panes together
  config/           Constants only: layout, limits, navigation, strings
  lib/              Pure functions: cn, id, text, time
  hooks/            Generic hooks: useNow, useDismiss, useIsomorphicLayoutEffect
  components/ui/    Feature-agnostic: Tooltip, ConfirmDialog, PinnedIndicator
  features/         One directory per feature, listed below
  thesis/           Versioned thesis schema, registry, engine, demo data and export
backend/          Empty. README is the spec. HTTP server slot, not the desktop app.
```

### Where each feature lives

| Feature | Path | Files | Largest |
| --- | --- | --- | --- |
| Shell / global state | `app/` | `App.jsx` | 450 |
| Undo / redo | `hooks/useUndoHistory.js`, `lib/undoHistory.js` | Ctrl+Z / Ctrl+Y command stack | — |
| Sidebar | `features/sidebar/` | `Sidebar.jsx`, `ContentTree.jsx`, `ContentRow.jsx`, `ItemContextMenu.jsx` | **~900** ⚠ |
| Workspaces | `features/workspace/` | `WorkspaceBadge`, `WorkspaceContextMenu`, `WorkspaceNameDialog`, `WorkspaceAvatarDialog` | 272 |
| Tabs | `features/tabs/` | `TabBar.jsx`, `ContentTab.jsx` | 70 |
| Note editor | `features/editor/` | `NoteEditor.jsx` | 207 |
| Mindmap | `features/mindmap/` | `MindmapEditor`, `MindmapPalette` | — |
| Sync / backup | `features/sync/` | `useNoteSync`, `SyncTestPanel`, `localBackup`, `payload` | — |
| Bin | `features/trash/` | `TrashView`, `TrashRow`, `TrashToggle` | 184 |
| Canvas routing | `features/canvas/` | `Canvas.jsx`, `CanvasMessage.jsx` | 86 |

⚠ `Sidebar.jsx` is the one file still over budget. Decomposition plan is in
`REFACTORING.md`, Phase 2. Do not add to it.

---

## Data models

Full definitions in `types/index.ts`. Shapes, in brief:

```ts
Workspace   { id, name, badge, isPinned, avatar: string|null }
ContentItem { id, workspaceId, title, type: "document"|"media",
              parentId, isPinned, isPrivate, isFavorite }
Note        { title, content }                    // keyed by ContentItem.id
Thesis note { noteType: "thesis", content: main body,
              researchData.thesis: template ref + fields + ordered section content }
NoteSyncPayload { noteId, workspaceId, title, content, extras,
                  updatedAt, hash, deviceId }
NoteVersion { id, noteId, createdAt, hash, payload, source: "cloud" }
TrashEntry  extends ContentItem { deletedAt: number, workspaceName: string }
Tab         { id, workspaceId, title, type }      // projection of ContentItem
NavId       "settings"|"profile"|"appearance"|"help"|"trash"
```

Three relationships worth remembering:

- A `Tab` is a **projection** of a `ContentItem`, not a copy — the id is shared,
  so renaming a note updates the row, the tab and the editor in one write.
- A `Note` is stored **apart** from its `ContentItem` so listing a workspace
  never carries note bodies.
- `ContentItem.parentId` is the **folder** the row sits in. Folders nest inside
  folders, so the sidebar walks the chain rather than reading one level; sibling
  order is the order of the `items` array, nothing else.
- `TrashEntry.workspaceName` is **denormalised on purpose** — the workspace may
  be deleted by the time the bin is read.

---

## Service contract

The UI calls `services.<domain>.<method>()` and never `fetch`. All methods are
async, all reject with `ServiceError { code, message, field? }`.

| Domain | Methods |
| --- | --- |
| `workspaces` | `list`, `create`, `update`, `remove` |
| `content` | `listByWorkspace`, `create`, `update`, `remove` |
| `notes` | `get`, `save` |
| `sync` | `emitToPeers`, `saveToCloud`, `listHistory`, `getVersion` |
| `trash` | `list`, `restore`, `purge`, `empty`, `isEnabled`, `setEnabled` |
| `background` | `sweepExpiredTrash`, `uploadAvatar` |

Endpoint mapping and server-side rules: `backend/README.md`.
The shipped application currently selects the local adapter in `services/index.ts`: SQLite on the Tauri desktop and IndexedDB in the browser. The adapter environment variable is not a supported runtime switch in this entry point; `mock`/`http` implementations are not selected by setting `VITE_SERVICE_ADAPTER`.

---

## Business rules that are easy to break

1. Deleting a workspace **cascades** to its items and must close their tabs in
   one pass — closing them one at a time reads a stale list each time.
2. An item restored from the bin whose workspace is gone gets **re-homed** to
   the current workspace, not restored into nothing.
3. Switching the bin **off empties it immediately**; while off, deletes are
   permanent and note text is dropped with the item.
4. Retention is **30 days from `deletedAt`**, swept on an interval. The sweep's
   updater returns the same array when nothing expired, so an idle session does
   not re-render.
5. Badges are **derived** from the name with Turkish casing (`i → İ`), never
   entered by hand.
6. Tabs are **scoped to their workspace** and survive switching away and back.
7. **Ctrl+Z / Ctrl+Y** walk an in-session command stack (typing, format, delete,
   move, rename, pin, mindmap). The stack is not persisted across restarts.
8. A row may never become **its own ancestor**. `lib/folder.js` refuses a folder
   dropped into its own subtree, and `nestWorkspaceItems` lifts a broken chain
   back to the root list instead of hiding the rows or looping forever.
9. Sidebar order is **array order**; `moveItemBeside` is the only writer for
   "move it up / down" and it adopts the target row's folder in the same pass.
   Pinned rows are still floated to the top of their own sibling group.

---

## Import rules

These are the constraints that keep the tree splittable. Each one is a
one-line grep in CI.

```
types/       →  imports nothing
services/    →  imports types/ only          (never frontend/)
config/,lib/,hooks/  →  no feature imports    (leaves of the graph)
features/*   →  may import lib, hooks, config, components/ui, types, services
             →  may NOT import another feature's internals, only its root export
app/         →  imports features; no feature imports app/
```

`services/mock` and `services/http` are imported by `services/index.ts` and
nothing else. One grep for those paths under `frontend/` is the whole test.

---

## Working on this without the full codebase

Attach this file plus only the rows you need.

| Task | Attach |
| --- | --- |
| Change a note editor behaviour | `features/editor/NoteEditor.jsx` |
| Change sync / backup cadence | `features/sync/*`, `config/sync.js`, `config/limits.js`, `services/mock/sync.ts` |
| Change the bin | `features/trash/*`, `types/index.ts` |
| Add a workspace field | `types/index.ts`, `services/mock/index.ts`, `features/workspace/*` |
| Add a nav destination | `config/navigation.js`, `features/canvas/Canvas.jsx` |
| Change tab behaviour | `app/App.jsx`, `features/tabs/*` |
| Change folder nesting, order or drag | `lib/folder.js`, `features/sidebar/ContentTree.jsx`, `features/sidebar/ContentRow.jsx` |
| Add an endpoint | `services/contracts.ts`, `services/mock/index.ts`, `services/http/index.ts` |
| Restyle a menu or dialog | the single component file |
| Change copy | `config/strings.js` |
| Change a size or limit | `config/layout.js` or `config/limits.js` |

If a task needs more than three files attached, that is a signal the boundary
is in the wrong place — say so rather than working around it.
