import { SessionData } from '@common/server-api/types/session';
import React, { createContext, useEffect, useState } from 'react';

interface SessionContextType {
  session: SessionData | null;
  sessionLoading: boolean;
  refetchSession: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType>({
  session: null,
  sessionLoading: true,
  refetchSession: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/session');
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      const sessionData = await response.json();
      setSession(sessionData);
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session, sessionLoading, refetchSession: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}
