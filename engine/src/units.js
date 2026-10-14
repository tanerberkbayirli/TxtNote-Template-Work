export const MM_PER_PT = 25.4 / 72;
export const mmToTwip = (value = 0) => Math.round(value * 1440 / 25.4);
export const ptToTwip = (value = 0) => Math.round(value * 20);

const MILLIMETRES_PER_UNIT = Object.freeze({
  px: 25.4 / 96,
  pt: 25.4 / 72,
  mm: 1,
  cm: 10,
  inch: 25.4,
  twip: 25.4 / 1440,
  emu: 25.4 / 914400,
});

const normalizeUnit = (unit) => {
  const normalized = String(unit ?? "").trim().toLowerCase();
  const aliases = {
    pixel: "px", pixels: "px",
    point: "pt", points: "pt",
    millimeter: "mm", millimeters: "mm", millimetre: "mm", millimetres: "mm",
    centimeter: "cm", centimeters: "cm", centimetre: "cm", centimetres: "cm",
    in: "inch", inches: "inch",
    twips: "twip",
    emus: "emu",
  };
  return aliases[normalized] || normalized;
};

/** Convert a physical length between supported units. Pixels use the CSS 96 dpi definition. */
export function convertLength(value, from, to) {
  if (!Number.isFinite(value)) throw new TypeError("Length value must be a finite number");
  const source = normalizeUnit(from);
  const target = normalizeUnit(to);
  if (!(source in MILLIMETRES_PER_UNIT) || !(target in MILLIMETRES_PER_UNIT)) {
    throw new RangeError(`Unsupported length unit: ${source} or ${target}`);
  }
  return value * MILLIMETRES_PER_UNIT[source] / MILLIMETRES_PER_UNIT[target];
}
