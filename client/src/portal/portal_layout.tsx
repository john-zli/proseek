import { UsersApi } from '@client/api/users';
import { SessionContext } from '@client/contexts/session_context_provider';
import classes from '@client/portal/portal_layout.module.less';
import { Link } from '@client/shared-components/link';
import { LoadingSpinner } from '@client/shared-components/loading_spinner';
import clsx from 'clsx';
import { useCallback, useContext } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

export function PortalLayout() {
  const { session, sessionLoading, refetchSession } = useContext(SessionContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(async () => {
    await UsersApi.logout();
    await refetchSession();
    navigate('/portal/login');
  }, [refetchSession, navigate]);

  if (sessionLoading) {
    return (
      <div className={classes.loadingContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/portal/login" replace />;
  }

  return (
    <div className={classes.layout}>
      <div className={classes.headerContainer}>
        <div className={classes.nav}>
          <div className={classes.leftContainer}>
            <div className={classes.logoContainer} />
            <div className={classes.navLinks}>
              <Link
                className={clsx(classes.navLink, {
                  [classes.active]: location.pathname === '/portal/dashboard',
                })}
                href="/portal/dashboard"
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div className={classes.rightContainer}>
            <span className={classes.userName}>
              {session.user.firstName} {session.user.lastName}
            </span>
            <button className={classes.logoutButton} onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </div>
      <main className={classes.content}>
        <Outlet />
      </main>
    </div>
  );
}
