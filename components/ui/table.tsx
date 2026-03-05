import { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-sm ${className}`}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "" }: TableProps) {
  return <thead className={`border-b border-zinc-200 dark:border-zinc-800 ${className}`}>{children}</thead>;
}

export function TableBody({ children, className = "" }: TableProps) {
  return <tbody className={`${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = "" }: TableProps) {
  return (
    <tr
      className={`border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }: TableProps) {
  return (
    <th
      className={`h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }: TableProps) {
  return (
    <td
      className={`px-4 py-3 align-middle text-zinc-700 dark:text-zinc-300 ${className}`}
    >
      {children}
    </td>
  );
}
