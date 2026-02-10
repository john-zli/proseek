import { AdminApi } from '@admin-client/api/admin_api';
import { SessionData } from '@common/server-api/types/session';
import { SanitizedUser } from '@common/server-api/types/users';
import React, { createContext, useCallback, useEffect, useState } from 'react';

interface SessionContextType {
  session: SessionData | null;
  sessionLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType>({
  session: null,
  sessionLoading: true,
  login: async () => {},
  logout: async () => {},
  refetchSession: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const sessionData = await AdminApi.getSession();
      setSession(sessionData);
    } catch (error) {
      console.error('Error fetching session:', error);
      setSession({ isAuthenticated: false });
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await AdminApi.login({ email, password });
    setSession({ isAuthenticated: true, user: result.user as SanitizedUser });
  }, []);

  const logout = useCallback(async () => {
    await AdminApi.logout();
    setSession({ isAuthenticated: false });
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <SessionContext.Provider value={{ session, sessionLoading, login, logout, refetchSession: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}
