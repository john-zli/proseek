import { useState } from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, ButtonStyle } from '../shared-components/button';
import { TextInput } from '../shared-components/text_input';
import classes from './login_page.module.less';
import { UsersApi } from '@client/api/users';
import { SessionContext } from '@client/contexts/session_context_provider';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { refetchSession } = useContext(SessionContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      await UsersApi.login({ email, password });
      await refetchSession();

      // TODO: Redirect to the churches' admin page.
      navigate('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className={classes.loginContainer}>
      <form className={classes.loginForm} onSubmit={handleSubmit}>
        <h2 className={classes.title}>Log in</h2>
        <TextInput type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <TextInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className={classes.error}>{error}</div>}
        <Button buttonStyle={ButtonStyle.Primary} onClick={() => {}}>
          Log in
        </Button>
      </form>
    </div>
  );
}
