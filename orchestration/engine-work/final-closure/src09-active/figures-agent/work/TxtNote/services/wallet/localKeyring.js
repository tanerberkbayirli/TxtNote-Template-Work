/**
 * Temporary local Web3 wallet provider (not Privy).
 *
 * First launch generates a secp256k1 private key. Tauri persists it in the OS
 * credential store. Later launches reload that secret and rebuild the account
 * without prompting. The public address is the only value callers persist.
 *
 * Swap this module via `setWalletProvider` when Privy lands.
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export const WALLET_SECRET_ACCOUNT = "wallet.private-key.v1";
export const LOCAL_KEYRING_PROVIDER_ID = "local-keyring";
export const MEMORY_PROVIDER_ID = "memory";

const isTauri = () => {
  if (typeof window === "undefined") return false;
  const w = window;
  return Boolean(w.__TAURI_INTERNALS__ || w.__TAURI__);
};

const invokeSecure = async (command, args) => {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(command, args);
};

export const tauriKeyringStore = {
  async load(account) {
    if (!isTauri()) return null;
    const value = await invokeSecure("secure_load_secret", { account });
    return typeof value === "string" && value ? value : null;
  },
  async save(account, secret) {
    if (!isTauri()) {
      throw new Error("Güvenli kasa yalnızca masaüstü uygulamasında kullanılabilir.");
    }
    await invokeSecure("secure_store_secret", { account, secret });
    const stored = await invokeSecure("secure_load_secret", { account });
    if (stored !== secret) {
      throw new Error("İşletim sistemi kasası yazıldıktan sonra doğrulanamadı.");
    }
  },
};

const isPrivateKey = (value) =>
  typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);

const accountFromSecret = (secret) => {
  if (!isPrivateKey(secret)) {
    throw new Error("Kasadaki cüzdan anahtarı okunamadı.");
  }
  return privateKeyToAccount(secret);
};

export function createLocalWalletProvider({ store = tauriKeyringStore, allowEphemeral = !isTauri() } = {}) {
  let secret = null;
  let address = null;
  let durable = false;
  let inflight = null;

  const remember = (nextSecret, nextDurable) => {
    const account = accountFromSecret(nextSecret);
    secret = nextSecret;
    address = account.address;
    durable = nextDurable;
    return account;
  };

  const loadOrCreate = async () => {
    if (secret && address) {
      return {
        address,
        created: false,
        providerId: durable ? LOCAL_KEYRING_PROVIDER_ID : MEMORY_PROVIDER_ID,
        durable,
      };
    }

    const stored = await store.load(WALLET_SECRET_ACCOUNT);
    if (stored != null) {
      const account = remember(stored, true);
      return {
        address: account.address,
        created: false,
        providerId: LOCAL_KEYRING_PROVIDER_ID,
        durable: true,
      };
    }

    const created = generatePrivateKey();
    try {
      await store.save(WALLET_SECRET_ACCOUNT, created);
      const account = remember(created, true);
      return {
        address: account.address,
        created: true,
        providerId: LOCAL_KEYRING_PROVIDER_ID,
        durable: true,
      };
    } catch (error) {
      if (!allowEphemeral) throw error;
      const account = remember(created, false);
      return {
        address: account.address,
        created: true,
        providerId: MEMORY_PROVIDER_ID,
        durable: false,
      };
    }
  };

  return {
    id: LOCAL_KEYRING_PROVIDER_ID,
    async ensure() {
      if (secret && address) {
        return {
          address,
          created: false,
          providerId: durable ? LOCAL_KEYRING_PROVIDER_ID : MEMORY_PROVIDER_ID,
          durable,
        };
      }
      if (!inflight) {
        inflight = loadOrCreate().finally(() => {
          inflight = null;
        });
      }
      return inflight;
    },
    async getAddress() {
      if (address) return address;
      const next = await this.ensure();
      return next.address;
    },
    async getPublicKey() {
      if (!secret) await this.ensure();
      return accountFromSecret(secret).publicKey;
    },
    isDurable() {
      return durable;
    },
    async signMessage(message) {
      if (!secret) await this.ensure();
      const account = accountFromSecret(secret);
      return account.signMessage({ message });
    },
    /**
     * Temporary test hook for encrypted-DB export verification.
     * Do not persist this value; do not call it from production UI.
     */
    exportSecretForTest() {
      if (!secret) {
        throw new Error("Cüzdan kilitli; test dışa aktarma için oturum açık olmalı.");
      }
      return secret;
    },
    /**
     * Temporary test hook: replaces this device's wallet with a pasted key
     * (the "welcome back" step of the E2E lab). Persists to the OS keychain
     * before accepting it. Only browser previews may use an ephemeral wallet.
     */
    async importSecretForTest(nextSecret) {
      if (!isPrivateKey(nextSecret)) {
        throw new Error("Geçersiz private key (0x + 64 hex bekleniyor).");
      }
      accountFromSecret(nextSecret);
      if (inflight) await inflight;
      try {
        await store.save(WALLET_SECRET_ACCOUNT, nextSecret);
        const account = remember(nextSecret, true);
        return { address: account.address, durable: true };
      } catch (error) {
        if (!allowEphemeral) throw error;
        const account = remember(nextSecret, false);
        return { address: account.address, durable: false };
      }
    },
    lock() {
      secret = null;
      address = null;
      durable = false;
    },
  };
}

export const localKeyringWalletProvider = createLocalWalletProvider();
