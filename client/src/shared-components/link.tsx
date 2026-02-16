import classes from '@client/shared-components/link.module.less';
import clsx from 'clsx';

interface Props {
  className?: string;
  href: string;
  children?: React.ReactNode;
  newTab?: boolean;
}
export function Link(props: Props) {
  const { className, href, children, newTab } = props;

  return (
    <a href={href} target={newTab ? '_blank' : '_self'} className={clsx(className, classes.link)}>
      {children}
    </a>
  );
}
