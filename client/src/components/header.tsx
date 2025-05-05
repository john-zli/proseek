// import {useLocation} from 'react-router-dom';
import clsx from 'clsx';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, ButtonStyle } from '../shared-components/button';
import { Link } from '../shared-components/link';
import classes from './header.module.less';

export function Header() {
  const navigate = useNavigate();
  const navigateToLogin = useCallback(() => {
    navigate('/login');
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
          </div>
        </div>

        {/* Users should only be created via a referral. */}
        <div className={classes.rightContainer}>
          <Button buttonStyle={ButtonStyle.Secondary} onClick={navigateToLogin}>
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
