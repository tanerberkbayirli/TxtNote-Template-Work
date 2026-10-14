/**
 * Layout constants. Tailwind width/height tokens and pixel measurements the
 * floating surfaces are positioned against. Change a panel size here, nowhere else.
 */

/** Default width of the expanded sidebar; the user can drag the right edge. */
export const SIDEBAR_WIDTH_DEFAULT = 520;
export const SIDEBAR_WIDTH_MIN = 280;
export const SIDEBAR_WIDTH_MAX = 760;
export const SIDEBAR_WIDTH_KEY = "txtnote.sidebarWidth";

/** Collapsed: same footprint as the header toggle (w-10 h-11). */
export const COLLAPSED_WIDTH = "w-10";

/** Header strip height — kept in sync with the tab bar so the two rows line up. */
export const TOP_STRIP_HEIGHT = "h-11";

export const MENU_EDGE_PADDING = 8;

/** Widths the workspace context menu and its edit flyout are measured against. */
export const WORKSPACE_MENU_WIDTH = 272;

export const WORKSPACE_SUBMENU_WIDTH = 328;

/** Width of the item context menu itself, and of its two flyouts. */
export const ITEM_MENU_WIDTH = 208;

/** Width of the note-history flyout on the item context menu. */
export const NOTE_HISTORY_SUBMENU_WIDTH = 280;

/** Width of the "yeni içerik ekle" flyout that files a new note in a folder. */
export const NOTE_CREATE_SUBMENU_WIDTH = 288;
