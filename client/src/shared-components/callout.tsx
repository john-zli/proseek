import clsx from 'clsx';
import { ReactNode } from 'react';

import styles from './callout.module.less';

interface CalloutProps {
  children: ReactNode;
  className?: string;
}

export const Callout = ({ children, className }: CalloutProps) => {
  return <div className={clsx(styles.callout, className)}>{children}</div>;
};
