'use client';

import { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';

export function ExportBar() {
  const { jobId, fetchResults, status } = useAppStore();
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await apiClient.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('CSV exported successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = async () => {
    if (!jobId) {
      showToast('No job ID available', 'error');
      return;
    }

    setRefreshing(true);
    try {
      await fetchResults(jobId);
      showToast('Results refreshed', 'success');
    } catch (error: any) {
      showToast(error.message || 'Refresh failed', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleExport}
          variant="primary"
          size="md"
          className="flex-1"
          disabled={exporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Download CSV'}
        </Button>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="md"
          className="flex-1"
          disabled={refreshing || !jobId || status !== 'done'}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Results'}
        </Button>
      </div>
    </Card>
  );
}
