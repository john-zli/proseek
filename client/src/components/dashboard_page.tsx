import { PrayerRequestChatsApi } from '@client/api/prayer_request_chats';
import classes from '@client/components/dashboard_page.module.less';
import { SessionContext } from '@client/contexts/session_context_provider';
import type { PrayerRequestChat } from '@common/server-api/types/prayer_request_chats';
import clsx from 'clsx';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Tab = 'mine' | 'all';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DashboardPage() {
  const { session, sessionLoading } = useContext(SessionContext);
  const navigate = useNavigate();
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequestChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('mine');

  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.isAuthenticated || !session.user) {
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

  if (sessionLoading || loading) {
    return (
      <div className={classes.container}>
        <div className={classes.loading}>Loading...</div>
      </div>
    );
  }

  const userId = session?.user?.userId;
  const filteredRequests =
    activeTab === 'mine' ? prayerRequests.filter(r => r.assignedUserId === userId) : prayerRequests;

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <h1 className={classes.title}>Dashboard</h1>

        <div className={classes.tabs}>
          <button
            className={clsx(classes.tab, { [classes.active]: activeTab === 'mine' })}
            onClick={() => setActiveTab('mine')}
          >
            My Requests
          </button>
          <button
            className={clsx(classes.tab, { [classes.active]: activeTab === 'all' })}
            onClick={() => setActiveTab('all')}
          >
            All Church Requests
          </button>
        </div>

        {error && <div className={classes.error}>{error}</div>}

        {!error && filteredRequests.length === 0 && (
          <div className={classes.emptyState}>
            {activeTab === 'mine'
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
                <span
                  className={clsx(classes.badge, {
                    [classes.assignedBadge]: request.assignedUserId,
                    [classes.unassignedBadge]: !request.assignedUserId,
                  })}
                >
                  {request.assignedUserId ? 'Assigned' : 'Unassigned'}
                </span>
                <span className={classes.openIcon}>&rsaquo;</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
