/**
 * Workspace switcher, content list and nav rail.
 * NOTE: still the largest module in the tree — see REFACTORING.md, Phase 2.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Check,
  FolderUp,
  LayoutTemplate,
  MoreHorizontal,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Upload,
} from "lucide-react";
import { DEFAULT_ITEMS, DEFAULT_TRASH, DEFAULT_WORKSPACES, isTauriRuntime, rememberFileHandle, saveNote, writeMedia } from "@shared/services";
import { SearchField } from "../../components/ui/SearchField";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PinnedIndicator } from "../../components/ui/PinnedIndicator";
import { Tooltip } from "../../components/ui/Tooltip";
import { SIDEBAR_WIDTH_DEFAULT, SIDEBAR_WIDTH_KEY, SIDEBAR_WIDTH_MAX, SIDEBAR_WIDTH_MIN, TOP_STRIP_HEIGHT } from "../../config/layout";
import { DEFAULT_TRASH_ENABLED, TRASH_RETENTION_DAYS, WORKSPACE_NAME_MAX } from "../../config/limits";
import { NAV_LINKS } from "../../config/navigation";
import { UNTITLED_FOLDER, UNTITLED_NOTE } from "../../config/strings";
import { ContentTree } from "./ContentTree";
import { ItemContextMenu } from "./ItemContextMenu";
import { EKLE_NOTE_TYPE_OPTIONS } from "./noteTypes";
import { TEMPLATES } from "../../lib/templates";
import { WorkspaceAvatarDialog } from "../workspace/WorkspaceAvatarDialog";
import { WorkspaceBadge } from "../workspace/WorkspaceBadge";
import { WorkspaceContextMenu } from "../workspace/WorkspaceContextMenu";
import { WorkspaceNameDialog } from "../workspace/WorkspaceNameDialog";
import { useDismiss } from "../../hooks/useDismiss";
import { cn } from "../../lib/cn";
import { getFileExtension, isExternalBinaryFile, stemFromRenameLabel } from "../../lib/fileType";
import { stampCreated, stampUpdated } from "../../lib/entity";
import { createId } from "../../lib/id";
import { htmlToPlainText } from "../../lib/richText";
import { titleMatchesQuery } from "../../lib/noteSearch";
import {
  canMoveIntoFolder,
  collectSubtree,
  filterFolderTree,
  FOLDER_NOTE_TYPE,
  isFolderItem,
  moveItemBeside,
  moveItemIntoFolder,
  nestWorkspaceItems,
  removeItemFromFolder,
  siblingsOf,
} from "../../lib/folder";
import { badgeFromName, normalizeName } from "../../lib/text";
import { ITEM_TYPE_FILE } from "../../lib/upload";
import { ingestUploads } from "../../lib/ingestUpload";
import { pickFilesWithHandles, pickFolderWithHandles } from "../../lib/filePick";
import { openOrDownloadFile } from "../../lib/fileAccess";
import { clearDragItem, hasDragItem, readDragItem } from "../workarea/drag";

const itemListTitle = (item) =>
  normalizeName(htmlToPlainText(item.title ?? "")) ||
  (isFolderItem(item) ? UNTITLED_FOLDER : UNTITLED_NOTE);

const clampSidebarWidth = (width) => {
  const room = typeof window === "undefined" ? SIDEBAR_WIDTH_MAX : window.innerWidth - 280;
  const max = Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, room));
  return Math.round(Math.min(max, Math.max(SIDEBAR_WIDTH_MIN, width)));
};

const readStoredSidebarWidth = () => {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const next = Number(raw);
    if (Number.isFinite(next)) return clampSidebarWidth(next);
  } catch {
    /* private mode */
  }
  return SIDEBAR_WIDTH_DEFAULT;
};

const SidebarResizeHandle = ({ width, onWidthChange }) => {
  const dragRef = useRef(null);

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { startX: event.clientX, origin: width };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    onWidthChange(clampSidebarWidth(drag.origin + event.clientX - drag.startX));
  };

  const endDrag = () => {
    dragRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Kenar çubuğu genişliği"
      aria-valuemin={SIDEBAR_WIDTH_MIN}
      aria-valuemax={SIDEBAR_WIDTH_MAX}
      aria-valuenow={width}
      title="Sürükleyerek genişliği ayarla"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="absolute top-0 right-0 z-20 h-full w-1.5 cursor-col-resize touch-none bg-transparent hover:bg-neutral-400 dark:hover:bg-neutral-600"
    />
  );
};

