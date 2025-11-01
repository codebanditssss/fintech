'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { setupNavigationGuard } from '@/lib/navigation';
import UploadZone from '../components/UploadZone';
import JobStatus from '../components/JobStatus';
import ResultsTable from '../components/ResultsTable';
import SynonymsPanel from '../components/SynonymsPanel';
import EvidenceDrawer from '../components/EvidenceDrawer';
import { getJobStatus, exportCSV } from '@/lib/api';

export default function Dashboard() {
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [recordsCount, setRecordsCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If not authenticated, redirect to landing page
      // (middleware should have caught this, but double check client-side)
      if (!user) {
        router.replace('/');
        return;
      }
      
      // Set nav token for authenticated users
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('nav-token', 'valid');
        sessionStorage.setItem('nav-time', Date.now().toString());
      }
    };
    
    checkAuth();
  }, [router, supabase]);

  // Load jobId from localStorage on mount
  useEffect(() => {
    const savedJobId = localStorage.getItem('currentJobId');
    if (savedJobId) {
      setCurrentJobId(savedJobId);
      const loadJobStatus = async () => {
        try {
          const status = await getJobStatus(savedJobId);
          setJobStatus(status.status === 'done' ? 'completed' : status.status === 'running' ? 'processing' : status.status);
          setProgress(status.progress || 0);
          setDocumentsCount(status.documentsProcessed || 0);
          setRecordsCount(status.totalRecords || 0);
          setStatusMessage(status.message);
        } catch (error) {
          console.error('Failed to load saved job:', error);
          localStorage.removeItem('currentJobId');
        }
      };
      loadJobStatus();
    }
  }, []);

  // Poll job status when we have an active job
  useEffect(() => {
    if (!currentJobId || jobStatus === 'completed' || jobStatus === 'error') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const status = await getJobStatus(currentJobId);
        setProgress(status.progress || 0);
        setDocumentsCount(status.documentsProcessed || 0);
        setRecordsCount(status.totalRecords || 0);
        setStatusMessage(status.message);
        
        if (status.status === 'done') {
          setJobStatus('completed');
          clearInterval(pollInterval);
        } else if (status.status === 'error') {
          setJobStatus('error');
          clearInterval(pollInterval);
        } else if (status.status === 'running') {
          setJobStatus('processing');
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentJobId, jobStatus]);

  // Setup navigation guard to prevent browser navigation
  useEffect(() => {
    const cleanup = setupNavigationGuard(router);
    return cleanup;
  }, [router]);

  const handleJobCreated = useCallback((jobId: string) => {
    setCurrentJobId(jobId);
    setJobStatus('processing');
    setProgress(0);
    localStorage.setItem('currentJobId', jobId);
  }, []);

  const handleRefreshResults = useCallback(() => {
    // Trigger results table refresh by updating a key or state
  }, []);

  const handleExportCSV = async () => {
    if (!currentJobId) {
      toast.error('No job to export');
      return;
    }

    setIsExporting(true);
    try {
      await exportCSV(currentJobId);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleNewUpload = () => {
    setCurrentJobId(null);
    setJobStatus('idle');
    setProgress(0);
    setDocumentsCount(0);
    setRecordsCount(0);
    setStatusMessage(undefined);
    localStorage.removeItem('currentJobId');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      
      // Clear all navigation tokens and session data
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('nav-token');
        sessionStorage.removeItem('nav-time');
        document.cookie = 'nav-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Force immediate redirect to landing page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoggingOut(false);
      // Even on error, redirect to landing page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
        {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
        <div>
              <h1 className="text-lg font-semibold text-zinc-900">Finance Concept Translator</h1>
              <p className="text-xs text-zinc-500">Normalize financial documents in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentJobId && jobStatus === 'completed' && (
              <button 
                onClick={handleNewUpload}
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                New Upload
              </button>
            )}
            <button 
              onClick={handleExportCSV}
              disabled={!currentJobId || isExporting}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Upload Zone */}
          <div className="lg:col-span-2">
            <UploadZone onJobCreated={handleJobCreated} />
          </div>

          {/* Job Status */}
          <div>
            <JobStatus 
              status={jobStatus}
              progress={progress}
              documentsCount={documentsCount}
              recordsCount={recordsCount}
              message={statusMessage}
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="mb-6">
          <ResultsTable 
            jobId={currentJobId} 
            onRowClick={(row) => setSelectedEvidence(row)} 
          />
        </div>

        {/* Synonyms Panel */}
        <div>
          <SynonymsPanel onSynonymChange={handleRefreshResults} />
        </div>
      </main>

      {/* Evidence Drawer */}
      {selectedEvidence && (
        <EvidenceDrawer 
          evidence={selectedEvidence} 
          onClose={() => setSelectedEvidence(null)} 
        />
      )}

      {/* Settings Modal */}
      <Modal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)}
      >
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900">Settings</h2>
          <div className="pt-4 border-t border-zinc-200">
            <h3 className="text-sm font-medium text-zinc-700 mb-3">Account</h3>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
