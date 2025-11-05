import { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ==========================================
// TABLE CONTAINER
// ==========================================

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

// ==========================================
// TABLE HEADER
// ==========================================

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn("bg-zinc-50 border-b border-zinc-200", className)}>
      {children}
    </thead>
  );
}

// ==========================================
// TABLE BODY
// ==========================================

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn("divide-y divide-zinc-200", className)}>
      {children}
    </tbody>
  );
}

// ==========================================
// TABLE ROW
// ==========================================

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, className }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        onClick && "cursor-pointer hover:bg-zinc-50 transition-colors",
        className
      )}
    >
      {children}
    </tr>
  );
}

// ==========================================
// TABLE HEAD CELL
// ==========================================

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
}

export function TableHead({ children, className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "px-6 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

// ==========================================
// TABLE CELL
// ==========================================

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableCell({ children, className, align = 'left', ...props }: TableCellProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <td className={cn("px-6 py-4", alignClass, className)} {...props}>
      {children}
    </td>
  );
}

