import { UsersApi } from '@client/api/users';
import { SessionContext } from '@client/contexts/session_context_provider';
import classes from '@client/portal/components/login_page.module.less';
import { Button, ButtonStyle } from '@client/shared-components/button';
import { TextInput } from '@client/shared-components/text_input';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

      navigate('/portal');
    } catch (err) {
      setError((err as Error).message);
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
