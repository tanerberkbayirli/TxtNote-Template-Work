/** Plan quotas — kept in sync with the Premium screen copy. */

export const GB = 1024 ** 3;

export const PLAN_LIMITS = {
  freemium: { storageBytes: 1 * GB, maxDevices: 5 },
  lite: { storageBytes: 50 * GB, maxDevices: 10 },
  premium: { storageBytes: 250 * GB, maxDevices: null },
};

/**
 * Sync cadence floors per plan. Lite/Freemium cannot go faster than these;
 * Premium may pick anything at or above its (lower) floor.
 */
export const PLAN_SYNC_LIMITS = {
  freemium: { peerMinSeconds: 5, cloudMinMinutes: 10 },
  lite: { peerMinSeconds: 5, cloudMinMinutes: 10 },
  premium: { peerMinSeconds: 1, cloudMinMinutes: 5 },
};
