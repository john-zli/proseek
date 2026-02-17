import { InvitationInfo, UsersApi } from '@client/api/users';
import { SessionContext } from '@client/contexts/session_context_provider';
import classes from '@client/portal/components/invite_page.module.less';
import { Button, ButtonStyle } from '@client/shared-components/button';
import { TextInput } from '@client/shared-components/text_input';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function InvitePage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const navigate = useNavigate();
  const { refetchSession } = useContext(SessionContext);

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Male');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!code) {
      setLookupError('No invitation code provided.');
      setLoading(false);
      return;
    }

    UsersApi.getInvitation(code)
      .then(data => {
        setInvitation(data);
      })
      .catch(() => {
        setLookupError('This invitation is invalid or has expired.');
      })
      .finally(() => setLoading(false));
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    if (!firstName || !lastName || !password) {
      setSubmitError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await UsersApi.register({
        email: invitation.targetEmail,
        firstName,
        lastName,
        gender,
        password,
        invitationCode: code,
      });
      const sessionData = await refetchSession();
      navigate(`/portal/${sessionData?.user?.churchIds[0]}`);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={classes.container}>
        <div className={classes.card}>Loading...</div>
      </div>
    );
  }

  if (lookupError) {
    return (
      <div className={classes.container}>
        <div className={classes.card}>
          <h2 className={classes.title}>Invitation</h2>
          <p className={classes.errorMessage}>{lookupError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <form className={classes.card} onSubmit={handleSubmit}>
        <h2 className={classes.title}>Join {invitation!.churchName}</h2>
        <p className={classes.subtitle}>You&apos;ve been invited to create an account.</p>

        <div className={classes.field}>
          <label className={classes.label}>Email</label>
          <input className={classes.disabledInput} type="email" value={invitation!.targetEmail} disabled />
        </div>

        <div className={classes.row}>
          <div className={classes.field}>
            <label className={classes.label}>First name</label>
            <TextInput value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
          </div>
          <div className={classes.field}>
            <label className={classes.label}>Last name</label>
            <TextInput value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
          </div>
        </div>

        <div className={classes.field}>
          <label className={classes.label}>Gender</label>
          <select className={classes.select} value={gender} onChange={e => setGender(e.target.value)}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className={classes.field}>
          <label className={classes.label}>Password</label>
          <TextInput
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        {submitError && <div className={classes.error}>{submitError}</div>}

        <Button buttonStyle={ButtonStyle.Primary} onClick={() => {}} disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}
