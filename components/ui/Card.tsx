import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-slate-900
        rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50
        p-6 border border-gray-100 dark:border-slate-800
        backdrop-blur-sm
        transition-all duration-300 hover:shadow-2xl hover:shadow-gray-300/30 dark:hover:shadow-gray-950/50
        ${className}
      `}
    >
      {children}
    </div>
  );
}
