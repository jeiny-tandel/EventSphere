import { Input as AntdInput } from 'antd';
import type { ChangeEvent, FocusEvent, ReactElement } from 'react';

const { TextArea: AntdTextArea } = AntdInput;

export interface TextAreaProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  status?: 'error' | 'warning';
  className?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLTextAreaElement>) => void;
}

export function TextArea({
  id,
  name,
  label,
  placeholder,
  value,
  rows = 3,
  required = false,
  disabled = false,
  error,
  status,
  className,
  onChange,
  onBlur,
}: TextAreaProps): ReactElement {
  const inputId = id || name;
  const hasError = Boolean(error);
  const resolvedStatus = status ?? (hasError ? 'error' : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${className || ''}`.trim()}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-dim-grey-800"
        >
          {label}
          {required && <span className="ml-1 text-powder-blush-500">*</span>}
        </label>
      )}

      <AntdTextArea
        id={inputId}
        name={name}
        placeholder={placeholder}
        value={value}
        rows={rows}
        disabled={disabled}
        status={resolvedStatus}
        className="w-full"
        onChange={onChange}
        onBlur={onBlur}
      />

      {hasError && (
        <span className="text-xs text-powder-blush-500">{error}</span>
      )}
    </div>
  );
}

export default TextArea;
