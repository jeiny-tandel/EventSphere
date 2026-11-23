import type { ReactElement, ReactNode } from 'react';

export interface PageHeaderProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className = '',
}: PageHeaderProps): ReactElement {
  return (
    <div
      className={`flex flex-col justify-between gap-4 sm:flex-row sm:items-center ${className}`.trim()}
    >
      <div>
        <h1 className="text-2xl font-extrabold text-dim-grey-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-dim-grey-600">
            {description}
          </p>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}

export default PageHeader;
