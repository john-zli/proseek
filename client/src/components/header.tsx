// import {useLocation} from 'react-router-dom';
import clsx from 'clsx';

import { Button, ButtonStyle } from '../shared-components/button';
import { Link } from '../shared-components/link';
import classes from './header.module.less';

export function Header() {
  // const location = useLocation();
  const location = window.location;

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

        {/* Users should only be created via a referral. */}
        <div className={classes.rightContainer}>
          <Button buttonStyle={ButtonStyle.Secondary} onClick={() => {}}>
            Log in
          </Button>
          <Button buttonStyle={ButtonStyle.Primary} onClick={() => {}}>
            Register
          </Button>
        </div>
      </div>
    </div>
  );
}
