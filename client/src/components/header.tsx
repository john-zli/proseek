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
      <div className={classes.leftContainer}>
        <div className={classes.logoContainer} />
        <Link
          className={clsx(classes.text, {
            [classes.active]: location.pathname === '/',
          })}
          href="/"
        >
          Home
        </Link>
      </div>

      <div className={classes.rightContainer}>
        {/* TODO search bar */}
        <Button buttonStyle={ButtonStyle.Primary} onClick={() => {}}>
          Join the Network
        </Button>
      </div>
    </div>
  );
}
