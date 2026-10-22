# backend/

Empty on purpose. The uploaded code had no server, no persistence and no
network calls — everything lived in React state. This directory is the slot
that work goes into, and the list below is the whole job.

## The contract

`services/contracts.ts` is the specification. Every method there maps to one
endpoint, already sketched in `services/http/index.ts`. Build these and the
frontend switches over with an environment variable.

| Method | Endpoint | Returns |
| --- | --- | --- |
| `workspaces.list` | `GET /api/workspaces` | `Workspace[]` |
| `workspaces.create` | `POST /api/workspaces` | `Workspace` |
| `workspaces.update` | `PATCH /api/workspaces/:id` | `Workspace` |
| `workspaces.remove` | `DELETE /api/workspaces/:id` | `DeleteWorkspaceResult` |
| `content.listByWorkspace` | `GET /api/workspaces/:id/items` | `ContentItem[]` |
| `content.create` | `POST /api/items` | `ContentItem` |
| `content.update` | `PATCH /api/items/:id` | `ContentItem` |
| `content.remove` | `DELETE /api/items/:id` | `204` |
| `notes.get` | `GET /api/notes/:id` | `Note \| null` |
| `notes.save` | `PUT /api/notes/:id` | `204` |
| `sync.emitToPeers` | WebSocket `note.sync` (HTTP fallback `POST /api/sync/peer`) | `204` |
| `sync.saveToCloud` | `POST /api/notes/:id/backup` | `NoteVersion` |
| `sync.listHistory` | `GET /api/notes/:id/history` | `NoteVersion[]` |
| `sync.getVersion` | `GET /api/notes/:id/history/:versionId` | `NoteVersion \| null` |
| `trash.list` | `GET /api/trash` | `TrashEntry[]` |
| `trash.restore` | `POST /api/trash/:id/restore` | `ContentItem` |
| `trash.purge` | `DELETE /api/trash/:id` | `204` |
| `trash.empty` | `DELETE /api/trash` | `204` |
| `trash.isEnabled` | `GET /api/settings/trash-enabled` | `boolean` |
| `trash.setEnabled` | `PUT /api/settings/trash-enabled` | `204` |
| `background.uploadAvatar` | `POST /api/uploads/avatar` | `{ url: string }` |

Failures return a `ServiceError` body (see `types/index.ts`) with the matching
HTTP status. `message` is shown to the user as-is, so write it in Turkish.

## Rules the mock already enforces

Read `services/mock/index.ts` before writing the server — it is the reference
implementation, and these rules are load-bearing in the UI:

- **Workspace names** are trimmed, internal whitespace collapsed, max 32 chars,
  unique case-insensitively under Turkish casing (`i`/`İ`, `ı`/`I`).
- **Badges are derived**, never supplied by the client. First character of the
  normalised name, `toLocaleUpperCase("tr-TR")`.
- **Deleting a workspace cascades** to its items, and the response must include
  every removed item id — the client closes those tabs in a single pass.
- **The bin is a mode, not a table.** When it is off, deletes are permanent.
  Switching it off empties it immediately.
- **Retention is 30 days from `deletedAt`.** Move this to a server cron; the
  client sweep in `useTrash` exists only because the mock has nowhere else to
  run it, and should be deleted the day this ships.
- **Avatars** are images, 2 MB max. The server returns a URL; the client stops
  producing data URLs at that point.
- **Sync payload** is `NoteSyncPayload` (`types/index.ts`): `{ noteId, workspaceId,
  title, content, extras, updatedAt, hash, deviceId }`. Do not invent a second
  shape. Look for `BACKEND ENTEGRASYON NOKTASI` in `services/mock/sync.ts` and
  `services/http/index.ts`.
- **Cloud backup** must skip a write when `hash` matches the latest stored
  version for that note. A successful write becomes a `NoteVersion` row, newest
  first, returned by `GET /api/notes/:id/history`.
- **Peer fan-out** (`note.sync`) goes to the account's other live sessions and
  must not echo back to the sender. Lite/Freemium clients will not emit faster
  than every 5s; Premium may go down to 1s — enforce the same floors server-side.

## Background work

`background.sweepExpiredTrash` is the one asynchronous job. It belongs in a
scheduler, not in a request handler and not in a `setInterval` in the browser.
Anything else long-running — thumbnailing uploads, full-text indexing of notes,
export jobs — goes behind a new method on `BackgroundService` first, so the UI
gets a promise and a loading state rather than a blocked render.
