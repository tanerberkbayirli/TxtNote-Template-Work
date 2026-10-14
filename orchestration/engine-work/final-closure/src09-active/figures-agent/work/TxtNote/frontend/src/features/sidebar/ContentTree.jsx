/**
 * The sidebar list, drawn one level at a time.
 *
 * Folders nest as deep as they are made, and nesting is shown by indentation
 * alone — no rails, no elbows. The pinned block is closed with the same dashed
 * rule the workspace menu uses, at the top level only.
 */

import React from "react";
import { ContentRow } from "./ContentRow";
import { isFolderItem } from "../../lib/folder";

export const ContentTree = ({
  rows,
  childrenByParent,
  depth = 0,
  expandedFolderIds,
  activeItemId,
  focusedId,
  renamingId,
  dropHint,
  pinnedCount = 0,
  onSelect,
  onContextMenu,
  onToggleExpand,
  onFocusRow,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onDropHint,
  onMoveIntoFolder,
  onMoveBeside,
  onUnfileItem,
  onDropOnPane,
  onActivate,
}) => (
  <ul className={depth === 0 ? "space-y-1" : "mt-1 space-y-1"}>
    {rows.map((item, index) => {
      const kids = childrenByParent.get(item.id) ?? [];
      const folder = isFolderItem(item);
      const open = folder && expandedFolderIds.has(item.id) && kids.length > 0;

      return (
        <li key={item.id}>
          <ContentRow
            item={item}
            depth={depth}
            isActive={folder ? focusedId === item.id : item.id === activeItemId}
            isExpanded={expandedFolderIds.has(item.id)}
            isRenaming={renamingId === item.id}
            dropPlace={dropHint?.id === item.id ? dropHint.place : null}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            onToggleExpand={onToggleExpand}
            onFocusRow={onFocusRow}
            onRenameStart={onRenameStart}
            onRenameCommit={(title) => onRenameCommit(item.id, title)}
            onRenameCancel={onRenameCancel}
            onDropHint={onDropHint}
            onMoveIntoFolder={onMoveIntoFolder}
            onMoveBeside={onMoveBeside}
            onUnfileItem={onUnfileItem}
            onDropOnPane={onDropOnPane}
            onActivate={onActivate}
          />

          {open && (
            <ContentTree
              rows={kids}
              childrenByParent={childrenByParent}
              depth={depth + 1}
              expandedFolderIds={expandedFolderIds}
              activeItemId={activeItemId}
              focusedId={focusedId}
              renamingId={renamingId}
              dropHint={dropHint}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onToggleExpand={onToggleExpand}
              onFocusRow={onFocusRow}
              onRenameStart={onRenameStart}
              onRenameCommit={onRenameCommit}
              onRenameCancel={onRenameCancel}
              onDropHint={onDropHint}
              onMoveIntoFolder={onMoveIntoFolder}
              onMoveBeside={onMoveBeside}
              onUnfileItem={onUnfileItem}
              onDropOnPane={onDropOnPane}
              onActivate={onActivate}
            />
          )}

          {depth === 0 &&
            pinnedCount > 0 &&
            index === pinnedCount - 1 &&
            rows.length > pinnedCount && (
              <div className="my-2 border-b border-dashed border-neutral-300 dark:border-neutral-700" />
            )}
        </li>
      );
    })}
  </ul>
);
