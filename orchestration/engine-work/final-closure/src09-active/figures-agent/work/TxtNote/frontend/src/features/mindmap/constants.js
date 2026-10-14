/**
 * Shared vocabulary of the mindmap module: the kinds of things a map is made
 * of and how big they are.
 */

export const NODE_KIND = {
  /** Legacy combined card — rendered as a captioned image. */
  CARD: "card",
  /** Image only. */
  IMAGE_PLAIN: "image-plain",
  /** Image with a caption underneath. */
  IMAGE_CAPTION: "image-caption",
  /** Fogged image that asks before it is shown. */
  IMAGE_SENSITIVE: "image-sensitive",
  /** Free-standing coloured note, resizable. */
  NOTE: "note",
  /** Drop-target for PDFs, pictures and other files. */
  FILE: "file",
  /** İşaret yazı: hollow circle that opens a note bubble when tapped. */
  DOT: "dot",
  /** Tiny filled sphere that bends an arrow once clipped onto it. */
  PIN: "pin",
};

export const IMAGE_KINDS = new Set([
  NODE_KIND.CARD,
  NODE_KIND.IMAGE_PLAIN,
  NODE_KIND.IMAGE_CAPTION,
  NODE_KIND.IMAGE_SENSITIVE,
]);

export const isImageKind = (kind) => IMAGE_KINDS.has(kind);

export const isSensitiveImage = (node) => node?.kind === NODE_KIND.IMAGE_SENSITIVE;

/** What a dot's ring says about the note behind it. */
export const DOT_COLOR = {
  NEUTRAL: "neutral",
  BLUE: "blue",
  RED: "red",
};

export const NOTE_COLOR = {
  YELLOW: "yellow",
  BLUE: "blue",
  GREEN: "green",
  PINK: "pink",
  ORANGE: "orange",
  PURPLE: "purple",
  WHITE: "white",
};

export const NOTE_COLOR_CLASS = {
  [NOTE_COLOR.YELLOW]: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/70 dark:text-amber-100",
  [NOTE_COLOR.BLUE]: "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800/70 dark:text-sky-100",
  [NOTE_COLOR.GREEN]: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/70 dark:text-emerald-100",
  [NOTE_COLOR.PINK]: "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800/70 dark:text-rose-100",
  [NOTE_COLOR.ORANGE]: "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/40 dark:border-orange-800/70 dark:text-orange-100",
  [NOTE_COLOR.PURPLE]: "bg-violet-50 border-violet-200 text-violet-900 dark:bg-violet-950/40 dark:border-violet-800/70 dark:text-violet-100",
  [NOTE_COLOR.WHITE]: "bg-white border-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100",
};

export const NOTE_SWATCH = {
  [NOTE_COLOR.YELLOW]: "bg-amber-200",
  [NOTE_COLOR.BLUE]: "bg-sky-200",
  [NOTE_COLOR.GREEN]: "bg-emerald-200",
  [NOTE_COLOR.PINK]: "bg-rose-200",
  [NOTE_COLOR.ORANGE]: "bg-orange-200",
  [NOTE_COLOR.PURPLE]: "bg-violet-200",
  [NOTE_COLOR.WHITE]: "bg-white ring-1 ring-neutral-300 dark:bg-neutral-200",
};

export const NOTE_SHAPE = {
  RECTANGLE: "rectangle",
  HEXAGON: "hexagon",
  OVAL: "oval",
  PARALLELOGRAM: "parallelogram",
  DIAMOND: "diamond",
  DOCUMENT: "document",
};

export const NOTE_SHAPE_LABEL = {
  [NOTE_SHAPE.RECTANGLE]: "İşlem",
  [NOTE_SHAPE.HEXAGON]: "Altıgen",
  [NOTE_SHAPE.OVAL]: "Terminal",
  [NOTE_SHAPE.PARALLELOGRAM]: "Giriş / Çıkış",
  [NOTE_SHAPE.DIAMOND]: "Karar",
  [NOTE_SHAPE.DOCUMENT]: "Belge",
};

/** Akış diyagramı (ISO 5807) anlamı — paletteki ipucu ve yardım için. */
export const NOTE_SHAPE_HINT = {
  [NOTE_SHAPE.OVAL]: "Başla / Bitir — diyagramın giriş ve çıkış noktaları",
  [NOTE_SHAPE.PARALLELOGRAM]: "Veri okuma (input) veya yazdırma (output)",
  [NOTE_SHAPE.RECTANGLE]: "Hesaplama veya değer atama adımı",
  [NOTE_SHAPE.DIAMOND]: "Evet / hayır sorusu — akışı dallandırır",
  [NOTE_SHAPE.DOCUMENT]: "Yazdırılan rapor / belge çıktısı (opsiyonel)",
};

