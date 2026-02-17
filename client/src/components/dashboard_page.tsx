import { PrayerRequestChatsApi } from '@client/api/prayer_request_chats';
import classes from '@client/components/dashboard_page.module.less';
import { SessionContext } from '@client/contexts/session_context_provider';
import { formatDate, maskEmail } from '@client/format_helpers';
import { LoadingSpinner } from '@client/shared-components/loading_spinner';
import type { PrayerRequestChat } from '@common/server-api/types/prayer_request_chats';
import clsx from 'clsx';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

enum Tab {
  Mine = 'mine',
  All = 'all',
}

export function DashboardPage() {
  const { session, sessionLoading } = useContext(SessionContext);
  const navigate = useNavigate();
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequestChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Mine);

  useEffect(() => {
    if (sessionLoading) return;

    if (!session?.user) {
      navigate('/login');
      return;
    }

    PrayerRequestChatsApi.getDashboardRequests()
      .then(res => setPrayerRequests(res.prayerRequests))
      .catch(() => setError('Failed to load prayer requests.'))
      .finally(() => setLoading(false));
  }, [session, sessionLoading, navigate]);

  const handleOpenChat = useCallback((requestId: string) => {
    window.open(`/chats/${requestId}`, '_blank');
  }, []);

  const filteredRequests = useMemo(() => {
    return activeTab === Tab.Mine
      ? prayerRequests.filter(r => r.assignedUserId === session?.user?.userId)
      : prayerRequests;
  }, [prayerRequests, activeTab, session?.user?.userId]);

  if (sessionLoading || loading) {
    return (
      <div className={classes.container}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <h1 className={classes.title}>Dashboard</h1>

        <div className={classes.tabs}>
          <button
            className={clsx(classes.tab, { [classes.active]: activeTab === Tab.Mine })}
            onClick={() => setActiveTab(Tab.Mine)}
          >
            My Requests
          </button>
          <button
            className={clsx(classes.tab, { [classes.active]: activeTab === Tab.All })}
            onClick={() => setActiveTab(Tab.All)}
          >
            All Church Requests
          </button>
        </div>

        {error && <div className={classes.error}>{error}</div>}

        {!error && filteredRequests.length === 0 && (
          <div className={classes.emptyState}>
            {activeTab === Tab.Mine
              ? 'No prayer requests assigned to you yet.'
              : 'No prayer requests for your church yet.'}
          </div>
        )}

        {!error && filteredRequests.length > 0 && (
          <div className={classes.requestsList}>
            {filteredRequests.map(request => (
              <div
                key={request.requestId}
                className={classes.requestCard}
                onClick={() => handleOpenChat(request.requestId)}
              >
                <div className={classes.requestInfo}>
                  <div className={classes.requestLocation}>
                    {[request.city, request.zip].filter(Boolean).join(', ') || 'Unknown location'}
                  </div>
                  <div className={classes.requestMeta}>
                    <span>{formatDate(request.creationTimestamp)}</span>
                    {request.requestContactEmail && (
                      <span className={classes.requestContact}>{maskEmail(request.requestContactEmail)}</span>
                    )}
                  </div>
                </div>
                {request.assignedUserId && <span className={classes.badge}>Assigned</span>}
                <span className={classes.openIcon}>&rsaquo;</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
