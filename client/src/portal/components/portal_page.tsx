import { PrayerRequestChatsApi } from '@client/api/prayer_request_chats';
import { SessionContext } from '@client/contexts/session_context_provider';
import { formatDate, maskEmail } from '@client/format_helpers';
import classes from '@client/portal/components/portal_page.module.less';
import { LoadingSpinner } from '@client/shared-components/loading_spinner';
import type { PrayerRequestChat } from '@common/server-api/types/prayer_request_chats';
import clsx from 'clsx';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

enum Tab {
  Mine = 'mine',
  All = 'all',
}

export function PortalPage() {
  const { churchId } = useParams<{ churchId: string }>();
  const { session, sessionLoading } = useContext(SessionContext);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequestChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Mine);
  const [assigningIds, setAssigningIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (sessionLoading || !session?.user || !churchId) return;

    PrayerRequestChatsApi.listPrayerRequestChats(churchId)
      .then(res => setPrayerRequests(res.prayerRequests))
      .catch(() => setError('Failed to load prayer requests.'))
      .finally(() => setLoading(false));
  }, [session, sessionLoading, churchId]);

  const handleOpenChat = useCallback((requestId: string) => {
    window.open(`/chats/${requestId}`, '_blank');
  }, []);

  const handleClaim = useCallback(
    async (e: React.MouseEvent, requestId: string) => {
      e.stopPropagation();
      if (!session?.user) return;
      setAssigningIds(prev => new Set(prev).add(requestId));
      try {
        await PrayerRequestChatsApi.assignPrayerRequestChatroomToUser({ requestId, userId: session.user.userId });
        setPrayerRequests(prev =>
          prev.map(r => (r.requestId === requestId ? { ...r, assignedUserId: session.user!.userId } : r))
        );
      } catch {
        // silently fail — user can retry
      } finally {
        setAssigningIds(prev => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
      }
    },
    [session?.user]
  );

  const handleUnclaim = useCallback(async (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    setAssigningIds(prev => new Set(prev).add(requestId));
    try {
      await PrayerRequestChatsApi.unassignPrayerRequestChatroom(requestId);
      setPrayerRequests(prev => prev.map(r => (r.requestId === requestId ? { ...r, assignedUserId: null } : r)));
    } catch {
      // silently fail — user can retry
    } finally {
      setAssigningIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  }, []);

  const filteredRequests = useMemo(() => {
    return activeTab === Tab.Mine
      ? prayerRequests?.filter(r => r.assignedUserId === session?.user?.userId)
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
        <h1 className={classes.title}>Portal</h1>

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
            {filteredRequests.map(request => {
              const isAssignedToMe = request.assignedUserId === session?.user?.userId;
              const isAssignedToOther = request.assignedUserId !== null && !isAssignedToMe;
              const isBusy = assigningIds.has(request.requestId);

              return (
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
                  <div className={classes.cardActions}>
                    {isAssignedToOther && <span className={classes.badge}>Assigned</span>}
                    {isAssignedToMe && (
                      <button
                        className={classes.unclaimButton}
                        disabled={isBusy}
                        onClick={e => handleUnclaim(e, request.requestId)}
                      >
                        {isBusy ? '...' : 'Unclaim'}
                      </button>
                    )}
                    {!request.assignedUserId && (
                      <button
                        className={classes.claimButton}
                        disabled={isBusy}
                        onClick={e => handleClaim(e, request.requestId)}
                      >
                        {isBusy ? '...' : 'Claim'}
                      </button>
                    )}
                    <span className={classes.openIcon}>&rsaquo;</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
