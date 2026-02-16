import classes from '@client/shared-components/text_input.module.less';
import clsx from 'clsx';
import React from 'react';

interface TextInputProps {
  type?: string;
  value: string;
  placeholder?: string;
  className?: string;
  id?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: boolean;
}

export function TextInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  id,
  onKeyDown,
  error = false,
}: TextInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={clsx(classes.input, className, { [classes.error]: error })}
      id={id}
      onKeyDown={onKeyDown}
    />
  );
}
