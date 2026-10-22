/**
 * Application shell. Owns cross-feature state (tabs, notes, items, trash)
 * and wires the three panes together. Composition only — no presentation.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  DEFAULT_PROFILE,
  bindDatabaseOwner,
  bootstrapWallet,
  exportEncryptedDatabaseToDesktop,
  hydrateFileUrl,
  forgetNote,
  flushWrites,
  isTauriRuntime,
  loadNotes,
  loadShell,
  openBlindPackageAsPeerDevice,
  restoreFromEncryptedPackage,
  saveSnapshot,
  sendSnapshotToBlindServer,
  services,
  unlockVault,
  wipeDeviceData,
  writeMedia,
  saveNote,
  rememberFileHandle,
  onSaveStatus,
} from "@shared/services";
import { isCryptoAuthSession, isCryptoProfile, readAuthSession } from "../features/auth/authSession";
import { useAutoLock } from "../hooks/useAutoLock";
import { endUserSession } from "../lib/sessionLock.js";
import { DEFAULT_TRASH_ENABLED, SAVE_RETRY_MS, TRASH_RETENTION_DAYS, TRASH_SWEEP_MS } from "../config/limits";
import { NAV_LINKS } from "../config/navigation";
import { UNTITLED_NOTE } from "../config/strings";
import { collectSubtree, isFolderItem } from "../lib/folder";
import { getFileExtension, stemFromRenameLabel } from "../lib/fileType";
import { useTheme } from "../features/appearance/useTheme";
import { useSettings } from "../features/settings/useSettings";
import { useAppUpdater } from "../features/updater/useAppUpdater";
import { UpdateAvailableToast } from "../features/updater/UpdateAvailableToast";
import { Sidebar } from "../features/sidebar/Sidebar";
import { TabBar } from "../features/tabs/TabBar";
import { WorkArea } from "../features/workarea/WorkArea";
import { readDragItem } from "../features/workarea/drag";
import { TxtNoteWordmark } from "../brand/TxtNoteWordmark.jsx";
import {
  collectTabIds,
  findLeafByTab,
  firstLeaf,
  makeLeaf,
  placeTabInTree,
  pruneMissingTabs,
  removeTabFromTree,
  setSplitRatio,
  showTabInFocusedPane,
} from "../features/workarea/layout";
import { useNoteSync } from "../features/sync/useNoteSync";
import { SyncNetworkToast } from "../features/sync/SyncNetworkToast";
import { SaveErrorToast } from "../features/sync/SaveErrorToast";
import { loadAllLocalBackups, notesMapFromBackups, peekLocalBackup, deleteLocalBackup } from "../features/sync/localBackup";
import { buildNotePayload, getDeviceId, noteFromPayload } from "../features/sync/payload";
import { useUndoHistory } from "../hooks/useUndoHistory";
import { INITIAL_NOTE_REVISION, stampCreated } from "../lib/entity";
import { createId } from "../lib/id";
import { migrateAcademicNote, promoteAcademicItem } from "../lib/researchMigrate";
import { htmlToPlainText } from "../lib/richText";
import { normalizeName } from "../lib/text";
import { DAY_MS } from "../lib/time";
import {
  ACTION_DELAY_MS,
  delayForReason,
  mindmapChangeKind,
  noteHistoryKey,
  todosChangeKind,
} from "../lib/undoHistory";
import { flashcardsChangeKind, sameFlashcardDeck, sanitizeDeck } from "../lib/flashcards.js";
import { revokePreviewUrl, tabFieldsFromItem, ITEM_TYPE_FILE } from "../lib/upload";
import { isTextEditableFile, detectFileKind, mimeFromExtension } from "../lib/fileType";
import { accessKindFor, shouldPersistBytes, storageModeFor } from "../lib/fileStorage";
import { forgetSessionFile, hasSessionFile, peekSessionFile, rememberSessionFile } from "../lib/fileSession";
import { materializeFileItem } from "../lib/fileOpen";
import { ingestUploads } from "../lib/ingestUpload";
import {
  createTemplateSeed,
  TEMPLATE_LIBRARY_TAB_ID,
  templateById,
} from "../lib/templates";
import { pickTodoDailyFields } from "../lib/todoDaily";
import { resolveThesisTemplate } from "../../../../engine/src/registry.js";
import { createThesisDocument } from "../../../../engine/src/document.js";
import { prepareThesisNote } from "../../../../engine/src/contentModel.js";

const Canvas = lazy(() =>
  import("../features/canvas/Canvas").then((mod) => ({ default: mod.Canvas })),
);

const asNote = (note) => {
  const now = Date.now();
  const migrated = prepareThesisNote(migrateAcademicNote(note));
  const flashcards = sanitizeDeck(migrated?.flashcards);
  return {
    title: migrated?.title ?? "",
    content: migrated?.content ?? "",
    todos: Array.isArray(migrated?.todos) ? migrated.todos : [],
    entries: migrated?.entries && typeof migrated.entries === "object" ? migrated.entries : {},
    mindmap: migrated?.mindmap ?? { nodes: [], edges: [] },
    ...(migrated?.researchData != null ? { researchData: migrated.researchData } : {}),
    ...(flashcards ? { flashcards } : {}),
    ...pickTodoDailyFields(migrated),
    createdAt: typeof migrated?.createdAt === "number" ? migrated.createdAt : now,
    updatedAt: typeof migrated?.updatedAt === "number" ? migrated.updatedAt : now,
    revision:
      typeof migrated?.revision === "number" && migrated.revision >= 1
        ? migrated.revision
        : INITIAL_NOTE_REVISION,
    workspaceId: typeof migrated?.workspaceId === "string" ? migrated.workspaceId : undefined,
    fileId: migrated?.fileId === undefined ? undefined : migrated.fileId,
    encoding: typeof migrated?.encoding === "string" ? migrated.encoding : undefined,
    languageId: typeof migrated?.languageId === "string" ? migrated.languageId : undefined,
    languageLocked: Boolean(migrated?.languageLocked),
  };
};

const visibleNoteIds = (session) => {
  const ids = new Set();
  if (!session || typeof session !== "object") return [];
  if (typeof session.activeTabId === "string" && session.activeTabId) {
    ids.add(session.activeTabId);
  }
  if (session.paneTrees && typeof session.paneTrees === "object") {
    Object.values(session.paneTrees).forEach((tree) => {
      collectTabIds(tree).forEach((id) => {
        if (id) ids.add(id);
      });
    });
  }
  return [...ids];
};

const runWhenIdle = (work) => {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(work, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(work, 1);
  return () => window.clearTimeout(id);
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [tabHistory, setTabHistory] = useState([]); // most recently used first
  const [activeTabId, setActiveTabId] = useState(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState("");
  // workspaceId → binary split tree. Each leaf is one open editor pane.
  const [paneTrees, setPaneTrees] = useState({});
  const [activeNavId, setActiveNavId] = useState(null);
  // id → { title, content }. Lives here, not in the editor, so switching tabs
  // and coming back leaves the note exactly as it was.
  const [notes, setNotes] = useState({});
  // The sidebar lists these and the trash screen shows the bin, so both read
  // from up here rather than each keeping a copy that could drift.
  const [items, setItems] = useState([]);
  const [trash, setTrash] = useState([]);
  const [isTrashEnabled, setIsTrashEnabled] = useState(DEFAULT_TRASH_ENABLED);

  // Theme choice and the clock-based switcher, shown on the Görünüm screen.
  const { theme, setTheme, schedule, toggleSchedule, updateScheduleRule } = useTheme();

  // Client-side preferences and the Tauri updater check for Ayarlar.
  const {
    updateNotificationsEnabled,
    toggleUpdateNotifications,
    autoLock,
    setAutoLock,
    peerDebounceSeconds,
    setPeerDebounceSeconds,
    cloudIntervalMinutes,
    setCloudIntervalMinutes,
    pinnedTemplateIds,
    togglePinnedTemplate,
  } = useSettings();
  const {
    updateAvailable,
    updateVersion,
    status: updateStatus,
    progress: updateProgress,
    error: updateError,
    checkForUpdate,
    installUpdate,
  } = useAppUpdater({ enabled: updateNotificationsEnabled });
  const [updateToastDismissed, setUpdateToastDismissed] = useState(false);

  useEffect(() => {
    if (!updateAvailable) setUpdateToastDismissed(false);
  }, [updateAvailable]);

  // Account details for the Profil screen. Mock for now; the shape is what the
  // backend will eventually serve, so only the source changes later.
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpFocusSection, setHelpFocusSection] = useState(null);
  const [testPlanOverride, setTestPlanOverride] = useState(null);
  const planTier = testPlanOverride ?? profile.plan?.tier ?? "freemium";

  const isCryptoUser =
    isCryptoProfile(profile) || isCryptoAuthSession(readAuthSession());

  useAutoLock(autoLock, {
    enabled: ready && !walletError && isCryptoUser,
  });

  const handleLogout = useCallback(async () => {
    await endUserSession();
  }, []);

  const updateDisplayName = useCallback((displayName) => {
    setProfile((current) => ({ ...current, displayName }));
  }, []);

  // Workspaces that have been deleted. An item restored from the bin cannot go
  // back to one of these, so it is re-homed instead of vanishing into a
  // workspace no list will ever show.
  const retiredWorkspaces = useRef(new Set());
  const purgedTrashIds = useRef(new Set());
  const snapshotRef = useRef(null);
  const persistEnabledRef = useRef(false);
  const hadDiskDataRef = useRef(false);
  const persistBlockedRef = useRef(false);
  const [saveError, setSaveError] = useState(null);
  const skipHydrationPersistRef = useRef(true);
  const persistNeededRef = useRef(false);
  const notesRef = useRef(notes);
  const itemsRef = useRef(items);
  const loadingNotesRef = useRef(new Set());
  const openingFilesRef = useRef(new Set());
  const historyShellRef = useRef(null);
  notesRef.current = notes;
  itemsRef.current = items;

  snapshotRef.current = {
    workspaces,
    items,
    trash,
    notes,
    trashEnabled: isTrashEnabled,
    session: {
      currentWorkspaceId,
      tabs,
      tabHistory,
      paneTrees,
      sidebarCollapsed,
      activeTabId,
    },
    profile,
  };

  historyShellRef.current = {
    workspaces,
    items,
    trash,
    notes,
    tabs,
    tabHistory,
    paneTrees,
    activeTabId,
    currentWorkspaceId,
    activeNavId,
    isTrashEnabled,
    retiredWorkspaces: [...retiredWorkspaces.current],
  };

  const applyHistorySlice = useCallback((slice) => {
    if ("workspaces" in slice) setWorkspaces(slice.workspaces);
    if ("items" in slice) setItems(slice.items);
    if ("trash" in slice) setTrash(slice.trash);
    if ("tabs" in slice) setTabs(slice.tabs);
    if ("tabHistory" in slice) setTabHistory(slice.tabHistory);
    if ("paneTrees" in slice) setPaneTrees(slice.paneTrees);
    if ("activeTabId" in slice) setActiveTabId(slice.activeTabId);
    if ("currentWorkspaceId" in slice) setCurrentWorkspaceId(slice.currentWorkspaceId);
    if ("activeNavId" in slice) setActiveNavId(slice.activeNavId);
    if ("isTrashEnabled" in slice) setIsTrashEnabled(slice.isTrashEnabled);
    if ("retiredWorkspaces" in slice) {
      retiredWorkspaces.current = new Set(slice.retiredWorkspaces ?? []);
    }
    if ("notes" in slice) {
      setNotes((current) => {
        const next = { ...current };
        Object.entries(slice.notes).forEach(([id, note]) => {
          if (note == null) delete next[id];
          else next[id] = note;
        });
        return next;
      });
    }
  }, []);

  const undoHistory = useUndoHistory({
    getSnapshot: () => historyShellRef.current,
    applySlice: applyHistorySlice,
    enabled: ready,
  });

  const setItemsTracked = useCallback((updater) => {
    undoHistory.begin("shell");
    setItems(updater);
  }, [undoHistory.begin]);

  const setTrashTracked = useCallback((updater) => {
    undoHistory.begin("shell");
    setTrash(updater);
  }, [undoHistory.begin]);

  const setWorkspacesTracked = useCallback((updater) => {
    undoHistory.begin("shell");
    setWorkspaces(updater);
  }, [undoHistory.begin]);

  // Tabs stay with the workspace they were opened in.
  const visibleTabs = useMemo(() => {
    const byId = Object.fromEntries(items.map((item) => [item.id, item]));
    return tabs
      .filter((tab) => tab.type === "system" || tab.workspaceId === currentWorkspaceId)
      .map((tab) => {
        const item = byId[tab.id];
        return item ? { ...tab, ...tabFieldsFromItem(item) } : tab;
      });
  }, [tabs, items, currentWorkspaceId]);

  const activeTab = useMemo(
    () => visibleTabs.find((tab) => tab.id === activeTabId) ?? null,
    [visibleTabs, activeTabId],
  );

  const activeNavLink = useMemo(
    () => NAV_LINKS.find((link) => link.id === activeNavId) ?? null,
    [activeNavId],
  );

  const activeNote = activeTab ? notes[activeTab.id] : undefined;

  const visibleFileIds = useMemo(() => {
    if (activeNavId) return new Set();
    const ids = new Set(collectTabIds(paneTrees[currentWorkspaceId]));
    if (activeTabId) ids.add(activeTabId);
    return ids;
  }, [paneTrees, currentWorkspaceId, activeTabId, activeNavId]);

  const openVisibleFile = useCallback(async (item) => {
    if (!item || item.type !== ITEM_TYPE_FILE) return;
    if (openingFilesRef.current.has(item.id)) return;
    const needsUrl = !item.url;
    const needsNote = isTextEditableFile(item) && !notesRef.current[item.id]?.content;
    if (!needsUrl && !needsNote && !hasSessionFile(item.id)) return;
    if (!needsUrl && !needsNote) return;

    openingFilesRef.current.add(item.id);
    try {
      if (isTextEditableFile(item) && !notesRef.current[item.id]?.content) {
        try {
          const loaded = await loadNotes([item.id]);
          if (loaded[item.id]) {
            setNotes((current) =>
              current[item.id] ? current : { ...current, [item.id]: asNote(loaded[item.id]) },
            );
          }
        } catch {
          // Fall through to the session file.
        }
      }
      const hasNote = Boolean(notesRef.current[item.id]?.content);
      const result = await materializeFileItem({
        item,
        isTauri: isTauriRuntime(),
        writeMedia,
        hydrateFileUrl,
        saveNote,
        skipNote: hasNote,
      });
      if (result.url || result.mediaPath) {
        setItems((current) =>
          current.map((row) =>
            row.id === item.id
              ? {
                  ...row,
                  url: result.url || row.url,
                  mediaPath: result.mediaPath || row.mediaPath,
                  needsReselect: false,
                  persistentAccess: Boolean(result.mediaPath || row.persistentAccess || hasSessionFile(item.id)),
                }
              : row,
          ),
        );
      }
      if (result.note) {
        setNotes((current) => ({
          ...current,
          [item.id]: current[item.id]
            ? { ...current[item.id], ...result.note, content: result.note.content }
            : asNote(result.note),
        }));
      }
    } finally {
      openingFilesRef.current.delete(item.id);
    }
  }, []);

  useEffect(() => {
    visibleFileIds.forEach((id) => {
      const item = itemsRef.current.find((row) => row.id === id);
      if (item?.type === ITEM_TYPE_FILE) void openVisibleFile(item);
    });

    const hidden = itemsRef.current.filter(
      (item) => item.type === ITEM_TYPE_FILE && !visibleFileIds.has(item.id),
    );
    if (hidden.length === 0) return;

    const hiddenIds = new Set(hidden.map((item) => item.id));
    hidden.forEach((item) => {
      if (typeof item.url === "string" && item.url.startsWith("blob:")) revokePreviewUrl(item);
      const note = notesRef.current[item.id];
      if (note && isTextEditableFile(item)) saveNote(item.id, note).catch(() => undefined); // reported via onSaveStatus
    });
    setItems((current) => {
      let changed = false;
      const next = current.map((item) => {
        if (!hiddenIds.has(item.id)) return item;
        if (typeof item.url === "string" && item.url.startsWith("blob:")) {
          changed = true;
          return { ...item, url: null };
        }
        return item;
      });
      return changed ? next : current;
    });
    setNotes((current) => {
      let changed = false;
      const next = { ...current };
      hidden.forEach((item) => {
        if (!next[item.id]) return;
        if (item.type !== ITEM_TYPE_FILE) return;
        delete next[item.id];
        changed = true;
      });
      return changed ? next : current;
    });
  }, [visibleFileIds, openVisibleFile]);

  const workspaceIdFor = useCallback(
    (noteId) =>
      items.find((row) => row.id === noteId)?.workspaceId ??
      tabs.find((row) => row.id === noteId)?.workspaceId ??
      currentWorkspaceId,
    [items, tabs, currentWorkspaceId],
  );

  const persistNow = useCallback(async () => {
    if (!persistNeededRef.current) return;
    if (persistBlockedRef.current) return;
    const snapshot = snapshotRef.current;
    if (!snapshot) return;
    if (
      persistEnabledRef.current === false &&
      (!Array.isArray(snapshot.workspaces) || snapshot.workspaces.length === 0)
    ) {
      return;
    }
    if (
      hadDiskDataRef.current &&
      (!Array.isArray(snapshot.workspaces) || snapshot.workspaces.length === 0)
    ) {
      return;
    }
    persistEnabledRef.current = true;
    persistNeededRef.current = false;
    try {
      await saveSnapshot(snapshot);
    } catch {
      // Not saved: keep it due so the retry below (and the next change) writes it again. The service reports the
      // failure to the save-status listener, which shows it (HE-VB-05).
      persistNeededRef.current = true;
    }
  }, []);

  useEffect(() => onSaveStatus((status) => setSaveError(status.ok ? null : status.error)), []);

  // While saving fails, keep retrying; a success clears the notice.
  useEffect(() => {
    if (!saveError) return undefined;
    const id = window.setInterval(() => {
      persistNeededRef.current = true;
      void persistNow();
    }, SAVE_RETRY_MS);
    return () => window.clearInterval(id);
  }, [saveError, persistNow]);

  const persistHistory = useCallback(async () => {
    const snapshot = snapshotRef.current;
    if (!snapshot?.notes) return;
    const deviceId = getDeviceId();
    const entries = Object.entries(snapshot.notes);
    for (const [noteId, note] of entries) {
      try {
        await services.sync.saveToCloud(
          buildNotePayload({
            noteId,
            workspaceId: workspaceIdFor(noteId),
            note,
            deviceId,
          }),
        );
      } catch {
        // Close path must still finish even if one version write fails.
      }
    }
  }, [workspaceIdFor]);

  const handleTestExportEncryptedDb = useCallback(async () => {
    await flushWrites();
    return exportEncryptedDatabaseToDesktop();
  }, []);

  const handleBlindRelaySend = useCallback(async () => {
    await flushWrites();
    return sendSnapshotToBlindServer();
  }, []);

  const handleBlindRelayOpen = useCallback(async (pkg) => {
    return openBlindPackageAsPeerDevice(pkg);
  }, []);

  const handleDeviceWipe = useCallback(async () => {
    await flushWrites();
    // Nothing in memory may be written back after the wipe.
    persistBlockedRef.current = true;
    persistEnabledRef.current = false;
    persistNeededRef.current = false;
    const result = await wipeDeviceData();
    window.setTimeout(() => window.location.reload(), 400);
    return result;
  }, []);

  const handleRestoreFromKey = useCallback(async ({ pkg, privateKey }) => {
    persistBlockedRef.current = true;
    persistEnabledRef.current = false;
    persistNeededRef.current = false;
    return restoreFromEncryptedPackage({ pkg, privateKey });
  }, []);

  const handleReloadApp = useCallback(() => {
    window.location.reload();
  }, []);

  const noteSync = useNoteSync({
    notes,
    workspaceIdFor,
    activeNoteId: activeTabId,
    planTier,
    peerDebounceSeconds,
    cloudIntervalMinutes,
  });

  const ensureNoteLoaded = useCallback((noteId, fallbackTitle = "") => {
    if (!noteId) return;
    if (notesRef.current[noteId] || loadingNotesRef.current.has(noteId)) return;

    const backup = peekLocalBackup(noteId);
    if (backup) {
      setNotes((current) =>
        current[noteId] ? current : { ...current, [noteId]: asNote(noteFromPayload(backup)) },
      );
      return;
    }

    loadingNotesRef.current.add(noteId);
    void loadNotes([noteId])
      .then((loaded) => {
        const next = loaded[noteId]
          ? asNote(loaded[noteId])
          : asNote({
              title: fallbackTitle === UNTITLED_NOTE ? "" : fallbackTitle,
            });
        setNotes((current) => (current[noteId] ? current : { ...current, [noteId]: next }));
      })
      .catch(() => {
        // Leave the pane on its loading state; another click retries.
      })
      .finally(() => {
        loadingNotesRef.current.delete(noteId);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cancelIdle = () => {};
    (async () => {
      let walletMeta = null;
      try {
        walletMeta = await bootstrapWallet();
        await unlockVault();
      } catch (error) {
        console.error("Cüzdan yüklenemedi", error);
        if (cancelled) return;
        if (isTauriRuntime()) {
          persistBlockedRef.current = true;
          persistEnabledRef.current = false;
          persistNeededRef.current = false;
          setWalletError(error?.message || "Cüzdan kasası açılamadı.");
          setReady(true);
          return;
        }
      }

      try {
        await bindDatabaseOwner();
      } catch (error) {
        console.error("Veritabanı cüzdana bağlanamadı", error);
      }

      let snapshot;
      try {
        snapshot = await loadShell();
      } catch (error) {
        console.error("Yerel veri yüklenemedi, yeniden deneniyor", error);
        await new Promise((resolve) => window.setTimeout(resolve, 200));
        snapshot = await loadShell();
      }
      if (cancelled) return;

      const session = snapshot.session && typeof snapshot.session === "object" ? snapshot.session : {};
      const sqliteNotes = {};
      const needed = visibleNoteIds(session).filter((id) => {
        const tab = (session.tabs || []).find((entry) => entry?.id === id);
        if (tab?.type === "system") return false;
        const item = (snapshot.items || []).find((row) => row?.id === id);
        if (item?.type === ITEM_TYPE_FILE && !isTextEditableFile(item)) return false;
        return true;
      });
      if (needed.length > 0) {
        try {
          const loaded = await loadNotes(needed);
          Object.entries(loaded).forEach(([id, note]) => {
            sqliteNotes[id] = asNote(note);
          });
        } catch (error) {
          console.error("Açık notlar yüklenemedi", error);
        }
      }
      if (cancelled) return;

      const loadedItems = (Array.isArray(snapshot.items) ? snapshot.items : []).map(promoteAcademicItem);
      setWorkspaces(Array.isArray(snapshot.workspaces) ? snapshot.workspaces : []);
      setItems(loadedItems);
      setTrash((Array.isArray(snapshot.trash) ? snapshot.trash : []).map(promoteAcademicItem));
      setNotes(sqliteNotes);
      setIsTrashEnabled(snapshot.trashEnabled !== false);

      const byId = Object.fromEntries(loadedItems.map((item) => [item.id, item]));
      if (Array.isArray(session.tabs)) {
        setTabs(
          session.tabs.map((tab) => {
            const item = byId[tab.id];
            return item
              ? {
                  ...tab,
                  title: item.title ?? tab.title,
                  url: item.url ?? tab.url,
                  fileKind: item.fileKind ?? tab.fileKind,
                  fileName: item.fileName ?? tab.fileName,
                  mimeType: item.mimeType ?? tab.mimeType,
                  noteType: promoteAcademicItem({ noteType: item.noteType ?? tab.noteType }).noteType,
                }
              : promoteAcademicItem(tab);
          }),
        );
      }
      if (Array.isArray(session.tabHistory)) setTabHistory(session.tabHistory);
      if (session.paneTrees && typeof session.paneTrees === "object") setPaneTrees(session.paneTrees);
      const firstWorkspaceId = snapshot.workspaces?.[0]?.id ?? "";
      setCurrentWorkspaceId(
        typeof session.currentWorkspaceId === "string" && session.currentWorkspaceId
          ? session.currentWorkspaceId
          : firstWorkspaceId,
      );
      if (typeof session.sidebarCollapsed === "boolean") setSidebarCollapsed(session.sidebarCollapsed);
      if (session.activeTabId) setActiveTabId(session.activeTabId);
      if (snapshot.profile && typeof snapshot.profile === "object") {
        setProfile((current) => ({ ...current, ...snapshot.profile }));
      }
      if (walletMeta?.address) {
        setProfile((current) => ({
          ...current,
          walletAddress: walletMeta.address,
          walletProvider: walletMeta.providerId,
        }));
      }
      const auth = readAuthSession();
      if (auth?.authenticated) {
        setProfile((current) => {
          const fromEmail =
            typeof auth.email === "string" && auth.email.includes("@")
              ? auth.email.split("@")[0]
              : "";
          return {
            ...current,
            displayName: current.displayName || auth.displayName || fromEmail,
            registrationMethod: current.registrationMethod || auth.registrationMethod || null,
            lastLoginAt: auth.at ?? current.lastLoginAt,
            createdAt: current.createdAt ?? auth.at ?? null,
          };
        });
      }
      hadDiskDataRef.current = (snapshot.workspaces?.length ?? 0) > 0;
      persistEnabledRef.current = true;
      skipHydrationPersistRef.current = true;
      persistNeededRef.current = false;
      setReady(true);

      cancelIdle = runWhenIdle(() => {
        void loadAllLocalBackups()
          .then((backups) => {
            if (cancelled) return;
            const backupNotes = notesMapFromBackups(backups);
            const visible = new Set(needed);
            setNotes((current) => {
              let changed = false;
              const next = { ...current };
              visible.forEach((id) => {
                if (next[id] || !backupNotes[id]) return;
                next[id] = asNote(backupNotes[id]);
                changed = true;
              });
              return changed ? next : current;
            });
          })
          .catch(() => {
            // Crash-recovery store is optional; SQLite already painted the UI.
          });
      });
    })().catch((error) => {
      console.error("Yerel veri yüklenemedi", error);
      hadDiskDataRef.current = true;
      persistBlockedRef.current = true;
      persistEnabledRef.current = false;
      persistNeededRef.current = false;
      setReady(true);
    });
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    if (skipHydrationPersistRef.current) {
      skipHydrationPersistRef.current = false;
      return undefined;
    }
    persistNeededRef.current = true;
    const timer = window.setTimeout(() => {
      void persistNow();
    }, 120);
    return () => {
      window.clearTimeout(timer);
      void persistNow();
    };
  }, [
    ready,
    persistNow,
    workspaces,
    items,
    trash,
    notes,
    isTrashEnabled,
    currentWorkspaceId,
    tabs,
    tabHistory,
    paneTrees,
    sidebarCollapsed,
    profile,
  ]);

  useEffect(() => {
    if (!ready) return undefined;
    const flush = () => {
      void persistNow();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void persistNow();
        void persistHistory();
      }
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [ready, persistNow, persistHistory]);

  useEffect(() => {
    if (!ready || !isTauriRuntime()) return undefined;
    let unlisten = () => {};
    let closing = false;
    (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const appWindow = getCurrentWindow();
        unlisten = await appWindow.onCloseRequested(async (event) => {
          // A second close event from destroy() must not be cancelled, or the
          // window stays open forever (Windows deadlock with preventDefault + destroy).
          if (closing) return;
          event.preventDefault();
          closing = true;
          try {
            await Promise.race([
              persistNow().then(() => flushWrites()),
              new Promise((resolve) => {
                window.setTimeout(resolve, 1500);
              }),
            ]);
          } catch (error) {
            console.error("Kapanış kaydı başarısız", error);
          }
          window.setTimeout(() => {
            void appWindow.destroy();
          }, 0);
        });
      } catch (error) {
        console.error("Pencere kapanış kaydı bağlanamadı", error);
      }
    })();
    return () => unlisten();
  }, [ready, persistNow]);

  // One title, three places: the editor, its tab and its sidebar row.
  const noteTitles = useMemo(() => {
    const titles = {};
    Object.entries(notes).forEach(([id, note]) => {
      titles[id] = normalizeName(htmlToPlainText(note.title ?? "")) || UNTITLED_NOTE;
    });
    return titles;
  }, [notes]);

  const openTab = useCallback((item) => {
    if (!item || isFolderItem(item)) return;
    setTabs((current) =>
      current.some((tab) => tab.id === item.id)
        ? current
        : [
            ...current,
            {
              id: item.id,
              workspaceId: item.workspaceId,
              ...tabFieldsFromItem(item),
            },
          ],
    );
    if (item.type === "document") {
      ensureNoteLoaded(item.id, item.title);
    }

    setTabHistory((current) => [item.id, ...current.filter((id) => id !== item.id)]);
    setActiveTabId(item.id);
    setActiveNavId(null);

    const workspaceId = item.workspaceId ?? currentWorkspaceId;
    setPaneTrees((trees) => ({
      ...trees,
      [workspaceId]: showTabInFocusedPane(trees[workspaceId], item.id, activeTabId),
    }));
  }, [activeTabId, currentWorkspaceId, ensureNoteLoaded]);

  const openTemplateLibrary = useCallback(() => {
    const systemTab = {
      id: TEMPLATE_LIBRARY_TAB_ID,
      title: "Şablonlar",
      type: "system",
      noteType: "templates",
    };
    setTabs((current) =>
      current.some((tab) => tab.id === TEMPLATE_LIBRARY_TAB_ID)
        ? current
        : [...current, systemTab],
    );
    setTabHistory((current) => [
      TEMPLATE_LIBRARY_TAB_ID,
      ...current.filter((id) => id !== TEMPLATE_LIBRARY_TAB_ID),
    ]);
    setActiveTabId(TEMPLATE_LIBRARY_TAB_ID);
    setActiveNavId(null);
  }, []);

  const handleUseTemplate = useCallback(
    (templateId) => {
      const template = templateById(templateId);
      const seed = createTemplateSeed(templateId);
      if (!template || !seed) return;

      const note = asNote({ ...seed, workspaceId: currentWorkspaceId });
      const title = normalizeName(htmlToPlainText(note.title ?? "")) || UNTITLED_NOTE;
      const created = stampCreated({
        id: createId("itm"),
        workspaceId: currentWorkspaceId,
        title,
        type: "document",
        noteType: template.noteType,
        parentId: null,
        isPinned: false,
        isPrivate: false,
        isFavorite: false,
      });

      notesRef.current = { ...notesRef.current, [created.id]: note };
      setItemsTracked((current) => [...current, created]);
      setNotes((current) => ({ ...current, [created.id]: note }));
      openTab(created);
    },
    [currentWorkspaceId, openTab, setItemsTracked],
  );

  const handleCreateAcademicFromTemplate = useCallback(
    (fromNoteId, seed) => {
      if (!seed) return;
      const source = items.find((row) => row.id === fromNoteId);
      const created = stampCreated({
        id: createId("itm"),
        workspaceId: source?.workspaceId ?? currentWorkspaceId,
        title: UNTITLED_NOTE,
        type: "document",
        noteType: "academic",
        parentId: source?.parentId ?? null,
        isPinned: false,
        isPrivate: false,
        isFavorite: false,
      });
      const note = asNote({
        title: "",
        content: seed.content,
        researchData: seed.researchData,
      });
      notesRef.current = { ...notesRef.current, [created.id]: note };
      setItemsTracked((list) => [...list, created]);
      setNotes((current) => ({ ...current, [created.id]: note }));
      openTab(created);
    },
    [currentWorkspaceId, items, openTab, setItemsTracked],
  );

  const handleCreateThesis = useCallback(async (selection) => {
    const resolved = await resolveThesisTemplate(selection);
    const template = resolved.template;
    const created = stampCreated({
      id: createId("itm"), workspaceId: currentWorkspaceId, title: UNTITLED_NOTE,
      type: "document", noteType: "thesis", parentId: null,
      isPinned: false, isPrivate: false, isFavorite: false,
    });
    const note = asNote({
      title: "", content: "", workspaceId: currentWorkspaceId,
      researchData: { thesis: {
        ...createThesisDocument(template, selection),
        fallback: resolved.fallback,
        fallbackReason: resolved.reason,
      } },
    });
    notesRef.current = { ...notesRef.current, [created.id]: note };
    setItemsTracked((current) => [...current, created]);
    setNotes((current) => ({ ...current, [created.id]: note }));
    openTab(created);
  }, [currentWorkspaceId, openTab, setItemsTracked]);

  const selectTab = useCallback((tabId) => {
    const tab = tabs.find((entry) => entry.id === tabId);
    if (tab?.type === "system") {
      setTabHistory((current) => [tabId, ...current.filter((id) => id !== tabId)]);
      setActiveTabId(tabId);
      setActiveNavId(null);
      return;
    }
    const item = itemsRef.current.find((row) => row.id === tabId);
    if (!item || item.type !== ITEM_TYPE_FILE) ensureNoteLoaded(tabId);
    setTabHistory((current) => [tabId, ...current.filter((id) => id !== tabId)]);
    setActiveTabId(tabId);
    setActiveNavId(null);
    setPaneTrees((trees) => ({
      ...trees,
      [currentWorkspaceId]: showTabInFocusedPane(trees[currentWorkspaceId], tabId, activeTabId),
    }));
  }, [tabs, activeTabId, currentWorkspaceId, ensureNoteLoaded]);

  /** Removes a tab and, if it was the active one, hands focus to the next best. */
  const dropTab = useCallback(
    (tabId) => {
      const scoped = tabs.filter(
        (tab) => tab.type === "system" || tab.workspaceId === currentWorkspaceId,
      );
      const closedIndex = scoped.findIndex((tab) => tab.id === tabId);
      const remaining = tabs.filter((tab) => tab.id !== tabId);
      const remainingHistory = tabHistory.filter((id) => id !== tabId);
      const scopedRemaining = remaining.filter(
        (tab) => tab.type === "system" || tab.workspaceId === currentWorkspaceId,
      );
      const lastActiveId = remainingHistory.find((id) =>
        scopedRemaining.some((tab) => tab.id === id),
      );
      const neighbour = scopedRemaining[closedIndex] ?? scopedRemaining[closedIndex - 1] ?? null;
      const fallbackId = lastActiveId ?? neighbour?.id ?? null;
      const remainingTree = removeTabFromTree(paneTrees[currentWorkspaceId], tabId);
      const nextTree = remainingTree ?? (fallbackId ? makeLeaf(fallbackId) : null);

      setTabs(remaining);
      setTabHistory(remainingHistory);
      setPaneTrees((trees) => ({ ...trees, [currentWorkspaceId]: nextTree }));

      const stillVisible = findLeafByTab(nextTree, activeTabId === tabId ? null : activeTabId);
      if (!stillVisible) {
        const nextId = firstLeaf(nextTree)?.tabId ?? null;
        if (nextId) ensureNoteLoaded(nextId);
        setActiveTabId(nextId);
      }
    },
    [tabs, tabHistory, activeTabId, currentWorkspaceId, paneTrees, ensureNoteLoaded],
  );

  const resolveDroppedItem = useCallback(
    (event) => {
      const payload = readDragItem(event);
      if (!payload?.id) return null;
      return (
        items.find((row) => row.id === payload.id) ??
        tabs.find((row) => row.id === payload.id) ??
        (payload.type || payload.title ? payload : null)
      );
    },
    [items, tabs],
  );

  const handleDropEmpty = useCallback(
    (event) => {
      const item = resolveDroppedItem(event);
      if (!item || isFolderItem(item)) return;
      openTab(item);
    },
    [resolveDroppedItem, openTab],
  );

  const placeItemInPane = useCallback((item, payload) => {
    if (!item || isFolderItem(item)) return;

    const leafId = payload?.leafId;
    const nodeId = payload?.nodeId ?? leafId;
    const edge = payload?.edge;

    const workspaceId = item.workspaceId ?? currentWorkspaceId;
    setTabs((current) =>
      current.some((tab) => tab.id === item.id)
        ? current
        : [
            ...current,
            {
              id: item.id,
              workspaceId: item.workspaceId,
              ...tabFieldsFromItem(item),
            },
          ],
    );
    if (item.type === "document") {
      ensureNoteLoaded(item.id, item.title);
    }
    setTabHistory((current) => [item.id, ...current.filter((id) => id !== item.id)]);
    setActiveTabId(item.id);
    setActiveNavId(null);

    setPaneTrees((trees) => ({
      ...trees,
      [workspaceId]: placeTabInTree(trees[workspaceId], item.id, { leafId, nodeId, edge }),
    }));
  }, [currentWorkspaceId, ensureNoteLoaded]);

  const handleDropOnLeaf = useCallback(
    (payload, event) => {
      placeItemInPane(resolveDroppedItem(event), payload);
    },
    [placeItemInPane, resolveDroppedItem],
  );

  const handleTabDropOnPane = useCallback(
    (tabId, payload) => {
      const item = items.find((row) => row.id === tabId) ?? tabs.find((row) => row.id === tabId);
      placeItemInPane(item, payload);
    },
    [items, tabs, placeItemInPane],
  );

  const openBeside = useCallback(
    (item) => {
      if (!item || isFolderItem(item)) return;
      const workspaceId = item.workspaceId ?? currentWorkspaceId;
      const tree = paneTrees[workspaceId];
      const focused = findLeafByTab(tree, activeTabId) ?? firstLeaf(tree);
      placeItemInPane(item, {
        leafId: focused?.id,
        nodeId: focused?.id,
        edge: "right",
      });
    },
    [activeTabId, currentWorkspaceId, paneTrees, placeItemInPane],
  );

  const handlePaneRatioChange = useCallback(
    (splitId, ratio) => {
      setPaneTrees((trees) => ({
        ...trees,
        [currentWorkspaceId]: setSplitRatio(trees[currentWorkspaceId], splitId, ratio),
      }));
    },
    [currentWorkspaceId],
  );

  const handleWorkspaceChange = useCallback(
    (workspace) => {
      setCurrentWorkspaceId(workspace.id);
      setActiveNavId(null);

      const scoped = tabs.filter((tab) => tab.type === "system" || tab.workspaceId === workspace.id);
      const lastActiveId = tabHistory.find((id) => scoped.some((tab) => tab.id === id));
      const nextActive = lastActiveId ?? scoped[0]?.id ?? null;
      setActiveTabId(nextActive);
      const allowed = scoped.map((tab) => tab.id);
      let tree = pruneMissingTabs(paneTrees[workspace.id], allowed);
      if (!tree && nextActive) tree = makeLeaf(nextActive);
      collectTabIds(tree).forEach((id) => {
        if (id === TEMPLATE_LIBRARY_TAB_ID) return;
        const row = itemsRef.current.find((entry) => entry.id === id);
        if (!row || row.type !== ITEM_TYPE_FILE) ensureNoteLoaded(id);
      });
      if (nextActive) {
        if (nextActive === TEMPLATE_LIBRARY_TAB_ID) {
          setPaneTrees((trees) => ({ ...trees, [workspace.id]: tree ?? null }));
          return;
        }
        const row = itemsRef.current.find((entry) => entry.id === nextActive);
        if (!row || row.type !== ITEM_TYPE_FILE) ensureNoteLoaded(nextActive);
      }
      setPaneTrees((trees) => ({ ...trees, [workspace.id]: tree ?? null }));
    },
    [tabs, tabHistory, paneTrees, ensureNoteLoaded],
  );

  const handleNavigate = useCallback((navId) => {
    setActiveNavId(navId);
    setActiveTabId(null);
    setHelpFocusSection(null);
  }, []);

  const openHelpSection = useCallback((section) => {
    setHelpFocusSection(section);
    setActiveNavId("help");
    setActiveTabId(null);
  }, []);

  // Renaming in the editor renames the tab and sidebar row in the same keystroke.
  const renameRow = (row, title) => {
    if (row.fileName) {
      const stem = stemFromRenameLabel(title, row.fileName) || row.title;
      const ext = getFileExtension(row.fileName);
      return { ...row, title: stem, fileName: ext ? `${stem}.${ext}` : row.fileName };
    }
    return { ...row, title };
  };

  const commitNoteShell = useCallback((delay, commit) => {
    if (delay === ACTION_DELAY_MS) {
      flushSync(commit);
      undoHistory.flushPending();
      return;
    }
    commit();
  }, [undoHistory.flushPending]);

  const updateNoteTitle = useCallback((noteId, title, reason) => {
    if (undoHistory.isApplying()) return;
    const delay = delayForReason(reason);
    undoHistory.begin(noteHistoryKey(noteId, "title", reason), delay);
    const label = normalizeName(htmlToPlainText(title)) || UNTITLED_NOTE;
    commitNoteShell(delay, () => {
      setNotes((current) =>
        current[noteId]
          ? { ...current, [noteId]: { ...current[noteId], title } }
          : current,
      );
      setTabs((current) => current.map((tab) => (tab.id === noteId ? renameRow(tab, label) : tab)));
      setItems((current) => current.map((item) => (item.id === noteId ? renameRow(item, label) : item)));
    });
  }, [commitNoteShell, undoHistory.begin, undoHistory.isApplying]);

  const handleItemRename = useCallback((itemId, title) => {
    const label = normalizeName(title);
    if (!label) return;
    setTabs((current) => current.map((tab) => (tab.id === itemId ? renameRow(tab, label) : tab)));
    setNotes((current) =>
      current[itemId]
        ? { ...current, [itemId]: { ...current[itemId], title: label, updatedAt: Date.now() } }
        : current,
    );
  }, []);

  const reorderTabs = useCallback((draggedId, targetId, place) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    setTabs((current) => {
      const dragged = current.find((tab) => tab.id === draggedId);
      const target = current.find((tab) => tab.id === targetId);
      if (!dragged || !target || dragged.workspaceId !== target.workspaceId) return current;
      const without = current.filter((tab) => tab.id !== draggedId);
      const targetIndex = without.findIndex((tab) => tab.id === targetId);
      if (targetIndex < 0) return current;
      const insertAt = place === "after" ? targetIndex + 1 : targetIndex;
      return [...without.slice(0, insertAt), dragged, ...without.slice(insertAt)];
    });
  }, []);

  const updateNoteContent = useCallback((noteId, content, reason) => {
    if (undoHistory.isApplying()) return;
    const delay = delayForReason(reason);
    undoHistory.begin(noteHistoryKey(noteId, "content", reason), delay);
    commitNoteShell(delay, () => {
      setNotes((current) => ({
      ...current,
      [noteId]: prepareThesisNote({ ...current[noteId], content, updatedAt: Date.now() }),
    }));
    });
  }, [commitNoteShell, undoHistory.begin, undoHistory.isApplying]);

  // The to-do and diary editors patch their own slice (todos / entries).
  const updateNote = useCallback((noteId, patch, reason) => {
    if (undoHistory.isApplying()) return;
    const currentNote = notesRef.current[noteId];

    if (patch.mindmap && currentNote?.mindmap) {
      if (
        currentNote.mindmap.nodes === patch.mindmap.nodes &&
        currentNote.mindmap.edges === patch.mindmap.edges
      ) {
        return;
      }
    }

    if (patch.flashcards && sameFlashcardDeck(currentNote?.flashcards, patch.flashcards)) {
      return;
    }

    let field = "note";
    let burst = reason;
    if (patch.content !== undefined) field = "content";
    else if (patch.title !== undefined) field = "title";
    else if (patch.todos !== undefined || patch.todoPlan !== undefined) {
      field = "todos";
      burst = todosChangeKind(
        currentNote?.todos,
        patch.todos ?? currentNote?.todos,
        currentNote?.todoPlan,
        patch.todoPlan ?? currentNote?.todoPlan,
      );
    } else if (patch.entries !== undefined) field = "entries";
    else if (patch.mindmap !== undefined) {
      field = "mindmap";
      burst = mindmapChangeKind(currentNote?.mindmap, patch.mindmap);
    } else if (patch.flashcards !== undefined) {
      field = "flashcards";
      burst = flashcardsChangeKind(currentNote?.flashcards, patch.flashcards);
    }

    undoHistory.begin(noteHistoryKey(noteId, field, burst), delayForReason(burst));
    setNotes((current) => ({
      ...current,
      [noteId]: prepareThesisNote({ ...current[noteId], ...patch, updatedAt: Date.now() }),
    }));
  }, [undoHistory.begin, undoHistory.isApplying]);

  const restoreNoteVersion = useCallback((noteId, version) => {
    undoHistory.begin("shell");
    const next = asNote(noteFromPayload(version.payload));
    const label = normalizeName(htmlToPlainText(next.title ?? "")) || UNTITLED_NOTE;
    setNotes((current) => ({ ...current, [noteId]: { ...current[noteId], ...next } }));
    setTabs((current) =>
      current.map((tab) => (tab.id === noteId ? { ...tab, title: label } : tab)),
    );
    setItems((current) =>
      current.map((item) => (item.id === noteId ? { ...item, title: label } : item)),
    );
  }, [undoHistory.begin]);

  const handleUploadContent = useCallback((result) => {
    const incoming = result?.notes && typeof result.notes === "object" ? result.notes : {};
    const entries = Object.entries(incoming);
    if (entries.length === 0) return;
    setNotes((current) => {
      const next = { ...current };
      entries.forEach(([id, note]) => {
        next[id] = asNote(note);
      });
      return next;
    });
  }, []);

  const handleReplaceFile = useCallback(async (itemId, file) => {
    if (!itemId || !file) return;
    const mimeType = file.type || mimeFromExtension(file.name);
    const kind = detectFileKind({ name: file.name, type: mimeType });
    const tauri = isTauriRuntime();
    const persist = shouldPersistBytes({
      name: file.name,
      type: mimeType,
      size: file.size,
      kind,
      isTauri: tauri,
    });
    let url = null;
    let mediaPath = null;
    if (persist) {
      try {
        const written = await writeMedia(itemId, file, mimeType);
        if (typeof written === "string") {
          url = written;
        } else if (written) {
          url = written.url;
          mediaPath = written.mediaPath;
        }
      } catch {
        url = null;
      }
    }
    if (!url) {
      try {
        url = URL.createObjectURL(file);
      } catch {
        url = null;
      }
    }
    const patch = {
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      fileKind: kind,
      url,
      mediaPath,
      needsReselect: !persist && !url,
      persistentAccess: persist,
      storageMode: storageModeFor({
        name: file.name,
        type: mimeType,
        size: file.size,
        kind,
        isTauri: tauri,
      }),
      accessKind: mediaPath
        ? "mediaPath"
        : accessKindFor({
            name: file.name,
            type: mimeType,
            size: file.size,
            kind,
            isTauri: tauri,
          }),
    };
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    );
    rememberSessionFile(itemId, file);
    if (isTextEditableFile({ ...patch, type: "file" })) {
      try {
        const text = await file.text();
        const note = asNote({ title: file.name, content: text });
        setNotes((current) => ({ ...current, [itemId]: note }));
        void saveNote(itemId, note);
      } catch {
        // Binary reattach — preview URL is enough.
      }
    }
  }, []);

  const handleExtractArchive = useCallback(async (item) => {
    if (!item?.id) return;
    let file = peekSessionFile(item.id)?.file || null;
    if (!file) {
      try {
        const hydrated = await hydrateFileUrl(item.id, item.mediaPath);
        file = hydrated?.file || null;
        if (hydrated?.file) rememberSessionFile(item.id, hydrated.file, hydrated.handle);
      } catch {
        file = null;
      }
    }
    if (!file) return;
    const result = await ingestUploads({
      files: [file],
      workspaceId: item.workspaceId ?? currentWorkspaceId,
      parentId: item.parentId ?? null,
      isTauri: isTauriRuntime(),
      rememberHandle: rememberFileHandle,
      extractArchives: true,
    });
    if (result.items.length > 0) {
      setItemsTracked((current) => [...current, ...result.items]);
    }
  }, [currentWorkspaceId, setItemsTracked]);

  // Notes open in a tab; a folder is only a sidebar grouping.
  const handleCreateContent = useCallback((workspaceId, noteType = "standard") => {
    const folder = noteType === "folder";
    return stampCreated({
      id: createId("itm"),
      workspaceId,
      title: folder ? "" : UNTITLED_NOTE,
      type: folder ? "folder" : "document",
      noteType,
      parentId: null,
      isPinned: false,
      isPrivate: false,
      isFavorite: false,
    });
  }, []);

  /**
   * Lets go of the text behind items that are never coming back. Storage drops it at once, so this is never undoable:
   * the undo history is cleared, or a later Ctrl+Z would bring an item back empty (HE-VB-04).
   */
  const forgetNotes = useCallback((ids) => {
    if (ids.length === 0) return;
    undoHistory.reset();
    ids.forEach((id) => {
      void deleteLocalBackup(id);
      void forgetNote(id);
      forgetSessionFile(id);
    });
    setNotes((current) => {
      const next = { ...current };
      ids.forEach((id) => delete next[id]);
      return next;
    });
  }, [undoHistory.reset]);

  // Deleting the file also drops its tab.
  const handleItemDelete = useCallback(
    (item, removedItems = [item]) => {
      const removed = Array.isArray(removedItems) && removedItems.length > 0 ? removedItems : [item];
      removed.forEach(dropTab);
      // Bin off: the item is gone for good, so drop its text and any blob URL.
      if (!isTrashEnabled) {
        removed.forEach(revokePreviewUrl);
        forgetNotes(removed.map((removedItem) => removedItem.id));
      }
    },
    [dropTab, isTrashEnabled, forgetNotes],
  );

  /* -- trash --------------------------------------------------------------- */

  /**
   * A deleted workspace takes its open tabs with it — all of them in one pass,
   * since dropping them one at a time would each work from the same stale list.
   * The sidebar switches workspace right after, which picks the next active tab.
   */
  const handleWorkspaceDelete = useCallback(
    (workspace, removedItems) => {
      const removedIds = new Set(removedItems.map((item) => item.id));
      retiredWorkspaces.current.add(workspace.id);

      setTabs((current) => current.filter((tab) => tab.workspaceId !== workspace.id));
      setTabHistory((current) => current.filter((id) => !removedIds.has(id)));
      setActiveTabId((current) => (current && removedIds.has(current) ? null : current));
      setPaneTrees((trees) => {
        const next = { ...trees };
        delete next[workspace.id];
        return next;
      });

      // Text only outlives its item while the bin is holding it.
      if (!isTrashEnabled) forgetNotes([...removedIds]);
    },
    [isTrashEnabled, forgetNotes],
  );

  const restoreFromTrash = useCallback(
    (entryId) => {
      const entry = trash.find((row) => row.id === entryId);
      if (!entry) return;

      // Restoring a folder restores its entire saved tree. Restoring one child
      // is intentionally independent: it returns to the current workspace's
      // root instead of pointing at a folder that is still in the bin.
      const restoredEntries = isFolderItem(entry) ? collectSubtree(trash, entryId) : [entry];
      const restoredIds = new Set(restoredEntries.map((row) => row.id));
      const restored = restoredEntries.map((row) => {
        const { deletedAt, workspaceName, ...item } = row;
        const shouldMove =
          retiredWorkspaces.current.has(item.workspaceId) || item.workspaceId !== currentWorkspaceId;
        return {
          ...item,
          ...(shouldMove ? { workspaceId: currentWorkspaceId } : {}),
          ...(!isFolderItem(entry) && item.id === entryId ? { parentId: null } : {}),
        };
      });

      undoHistory.begin("shell");
      setItems((current) =>
        [...current, ...restored.filter((item) => !current.some((row) => row.id === item.id))],
      );
      setTrash((current) => current.filter((row) => !restoredIds.has(row.id)));
      if (!isFolderItem(entry)) openTab(restored[0]);
    },
    [trash, currentWorkspaceId, openTab, undoHistory.begin],
  );

  const deleteFromTrashForever = useCallback(
    (entryId) => {
      // Last chance to hand the bytes back: after this the entry is unreachable.
      const entry = trash.find((row) => row.id === entryId);
      if (!entry) return;
      const deleted = isFolderItem(entry) ? collectSubtree(trash, entryId) : [entry];
      const deletedIds = new Set(deleted.map((row) => row.id));
      deleted.forEach(revokePreviewUrl);
      setTrash((current) => current.filter((row) => !deletedIds.has(row.id)));
      forgetNotes([...deletedIds]);
    },
    [trash, forgetNotes],
  );

  const emptyTrash = useCallback(() => {
    trash.forEach(revokePreviewUrl);
    forgetNotes(trash.map((row) => row.id));
    setTrash([]);
  }, [trash, forgetNotes]);

  /**
   * Switching the bin off is itself a delete: whatever is inside goes now, and
   * nothing new arrives until it is switched back on.
   */
  const toggleTrash = useCallback(
    (next) => {
      // Switching the bin off empties it for good (not undoable); switching it on is an ordinary step.
      if (next || trash.length === 0) undoHistory.begin("shell");
      setIsTrashEnabled(next);
      if (!next) emptyTrash();
    },
    [emptyTrash, trash.length, undoHistory.begin],
  );

  // Anything past its 30 days leaves on its own. The updater hands back the same
  // array when nothing has expired, so an idle session never re-renders.
  useEffect(() => {
    if (!isTrashEnabled) return undefined;

    const sweep = () =>
      setTrash((current) => {
        const cutoff = Date.now() - TRASH_RETENTION_DAYS * DAY_MS;
        const expired = current.filter((entry) => entry.deletedAt <= cutoff);
        if (expired.length === 0) return current;

        const fresh = expired.filter((entry) => !purgedTrashIds.current.has(entry.id));
        fresh.forEach((entry) => {
          purgedTrashIds.current.add(entry.id);
          revokePreviewUrl(entry);
        });
        if (fresh.length > 0) forgetNotes(fresh.map((entry) => entry.id));

        return current.filter((entry) => entry.deletedAt > cutoff);
      });

    sweep();
    const id = window.setInterval(sweep, TRASH_SWEEP_MS);
    return () => window.clearInterval(id);
  }, [isTrashEnabled, forgetNotes]);

  if (!ready) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-white text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
        <TxtNoteWordmark className="h-8 w-auto invert dark:invert-0" />
        <p className="text-[15px]">TxtNote yükleniyor…</p>
      </div>
    );
  }

  if (walletError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-white px-6 text-center text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
        <TxtNoteWordmark className="h-8 w-auto invert dark:invert-0" />
        <p className="text-[16px] font-medium text-neutral-800 dark:text-neutral-100">Cüzdan açılamadı</p>
        <p className="max-w-md text-[14px] leading-relaxed">{walletError}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-white dark:bg-neutral-950">
      <Sidebar
        activeItemId={activeTabId}
        activeNavId={activeNavId}
        itemTitles={noteTitles}
        workspaces={workspaces}
        onWorkspacesChange={setWorkspacesTracked}
        initialWorkspaces={workspaces}
        initialWorkspaceId={currentWorkspaceId}
        defaultCollapsed={sidebarCollapsed}
        items={items}
        trash={trash}
        isTrashEnabled={isTrashEnabled}
        onItemsChange={setItemsTracked}
        onTrashChange={setTrashTracked}
        onItemSelect={openTab}
        onNavigate={handleNavigate}
        onCreateContent={handleCreateContent}
        onOpenTemplateLibrary={openTemplateLibrary}
        onUseTemplate={handleUseTemplate}
        pinnedTemplateIds={pinnedTemplateIds}
        onUploadContent={handleUploadContent}
        onWorkspaceChange={handleWorkspaceChange}
        onWorkspaceDelete={handleWorkspaceDelete}
        onItemDelete={handleItemDelete}
        onItemRename={handleItemRename}
        onItemOpenBeside={openBeside}
        onItemDropOnPane={handleTabDropOnPane}
        onRestoreNoteVersion={restoreNoteVersion}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TabBar
          tabs={visibleTabs}
          activeTabId={activeTabId}
          onSelect={selectTab}
          onClose={dropTab}
          onReorder={reorderTabs}
          onDropOnPane={handleTabDropOnPane}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* The canvas owns its own scrolling — the editor needs a fixed-height
            frame so its page can fill the space and its footer can stay put. */}
        <main className="min-h-0 flex-1">
          {activeNavId || activeTab?.type === "system" ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-[15px] text-neutral-500 dark:text-neutral-400">
                Yükleniyor…
              </div>
            }
          >
          <Canvas
            tab={activeTab}
            navId={activeNavId}
            navLabel={activeNavLink?.label}
            navIcon={activeNavLink?.icon}
            trash={trash}
            isTrashEnabled={isTrashEnabled}
            onTrashToggle={toggleTrash}
            onTrashRestore={restoreFromTrash}
            onTrashDeleteForever={deleteFromTrashForever}
            onTrashEmpty={emptyTrash}
            note={activeNote}
            onTitleChange={updateNoteTitle}
            onContentChange={updateNoteContent}
            onNoteChange={updateNote}
            onReplaceFile={handleReplaceFile}
            onExtractArchive={handleExtractArchive}
            pinnedTemplateIds={pinnedTemplateIds}
            onTogglePinnedTemplate={togglePinnedTemplate}
            onUseTemplate={handleUseTemplate}
            onCreateThesis={handleCreateThesis}
            theme={theme}
            onThemeChange={setTheme}
            themeSchedule={schedule}
            onThemeScheduleToggle={toggleSchedule}
            onThemeScheduleRuleChange={updateScheduleRule}
            profile={profile}
            onDisplayNameChange={updateDisplayName}
            isCryptoUser={isCryptoUser}
            onLogout={handleLogout}
            onTestExportEncryptedDb={handleTestExportEncryptedDb}
            onBlindRelaySend={handleBlindRelaySend}
            onBlindRelayOpen={handleBlindRelayOpen}
            onDeviceWipe={handleDeviceWipe}
            onRestoreFromKey={handleRestoreFromKey}
            onReloadApp={handleReloadApp}
            updateNotificationsEnabled={updateNotificationsEnabled}
            onUpdateNotificationsToggle={toggleUpdateNotifications}
            updateAvailable={updateAvailable}
            updateVersion={updateVersion}
            updateStatus={updateStatus}
            updateProgress={updateProgress}
            updateError={updateError}
            onCheckUpdate={checkForUpdate}
            onInstallUpdate={installUpdate}
            autoLock={autoLock}
            onAutoLockChange={setAutoLock}
            planTier={planTier}
            peerDebounceSeconds={peerDebounceSeconds}
            onPeerDebounceChange={setPeerDebounceSeconds}
            cloudIntervalMinutes={cloudIntervalMinutes}
            onCloudIntervalChange={setCloudIntervalMinutes}
            helpFocusSection={helpFocusSection}
            sync={{
              lanes: noteSync.lanes,
              peerDebounceMs: noteSync.peerDebounceMs,
              networkErrorEnabled: noteSync.networkErrorEnabled,
              setNetworkErrorEnabled: noteSync.setNetworkErrorEnabled,
              skipCloudInterval: noteSync.skipCloudInterval,
              onPlanTierChange: setTestPlanOverride,
            }}
          />
          </Suspense>
          ) : (
            <WorkArea
              tree={paneTrees[currentWorkspaceId] ?? null}
              tabs={visibleTabs}
              notes={notes}
              focusedTabId={activeTabId}
              onFocus={selectTab}
              onDropOnLeaf={handleDropOnLeaf}
              onDropEmpty={handleDropEmpty}
              onRatioChange={handlePaneRatioChange}
              onTitleChange={updateNoteTitle}
              onContentChange={updateNoteContent}
              onNoteChange={updateNote}
              onCreateAcademicFromTemplate={handleCreateAcademicFromTemplate}
              onReplaceFile={handleReplaceFile}
            onExtractArchive={handleExtractArchive}
              planTier={planTier}
              sync={{
                lanes: noteSync.lanes,
                peerDebounceMs: noteSync.peerDebounceMs,
                networkErrorEnabled: noteSync.networkErrorEnabled,
                setNetworkErrorEnabled: noteSync.setNetworkErrorEnabled,
                skipCloudInterval: noteSync.skipCloudInterval,
                onPlanTierChange: setTestPlanOverride,
              }}
            />
          )}
        </main>
      </div>

      <UpdateAvailableToast
        visible={
          updateNotificationsEnabled &&
          updateAvailable &&
          !updateToastDismissed
        }
        version={updateVersion}
        installing={updateStatus === "downloading" || updateStatus === "installing"}
        onInstall={installUpdate}
        onDismiss={() => setUpdateToastDismissed(true)}
      />
      <SaveErrorToast
        error={saveError}
        onRetry={() => {
          persistNeededRef.current = true;
          void persistNow();
        }}
      />
      <SyncNetworkToast
        visible={
          noteSync.lanes.peer.status === "error" || noteSync.lanes.cloud.status === "error"
        }
        onOpenHelp={() => openHelpSection("network")}
        onOpenContact={() => openHelpSection("contact")}
      />
    </div>
  );
}
