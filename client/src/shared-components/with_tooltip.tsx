import { ReactNode } from 'react';

import classes from './with_tooltip.module.less';

export enum TooltipPosition {
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
}

interface TooltipProps {
  children: ReactNode;
  message: string;
  position?: TooltipPosition;
}

export function withTooltip(children: ReactNode, message: string, position: TooltipPosition = TooltipPosition.Bottom) {
  return (
    <WithTooltip message={message} position={position}>
      {children}
    </WithTooltip>
  );
}

function WithTooltip({ children, message, position = TooltipPosition.Bottom }: TooltipProps) {
  return (
    <div className={classes.tooltipWrapper}>
      {children}
      <div className={`${classes.tooltip} ${classes[position]}`}>{message}</div>
    </div>
  );
}
