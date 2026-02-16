import { Button, ButtonStyle } from '../shared-components/button';
import { Link } from '../shared-components/link';
import classes from './header.module.less';
import { UsersApi } from '@client/api/users';
import { SessionContext } from '@client/contexts/session_context_provider';
import clsx from 'clsx';
import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();
  const { session, refetchSession } = useContext(SessionContext);
  const isAuthenticated = session?.isAuthenticated && session.user;

  const navigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await UsersApi.logout();
      await refetchSession();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [refetchSession, navigate]);

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
          {isAuthenticated ? (
            <>
              <span className={classes.userName}>{session.user!.firstName}</span>
              <Button buttonStyle={ButtonStyle.Secondary} onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button buttonStyle={ButtonStyle.Secondary} onClick={navigateToLogin}>
                Log in
              </Button>
              <Button buttonStyle={ButtonStyle.Primary} onClick={() => {}}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
