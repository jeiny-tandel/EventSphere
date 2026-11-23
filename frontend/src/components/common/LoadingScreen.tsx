import type { ReactElement } from 'react';

export interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({
  message = 'Loading...',
  className = '',
}: LoadingScreenProps): ReactElement {
  return (
    <div
      className={`flex min-h-screen items-center justify-center ${className}`.trim()}
    >
      <div>{message}</div>
    </div>
  );
}

export default LoadingScreen;
