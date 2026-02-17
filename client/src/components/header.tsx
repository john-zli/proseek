import classes from '@client/components/header.module.less';
import { Link } from '@client/shared-components/link';
import clsx from 'clsx';

export function Header() {
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
          </div>
        </div>

        <div className={classes.rightContainer}>
          <Link className={classes.portalLink} href="/portal/login">
            Church Member? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
