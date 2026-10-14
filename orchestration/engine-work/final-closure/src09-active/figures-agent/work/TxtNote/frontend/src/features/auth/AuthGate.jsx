import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { bootstrapWallet } from "@shared/services";
import {
  isAuthenticated,
  SESSION_LOGOUT_EVENT,
  writeAuthSession,
} from "./authSession.js";
import { TxtNoteWordmark } from "../../brand/TxtNoteWordmark.jsx";
import WalletResumeView from "./WalletResumeView.jsx";

const App = lazy(() => import("../../app/App.jsx"));
const RegisterPage = lazy(() => import("./RegisterPage.tsx"));

const BootScreen = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-white text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
    <TxtNoteWordmark className="h-8 w-auto invert dark:invert-0" />
    <p className="text-[15px]">TxtNote yükleniyor…</p>
  </div>
);

/**
 * Shows the register/login screen until a real (or test-bypass) session exists,
 * then mounts the note app.
 */
export default function AuthGate() {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [walletResume, setWalletResume] = useState(false);
  const [booting, setBooting] = useState(!authed);

  useEffect(() => {
    let cancelled = false;
    void bootstrapWallet()
      .then((meta) => {
        if (cancelled || authed) return;
        if (meta.durable && !meta.created) setWalletResume(true);
      })
      .catch((error) => {
        console.error("Cüzdan başlatılamadı", error);
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authed]);

  useEffect(() => {
    const onLogout = () => {
      setAuthed(false);
      void bootstrapWallet()
        .then((meta) => {
          setWalletResume(Boolean(meta.durable && !meta.created));
        })
        .catch(() => {
          setWalletResume(false);
        });
    };
    window.addEventListener(SESSION_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(SESSION_LOGOUT_EVENT, onLogout);
  }, []);

  const handleAuthenticated = useCallback((session) => {
    writeAuthSession(session);
    setWalletResume(false);
    setAuthed(true);
  }, []);

  if (authed) {
    return (
      <Suspense fallback={<BootScreen />}>
        <App />
      </Suspense>
    );
  }

  if (booting) {
    return <BootScreen />;
  }

  if (walletResume) {
    return <WalletResumeView onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Suspense fallback={<BootScreen />}>
      <RegisterPage onAuthenticated={handleAuthenticated} />
    </Suspense>
  );
}
