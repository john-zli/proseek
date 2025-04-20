import clsx from 'clsx';
import { ReactNode } from 'react';

import styles from './callout.module.less';

interface CalloutProps {
  children: ReactNode;
  className?: string;
  delaySeconds?: number;
}

export function Callout(props: CalloutProps) {
  const { children, className, delaySeconds } = props;

  const animationStyle = delaySeconds ? { animationDelay: `${delaySeconds}s`, animationFillMode: 'backwards' } : {};
  return (
    <div style={animationStyle} className={clsx(styles.callout, className)}>
      {children}
    </div>
  );
}
