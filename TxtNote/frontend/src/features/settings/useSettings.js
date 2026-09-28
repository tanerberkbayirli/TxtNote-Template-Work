/**
 * Client-side settings that survive a reload. Auto-lock and sync cadence stay
 * here; update checks run through the Tauri updater plugin.
 */

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CLOUD_INTERVAL_MINUTES,
  DEFAULT_PEER_DEBOUNCE_SECONDS,
} from "../../config/limits";
import { DEFAULT_PINNED_TEMPLATE_IDS, sanitizeTemplateIds } from "../../lib/templates";

const UPDATE_NOTIFICATIONS_KEY = "txtnote.updateNotifications";
const AUTO_LOCK_KEY = "txtnote.autoLock";
const PEER_DEBOUNCE_KEY = "txtnote.sync.peerDebounceSeconds";
const CLOUD_INTERVAL_KEY = "txtnote.sync.cloudIntervalMinutes";
const PINNED_TEMPLATES_KEY = "txtnote.pinnedTemplates";

export const AUTO_LOCK_OPTIONS = [
  { id: "10m", label: "10 dakika" },
  { id: "1h", label: "1 saat" },
  { id: "1d", label: "1 gün" },
  { id: "1mo", label: "1 ay" },
  { id: "off", label: "Kapatma" },
];

const AUTO_LOCK_IDS = new Set(AUTO_LOCK_OPTIONS.map((option) => option.id));

const readNumber = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readBool = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) === true;
  } catch {
    return fallback;
  }
};

const readAutoLock = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return AUTO_LOCK_IDS.has(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readPinnedTemplates = () => {
  try {
    const raw = window.localStorage.getItem(PINNED_TEMPLATES_KEY);
    return sanitizeTemplateIds(raw ? JSON.parse(raw) : DEFAULT_PINNED_TEMPLATE_IDS);
  } catch {
    return sanitizeTemplateIds(DEFAULT_PINNED_TEMPLATE_IDS);
  }
};

const writeStored = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full disk — the session still works, it just forgets.
  }
};

export const useSettings = () => {
  const [updateNotificationsEnabled, setUpdateNotificationsEnabled] = useState(() =>
    readBool(UPDATE_NOTIFICATIONS_KEY, true),
  );
  const [autoLock, setAutoLock] = useState(() => readAutoLock(AUTO_LOCK_KEY, "off"));
  const [peerDebounceSeconds, setPeerDebounceSeconds] = useState(() =>
    readNumber(PEER_DEBOUNCE_KEY, DEFAULT_PEER_DEBOUNCE_SECONDS),
  );
  const [cloudIntervalMinutes, setCloudIntervalMinutes] = useState(() =>
    readNumber(CLOUD_INTERVAL_KEY, DEFAULT_CLOUD_INTERVAL_MINUTES),
  );
  const [pinnedTemplateIds, setPinnedTemplateIds] = useState(readPinnedTemplates);

  useEffect(() => {
    writeStored(UPDATE_NOTIFICATIONS_KEY, updateNotificationsEnabled);
  }, [updateNotificationsEnabled]);

  useEffect(() => {
    writeStored(AUTO_LOCK_KEY, autoLock);
  }, [autoLock]);

  useEffect(() => {
    writeStored(PEER_DEBOUNCE_KEY, peerDebounceSeconds);
  }, [peerDebounceSeconds]);

  useEffect(() => {
    writeStored(CLOUD_INTERVAL_KEY, cloudIntervalMinutes);
  }, [cloudIntervalMinutes]);

  useEffect(() => {
    writeStored(PINNED_TEMPLATES_KEY, pinnedTemplateIds);
  }, [pinnedTemplateIds]);

  const toggleUpdateNotifications = useCallback((isEnabled) => {
    setUpdateNotificationsEnabled(isEnabled);
  }, []);

  const togglePinnedTemplate = useCallback((templateId) => {
    setPinnedTemplateIds((current) =>
      current.includes(templateId)
        ? current.filter((id) => id !== templateId)
        : sanitizeTemplateIds([...current, templateId]),
    );
  }, []);

  return {
    updateNotificationsEnabled,
    toggleUpdateNotifications,
    autoLock,
    setAutoLock,
    peerDebounceSeconds,
    setPeerDebounceSeconds,
    cloudIntervalMinutes,
    setCloudIntervalMinutes,
    pinnedTemplateIds,
    togglePinnedTemplate,
  };
};
