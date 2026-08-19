'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { SessionUser } from '@aww/shared';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

type SessionState = {
  session: Session | null;
  user: SessionUser | null;
  loading: boolean;
  token: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (token: string | undefined) => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      setUser(await api.get<SessionUser>('/api/me', { token }));
    } catch {
      // A valid Supabase token with no profile row means the signup trigger has
      // not caught up yet. Treat it as signed out rather than crashing the shell.
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const client = supabase();
    let active = true;

    client.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.access_token);
      setLoading(false);
    });

    // Fires on sign-in, sign-out, and every silent token refresh.
    const { data: listener } = client.auth.onAuthStateChange(async (_event, next) => {
      if (!active) return;
      setSession(next);
      await loadProfile(next?.access_token);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<SessionState>(
    () => ({
      session,
      user,
      loading,
      token: session?.access_token ?? null,
      refresh: () => loadProfile(session?.access_token),
      signOut: async () => {
        await supabase().auth.signOut();
        setUser(null);
        setSession(null);
      },
    }),
    [session, user, loading, loadProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
