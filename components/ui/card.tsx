import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <h3
      className={`text-lg font-semibold text-zinc-900 dark:text-zinc-100 ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }: CardProps) {
  return (
    <p className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`}>
      {children}
    </p>
  );
}
