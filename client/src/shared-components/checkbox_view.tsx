import clsx from 'clsx';

import classes from './checkbox_view.module.less';

interface Props {
  checked: boolean;
  label: string;
  className?: string;
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function CheckboxView({ checked, label, className }: Props) {
  return (
    <div className={clsx(classes.checkboxContent, className)}>
      <div className={clsx(classes.checkbox, { [classes.checked]: checked })}>{checked && <CheckIcon />}</div>
      <span className={classes.checkboxLabel}>{label}</span>
    </div>
  );
}
