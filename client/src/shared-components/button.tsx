import clsx from 'clsx';

import classes from './button.module.less';

export enum ButtonStyle {
  Primary = 'Primary',
  Secondary = 'Secondary',
  Icon = 'Icon',
}

interface Props {
  buttonStyle: ButtonStyle;
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

function mapButtonStyleToClassName(buttonStyle: ButtonStyle): string {
  switch (buttonStyle) {
    case ButtonStyle.Primary:
      return classes.primaryButton;
    case ButtonStyle.Secondary:
      return classes.secondaryButton;
    case ButtonStyle.Icon:
      return classes.iconButton;
    default:
      return classes.primaryButton;
  }
}

export function Button(props: Props) {
  const { buttonStyle, onClick, children, className, disabled } = props;
  return (
    <button
      className={clsx(className, mapButtonStyleToClassName(buttonStyle), { [classes.disabled]: disabled })}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
