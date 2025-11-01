'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { setupNavigationGuard } from '@/lib/navigation';
import { getJobStatus, exportCSV } from '@/lib/api';

// New components
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import SynonymsDock from '../components/SynonymsDock';

// Existing components
import UploadZone from '../components/UploadZone';
import JobStatus from '../components/JobStatus';
import ResultsTable from '../components/ResultsTable';
import SynonymsPanel from '../components/SynonymsPanel';
import EvidenceDrawer from '../components/EvidenceDrawer';
import { Modal } from '@/components/ui/Modal';

export default function DashboardRedesign() {
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [recordsCount, setRecordsCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSynonymsModalOpen, setIsSynonymsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Mock data for now - will integrate with real data
  const [documents] = useState([
    { id: '1', name: 'invoice_march.pdf', termsCount: 5, date: 'Mar 1' },
    { id: '2', name: 'gst_report.pdf', termsCount: 8, date: 'Feb 28' },
  ]);

  const [synonyms] = useState([
    { 
      id: '1', 
      term: 'GST', 
      canonical: 'GST',
      mappings: ['GST', 'G.S.T', 'Goods and Services Tax']
    },
    { 
      id: '2', 
      term: 'VAT', 
      canonical: 'VAT',
      mappings: ['VAT', 'Value Added Tax']
    },
    { 
      id: '3', 
      term: 'TDS', 
      canonical: 'TDS',
      mappings: ['TDS', 'Tax Deducted at Source']
    },
  ]);

  const router = useRouter();
  const supabase = createClient();

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('nav-token', 'valid');
        sessionStorage.setItem('nav-time', Date.now().toString());
      }
    };
    checkAuth();
  }, [router, supabase]);

  // Load job from localStorage
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

  // Poll job status
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

  // Setup navigation guard
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
    // Trigger refresh
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
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('nav-token');
        sessionStorage.removeItem('nav-time');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="h-screen bg-zinc-50 flex overflow-hidden">
      {/* Left Sidebar */}
      <LeftSidebar
        documents={documents}
        currentUser={{ name: 'Khushi', email: 'khushi@email.com' }}
        onDocumentSelect={(id) => console.log('Select doc:', id)}
        onDocumentDelete={(id) => console.log('Delete doc:', id)}
        onLogout={handleLogout}
        onSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar with Synonyms and Upload */}
        <div className="bg-white border-b border-zinc-200 px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Synonyms Dock */}
            <div className="flex-1 w-full md:w-auto">
              <SynonymsDock
                synonyms={synonyms}
                onAdd={() => setIsSynonymsModalOpen(true)}
                onEdit={(id) => setIsSynonymsModalOpen(true)}
                onDelete={(id) => console.log('Delete:', id)}
              />
            </div>

            {/* Upload Button */}
            <div className="flex items-center gap-2">
              {currentJobId && jobStatus === 'completed' && (
                <button
                  onClick={handleNewUpload}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  New Upload
                </button>
              )}
              <button
                onClick={handleExportCSV}
                disabled={!currentJobId || isExporting}
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-50">
          <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
            {/* Upload Zone - Only show if no active job */}
            {!currentJobId && (
              <div className="bg-white rounded-xl border border-zinc-200 p-4 md:p-8">
                <UploadZone onJobCreated={handleJobCreated} />
              </div>
            )}

            {/* Job Status */}
            {currentJobId && jobStatus !== 'completed' && (
              <div className="bg-white rounded-xl border border-zinc-200 p-4 md:p-6">
                <JobStatus
                  status={jobStatus}
                  progress={progress}
                  documentsCount={documentsCount}
                  recordsCount={recordsCount}
                  message={statusMessage}
                />
              </div>
            )}

            {/* Results Table */}
            {currentJobId && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <ResultsTable
                  jobId={currentJobId}
                  onRowClick={(row) => setSelectedEvidence(row)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar (Chat) */}
      <RightSidebar jobId={currentJobId} />

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
          <p className="text-sm text-zinc-600">Settings panel coming soon...</p>
        </div>
      </Modal>

      {/* Synonyms Management Modal */}
      {isSynonymsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-xl font-semibold text-zinc-900">Manage Synonyms</h2>
              <button
                onClick={() => setIsSynonymsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
              <SynonymsPanel onSynonymChange={handleRefreshResults} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

