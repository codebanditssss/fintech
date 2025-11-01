import { useEffect, useRef } from 'react';
import { useAppStore } from './store';
import { apiClient } from './api';
import { JobStatus } from './types';

export function usePolling(jobId: string | null, enabled: boolean) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { setStatus, fetchResults } = useAppStore();

  useEffect(() => {
    if (!jobId || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const { status } = await apiClient.getStatus(jobId);
        setStatus(status);

        if (status === 'done') {
          // Stop polling and fetch results
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          await fetchResults(jobId);
        } else if (status === 'error') {
          // Stop polling on error
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        // Continue polling on error (network issues, etc.)
      }
    };

    // Poll immediately
    poll();

    // Then poll every 2 seconds
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, enabled, setStatus, fetchResults]);
}
