/**
 * services/mock/fixtures.ts — empty seed data for a fresh install.
 *
 * Typed against `types/index.ts`. The UI prompts for the first workspace on
 * launch; the backend replaces these defaults once accounts exist.
 */

import type { AccountProfile, ContentItem, TrashEntry, Workspace } from "../../types";

export const DEFAULT_WORKSPACES: Workspace[] = [];

export const DEFAULT_ITEMS: ContentItem[] = [];

export const DEFAULT_PROFILE: AccountProfile = {
  displayName: "",
  registrationMethod: null,
  walletAddress: null,
  walletProvider: null,
  plan: {
    tier: "freemium",
    billingCycle: null,
    nextPaymentAt: null,
    startedAt: null,
  },
  usage: {
    storageUsedBytes: 0,
  },
  createdAt: null,
  lastLoginAt: null,
  devices: [],
};

export const DEFAULT_TRASH: TrashEntry[] = [];
