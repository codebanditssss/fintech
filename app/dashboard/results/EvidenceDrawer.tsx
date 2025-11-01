'use client';

import { useEffect } from 'react';
import { X, FileText, MapPin } from 'lucide-react';
import { ConceptRow } from '@/lib/types';
import { Card } from '@/components/ui';

interface EvidenceDrawerProps {
  row: ConceptRow;
  onClose: () => void;
}

export function EvidenceDrawer({ row, onClose }: EvidenceDrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl z-50 overflow-y-auto">
        <Card className="m-0 rounded-none border-0 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Evidence Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Field
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{row.field}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Canonical
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{row.canonical}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Value
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{row.value}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Page
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{row.page}</p>
              </div>
            </div>

            {/* Document ID */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                {row.doc_id}
              </span>
            </div>

            {/* Bounding Box (if available) */}
            {row.bbox && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-800 dark:text-blue-300">
                  BBox: [{row.bbox.join(', ')}]
                </span>
              </div>
            )}

            {/* Evidence Text */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Evidence Text
              </p>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {row.evidence}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
