import React from 'react';
import { InvoiceType } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface InvoiceTypeTabProps {
  type: InvoiceType;
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export function InvoiceTypeTab({ type, label, icon, active, onClick }: InvoiceTypeTabProps) {
  return (
    <Button
      onClick={onClick}
      size="xs"
      className={`rounded-lg flex items-center gap-2 ${
        active
          ? 'bg-zinc-900 text-white hover:bg-zinc-800'
          : 'bg-zinc-100 text-white hover:bg-zinc-200'
      }`}
    >
      {icon}
      {label}
    </Button>
  );
}

