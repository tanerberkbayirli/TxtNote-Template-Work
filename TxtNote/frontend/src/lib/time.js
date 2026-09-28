/**
 * Relative-time formatting in Turkish. No date library.
 */

import { TRASH_RETENTION_DAYS } from "../config/limits";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** "3 saat önce" — plain Turkish relative time, no date library. */
export const formatRelativePast = (timestamp, now) => {
  const minutes = Math.floor(Math.max(0, now - timestamp) / 60000);

  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dakika önce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;

  return new Date(timestamp).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * What is left of an entry's 30 days. Nothing sits in the bin while the bin is
 * off, so there is no open-ended case to describe. `isUrgent` marks the last
 * day, which the row picks up as an amber accent.
 */
export const formatRetentionLeft = (deletedAt, now) => {
  const hoursLeft = Math.floor(
    (deletedAt + TRASH_RETENTION_DAYS * DAY_MS - now) / (60 * 60 * 1000),
  );

  if (hoursLeft < 0) return { label: "Siliniyor", isUrgent: true };
  if (hoursLeft < 1) return { label: "1 saatten az kaldı", isUrgent: true };
  if (hoursLeft < 24) return { label: `${hoursLeft} saat sonra silinecek`, isUrgent: true };

  return { label: `${Math.floor(hoursLeft / 24)} gün sonra silinecek`, isUrgent: false };
};
