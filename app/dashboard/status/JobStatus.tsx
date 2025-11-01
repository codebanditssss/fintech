'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui';
import { Loader } from '@/components/ui/Loader';
import { useAppStore } from '@/lib/store';
import { usePolling } from '@/lib/hooks';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

export function JobStatus() {
  const { jobId, status } = useAppStore();
  const enabled = !!jobId && (status === 'queued' || status === 'running');
  
  usePolling(jobId, enabled);

  if (!jobId) {
    return (
      <Card>
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload files to start processing
          </p>
        </div>
      </Card>
    );
  }

  const statusConfig = {
    idle: { label: 'Idle', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
    queued: { label: 'Queued', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
    running: { label: 'Processing', icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    done: { label: 'Complete', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
    error: { label: 'Error', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Job Status
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {jobId.slice(0, 8)}...
          </span>
        </div>
        
        <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}>
          {status === 'running' ? (
            <Loader2 className={`w-5 h-5 animate-spin ${config.color}`} />
          ) : (
            <Icon className={`w-5 h-5 ${config.color}`} />
          )}
          <span className={`font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>

        {status === 'running' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This may take a few moments...
          </p>
        )}
      </div>
    </Card>
  );
}
