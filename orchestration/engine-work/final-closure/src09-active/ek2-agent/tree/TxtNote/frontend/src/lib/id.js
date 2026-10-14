/**
 * Client-side id generation. Prefer the platform UUID; fall back to a
 * timestamped token when `crypto.randomUUID` is missing.
 */

const uniqueId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const time = `${Date.now().toString(36)}-${Math.floor(performance.now()).toString(36)}`;
  const entropy = new Uint8Array(8);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(entropy);
  }
  const extra = Array.from(entropy, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${time}-${extra || "id"}`;
};

export const createId = (prefix) => `${prefix}-${uniqueId()}`;
