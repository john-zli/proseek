import classes from '@client/components/header.module.less';
import { Button, ButtonStyle } from '@client/shared-components/button';
import { Link } from '@client/shared-components/link';
import clsx from 'clsx';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  const navigateToPortal = useCallback(() => {
    navigate('/portal');
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

        <div className={classes.rightContainer}>
          <Button buttonStyle={ButtonStyle.Primary} onClick={navigateToPortal}>
            Church Portal
          </Button>
        </div>
      </div>
    </div>
  );
}
