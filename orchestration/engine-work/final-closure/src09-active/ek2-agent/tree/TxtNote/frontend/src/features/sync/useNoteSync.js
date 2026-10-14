/**
 * Three-lane note sync: local auto-save, peer debounce, cloud interval.
 *
 * The hook stores due-times rather than ticking React state, so the shell
 * does not re-render every countdown frame. `SyncTestPanel` reads `now`
 * itself and derives the remaining seconds.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { services, saveNote } from "@shared/services";
import { LOCAL_BACKUP_MS } from "../../config/limits";
import { clampCloudInterval, clampPeerDebounce } from "../../config/sync";
import { writeLocalBackup } from "./localBackup";
import { buildNotePayload, getDeviceId, hashNote, noteFromPayload } from "./payload";

const TICK_MS = 250;
const EMPTY_LANE = {
  status: "idle",
  savedAt: null,
  dueAt: null,
  error: null,
  skipped: false,
};

const lane = (patch = {}) => ({ ...EMPTY_LANE, ...patch });

const errorMessage = (error) =>
  error?.message || (typeof error === "string" ? error : "Beklenmeyen bir hata.");

export const useNoteSync = ({
  notes,
  workspaceIdFor,
  activeNoteId,
  planTier = "freemium",
  peerDebounceSeconds,
  cloudIntervalMinutes,
}) => {
  const deviceIdRef = useRef(getDeviceId());
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const workspaceIdForRef = useRef(workspaceIdFor);
  workspaceIdForRef.current = workspaceIdFor;
  const activeNoteIdRef = useRef(activeNoteId);
  activeNoteIdRef.current = activeNoteId;

  const peerMs = clampPeerDebounce(peerDebounceSeconds, planTier) * 1000;
  const cloudMs = clampCloudInterval(cloudIntervalMinutes, planTier) * 60 * 1000;
  const peerMsRef = useRef(peerMs);
  const cloudMsRef = useRef(cloudMs);
  peerMsRef.current = peerMs;
  cloudMsRef.current = cloudMs;

  const seenHashRef = useRef({});
  const prevNotesRef = useRef({});
  const localHashRef = useRef({});
  const peerHashRef = useRef({});
  const cloudHashRef = useRef({});
  const lastEditAtRef = useRef({});
  const cloudWindowStartRef = useRef({});
  const localDueAtRef = useRef({});
  const peerDueAtRef = useRef({});
  const cloudDueAtRef = useRef({});
  const localDirtyRef = useRef(new Set());
  const peerDirtyRef = useRef(new Set());
  const localInFlightRef = useRef(new Set());
  const peerInFlightRef = useRef(new Set());
  const cloudInFlightRef = useRef(new Set());
  const seededHistoryRef = useRef(new Set());

  const [networkErrorEnabled, setNetworkErrorEnabled] = useState(false);
  const networkErrorRef = useRef(false);
  networkErrorRef.current = networkErrorEnabled;

  const [lanes, setLanes] = useState({});
  const [historyEpoch, setHistoryEpoch] = useState(0);

  const patchLane = useCallback((noteId, name, next) => {
    setLanes((current) => {
      const existing = current[noteId] ?? { local: lane(), peer: lane(), cloud: lane() };
      const merged = { ...existing[name], ...next };
      if (
        existing[name].status === merged.status &&
        existing[name].savedAt === merged.savedAt &&
        existing[name].dueAt === merged.dueAt &&
        existing[name].error === merged.error &&
        existing[name].skipped === merged.skipped
      ) {
        return current;
      }
      return { ...current, [noteId]: { ...existing, [name]: merged } };
    });
  }, []);

  const payloadFor = useCallback((noteId) => {
    const note = notesRef.current[noteId];
    if (!note) return null;
    return buildNotePayload({
      noteId,
      workspaceId: workspaceIdForRef.current(noteId),
      note,
      deviceId: deviceIdRef.current,
    });
  }, []);

  /* -- observe edits ------------------------------------------------------- */

  useEffect(() => {
    const now = Date.now();
    const previous = prevNotesRef.current;
    Object.entries(notes).forEach(([noteId, note]) => {
      if (previous[noteId] === note) return;
      if (!(noteId in seenHashRef.current)) {
        seenHashRef.current[noteId] = null;
        return;
      }
      const workspaceId = workspaceIdFor(noteId);
      const hash = hashNote(noteId, workspaceId, note);
      if (seenHashRef.current[noteId] === hash) return;

      seenHashRef.current[noteId] = hash;
      lastEditAtRef.current[noteId] = now;
      localDirtyRef.current.add(noteId);
      peerDirtyRef.current.add(noteId);

      if (!localDueAtRef.current[noteId] || localDueAtRef.current[noteId] < now) {
        localDueAtRef.current[noteId] = now + LOCAL_BACKUP_MS;
      }
      peerDueAtRef.current[noteId] = now + peerMsRef.current;
      if (!cloudDueAtRef.current[noteId]) {
        cloudDueAtRef.current[noteId] = now + cloudMsRef.current;
        cloudWindowStartRef.current[noteId] = now;
      }

      patchLane(noteId, "local", { status: "pending", error: null });
      patchLane(noteId, "peer", {
        status: "pending",
        dueAt: peerDueAtRef.current[noteId],
        error: null,
      });
      patchLane(noteId, "cloud", {
        status: "pending",
        dueAt: cloudDueAtRef.current[noteId],
        skipped: false,
        error: null,
      });
    });
    prevNotesRef.current = notes;
  }, [notes, workspaceIdFor, patchLane]);

  /* -- cadence changes: keep remaining time, never speed past the new floor */

  useEffect(() => {
    const now = Date.now();
    Object.keys(peerDueAtRef.current).forEach((noteId) => {
      if (!peerDirtyRef.current.has(noteId)) return;
      const remaining = Math.max(0, peerDueAtRef.current[noteId] - now);
      peerDueAtRef.current[noteId] = now + Math.min(remaining, peerMs);
      patchLane(noteId, "peer", { dueAt: peerDueAtRef.current[noteId] });
    });
  }, [peerMs, patchLane]);

  useEffect(() => {
    const now = Date.now();
    Object.keys(cloudDueAtRef.current).forEach((noteId) => {
      const remaining = Math.max(0, cloudDueAtRef.current[noteId] - now);
      cloudDueAtRef.current[noteId] = now + Math.min(remaining, cloudMs);
      patchLane(noteId, "cloud", { dueAt: cloudDueAtRef.current[noteId] });
    });
  }, [cloudMs, patchLane]);

  /* -- tick: flush lanes whose due time has arrived ------------------------ */

  useEffect(() => {
    const flushLocal = async (noteId) => {
      if (localInFlightRef.current.has(noteId) || !localDirtyRef.current.has(noteId)) return;
      const payload = payloadFor(noteId);
      if (!payload) {
        localDirtyRef.current.delete(noteId);
        localDueAtRef.current[noteId] = null;
        return;
      }
      if (localHashRef.current[noteId] === payload.hash) {
        localDirtyRef.current.delete(noteId);
        localDueAtRef.current[noteId] = null;
        return;
      }

      localInFlightRef.current.add(noteId);
      localDueAtRef.current[noteId] = null;
      patchLane(noteId, "local", { status: "saving", error: null });
      try {
        await writeLocalBackup(payload);
        await saveNote(noteId, {
          ...noteFromPayload(payload),
          updatedAt: payload.updatedAt,
          workspaceId: payload.workspaceId,
        });
        if (!seededHistoryRef.current.has(noteId)) {
          await services.sync.saveToCloud(payload);
          seededHistoryRef.current.add(noteId);
        }
        localHashRef.current[noteId] = payload.hash;
        const latest = payloadFor(noteId);
        if (!latest || latest.hash === payload.hash) {
          localDirtyRef.current.delete(noteId);
        } else {
          localDueAtRef.current[noteId] = Date.now() + LOCAL_BACKUP_MS;
        }
        patchLane(noteId, "local", { status: "success", savedAt: Date.now(), error: null });
      } catch (error) {
        localDueAtRef.current[noteId] = Date.now() + LOCAL_BACKUP_MS;
        patchLane(noteId, "local", { status: "error", error: errorMessage(error) });
      } finally {
        localInFlightRef.current.delete(noteId);
      }
    };

    const flushPeer = async (noteId) => {
      if (peerInFlightRef.current.has(noteId) || !peerDirtyRef.current.has(noteId)) return;
      peerDueAtRef.current[noteId] = null;
      const payload = payloadFor(noteId);
      if (!payload) {
        peerDirtyRef.current.delete(noteId);
        return;
      }
      if (peerHashRef.current[noteId] === payload.hash) {
        peerDirtyRef.current.delete(noteId);
        patchLane(noteId, "peer", { status: "success", dueAt: null });
        return;
      }

      peerInFlightRef.current.add(noteId);
      patchLane(noteId, "peer", { status: "saving", dueAt: null, error: null });
      try {
        // BACKEND ENTEGRASYON NOKTASI — services.sync.emitToPeers
        if (networkErrorRef.current) {
          throw { code: "NETWORK", message: "Ağ hatası (simüle)." };
        }
        await services.sync.emitToPeers(payload);
        peerHashRef.current[noteId] = payload.hash;
        peerDirtyRef.current.delete(noteId);
        patchLane(noteId, "peer", { status: "success", savedAt: Date.now(), dueAt: null, error: null });
      } catch (error) {
        peerDueAtRef.current[noteId] = Date.now() + peerMsRef.current;
        patchLane(noteId, "peer", {
          status: "error",
          dueAt: peerDueAtRef.current[noteId],
          error: errorMessage(error),
        });
      } finally {
        peerInFlightRef.current.delete(noteId);
      }
    };

    const flushCloud = async (noteId) => {
      if (cloudInFlightRef.current.has(noteId) || !cloudDueAtRef.current[noteId]) return;
      const payload = payloadFor(noteId);
      if (!payload) {
        cloudDueAtRef.current[noteId] = null;
        return;
      }

      const windowStart = cloudWindowStartRef.current[noteId] ?? 0;
      const lastEdit = lastEditAtRef.current[noteId] ?? 0;
      const changedInWindow = lastEdit >= windowStart;
      const sameAsLastCloud = cloudHashRef.current[noteId] === payload.hash;

      cloudWindowStartRef.current[noteId] = Date.now();
      cloudDueAtRef.current[noteId] = Date.now() + cloudMsRef.current;

      if (!changedInWindow || sameAsLastCloud) {
        patchLane(noteId, "cloud", {
          status: "skipped",
          dueAt: cloudDueAtRef.current[noteId],
          skipped: true,
          error: null,
        });
        return;
      }

      cloudInFlightRef.current.add(noteId);
      patchLane(noteId, "cloud", {
        status: "saving",
        dueAt: cloudDueAtRef.current[noteId],
        skipped: false,
        error: null,
      });
      try {
        // BACKEND ENTEGRASYON NOKTASI — services.sync.saveToCloud
        if (networkErrorRef.current) {
          throw { code: "NETWORK", message: "Ağ hatası (simüle)." };
        }
        await services.sync.saveToCloud(payload);
        cloudHashRef.current[noteId] = payload.hash;
        setHistoryEpoch((value) => value + 1);
        patchLane(noteId, "cloud", {
          status: "success",
          savedAt: Date.now(),
          dueAt: cloudDueAtRef.current[noteId],
          skipped: false,
          error: null,
        });
      } catch (error) {
        patchLane(noteId, "cloud", {
          status: "error",
          dueAt: cloudDueAtRef.current[noteId],
          skipped: false,
          error: errorMessage(error),
        });
      } finally {
        cloudInFlightRef.current.delete(noteId);
      }
    };

    const tick = () => {
      const now = Date.now();

      Object.entries(localDueAtRef.current).forEach(([noteId, dueAt]) => {
        if (dueAt && now >= dueAt) void flushLocal(noteId);
      });

      Object.entries(peerDueAtRef.current).forEach(([noteId, dueAt]) => {
        if (dueAt && now >= dueAt) void flushPeer(noteId);
      });

      Object.entries(cloudDueAtRef.current).forEach(([noteId, dueAt]) => {
        if (dueAt && now >= dueAt) void flushCloud(noteId);
      });
    };

    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [patchLane, payloadFor]);

  const skipCloudInterval = useCallback(
    (noteId = activeNoteIdRef.current) => {
      if (!noteId) return;
      const now = Date.now();
      if (!cloudDueAtRef.current[noteId]) {
        cloudDueAtRef.current[noteId] = now;
        cloudWindowStartRef.current[noteId] = lastEditAtRef.current[noteId]
          ? lastEditAtRef.current[noteId] - 1
          : now - cloudMsRef.current;
      } else {
        cloudDueAtRef.current[noteId] = now;
      }
      patchLane(noteId, "cloud", { status: "pending", dueAt: now, skipped: false, error: null });
    },
    [patchLane],
  );

  const activeLanes = (activeNoteId && lanes[activeNoteId]) || {
    local: lane(),
    peer: lane(),
    cloud: lane(),
  };

  return {
    lanes: activeLanes,
    historyEpoch,
    networkErrorEnabled,
    setNetworkErrorEnabled,
    skipCloudInterval,
    peerDebounceMs: peerMs,
    cloudIntervalMs: cloudMs,
  };
};
