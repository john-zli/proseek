import classes from './detail_page.module.less';
import { AdminApi, UserDetail } from '@admin-client/api/admin_api';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

function formatTimestamp(epoch: number): string {
  return new Date(epoch * 1000).toLocaleString();
}

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await AdminApi.getUser(userId);
      setUser(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return <div className={classes.page}>Loading...</div>;
  }

  if (error || !user) {
    return (
      <div className={classes.page}>
        <div className={classes.error}>{error || 'User not found'}</div>
      </div>
    );
  }

  return (
    <div className={classes.page}>
      <Link to="/users" className={classes.backLink}>
        &larr; Back to Users
      </Link>

      <div className={classes.header}>
        <h1 className={classes.title}>
          {user.firstName} {user.lastName}
        </h1>
        <div className={classes.subtitle}>{user.userId}</div>
      </div>

      <div className={classes.detailCard}>
        <div className={classes.fieldGrid}>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>Email</span>
            <span className={classes.fieldValue}>{user.email}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>Gender</span>
            <span className={classes.fieldValue}>{user.gender}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>Created</span>
            <span className={classes.fieldValue}>{formatTimestamp(user.creationTimestamp)}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>Last Modified</span>
            <span className={classes.fieldValue}>{formatTimestamp(user.modificationTimestamp)}</span>
          </div>
        </div>
      </div>

      <h2 className={classes.sectionTitle}>Churches ({user.churches.length})</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Church Name</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {user.churches.length === 0 ? (
            <tr>
              <td colSpan={2} className={classes.emptyRow}>
                No church memberships found.
              </td>
            </tr>
          ) : (
            user.churches.map(membership => (
              <tr key={membership.churchId} onClick={() => navigate(`/churches/${membership.churchId}`)}>
                <td>{membership.churchName}</td>
                <td>{membership.role}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
