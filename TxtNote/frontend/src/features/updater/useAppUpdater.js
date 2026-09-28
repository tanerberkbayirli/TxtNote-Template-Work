/**
 * Checks the update server and installs a signed bundle when the user agrees.
 * No-op in the browser Vite fallback; only the Tauri shell can apply updates.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { isTauriRuntime } from "@shared/services";

export const useAppUpdater = ({ enabled = true } = {}) => {
  const [status, setStatus] = useState("idle");
  const [update, setUpdate] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const updateRef = useRef(null);

  const checkForUpdate = useCallback(async ({ silent = false } = {}) => {
    if (!isTauriRuntime()) return null;
    setStatus("checking");
    setError("");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const found = await check();
      updateRef.current = found ?? null;
      setUpdate(found ?? null);
      setStatus(found ? "available" : "upToDate");
      return found ?? null;
    } catch (err) {
      updateRef.current = null;
      setUpdate(null);
      if (silent) {
        setStatus("idle");
        return null;
      }
      setStatus("error");
      setError(err?.message || "Güncelleme denetimi başarısız.");
      return null;
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const pending = updateRef.current;
    if (!pending || !isTauriRuntime()) return false;
    setStatus("downloading");
    setProgress(0);
    setError("");
    try {
      let downloaded = 0;
      let total = 0;
      await pending.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data?.contentLength ?? 0;
          downloaded = 0;
          setProgress(0);
        } else if (event.event === "Progress") {
          downloaded += event.data?.chunkLength ?? 0;
          setProgress(total > 0 ? Math.min(1, downloaded / total) : 0);
        } else if (event.event === "Finished") {
          setProgress(1);
          setStatus("installing");
        }
      });
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
      return true;
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Güncelleme yüklenemedi.");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isTauriRuntime()) return undefined;
    const id = window.setTimeout(() => {
      void checkForUpdate({ silent: true });
    }, 1500);
    return () => window.clearTimeout(id);
  }, [enabled, checkForUpdate]);

  return {
    updateAvailable: Boolean(update),
    updateVersion: update?.version ?? "",
    updateNotes: update?.body ?? "",
    status,
    progress,
    error,
    checkForUpdate,
    installUpdate,
  };
};
