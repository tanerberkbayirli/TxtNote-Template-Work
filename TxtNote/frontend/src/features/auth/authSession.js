/**
 * Client-side auth session for the register-page gate.
 * Real sign-in lives in localStorage. The test bypass lives in sessionStorage
 * so it does not permanently skip the gate after the tab is closed.
 */

const AUTH_KEY = "txtnote.auth";
const BYPASS_KEY = "txtnote.auth.bypass";

export const SESSION_LOGOUT_EVENT = "txtnote:session-logout";

const CRYPTO_AUTH_METHODS = new Set(["metamask", "trust", "vault", "recover"]);

const METHOD_LABEL = {
  email: "E-posta ile kaydolundu",
  google: "Google ile kaydolundu",
  x: "X ile kaydolundu",
  apple: "Apple ile kaydolundu",
  github: "GitHub ile kaydolundu",
  discord: "Discord ile kaydolundu",
  metamask: "Kripto yöntemleri ile bağlanıldı",
  trust: "Kripto yöntemleri ile bağlanıldı",
  vault: "Kripto yöntemleri ile bağlanıldı",
  recover: "Kripto yöntemleri ile bağlanıldı",
  bypass: "Test (kayıt atlandı)",
};

const readJson = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export function readAuthSession() {
  return readJson(window.sessionStorage, BYPASS_KEY) ?? readJson(window.localStorage, AUTH_KEY);
}

export function writeAuthSession(session) {
  const next = {
    authenticated: true,
    at: Date.now(),
    method: session?.method ?? "email",
    email: session?.email ?? null,
    displayName: session?.displayName ?? null,
    bypass: session?.bypass === true,
    registrationMethod:
      session?.registrationMethod ?? METHOD_LABEL[session?.method] ?? METHOD_LABEL.email,
  };

  try {
    if (next.bypass) {
      window.sessionStorage.setItem(BYPASS_KEY, JSON.stringify(next));
    } else {
      window.sessionStorage.removeItem(BYPASS_KEY);
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    }
  } catch {
    // Private mode — the in-memory gate in AuthGate still lets the user through.
  }

  return next;
}

export function isAuthenticated() {
  return Boolean(readAuthSession()?.authenticated);
}

export function isCryptoAuthSession(session = readAuthSession()) {
  if (!session?.authenticated) return false;
  if (CRYPTO_AUTH_METHODS.has(session.method)) return true;
  const label = session.registrationMethod;
  return typeof label === "string" && label.includes("Kripto");
}

export function isCryptoProfile(profile) {
  if (!profile) return false;
  if (
    typeof profile.walletAddress === "string" &&
    profile.walletAddress &&
    profile.walletProvider === "local-keyring"
  ) {
    return true;
  }
  const label = profile.registrationMethod;
  return typeof label === "string" && label.includes("Kripto");
}

export function clearAuthSession() {
  try {
    window.localStorage.removeItem(AUTH_KEY);
    window.sessionStorage.removeItem(BYPASS_KEY);
  } catch {
    // ignore
  }
}
