import classes from './invitations_page.module.less';
import { AdminApi } from '@admin-client/api/admin_api';
import { Church } from '@common/server-api/types/churches';
import { useCallback, useEffect, useState } from 'react';

export function InvitationsPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [churchId, setChurchId] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchChurches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdminApi.listChurches();
      setChurches(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChurches();
  }, [fetchChurches]);

  const handleSend = async () => {
    setFormError('');
    setFormSuccess('');

    if (!email || !churchId) {
      setFormError('Email and church are required.');
      return;
    }

    try {
      setSending(true);
      await AdminApi.inviteUser({ email, churchId });
      setFormSuccess(`Invitation sent to ${email}`);
      setEmail('');
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className={classes.page}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={classes.page}>
        <div className={classes.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <h1 className={classes.title}>Send Invitation</h1>
      </div>

      <div className={classes.formCard}>
        <h3 className={classes.formTitle}>Invite a User</h3>
        <div className={classes.formGrid}>
          <input
            className={classes.input}
            placeholder="Email address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <select className={classes.select} value={churchId} onChange={e => setChurchId(e.target.value)}>
            <option value="">Select a church...</option>
            {churches.map(church => (
              <option key={church.churchId} value={church.churchId}>
                {church.name}
              </option>
            ))}
          </select>
        </div>
        {formError && <div className={classes.formError}>{formError}</div>}
        {formSuccess && <div className={classes.formSuccess}>{formSuccess}</div>}
        <div className={classes.formActions}>
          <button className={classes.sendButton} onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}
