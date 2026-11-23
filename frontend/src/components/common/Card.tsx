import { Card as AntdCard } from 'antd';
import type { ReactElement, ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  bordered?: boolean;
}

export function Card({
  children,
  className,
  bodyClassName,
  bordered = true,
}: CardProps): ReactElement {
  return (
    <AntdCard
      className={className}
      bordered={bordered}
      classNames={bodyClassName ? { body: bodyClassName } : undefined}
    >
      {children}
    </AntdCard>
  );
}

export default Card;
