/**
 * Name normalisation and badge derivation, with Turkish casing rules.
 */


/** Collapses stray whitespace so " İş  Notları " becomes "İş Notları". */
export const normalizeName = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

/** First character of the name, uppercased with Turkish casing rules (i → İ). */
export const badgeFromName = (value) => {
  const [first] = Array.from(normalizeName(value));
  return first ? first.toLocaleUpperCase("tr-TR") : "?";
};
