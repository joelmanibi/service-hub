"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import LoginModal from "./LoginModal";

export type SessionUserInfo = { email: string; role: string } | null;

type SessionContextValue = {
  user: SessionUserInfo;
  openLogin: () => void;
};

const SessionContext = createContext<SessionContextValue>({ user: null, openLogin: () => undefined });

/**
 * Expose aux composants client (Header, sections verrouillées de la fiche)
 * l'utilisateur connecté — lu côté serveur depuis le cookie de session
 * (layout.tsx) — et l'ouverture de la fenêtre de connexion. Après
 * connexion/déconnexion, `router.refresh()` relance le rendu serveur :
 * le layout relit le cookie et la fiche recharge (ou masque) les
 * informations sensibles.
 */
export default function SessionProvider({ user, children }: { user: SessionUserInfo; children: ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const openLogin = useCallback(() => setIsLoginOpen(true), []);
  const value = useMemo(() => ({ user, openLogin }), [user, openLogin]);

  return (
    <SessionContext.Provider value={value}>
      {children}
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
