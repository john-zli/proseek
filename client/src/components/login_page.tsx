import { useState } from 'react';

import { Button, ButtonStyle } from '../shared-components/button';
import { TextInput } from '../shared-components/text_input';
import classes from './login_page.module.less';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for login logic
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    // TODO: Call login API
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
