import { Button as AntdButton } from 'antd';
import type { ReactElement, ReactNode } from 'react';

export interface ButtonProps {
  children: ReactNode;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  htmlType?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  block?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export function Button({
  children,
  type = 'default',
  htmlType = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  block,
  className,
  onClick,
}: ButtonProps): ReactElement {
  return (
    <AntdButton
      type={type}
      htmlType={htmlType}
      loading={loading}
      disabled={disabled}
      block={block ?? fullWidth}
      className={className}
      onClick={onClick}
    >
      {children}
    </AntdButton>
  );
}

export default Button;
