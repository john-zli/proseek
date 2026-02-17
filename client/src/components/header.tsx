import classes from '@client/components/header.module.less';
import { SessionContext } from '@client/contexts/session_context_provider';
import { Button, ButtonStyle } from '@client/shared-components/button';
import { Link } from '@client/shared-components/link';
import clsx from 'clsx';
import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  const { session } = useContext(SessionContext);
  const isAuthenticated = Boolean(session?.user);

  const navigateToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div className={classes.headerContainer}>
      <div className={classes.nav}>
        <div className={classes.leftContainer}>
          <div className={classes.logoContainer} />
          <div className={classes.navLinks}>
            <Link
              className={clsx(classes.text, {
                [classes.active]: location.pathname === '/',
              })}
              href="/"
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                className={clsx(classes.text, {
                  [classes.active]: location.pathname === '/dashboard',
                })}
                href="/dashboard"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className={classes.rightContainer}>
          <Button buttonStyle={ButtonStyle.Primary} onClick={navigateToDashboard}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