export const Sidebar = ({
  initialWorkspaces = DEFAULT_WORKSPACES,
  initialWorkspaceId = "",
  initialItems = DEFAULT_ITEMS,
  initialTrash = DEFAULT_TRASH,
  defaultCollapsed = false,
  workspaces: controlledWorkspaces,
  onWorkspacesChange,
  className,
  // id → title, so a note renamed in the editor renames its row as you type.
  itemTitles = {},
  // Optional controlled selection. When omitted, the sidebar tracks its own.
  activeItemId: controlledActiveItemId,
  activeNavId: controlledActiveNavId,
  // Optional controlled lists, so the trash screen and the sidebar read from
  // one source. Omit both and the sidebar keeps working on its own.
  items: controlledItems,
  trash: controlledTrash,
  isTrashEnabled = DEFAULT_TRASH_ENABLED,
  onItemsChange,
  onTrashChange,
  onItemSelect,
  onNavigate,
  onCreateContent,
  onOpenTemplateLibrary,
  onUseTemplate,
  pinnedTemplateIds = [],
  onUploadContent,
  onWorkspaceChange,
  onWorkspaceCreate,
  onWorkspaceUpdate,
  onWorkspaceDelete,
  onItemDelete,
  onItemRename,
  onItemOpenBeside,
  onItemDropOnPane,
  onRestoreNoteVersion,
  onCollapsedChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [sidebarWidth, setSidebarWidth] = useState(readStoredSidebarWidth);
  const [internalWorkspaces, setInternalWorkspaces] = useState(initialWorkspaces);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(
    initialWorkspaceId || initialWorkspaces[0]?.id || "",
  );
  const [titleQuery, setTitleQuery] = useState("");
  const [expandedFolderIds, setExpandedFolderIds] = useState(() => new Set());
  const [focusedId, setFocusedId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  // Where the row being dragged would land: inside a folder, or above /
  // below another row. One hint drives both the highlight and the drop.
  const [dropHint, setDropHint] = useState(null);
  const [pendingItemDelete, setPendingItemDelete] = useState(null);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceError, setNewWorkspaceError] = useState("");
  // Workspace editing: which one the right-click menu is about, and which
  // dialog — if any — it has opened.
  const [workspaceMenu, setWorkspaceMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    workspaceId: null,
  });
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [renameError, setRenameError] = useState("");
  const [avatarTarget, setAvatarTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [internalItems, setInternalItems] = useState(initialItems);
  const [internalTrash, setInternalTrash] = useState(initialTrash);
  const [internalActiveItemId, setActiveItemId] = useState(null);
  const [internalActiveNavId, setActiveNavId] = useState(null);

  // A controlled value always wins, so the top tab bar can drive the highlight.
  const activeItemId =
    controlledActiveItemId !== undefined ? controlledActiveItemId : internalActiveItemId;
  const activeNavId =
    controlledActiveNavId !== undefined ? controlledActiveNavId : internalActiveNavId;

  const items = controlledItems !== undefined ? controlledItems : internalItems;
  const trash = controlledTrash !== undefined ? controlledTrash : internalTrash;
  const workspaces = controlledWorkspaces !== undefined ? controlledWorkspaces : internalWorkspaces;

  const updateWorkspaces = useCallback(
    (updater) => {
      if (controlledWorkspaces !== undefined) onWorkspacesChange?.(updater);
      else setInternalWorkspaces(updater);
    },
    [controlledWorkspaces, onWorkspacesChange],
  );

  // Both writers take the same functional updater a setState would, so an owner
  // higher up the tree can take the lists over without any call site changing.
  const updateItems = useCallback(
    (updater) => {
      if (controlledItems !== undefined) onItemsChange?.(updater);
      else setInternalItems(updater);
    },
    [controlledItems, onItemsChange],
  );

  const updateTrash = useCallback(
    (updater) => {
      if (controlledTrash !== undefined) onTrashChange?.(updater);
      else setInternalTrash(updater);
    },
    [controlledTrash, onTrashChange],
  );

  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    selectedItemId: null,
  });

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);

  const workspaceMenuRef = useRef(null);
  const createMenuRef = useRef(null);
  const uploadMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === currentWorkspaceId),
    [workspaces, currentWorkspaceId],
  );

  const pinnedTemplates = useMemo(() => {
    const pinned = new Set(pinnedTemplateIds);
    return TEMPLATES.filter((template) => pinned.has(template.id));
  }, [pinnedTemplateIds]);
  const createMenuOptions = useMemo(() => [
    ...pinnedTemplates.map((template) => ({
      templateId: template.id,
      label: template.name,
      description: template.description,
      icon: template.icon,
    })),
    ...EKLE_NOTE_TYPE_OPTIONS.filter((option) => option.noteType === FOLDER_NOTE_TYPE),
  ], [pinnedTemplates]);

  // Pinned workspaces rise to the top; the rest keep the order they were made in.
  const orderedWorkspaces = useMemo(
    () => [
      ...workspaces.filter((workspace) => workspace.isPinned),
      ...workspaces.filter((workspace) => !workspace.isPinned),
    ],
    [workspaces],
  );

  const pinnedWorkspaceCount = useMemo(
    () => workspaces.filter((workspace) => workspace.isPinned).length,
    [workspaces],
  );

  const findWorkspace = useCallback(
    (workspaceId) => workspaces.find((workspace) => workspace.id === workspaceId) ?? null,
    [workspaces],
  );

  const contextWorkspace = useMemo(
    () => findWorkspace(workspaceMenu.workspaceId),
    [findWorkspace, workspaceMenu.workspaceId],
  );

  const renameWorkspace = useMemo(() => findWorkspace(renameTarget), [findWorkspace, renameTarget]);

  const avatarWorkspace = useMemo(() => findWorkspace(avatarTarget), [findWorkspace, avatarTarget]);

  /** Says out loud what leaves with the workspace, and whether it can come back. */
  const workspaceDeleteDescription = useMemo(() => {
    const workspace = findWorkspace(deleteTarget);
    if (!workspace) return "";

    const count = items.filter((item) => item.workspaceId === workspace.id).length;
    const label = `“${workspace.name}”`;

    if (count === 0) return `${label} silinecek. İçinde hiç içerik yok.`;

    return isTrashEnabled
      ? `${label} ve içindeki ${count} içerik silinecek. İçerikler çöp kutusuna düşer, ${TRASH_RETENTION_DAYS} gün içinde geri alabilirsin.`
      : `${label} ve içindeki ${count} içerik kalıcı olarak silinecek. Çöp kutusu kapalı, bu işlem geri alınamaz.`;
  }, [findWorkspace, deleteTarget, items, isTrashEnabled]);

  const workspaceItems = useMemo(() => {
    const scoped = items
      .filter((item) => item.workspaceId === currentWorkspaceId)
      .map((item) =>
        item.type === ITEM_TYPE_FILE || item.fileName
          ? item
          : itemTitles[item.id] !== undefined
            ? { ...item, title: itemTitles[item.id] }
            : item,
      );
    return [...scoped.filter((item) => item.isPinned), ...scoped.filter((item) => !item.isPinned)];
  }, [items, currentWorkspaceId, itemTitles]);

  const folderTree = useMemo(() => {
    const tree = nestWorkspaceItems(workspaceItems);
    if (!titleQuery.trim()) return tree;
    return filterFolderTree(tree, (item) => titleMatchesQuery(itemListTitle(item), titleQuery));
  }, [workspaceItems, titleQuery]);

  const visibleItems = folderTree.roots;
  const pinnedCount = folderTree.pinnedRootCount;

  const needsSetup = workspaces.length === 0;

  const contextMenuItem = useMemo(
    () => workspaceItems.find((item) => item.id === contextMenu.selectedItemId) ?? null,
    [workspaceItems, contextMenu.selectedItemId],
  );

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((collapsed) => {
      const next = !collapsed;
      onCollapsedChange?.(next);
      return next;
    });
    setIsWorkspaceMenuOpen(false);
  }, [onCollapsedChange]);

  useEffect(() => {
    if (!initialWorkspaceId) return;
    setCurrentWorkspaceId((current) =>
      current === initialWorkspaceId ? current : initialWorkspaceId,
    );
  }, [initialWorkspaceId]);

  useEffect(() => {
    setTitleQuery("");
    setFocusedId(null);
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!titleQuery.trim()) return;
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      folderTree.childrenByParent.forEach((kids, folderId) => {
        if (kids.length > 0) next.add(folderId);
      });
      return next;
    });
  }, [titleQuery, folderTree]);

  useEffect(() => {
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
    } catch {
      /* private mode */
    }
  }, [sidebarWidth]);

  useEffect(() => {
    const onResize = () => setSidebarWidth((current) => clampSidebarWidth(current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeWorkspaceMenu = useCallback(() => setIsWorkspaceMenuOpen(false), []);

  useEffect(() => {
    if (!currentWorkspace) return;
    onWorkspaceChange?.(currentWorkspace);
    // The shell starts with an empty workspace id; tell it once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const selectWorkspace = useCallback(
    (workspace) => {
      setCurrentWorkspaceId(workspace.id);
      setActiveItemId(null);
      setIsWorkspaceMenuOpen(false);
      onWorkspaceChange?.(workspace);
    },
    [onWorkspaceChange],
  );

  const openCreateWorkspace = useCallback(() => {
    setNewWorkspaceName("");
    setNewWorkspaceError("");
    setIsWorkspaceMenuOpen(false);
    setIsCreateWorkspaceOpen(true);
  }, []);

  const closeCreateWorkspace = useCallback(() => {
    setIsCreateWorkspaceOpen(false);
    setNewWorkspaceName("");
    setNewWorkspaceError("");
  }, []);

  const changeNewWorkspaceName = useCallback((value) => {
    setNewWorkspaceName(value);
    setNewWorkspaceError("");
  }, []);

  /**
   * Names are labels, not identity. Two workspaces may share a name; UUID
   * is what makes them distinct. `exceptId` is kept so rename call sites
   * stay unchanged.
   */
  const validateWorkspaceName = useCallback((value, _exceptId) => {
    const name = normalizeName(value);

    if (!name) return { error: "Devam etmek için bir ad yaz." };
    if (name.length > WORKSPACE_NAME_MAX) {
      return { error: `En fazla ${WORKSPACE_NAME_MAX} karakter kullanabilirsin.` };
    }

    return { name };
  }, []);

  const createWorkspace = useCallback(() => {
    const { name, error } = validateWorkspaceName(newWorkspaceName);

    if (error) {
      setNewWorkspaceError(error);
      return;
    }

    const workspace = stampCreated({
      id: createId("ws"),
      name,
      badge: badgeFromName(name),
      isPinned: false,
      avatar: null,
    });

    updateWorkspaces((current) => [...current, workspace]);
    setIsCreateWorkspaceOpen(false);
    setNewWorkspaceName("");
    setNewWorkspaceError("");

    // Switch straight into the workspace that was just created.
    setCurrentWorkspaceId(workspace.id);
    setActiveItemId(null);
    setActiveNavId(null);
    setIsWorkspaceMenuOpen(false);

    onWorkspaceCreate?.(workspace);
    onWorkspaceChange?.(workspace);
  }, [newWorkspaceName, validateWorkspaceName, onWorkspaceCreate, onWorkspaceChange, updateWorkspaces]);

  /* -- workspace context menu ------------------------------------------------ */

  const openWorkspaceContextMenu = useCallback((event, workspaceId) => {
    event.preventDefault();
    event.stopPropagation();

    // Keyboard activation reports no pointer, which would pin the menu to the
    // top-left corner. Fall back to the control that was activated.
    const rect = event.currentTarget?.getBoundingClientRect?.();
    const hasPointer = event.clientX !== 0 || event.clientY !== 0;

    setWorkspaceMenu({
      isOpen: true,
      position:
        hasPointer || !rect
          ? { x: event.clientX, y: event.clientY }
          : { x: rect.left, y: rect.bottom },
      workspaceId,
    });
  }, []);

  const closeWorkspaceContextMenu = useCallback(() => {
    setWorkspaceMenu((state) =>
      state.isOpen ? { ...state, isOpen: false, workspaceId: null } : state,
    );
  }, []);

  /** Shared writer, so every workspace edit lands the same way. */
  const patchWorkspace = useCallback(
    (workspaceId, patch) => {
      const existing = workspaces.find((workspace) => workspace.id === workspaceId);
      if (!existing) return null;

      updateWorkspaces((current) =>
        current.map((workspace) =>
          workspace.id === workspaceId ? stampUpdated({ ...workspace, ...patch }) : workspace,
        ),
      );

      // Built from the list as it stands, not inside the updater: React runs
      // updaters at render time, so anything read back from one arrives too late.
      return stampUpdated({ ...existing, ...patch });
    },
    [workspaces, updateWorkspaces],
  );

  const toggleWorkspacePin = useCallback(
    (workspaceId) => {
      const workspace = findWorkspace(workspaceId);
      if (!workspace) return;

      const updated = patchWorkspace(workspaceId, { isPinned: !workspace.isPinned });
      if (updated) onWorkspaceUpdate?.(updated);
    },
    [findWorkspace, patchWorkspace, onWorkspaceUpdate],
  );

  /* -- rename ---------------------------------------------------------------- */

  const startRenameWorkspace = useCallback(
    (workspaceId) => {
      const workspace = findWorkspace(workspaceId);
      if (!workspace) return;

      setRenameName(workspace.name);
      setRenameError("");
      setRenameTarget(workspaceId);
      setIsWorkspaceMenuOpen(false);
    },
    [findWorkspace],
  );

  const closeRenameWorkspace = useCallback(() => {
    setRenameTarget(null);
    setRenameName("");
    setRenameError("");
  }, []);

  const changeRenameName = useCallback((value) => {
    setRenameName(value);
    setRenameError("");
  }, []);

  const submitRenameWorkspace = useCallback(() => {
    if (!renameTarget) return;

    const { name, error } = validateWorkspaceName(renameName, renameTarget);
    if (error) {
      setRenameError(error);
      return;
    }

    // The letter square follows the name unless a picture has taken its place.
    const updated = patchWorkspace(renameTarget, { name, badge: badgeFromName(name) });

    // Anything already in the bin remembers where it came from by name, so keep
    // those labels honest rather than leaving the old name behind.
    updateTrash((current) =>
      current.some((entry) => entry.workspaceId === renameTarget)
        ? current.map((entry) =>
            entry.workspaceId === renameTarget ? { ...entry, workspaceName: name } : entry,
          )
        : current,
    );

    closeRenameWorkspace();
    if (updated) onWorkspaceUpdate?.(updated);
  }, [
    renameTarget,
    renameName,
    validateWorkspaceName,
    patchWorkspace,
    updateTrash,
    closeRenameWorkspace,
    onWorkspaceUpdate,
  ]);

  /* -- picture --------------------------------------------------------------- */

  const startChangeWorkspaceAvatar = useCallback((workspaceId) => {
    setAvatarTarget(workspaceId);
    setIsWorkspaceMenuOpen(false);
  }, []);

  const closeWorkspaceAvatar = useCallback(() => setAvatarTarget(null), []);

  const saveWorkspaceAvatar = useCallback(
    (workspaceId, avatar) => {
      const updated = patchWorkspace(workspaceId, { avatar: avatar ?? null });
      setAvatarTarget(null);
      if (updated) onWorkspaceUpdate?.(updated);
    },
    [patchWorkspace, onWorkspaceUpdate],
  );

  /* -- delete ---------------------------------------------------------------- */

  // The last workspace stays: the sidebar has nothing to show without one.
  const canDeleteWorkspace = workspaces.length > 1;

  const requestDeleteWorkspace = useCallback(
    (workspaceId) => {
      if (!canDeleteWorkspace) return;
      setDeleteTarget(workspaceId);
      setIsWorkspaceMenuOpen(false);
    },
    [canDeleteWorkspace],
  );

  const closeDeleteWorkspace = useCallback(() => setDeleteTarget(null), []);

  /**
   * Deleting a workspace takes its contents with it. They travel the same road a
   * single deleted item does: into the bin when the bin is on, gone when it is off.
   */
  const confirmDeleteWorkspace = useCallback(() => {
    const workspace = findWorkspace(deleteTarget);

    if (!workspace || workspaces.length <= 1) {
      setDeleteTarget(null);
      return;
    }

    const doomed = items
      .filter((item) => item.workspaceId === workspace.id)
      .map((item) => ({ ...item, title: itemTitles[item.id] || item.title }));

    updateItems((current) => current.filter((item) => item.workspaceId !== workspace.id));

    if (isTrashEnabled && doomed.length > 0) {
      updateTrash((current) => [
        ...doomed.map((item) => ({
          ...item,
          workspaceName: workspace.name,
          deletedAt: Date.now(),
        })),
        ...current,
      ]);
    }

    const remaining = workspaces.filter((row) => row.id !== workspace.id);
    updateWorkspaces(remaining);
    setDeleteTarget(null);

    // Tabs belonging to the workspace close in one pass, before the switch below
    // asks for the next workspace's most recent tab.
    onWorkspaceDelete?.(workspace, doomed);

    if (workspace.id === currentWorkspaceId) {
      const next =
        remaining.find((row) => row.isPinned) ?? remaining[0];

      if (next) {
        setCurrentWorkspaceId(next.id);
        setActiveItemId(null);
        onWorkspaceChange?.(next);
      }
    }
  }, [
    deleteTarget,
    findWorkspace,
    workspaces,
    items,
    itemTitles,
    isTrashEnabled,
    updateItems,
    updateTrash,
    currentWorkspaceId,
    onWorkspaceDelete,
    onWorkspaceChange,
  ]);

  const selectItem = useCallback(
    (item) => {
      setFocusedId(item.id);
      setActiveItemId(item.id);
      setActiveNavId(null);
      if (isFolderItem(item)) return;
      onItemSelect?.(item);
    },
    [onItemSelect],
  );

  const toggleFolder = useCallback((folderId) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const startRename = useCallback((itemId) => {
    setRenamingId(itemId);
  }, []);

  const commitRename = useCallback(
    (itemId, title) => {
      setRenamingId(null);
      const target = items.find((item) => item.id === itemId);
      const label = normalizeName(title) || target?.title || "";
      if (!target || !label) return;
      const nextTitle =
        target.type === ITEM_TYPE_FILE || target.fileName
          ? stemFromRenameLabel(label, target.fileName) || label
          : label;
      updateItems((current) =>
        current.map((item) => {
          if (item.id !== itemId) return item;
          if (item.type === ITEM_TYPE_FILE || item.fileName) {
            const ext = getFileExtension(item.fileName || "");
            return stampUpdated({
              ...item,
              title: nextTitle,
              fileName: ext ? `${nextTitle}.${ext}` : item.fileName,
            });
          }
          return stampUpdated({ ...item, title: nextTitle });
        }),
      );
      onItemRename?.(itemId, nextTitle);
    },
    [items, updateItems, onItemRename],
  );

  const moveItemByIdIntoFolder = useCallback(
    (folderId, draggedId) => {
      setDropHint(null);
      if (!draggedId) return;
      const item = items.find((row) => row.id === draggedId);
      const folder = items.find((row) => row.id === folderId);
      if (!canMoveIntoFolder(item, folder, items)) return;
      updateItems((current) => moveItemIntoFolder(current, draggedId, folderId));
      setExpandedFolderIds((current) => new Set(current).add(folderId));
      setFocusedId(draggedId);
    },
    [items, updateItems],
  );

  /** Puts a row above or below another one — this is "move it up / down". */
  const moveItemBesideId = useCallback(
    (draggedId, targetId, place) => {
      setDropHint(null);
      if (!draggedId || !targetId || draggedId === targetId) return;
      updateItems((current) => moveItemBeside(current, draggedId, targetId, place));
      setFocusedId(draggedId);
    },
    [updateItems],
  );

  /** Alt + ↑ / ↓ walks a row past the sibling next to it. */
  const nudgeItem = useCallback(
    (itemId, step) => {
      const siblings = siblingsOf(folderTree, itemId);
      const index = siblings.findIndex((row) => row.id === itemId);
      const neighbour = siblings[index + step];
      if (index < 0 || !neighbour) return;
      moveItemBesideId(itemId, neighbour.id, step < 0 ? "before" : "after");
    },
    [folderTree, moveItemBesideId],
  );

  const unfileItem = useCallback(
    (itemId) => {
      setDropHint(null);
      updateItems((current) => removeItemFromFolder(current, itemId));
    },
    [updateItems],
  );

  const dropOutOfFolder = useCallback(
    (event) => {
      if (!hasDragItem(event)) return;
      event.preventDefault();
      const dragged = readDragItem(event);
      clearDragItem();
      setDropHint(null);
      const item = items.find((row) => row.id === dragged?.id) ?? dragged;
      if (item?.parentId) unfileItem(item.id);
    },
    [items, unfileItem],
  );

  const allowListDrop = useCallback((event) => {
    if (!hasDragItem(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const openContextMenu = useCallback((event, itemId) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      selectedItemId: itemId,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((state) => (state.isOpen ? { ...state, isOpen: false, selectedItemId: null } : state));
  }, []);

  const togglePin = useCallback(
    (itemId) => {
      updateItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, isPinned: !item.isPinned } : item)),
      );
    },
    [updateItems],
  );

  const deleteItem = useCallback(
    (itemId) => {
      const target = items.find((item) => item.id === itemId);
      if (!target) return;

      // A folder is one unit: retain its complete tree in the bin, including
      // nested folders.  Detaching children here used to make them leak out to
      // the main list while only the folder itself was trashed.
      const doomed = isFolderItem(target) ? collectSubtree(items, itemId) : [target];
      const doomedIds = new Set(doomed.map((item) => item.id));
      const deletedAt = Date.now();

      updateItems((current) => current.filter((item) => !doomedIds.has(item.id)));

      // Bin switched off: the item leaves for good, nothing is stashed.
      if (isTrashEnabled) {
        updateTrash((current) => [
          ...doomed.map((item) => ({
            // The row can be showing a title the editor renamed a keystroke ago.
            ...item,
            title: itemTitles[item.id] || item.title,
            workspaceName:
              workspaces.find((workspace) => workspace.id === item.workspaceId)?.name ?? "",
            deletedAt,
          })),
          ...current,
        ]);
      }

      setActiveItemId((active) => (doomedIds.has(active) ? null : active));
      onItemDelete?.(target, doomed);
    },
    [items, itemTitles, workspaces, isTrashEnabled, updateItems, updateTrash, onItemDelete],
  );

  const requestDeleteItem = useCallback(
    (itemId) => {
      const target = items.find((item) => item.id === itemId);
      if (!target) return;
      if (isTrashEnabled) {
        deleteItem(itemId);
        return;
      }
      setPendingItemDelete(target);
    },
    [items, isTrashEnabled, deleteItem],
  );

  const closePendingItemDelete = useCallback(() => setPendingItemDelete(null), []);

  const confirmPendingItemDelete = useCallback(() => {
    if (!pendingItemDelete) return;
    deleteItem(pendingItemDelete.id);
    setPendingItemDelete(null);
  }, [pendingItemDelete, deleteItem]);

  /**
   * `parentId` is what the folder's own right-click menu passes: the new note
   * is filed inside that folder instead of landing at the end of the list.
   */
  const handleCreateContent = useCallback(
    (noteType = "standard", parentId = null) => {
      setIsCreateMenuOpen(false);
      const folder = noteType === FOLDER_NOTE_TYPE;
      const created = onCreateContent?.(currentWorkspaceId, noteType);
      const base = created ?? stampCreated({
        id: createId("itm"),
        workspaceId: currentWorkspaceId,
        title: folder ? "" : UNTITLED_NOTE,
        type: folder ? "folder" : "document",
        noteType,
        parentId: null,
        isPinned: false,
        isPrivate: false,
        isFavorite: false,
      });
      const newItem = { ...base, parentId: parentId ?? null };
      updateItems((current) => [...current, newItem]);
      setFocusedId(newItem.id);
      setActiveItemId(newItem.id);
      setActiveNavId(null);
      setExpandedFolderIds((current) => {
        if (!parentId && !folder) return current;
        const next = new Set(current);
        if (parentId) next.add(parentId);
        if (folder) next.add(newItem.id);
        return next;
      });
      if (folder) {
        setRenamingId(newItem.id);
        return;
      }
      onItemSelect?.(newItem);
    },
    [currentWorkspaceId, updateItems, onCreateContent, onItemSelect],
  );

  const createInsideFolder = useCallback(
    (folderId, noteType = "standard") => handleCreateContent(noteType, folderId),
    [handleCreateContent],
  );

  const closeCreateMenu = useCallback(() => setIsCreateMenuOpen(false), []);
  const closeUploadMenu = useCallback(() => setIsUploadMenuOpen(false), []);

  const handleUseTemplate = useCallback(
    (templateId) => {
      closeCreateMenu();
      onUseTemplate?.(templateId);
    },
    [closeCreateMenu, onUseTemplate],
  );

  const handleOpenTemplateLibrary = useCallback(() => {
    closeCreateMenu();
    setActiveItemId(null);
    setActiveNavId(null);
    onOpenTemplateLibrary?.();
  }, [closeCreateMenu, onOpenTemplateLibrary]);

  const uploadParentId = useMemo(() => {
    const active = items.find((row) => row.id === (activeItemId || focusedId));
    if (!active) return null;
    if (isFolderItem(active)) return active.id;
    return active.parentId ?? null;
  }, [items, activeItemId, focusedId]);

  const ingestPickedFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList ?? []);
      setUploadError("");
      if (files.length === 0) return;

      setUploadProgress({ current: 0, total: files.length, label: "Dosyalar hazırlanıyor…" });
      try {
        const result = await ingestUploads({
          files,
          workspaceId: currentWorkspaceId,
          parentId: uploadParentId,
          isTauri: isTauriRuntime(),
          writeMedia,
          saveNote,
          rememberHandle: rememberFileHandle,
          onProgress: setUploadProgress,
        });

        if (result.items.length > 0) {
          updateItems((current) => [...current, ...result.items]);
          setExpandedFolderIds((current) => {
            const next = new Set(current);
            result.expandedFolderIds.forEach((id) => next.add(id));
            if (uploadParentId) next.add(uploadParentId);
            return next;
          });
          const filesOnly = result.items.filter((item) => item.type === ITEM_TYPE_FILE);
          if (result.rootIds[0]) {
            setActiveItemId(result.rootIds[0]);
            setFocusedId(result.rootIds[0]);
          } else if (filesOnly.length === 1) {
            setActiveItemId(filesOnly[0].id);
            setFocusedId(filesOnly[0].id);
          }
          setActiveNavId(null);
          onUploadContent?.(result);
        }

        if (result.errors.length > 0) {
          setUploadError(result.errors.slice(0, 3).join(" "));
        }
      } catch (error) {
        setUploadError(error?.message || "Dosyalar yüklenemedi.");
      } finally {
        setUploadProgress(null);
      }
    },
    [
      currentWorkspaceId,
      uploadParentId,
      updateItems,
      onUploadContent,
      onItemSelect,
    ],
  );

  const handleFilesPicked = useCallback(
    (event) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      void ingestPickedFiles(files);
    },
    [ingestPickedFiles],
  );

  const openFilePicker = useCallback(async () => {
    setUploadError("");
    setIsUploadMenuOpen(false);
    const handled = await pickFilesWithHandles();
    if (handled === null) {
      fileInputRef.current?.click();
      return;
    }
    await ingestPickedFiles(handled);
  }, [ingestPickedFiles]);

  const openFolderPicker = useCallback(async () => {
    setUploadError("");
    setIsUploadMenuOpen(false);
    const handled = await pickFolderWithHandles();
    if (handled === null) {
      folderInputRef.current?.click();
      return;
    }
    await ingestPickedFiles(handled);
  }, [ingestPickedFiles]);

  // The rejection note excuses itself after a moment.
  useEffect(() => {
    if (!uploadError) return undefined;
    const id = window.setTimeout(() => setUploadError(""), 8000);
    return () => window.clearTimeout(id);
  }, [uploadError]);

  const handleNavigate = useCallback(
    (navId) => {
      setActiveNavId(navId);
      setActiveItemId(null);
      onNavigate?.(navId);
    },
    [onNavigate],
  );

  useDismiss(isWorkspaceMenuOpen, workspaceMenuRef, closeWorkspaceMenu);
  useDismiss(isCreateMenuOpen, createMenuRef, closeCreateMenu);
  useDismiss(isUploadMenuOpen, uploadMenuRef, closeUploadMenu);

  const railButtonClass =
    "flex w-full items-center rounded-md text-[15px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";

  const actionPillClass = cn(
    "box-border flex items-center justify-center rounded-full text-[14px] font-medium",
    "transition-colors duration-150 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50",
    "dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900",
  );

  return (
    <>
      {isCollapsed ? (
        <button
          type="button"
          onClick={toggleCollapse}
          title="Kenar çubuğunu genişlet"
          aria-label="Kenar çubuğunu genişlet"
          aria-expanded={false}
          className="absolute left-0 top-0 z-30 flex h-11 w-10 items-center justify-center border-r border-b border-neutral-200 bg-neutral-50 text-neutral-500 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      ) : (
      <aside
        data-sidebar=""
        aria-label="Çalışma alanı kenar çubuğu"
        className={cn(
          "relative flex h-screen shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900",
          className,
        )}
        style={{ width: sidebarWidth }}
      >
        <div
          className={cn(
            "flex shrink-0 items-end gap-1 border-b border-neutral-200 px-3 dark:border-neutral-800",
            TOP_STRIP_HEIGHT,
          )}
        >
            <>
              <div ref={workspaceMenuRef} className="relative flex-1">
                {needsSetup ? (
                  <div
                    className={cn(
                      railButtonClass,
                      "h-10 cursor-default gap-2.5 px-2.5 text-neutral-400 dark:text-neutral-500",
                    )}
                  >
                    <WorkspaceBadge workspace={null} size="sm" tone="solid" letter="?" />
                    <span className="flex-1 truncate text-left font-medium">Çalışma alanı</span>
                  </div>
                ) : (
                  <>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isWorkspaceMenuOpen}
                  onClick={() => setIsWorkspaceMenuOpen((open) => !open)}
                  // Right-clicking the header acts on the workspace it shows.
                  onContextMenu={(event) =>
                    currentWorkspace && openWorkspaceContextMenu(event, currentWorkspace.id)
                  }
                  className={cn(
                    railButtonClass,
                    "h-10 gap-2.5 px-2.5 text-neutral-800 hover:bg-neutral-200/60 dark:text-neutral-100 dark:hover:bg-neutral-800",
                  )}
                >
                  <WorkspaceBadge workspace={currentWorkspace} size="sm" tone="solid" />
                  <span className="flex-1 truncate text-left font-medium">{currentWorkspace?.name}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200",
                      isWorkspaceMenuOpen && "rotate-180",
                    )}
                    strokeWidth={2}
                  />
                </button>

                {isWorkspaceMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Çalışma alanları"
                    className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
                  >
                    <p className="px-2.5 py-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      Çalışma alanları
                    </p>
                    {orderedWorkspaces.map((workspace, index) => (
                      <React.Fragment key={workspace.id}>
                        {/* Row and menu affordance are siblings so no button is nested. */}
                        <div
                          className="group/ws relative"
                          onContextMenu={(event) => openWorkspaceContextMenu(event, workspace.id)}
                        >
                          <button
                            type="button"
                            role="menuitemradio"
                            aria-checked={workspace.id === currentWorkspaceId}
                            onClick={() => selectWorkspace(workspace)}
                            className="flex w-full items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-[15px] text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                          >
                            <WorkspaceBadge workspace={workspace} size="sm" tone="muted" />
                            <span className="flex-1 truncate text-left">{workspace.name}</span>

                            <span className="flex items-center gap-2 group-hover/ws:invisible">
                              {workspace.isPinned && <PinnedIndicator />}
                              {workspace.id === currentWorkspaceId && (
                                <Check className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                              )}
                            </span>
                          </button>

                          <button
                            type="button"
                            aria-label={`${workspace.name} çalışma ortamı ayarları`}
                            aria-haspopup="menu"
                            onClick={(event) => openWorkspaceContextMenu(event, workspace.id)}
                            className="invisible absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 focus-visible:visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 group-hover/ws:visible dark:text-neutral-400 dark:hover:bg-neutral-600 dark:hover:text-neutral-100"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>

                        {/* Same dashed rule the content list uses to close its pinned block. */}
                        {pinnedWorkspaceCount > 0 &&
                          index === pinnedWorkspaceCount - 1 &&
                          orderedWorkspaces.length > pinnedWorkspaceCount && (
                            <div className="my-1.5 border-b border-dashed border-neutral-300 dark:border-neutral-600" />
                          )}
                      </React.Fragment>
                    ))}
                    <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openCreateWorkspace}
                      className="flex w-full items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-[15px] text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      <Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      Yeni çalışma alanı
                    </button>
                  </div>
                )}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={toggleCollapse}
                aria-label="Kenar çubuğunu daralt"
                aria-expanded={true}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </>
        </div>

            {/* middle: content list */}
            <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3">
              <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-3">
                <p className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                  İçerikler
                </p>
                <SearchField
                  className="min-w-0 flex-1"
                  value={titleQuery}
                  placeholder="Başlık ara"
                  aria-label="Başlıklarda ara"
                  onChange={(event) => setTitleQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Escape") return;
                    event.stopPropagation();
                    setTitleQuery("");
                    event.currentTarget.blur();
                  }}
                />
              </div>

              <div
                onDragOver={allowListDrop}
                onDrop={dropOutOfFolder}
                onKeyDown={(event) => {
                  if (event.target instanceof HTMLInputElement) return;
                  const targetId = focusedId || activeItemId;
                  if (!targetId) return;
                  if (event.key === "F2") {
                    event.preventDefault();
                    startRename(targetId);
                    return;
                  }
                  if (event.key === "Delete") {
                    event.preventDefault();
                    requestDeleteItem(targetId);
                    return;
                  }
                  if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
                    event.preventDefault();
                    nudgeItem(targetId, event.key === "ArrowUp" ? -1 : 1);
                  }
                }}
              >
                <ContentTree
                  rows={visibleItems}
                  childrenByParent={folderTree.childrenByParent}
                  expandedFolderIds={expandedFolderIds}
                  activeItemId={activeItemId}
                  focusedId={focusedId}
                  renamingId={renamingId}
                  dropHint={dropHint}
                  pinnedCount={pinnedCount}
                  onSelect={selectItem}
                  onContextMenu={openContextMenu}
                  onToggleExpand={toggleFolder}
                  onFocusRow={setFocusedId}
                  onRenameStart={startRename}
                  onRenameCommit={commitRename}
                  onRenameCancel={() => setRenamingId(null)}
                  onDropHint={setDropHint}
                  onMoveIntoFolder={moveItemByIdIntoFolder}
                  onMoveBeside={moveItemBesideId}
                  onUnfileItem={unfileItem}
                  onDropOnPane={onItemDropOnPane}
                  onActivate={(item) => {
                    selectItem(item);
                    if (isExternalBinaryFile(item)) {
                      void openOrDownloadFile(item).catch((error) => {
                        setUploadError(error?.message || "Dosya açılamadı.");
                      });
                    }
                  }}
                />
              </div>

              {visibleItems.length === 0 && (
                <p className="mt-3 px-2.5 py-5 text-center text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {needsSetup
                    ? "Başlamak için bir çalışma alanı oluştur."
                    : titleQuery.trim()
                      ? "Eşleşen başlık yok."
                      : "Bu çalışma alanı boş. Aşağıdan ilk içeriğini ekle."}
                </p>
              )}

              <div
                className="min-h-8 flex-1"
                onDragOver={allowListDrop}
                onDrop={dropOutOfFolder}
              />
            </nav>

            {/* actions — one compact pill row, above the canvas tools */}
            <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFilesPicked}
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                webkitdirectory=""
                directory=""
                onChange={handleFilesPicked}
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
              />

              {uploadProgress && (
                <div className="mb-2 rounded-md border border-neutral-200 bg-white px-2.5 py-2 dark:border-neutral-700 dark:bg-neutral-900">
                  <p className="truncate text-[12px] text-neutral-600 dark:text-neutral-300">
                    {uploadProgress.label}
                  </p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                      className="h-full bg-neutral-900 transition-[width] duration-150 dark:bg-neutral-100"
                      style={{
                        width: `${Math.min(
                          100,
                          uploadProgress.total
                            ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
                            : 0,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {uploadProgress.current} / {uploadProgress.total}
                  </p>
                </div>
              )}

              {uploadError && (
                <p
                  role="alert"
                  className="mb-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[12px] leading-snug text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                >
                  {uploadError}
                </p>
              )}

              <div className="flex items-stretch gap-2.5">
                <div ref={createMenuRef} className="relative min-w-0 flex-1">
                  {isCreateMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Not türleri"
                      className="create-menu-pop-in absolute bottom-full left-0 z-50 mb-2 max-h-[min(70vh,34rem)] w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
                    >
                      {createMenuOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <React.Fragment key={option.templateId ?? option.noteType}>
                            {option.dividerBefore && pinnedTemplates.length > 0 && (
                              <div
                                role="separator"
                                className="mx-2 my-1.5 h-px bg-neutral-300 dark:bg-neutral-600"
                              />
                            )}
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => option.templateId
                                ? handleUseTemplate(option.templateId)
                                : handleCreateContent(option.noteType)}
                              className="flex w-full items-start gap-3 rounded-[5px] px-2.5 py-2.5 text-left transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-400 dark:hover:bg-neutral-700 dark:focus-visible:ring-neutral-500"
                            >
                              <Icon
                                className="mt-0.5 h-[18px] w-[18px] shrink-0 text-neutral-500 dark:text-neutral-400"
                                strokeWidth={1.75}
                              />
                              <span className="min-w-0">
                                <span className="block text-[14px] font-medium text-neutral-800 dark:text-neutral-100">
                                  {option.label}
                                </span>
                                <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                                  {option.description}
                                </span>
                              </span>
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex min-w-0 items-stretch">
                    <button
                      type="button"
                      title="Yeni İçerik Ekle"
                      aria-label="Yeni İçerik Ekle"
                      aria-haspopup="menu"
                      aria-expanded={isCreateMenuOpen}
                      disabled={needsSetup}
                      onClick={() => setIsCreateMenuOpen((open) => !open)}
                      className={cn(
                        actionPillClass,
                        "h-10 min-w-0 flex-1 gap-2 border px-3 transition-[flex-grow] duration-300 ease-out motion-reduce:transition-none",
                        needsSetup
                          ? "cursor-not-allowed border-transparent bg-neutral-300 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500"
                          : "border-transparent bg-neutral-900 text-neutral-50 hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white",
                      )}
                    >
                      <Plus
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                          isCreateMenuOpen && "rotate-45",
                        )}
                        strokeWidth={2}
                      />
                      <span className="truncate">Ekle</span>
                    </button>
                    {!needsSetup && (
                      <div
                        aria-hidden={!isCreateMenuOpen}
                        className={cn(
                          "grid shrink-0 transition-[grid-template-columns,opacity,margin-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                          isCreateMenuOpen
                            ? "ml-2 grid-cols-[1fr] opacity-100"
                            : "pointer-events-none ml-0 grid-cols-[0fr] opacity-0",
                        )}
                      >
                        <div className="min-w-0 overflow-hidden">
                          {isCreateMenuOpen ? (
                            <Tooltip label="Tüm şablonları keşfet" placement="top">
                              <button
                                type="button"
                                title="Tüm şablonları keşfet"
                                aria-label="Tüm şablonları keşfet"
                                onClick={handleOpenTemplateLibrary}
                                className={cn(
                                  actionPillClass,
                                  "template-discover-pop-in h-10 w-10 shrink-0 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700",
                                )}
                              >
                                <LayoutTemplate className="h-[18px] w-[18px]" strokeWidth={2} />
                              </button>
                            </Tooltip>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div ref={uploadMenuRef} className="relative min-w-0 flex-1">
                  {isUploadMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Yükle"
                      className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/40"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void openFilePicker()}
                        className="flex w-full items-start gap-3 rounded-[5px] px-2.5 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <Upload
                          className="mt-0.5 h-[18px] w-[18px] shrink-0 text-neutral-500 dark:text-neutral-400"
                          strokeWidth={1.75}
                        />
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium text-neutral-800 dark:text-neutral-100">
                            Dosya yükle
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                            Kod, belge, görsel, arşiv veya diğer dosyalar.
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void openFolderPicker()}
                        className="flex w-full items-start gap-3 rounded-[5px] px-2.5 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <FolderUp
                          className="mt-0.5 h-[18px] w-[18px] shrink-0 text-neutral-500 dark:text-neutral-400"
                          strokeWidth={1.75}
                        />
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium text-neutral-800 dark:text-neutral-100">
                            Klasör yükle
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                            Alt klasörler ve dosya ağacı korunur.
                          </span>
                        </span>
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    title="Dosya veya klasör yükle"
                    aria-label="Dosya veya klasör yükle"
                    aria-haspopup="menu"
                    aria-expanded={isUploadMenuOpen}
                    disabled={needsSetup || Boolean(uploadProgress)}
                    onClick={() => setIsUploadMenuOpen((open) => !open)}
                    className={cn(
                      actionPillClass,
                      "h-10 w-full min-w-0 gap-2 border px-3",
                      needsSetup || uploadProgress
                        ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600"
                        : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    )}
                  >
                    <Upload className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    <span className="truncate">Yükle</span>
                  </button>
                </div>
              </div>
            </div>

            {/* bottom: system nav — single row of icon-only circular buttons */}
            <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
              <div className="flex items-center justify-between px-1">
                {NAV_LINKS.map(({ id, label, icon: Icon, highlight }) => (
                  <Tooltip key={id} label={label} placement="top">
                    <button
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-current={activeNavId === id ? "page" : undefined}
                      onClick={() => handleNavigate(id)}
                      className={cn(
                        "relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
                        highlight
                          ? activeNavId === id
                            ? "bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-300/60 dark:ring-amber-500/50"
                            : "bg-gradient-to-br from-amber-400/90 via-orange-400/90 to-rose-400/90 text-white shadow-sm shadow-amber-500/25 hover:from-amber-500 hover:via-orange-500 hover:to-rose-500 hover:shadow-md hover:shadow-amber-500/30"
                          : activeNavId === id
                            ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                            : "text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      {id === "trash" && trash.length > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[11px] font-medium leading-none text-white dark:bg-neutral-100 dark:text-neutral-900">
                          {trash.length}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
        <SidebarResizeHandle width={sidebarWidth} onWidthChange={setSidebarWidth} />
      </aside>
      )}

      <ItemContextMenu
        state={contextMenu}
        item={contextMenuItem}
        onTogglePin={togglePin}
        onDelete={requestDeleteItem}
        onRestoreVersion={onRestoreNoteVersion}
        onRename={startRename}
        onOpenBeside={onItemOpenBeside}
        onRemoveFromFolder={unfileItem}
        onCreateInside={createInsideFolder}
        onClose={closeContextMenu}
      />

      <WorkspaceContextMenu
        state={workspaceMenu}
        workspace={contextWorkspace}
        canDelete={canDeleteWorkspace}
        onTogglePin={toggleWorkspacePin}
        onRename={startRenameWorkspace}
        onChangeAvatar={startChangeWorkspaceAvatar}
        onDelete={requestDeleteWorkspace}
        onClose={closeWorkspaceContextMenu}
      />

      <WorkspaceNameDialog
        isOpen={isCreateWorkspaceOpen && !needsSetup}
        mode="create"
        name={newWorkspaceName}
        error={newWorkspaceError}
        onNameChange={changeNewWorkspaceName}
        onSubmit={createWorkspace}
        onClose={closeCreateWorkspace}
      />

      {needsSetup && (
        <WorkspaceNameDialog
          isOpen
          mode="setup"
          name={newWorkspaceName}
          error={newWorkspaceError}
          onNameChange={changeNewWorkspaceName}
          onSubmit={createWorkspace}
          onClose={() => {}}
          allowDismiss={false}
        />
      )}

      <WorkspaceNameDialog
        isOpen={renameTarget !== null}
        mode="rename"
        workspace={renameWorkspace}
        name={renameName}
        error={renameError}
        onNameChange={changeRenameName}
        onSubmit={submitRenameWorkspace}
        onClose={closeRenameWorkspace}
      />

      {/* Keyed and mounted on demand: each open is a fresh mount, so the preview
          starts on the picture the workspace already has. */}
      {avatarTarget !== null && (
        <WorkspaceAvatarDialog
          key={avatarTarget}
          isOpen
          workspace={avatarWorkspace}
          onSave={saveWorkspaceAvatar}
          onClose={closeWorkspaceAvatar}
        />
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Çalışma ortamı silinsin mi?"
        description={workspaceDeleteDescription}
        confirmLabel="Çalışma ortamını sil"
        onConfirm={confirmDeleteWorkspace}
        onClose={closeDeleteWorkspace}
      />

      <ConfirmDialog
        isOpen={pendingItemDelete !== null}
        title="Kalıcı olarak silinsin mi?"
        description={`“${pendingItemDelete?.title || "Bu içerik"}” çöp kutusu kapalı olduğu için geri alınamaz biçimde silinecek.`}
        confirmLabel="Kalıcı olarak sil"
        onConfirm={confirmPendingItemDelete}
        onClose={closePendingItemDelete}
      />
    </>
  );
};

/* ========================================================================== */
/*  Top tab bar                                                                */
/* ========================================================================== */
