import classes from './detail_page.module.less';
import { AdminApi, ChurchDetail } from '@admin-client/api/admin_api';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

function formatTimestamp(epoch: number): string {
  return new Date(epoch * 1000).toLocaleString();
}

export function ChurchDetailPage() {
  const { churchId } = useParams<{ churchId: string }>();
  const navigate = useNavigate();
  const [church, setChurch] = useState<ChurchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchChurch = useCallback(async () => {
    if (!churchId) return;
    try {
      setLoading(true);
      const data = await AdminApi.getChurch(churchId);
      setChurch(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    fetchChurch();
  }, [fetchChurch]);

  if (loading) {
    return <div className={classes.page}>Loading...</div>;
  }

  if (error || !church) {
    return (
      <div className={classes.page}>
        <div className={classes.error}>{error || 'Church not found'}</div>
      </div>
    );
  }

  return (
    <div className={classes.page}>
      <Link to="/churches" className={classes.backLink}>
        &larr; Back to Churches
      </Link>

      <div className={classes.header}>
        <h1 className={classes.title}>{church.name}</h1>
        <div className={classes.subtitle}>{church.churchId}</div>
      </div>

      <div className={classes.detailCard}>
        <div className={classes.fieldGrid}>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>Address</span>
            <span className={classes.fieldValue}>{church.address || '—'}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>Email</span>
            <span className={classes.fieldValue}>{church.email || '—'}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>City</span>
            <span className={classes.fieldValue}>{church.city || '—'}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>State</span>
            <span className={classes.fieldValue}>{church.state || '—'}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>ZIP</span>
            <span className={classes.fieldValue}>{church.zip || '—'}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>County</span>
            <span className={classes.fieldValue}>{church.county || '—'}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>Created</span>
            <span className={classes.fieldValue}>{formatTimestamp(church.creationTimestamp)}</span>
          </div>
          <div className={classes.field}>
            <span className={classes.fieldLabel}>Last Modified</span>
            <span className={classes.fieldValue}>{formatTimestamp(church.modificationTimestamp)}</span>
          </div>
        </div>
      </div>

      <h2 className={classes.sectionTitle}>Members ({church.members.length})</h2>
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {church.members.length === 0 ? (
            <tr>
              <td colSpan={3} className={classes.emptyRow}>
                No members found.
              </td>
            </tr>
          ) : (
            church.members.map(member => (
              <tr key={member.userId} onClick={() => navigate(`/users/${member.userId}`)}>
                <td>
                  {member.firstName} {member.lastName}
                </td>
                <td>{member.email}</td>
                <td>{member.role}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
