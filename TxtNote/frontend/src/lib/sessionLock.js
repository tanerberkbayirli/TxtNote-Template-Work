/**
 * Ends the in-app session: vault key and wallet secret leave memory; auth flag
 * is cleared. The OS keychain copy of the private key is not deleted.
 */

import {
  clearSealedCache,
  flushWrites,
  getWalletProvider,
  lockVault,
} from "@shared/services";
import { clearAuthSession, SESSION_LOGOUT_EVENT } from "../features/auth/authSession.js";

export async function endUserSession() {
  await flushWrites();
  lockVault();
  clearSealedCache();
  getWalletProvider().lock?.();
  clearAuthSession();
  window.dispatchEvent(new CustomEvent(SESSION_LOGOUT_EVENT));
}
