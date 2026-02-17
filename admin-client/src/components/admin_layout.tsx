import classes from './admin_layout.module.less';
import { NavLink, Outlet } from 'react-router-dom';

export function AdminLayout() {
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
          <NavLink
            to="/invitations"
            className={({ isActive }) => `${classes.navItem} ${isActive ? classes.navItemActive : ''}`}
          >
            Invitations
          </NavLink>
        </nav>
      </aside>
      <main className={classes.content}>
        <Outlet />
      </main>
    </div>
  );
}
