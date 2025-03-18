import classes from './header.module.less';
import clsx from 'clsx';
// import {useLocation} from 'react-router-dom';
import { Link } from '../shared-components/Link';
import { Button, ButtonStyle } from '../shared-components/button';

export function Header() {
  // const location = useLocation();
  const location = window.location;

  return (
    <div className={classes.headerContainer}>
      <div className={classes.leftContainer}>
        <div className={classes.logoContainer}/>
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
  )
}