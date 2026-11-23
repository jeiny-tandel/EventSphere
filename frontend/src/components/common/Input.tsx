import { Input as AntdInput } from 'antd';
import type { ChangeEvent, FocusEvent, ReactElement } from 'react';

export interface InputProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  type?: string;
  isPassword?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
}

export function Input({
  id,
  name,
  label,
  placeholder,
  value,
  type = 'text',
  isPassword = false,
  required = false,
  disabled = false,
  error,
  className,
  onChange,
  onBlur,
}: InputProps): ReactElement {
  const inputId = id || name;
  const hasError = Boolean(error);

  const sharedProps = {
    id: inputId,
    name,
    placeholder,
    value,
    disabled,
    status: hasError ? ('error' as const) : undefined,
    className: 'w-full',
    onChange,
    onBlur,
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-dim-grey-800"
        >
          {label}
          {required && <span className="ml-1 text-powder-blush-500">*</span>}
        </label>
      )}

      {isPassword || type === 'password' ? (
        <AntdInput.Password {...sharedProps} />
      ) : (
        <AntdInput type={type} {...sharedProps} />
      )}

      {hasError && (
        <span className="text-xs text-powder-blush-500">{error}</span>
      )}
    </div>
  );
}

export default Input;
