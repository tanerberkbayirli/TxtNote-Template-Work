/**
 * Theme catalogue and the clock rule that can drive it.
 *
 * Three themes for now: white (light), black (true-black dark) and dark
 * (soft neutral dark). The schedule is a pair of editable rules — "at this
 * time, switch to this theme" — evaluated against the time of day.
 */

export const THEME = {
  LIGHT: "light",
  BLACK: "black",
  DARK: "dark",
};

export const THEME_OPTIONS = [
  {
    id: THEME.LIGHT,
    label: "Beyaz tema",
    description: "Aydınlık zeminler, koyu yazı. Gündüz kullanımı için.",
    // What the little preview card paints itself with.
    preview: { page: "#fafafa", panel: "#ffffff", ink: "#171717", line: "#e5e5e5" },
  },
  {
    id: THEME.BLACK,
    label: "Siyah tema",
    description: "Saf siyah zemin. OLED ekranlarda en az ışık.",
    preview: { page: "#000000", panel: "#101010", ink: "#f5f5f5", line: "#1c1c1c" },
  },
  {
    id: THEME.DARK,
    label: "Karanlık tema",
    description: "Yumuşak koyu griler. Gece için göz yormayan seçenek.",
    preview: { page: "#0a0a0a", panel: "#171717", ink: "#f5f5f5", line: "#262626" },
  },
];

export const THEME_LABEL = Object.fromEntries(
  THEME_OPTIONS.map((option) => [option.id, option.label]),
);

/** What the switcher starts with: dark after work, white with the sunrise. */
export const DEFAULT_SCHEDULE = {
  isEnabled: false,
  rules: [
    { id: "evening", time: "18:00", theme: THEME.DARK },
    { id: "morning", time: "05:00", theme: THEME.LIGHT },
  ],
};

/** "18:30" → 1110. Invalid input comes back as null, and the rule sits out. */
const minutesOf = (time) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(time ?? "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

/**
 * Which theme the clock says it should be: the rule fired most recently.
 * Before the day's first rule, yesterday's last one is still in force —
 * 03:00 with an 18:00 → dark rule is dark, not "nothing yet".
 */
export const scheduledThemeFor = (rules, date = new Date()) => {
  const valid = rules
    .map((rule) => ({ ...rule, minutes: minutesOf(rule.time) }))
    .filter((rule) => rule.minutes !== null && THEME_LABEL[rule.theme])
    .sort((a, b) => a.minutes - b.minutes);

  if (valid.length === 0) return null;

  const now = date.getHours() * 60 + date.getMinutes();
  let active = valid[valid.length - 1]; // wrapped over from yesterday
  for (const rule of valid) {
    if (rule.minutes <= now) active = rule;
  }
  return active.theme;
};
