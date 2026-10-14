/**
 * services/http/index.ts — the real backend adapter. Not wired up yet.
 *
 * Every method is a `TODO`, and that is the point: this file is the complete,
 * itemised list of what `backend/` has to expose. When all of them are filled
 * in, flip `VITE_SERVICE_ADAPTER=http` and nothing in `frontend/` changes.
 *
 * Keep the mock and this file symmetrical. If you add a method to one, the
 * TypeScript compiler will make you add it to the other — that is the guard
 * rail, don't route around it with `as any`.
 */

import type { AppServices } from "../contracts";
import type { ServiceError } from "../../types";

const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "/api";

const pathId = (id: string) => encodeURIComponent(id);

/** Single place where a transport failure becomes a `ServiceError`. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      credentials: "same-origin",
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw { code: "NETWORK", message: "Sunucuya ulaşılamadı." } satisfies ServiceError;
  }

  if (!response.ok) {
    // The server is expected to return a `ServiceError` body on failure.
    const body = await response.json().catch(() => null);
    throw (body ?? { code: "UNKNOWN", message: "Beklenmeyen bir hata." }) as ServiceError;
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

const notImplemented = (endpoint: string) => {
  throw new Error(`http adapter: ${endpoint} not implemented`);
};

export const httpServices: AppServices = {
  workspaces: {
    list: () => request("/workspaces"),
    create: (input) =>
      request("/workspaces", { method: "POST", body: JSON.stringify(input) }),
    update: (id, patch) =>
      request(`/workspaces/${pathId(id)}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id) => request(`/workspaces/${pathId(id)}`, { method: "DELETE" }),
  },

  content: {
    listByWorkspace: (workspaceId) => request(`/workspaces/${pathId(workspaceId)}/items`),
    create: (input) => request("/items", { method: "POST", body: JSON.stringify(input) }),
    update: (id, patch) =>
      request(`/items/${pathId(id)}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id) => request(`/items/${pathId(id)}`, { method: "DELETE" }),
  },

  notes: {
    get: (id) => request(`/notes/${pathId(id)}`),
    save: (id, note) => request(`/notes/${pathId(id)}`, { method: "PUT", body: JSON.stringify(note) }),
  },

  trash: {
    list: () => request("/trash"),
    restore: (id) => request(`/trash/${pathId(id)}/restore`, { method: "POST" }),
    purge: (id) => request(`/trash/${pathId(id)}`, { method: "DELETE" }),
    empty: () => request("/trash", { method: "DELETE" }),
    isEnabled: () => request("/settings/trash-enabled"),
    setEnabled: (enabled) =>
      request("/settings/trash-enabled", { method: "PUT", body: JSON.stringify({ enabled }) }),
  },

  background: {
    // Server-side cron once the backend exists — the client stops sweeping.
    sweepExpiredTrash: async () => [],
    uploadAvatar: () => notImplemented("POST /uploads/avatar"),
  },

  // BACKEND ENTEGRASYON NOKTASI — swap the mock for these four endpoints.
  // Payload: `NoteSyncPayload` (noteId, content, updatedAt, hash, …).
  sync: {
    // Real path: authenticated WebSocket `note.sync`. HTTP fallback below.
    emitToPeers: (payload) =>
      request("/sync/peer", { method: "POST", body: JSON.stringify(payload) }),
    saveToCloud: (payload) =>
      request(`/notes/${pathId(payload.noteId)}/backup`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listHistory: (noteId) => request(`/notes/${pathId(noteId)}/history`),
    getVersion: (noteId, versionId) =>
      request(`/notes/${pathId(noteId)}/history/${pathId(versionId)}`),
  },
};
