/**
 * Sync preference helpers. Plan floors live in `plans.js`; timing constants
 * live in `limits.js`. This module is the only place that combines the two.
 */

import {
  CLOUD_INTERVAL_MINUTES_MAX,
  CLOUD_INTERVAL_OPTIONS,
  DEFAULT_CLOUD_INTERVAL_MINUTES,
  DEFAULT_PEER_DEBOUNCE_SECONDS,
} from "./limits";
import { PLAN_SYNC_LIMITS } from "./plans";

export { CLOUD_INTERVAL_OPTIONS };

export const syncLimitsFor = (tier) =>
  PLAN_SYNC_LIMITS[tier] ?? PLAN_SYNC_LIMITS.freemium;

export const clampPeerDebounce = (seconds, tier) => {
  const min = syncLimitsFor(tier).peerMinSeconds;
  const n = Number(seconds);
  if (!Number.isFinite(n)) return Math.max(min, DEFAULT_PEER_DEBOUNCE_SECONDS);
  return Math.max(min, Math.round(n));
};

export const clampCloudInterval = (minutes, tier) => {
  const min = syncLimitsFor(tier).cloudMinMinutes;
  const n = Number(minutes);
  if (!Number.isFinite(n)) return Math.max(min, DEFAULT_CLOUD_INTERVAL_MINUTES);
  const allowed = CLOUD_INTERVAL_OPTIONS.includes(n)
    ? n
    : CLOUD_INTERVAL_OPTIONS.find((option) => option >= n) ??
      CLOUD_INTERVAL_OPTIONS[CLOUD_INTERVAL_OPTIONS.length - 1];
  return Math.min(CLOUD_INTERVAL_MINUTES_MAX, Math.max(min, allowed));
};

/** Settings chip label for a peer debounce preset (seconds). */
export const formatPeerPresetLabel = (seconds) => {
  if (seconds >= 60 && seconds % 60 === 0) {
    const minutes = seconds / 60;
    return minutes === 1 ? "1 dk" : `${minutes} dk`;
  }
  return `${seconds}s`;
};

/** Settings chip label for a cloud backup interval (minutes). */
export const formatCloudIntervalLabel = (minutes) => {
  if (minutes >= 24 * 60) return "1 gün";
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 sa" : `${hours} sa`;
  }
  return `${minutes} dk`;
};
