import classes from './login_page.module.less';
import { SessionContext } from '@admin-client/contexts/session_context';
import { useContext, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, sessionLoading, login } = useContext(SessionContext);
  const navigate = useNavigate();

  if (sessionLoading) {
    return null;
  }

  if (session?.isAuthenticated) {
    return <Navigate to="/churches" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/churches');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <form className={classes.form} onSubmit={handleSubmit}>
        <h2 className={classes.title}>ProSeek Admin</h2>
        <input
          className={classes.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
        />
        <input
          className={classes.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className={classes.error}>{error}</div>}
        <button className={classes.button} type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
