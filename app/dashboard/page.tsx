'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, LogOut, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { setupNavigationGuard } from '@/lib/navigation';
import { getJobStatus, exportCSV } from '@/lib/api';
import UploadZone from '../components/UploadZone';
import JobStatus from '../components/JobStatus';
import ResultsTable from '../components/ResultsTable';
import SynonymsPanel from '../components/SynonymsPanel';
import EvidenceDrawer from '../components/EvidenceDrawer';
import ChatInterface from '../components/ChatInterface';
import DocumentHistory from '../components/DocumentHistory';
import ChatHistory from '../components/ChatHistory';
import { Button } from '@/components/ui/Button';

export default function Dashboard() {
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [recordsCount, setRecordsCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  // const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

  useEffect(() => {
    const savedJobId = localStorage.getItem('currentJobId');
    if (savedJobId) {
      setCurrentJobId(savedJobId);
      const loadJobStatus = async () => {
        try {
          const status = await getJobStatus(savedJobId);
          setJobStatus(
            status.status === 'done' ? 'completed' 
            : status.status === 'running' || status.status === 'queued' ? 'processing' 
            : status.status === 'error' ? 'error' 
            : 'idle'
          );
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
        } else if (status.status === 'running' || status.status === 'queued') {
          setJobStatus('processing');
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentJobId, jobStatus]);

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
        document.cookie = 'nav-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoggingOut(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">FinTech</h1>
              <p className="text-xs text-zinc-500">Normalize financial documents in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentJobId && jobStatus === 'completed' && (
              <Button 
                onClick={handleNewUpload}
                variant="icon"
                size="sm"
                className="text-zinc-700 hover:text-zinc-900 rounded-lg shadow-sm"
              >
                New Upload
              </Button>
            )}
            <Button 
              onClick={handleExportCSV}
              disabled={!currentJobId || isExporting}
              variant="icon"
              size="sm"
              className="text-zinc-700 hover:text-zinc-900 rounded-lg flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            {/* <Button 
              onClick={() => setIsSettingsModalOpen(true)}
              variant="icon"
              className="p-2 text-zinc-600 hover:text-zinc-900"
            >
              <Settings className="w-4 h-4" />
            </Button> */}
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="icon"
              className="p-2 text-zinc-600 hover:text-zinc-900 shadow-sm"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <UploadZone onJobCreated={handleJobCreated} />
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DocumentHistory 
            onDocumentSelect={async (jobId) => {
              setCurrentJobId(jobId);
              setJobStatus('completed');  
              try {
                const status = await getJobStatus(jobId);
                setProgress(100);
                setDocumentsCount(status.documentsProcessed || 0);
                setRecordsCount(status.totalRecords || 0);
                setStatusMessage('Document loaded from history');
                setTimeout(() => {
                  const resultsSection = document.getElementById('results-section');
                  if (resultsSection) {
                    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 300);
              } catch (error) {
                console.error('Error loading job:', error);
                toast.error('Failed to load document data');
              }
            }}
          />
          <ChatHistory jobId={currentJobId} />
        </div>

        <div id="results-section" className="mb-6">
          <ResultsTable 
            jobId={currentJobId} 
            onRowClick={(row) => setSelectedEvidence(row)} 
          />
        </div>

        <div className="mb-6">
          <SynonymsPanel onSynonymChange={handleRefreshResults} />
        </div>
      </main>

      {selectedEvidence && (
        <EvidenceDrawer 
          evidence={selectedEvidence} 
          onClose={() => setSelectedEvidence(null)} 
        />
      )}

      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          variant="primary"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:scale-110 flex items-center justify-center z-40 p-0"
          title="Ask Questions"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      )}

      <ChatInterface
        jobId={currentJobId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
