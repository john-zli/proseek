import classes from './admin_layout.module.less';
import { SessionContext } from '@admin-client/contexts/session_context';
import { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export function AdminLayout() {
  const { session, logout } = useContext(SessionContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={classes.layout}>
      <aside className={classes.sidebar}>
        <div className={classes.brand}>ProSeek Admin</div>
        <nav className={classes.nav}>
          <NavLink
            to="/churches"
            className={({ isActive }) => `${classes.navItem} ${isActive ? classes.navItemActive : ''}`}
          >
            Churches
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) => `${classes.navItem} ${isActive ? classes.navItemActive : ''}`}
          >
            Users
          </NavLink>
        </nav>
        <div className={classes.sidebarFooter}>
          <div className={classes.userInfo}>{session?.user?.email}</div>
          <button className={classes.logoutButton} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className={classes.content}>
        <Outlet />
      </main>
    </div>
  );
}