/** Akış diyagramı sembollerinin sıralı listesi. */
export const FLOWCHART_SHAPES = [
  NOTE_SHAPE.OVAL,
  NOTE_SHAPE.PARALLELOGRAM,
  NOTE_SHAPE.RECTANGLE,
  NOTE_SHAPE.DIAMOND,
  NOTE_SHAPE.DOCUMENT,
];

export const NOTE_SHAPE_PAINT = {
  [NOTE_COLOR.YELLOW]: "fill-amber-50 stroke-amber-200 dark:fill-amber-950/55 dark:stroke-amber-800/80",
  [NOTE_COLOR.BLUE]: "fill-sky-50 stroke-sky-200 dark:fill-sky-950/55 dark:stroke-sky-800/80",
  [NOTE_COLOR.GREEN]: "fill-emerald-50 stroke-emerald-200 dark:fill-emerald-950/55 dark:stroke-emerald-800/80",
  [NOTE_COLOR.PINK]: "fill-rose-50 stroke-rose-200 dark:fill-rose-950/55 dark:stroke-rose-800/80",
  [NOTE_COLOR.ORANGE]: "fill-orange-50 stroke-orange-200 dark:fill-orange-950/55 dark:stroke-orange-800/80",
  [NOTE_COLOR.PURPLE]: "fill-violet-50 stroke-violet-200 dark:fill-violet-950/55 dark:stroke-violet-800/80",
  [NOTE_COLOR.WHITE]: "fill-white stroke-neutral-200 dark:fill-neutral-800 dark:stroke-neutral-600",
};

export const NOTE_SHAPE_TEXT = {
  [NOTE_COLOR.YELLOW]: "text-amber-900 dark:text-amber-100",
  [NOTE_COLOR.BLUE]: "text-sky-900 dark:text-sky-100",
  [NOTE_COLOR.GREEN]: "text-emerald-900 dark:text-emerald-100",
  [NOTE_COLOR.PINK]: "text-rose-900 dark:text-rose-100",
  [NOTE_COLOR.ORANGE]: "text-orange-900 dark:text-orange-100",
  [NOTE_COLOR.PURPLE]: "text-violet-900 dark:text-violet-100",
  [NOTE_COLOR.WHITE]: "text-neutral-800 dark:text-neutral-100",
};

export const NOTE_MIN = { width: 140, height: 88 };
export const NOTE_MAX = { width: 420, height: 320 };

export const EDGE_KIND = {
  LEFT: "left",
  RIGHT: "right",
  BOTH: "both",
};

export const EDGE_LABELS = {
  [EDGE_KIND.RIGHT]: {
    label: "A → B (İleri Yönlü)",
    hint: "Ok ucu B'de — ikinci tıklanan",
  },
  [EDGE_KIND.LEFT]: {
    label: "B → A (Geri Yönlü)",
    hint: "Ok ucu A'da — ilk tıklanan",
  },
  [EDGE_KIND.BOTH]: {
    label: "A ↔ B (Çift Yönlü)",
    hint: "İki uçta da ok",
  },
};

export const CLICK_PLACE_STEP = 24;

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.15;
export const ZOOM_DEFAULT = 1;

export const DOT_ARIA_LABEL = {
  [DOT_COLOR.NEUTRAL]: "Nötr işaret yazı",
  [DOT_COLOR.BLUE]: "Dış bağlantılı işaret yazı",
  [DOT_COLOR.RED]: "Hassas içerik işaret yazısı",
};

export const NODE_SIZE = {
  [NODE_KIND.CARD]: { width: 224, height: 176 },
  [NODE_KIND.IMAGE_PLAIN]: { width: 200, height: 148 },
  [NODE_KIND.IMAGE_CAPTION]: { width: 200, height: 196 },
  [NODE_KIND.IMAGE_SENSITIVE]: { width: 200, height: 148 },
  [NODE_KIND.NOTE]: { width: 176, height: 128 },
  [NODE_KIND.FILE]: { width: 200, height: 168 },
  [NODE_KIND.DOT]: { width: 28, height: 28 },
  [NODE_KIND.PIN]: { width: 12, height: 12 },
};

export const CARD_IMAGE_HEIGHT = 112;

export const FILE_SLOT_MAX = 12;
