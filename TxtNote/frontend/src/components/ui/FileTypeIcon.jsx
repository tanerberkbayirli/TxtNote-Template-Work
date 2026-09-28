/**
 * The one place that decides which glyph a file gets.
 *
 * The sidebar row, the tab and the bin row all draw the same icon for the same
 * item, so the mapping lives here rather than being re-derived at each site.
 */

import React from "react";
import {
  AppWindow,
  CalendarDays,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  GraduationCap,
  Image as ImageIcon,
  ListTodo,
  Layers3,
  LayoutTemplate,
  Music,
  Video,
  Waypoints,
} from "lucide-react";
import { FILE_KIND, FILE_KIND_LABEL, resolveItemKind } from "../../lib/fileType";
import { cn } from "../../lib/cn";

/**
 * Lucide has no PDF glyph, so this is the one hand-drawn icon in the set: a
 * page with a folded corner and the wordmark, in lucide's 24-unit box and
 * stroke conventions so it sits level with its neighbours.
 */
const PdfIcon = ({ className, strokeWidth = 1.75, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
    <path d="M15 2v5h5" />
    <text
      x="12"
      y="18.2"
      textAnchor="middle"
      fontSize="6.5"
      fontWeight="700"
      letterSpacing="-0.2"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      fill="currentColor"
      stroke="none"
    >
      PDF
    </text>
  </svg>
);

/**
 * kind → glyph and accent. `tone` is the only colour in the set; leave it empty
 * and the icon inherits the row's own neutral text colour.
 */
const NOTE_TYPE_ICONS = {
  standard: { Icon: FileText, tone: "" },
  todo: { Icon: ListTodo, tone: "" },
  diary: { Icon: CalendarDays, tone: "" },
  mindmap: { Icon: Waypoints, tone: "" },
  academic: { Icon: GraduationCap, tone: "" },
  flashcards: { Icon: Layers3, tone: "" },
  research: { Icon: GraduationCap, tone: "" },
  folder: { Icon: Folder, tone: "" },
  templates: { Icon: LayoutTemplate, tone: "" },
};

const ICONS_BY_KIND = {
  [FILE_KIND.PDF]: { Icon: PdfIcon, tone: "text-rose-400 dark:text-rose-300" },
  [FILE_KIND.IMAGE]: { Icon: ImageIcon, tone: "text-violet-400 dark:text-violet-300" },
  [FILE_KIND.VIDEO]: { Icon: Video, tone: "text-sky-400 dark:text-sky-300" },
  [FILE_KIND.AUDIO]: { Icon: Music, tone: "text-amber-400 dark:text-amber-300" },
  [FILE_KIND.SHEET]: { Icon: FileSpreadsheet, tone: "text-emerald-400 dark:text-emerald-300" },
  [FILE_KIND.ARCHIVE]: { Icon: FileArchive, tone: "text-orange-400 dark:text-orange-300" },
  [FILE_KIND.CODE]: { Icon: FileCode, tone: "text-cyan-400 dark:text-cyan-300" },
  [FILE_KIND.DOCUMENT]: { Icon: FileText, tone: "" },
  [FILE_KIND.BINARY]: { Icon: AppWindow, tone: "text-neutral-500 dark:text-neutral-400" },
};

/**
 * Pass an `item` (or a `tab`, or a bin `entry` — same shape) and it works out
 * the kind, or pass `kind` directly when there is no item to hand.
 *
 * `tinted={false}` drops the accent colour, for surfaces that want the icon to
 * stay monochrome with the rest of the row.
 */
export const FileTypeIcon = ({
  item,
  kind,
  className,
  strokeWidth = 1.75,
  tinted = true,
  open = false,
  ...props
}) => {
  const resolved = kind ?? resolveItemKind(item);
  const noteType = item?.noteType;
  const noteFace =
    item?.type === "folder" || noteType === "folder"
      ? { Icon: open ? FolderOpen : Folder, tone: "" }
      : (item?.type === "document" || item?.type === "system" || (!item?.type && noteType)) && noteType
        ? NOTE_TYPE_ICONS[noteType]
        : null;
  const { Icon, tone } = noteFace ?? ICONS_BY_KIND[resolved] ?? ICONS_BY_KIND[FILE_KIND.DOCUMENT];

  return (
    <Icon
      aria-hidden="true"
      strokeWidth={strokeWidth}
      className={cn("shrink-0", tinted && tone, className)}
      {...props}
    />
  );
};

/** "PDF", "Görsel", … for tooltips and labels next to the icon. */
export const fileKindLabel = (item) => FILE_KIND_LABEL[resolveItemKind(item)];
