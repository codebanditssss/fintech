'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Database, Download, Settings, Search, AlertCircle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { setupNavigationGuard, navigateWithToken } from '@/lib/navigation';
import UploadZone from '../components/UploadZone';
import JobStatus from '../components/JobStatus';
import ResultsTable from '../components/ResultsTable';
import SynonymsPanel from '../components/SynonymsPanel';
import EvidenceDrawer from '../components/EvidenceDrawer';

export default function Dashboard() {
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
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

  // Setup navigation guard to prevent browser navigation
  useEffect(() => {
    const cleanup = setupNavigationGuard(router);
    return cleanup;
  }, [router]);

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
            <button className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Upload Zone */}
          <div className="lg:col-span-2">
            <UploadZone onUpload={(files) => console.log(files)} />
          </div>

          {/* Job Status */}
          <div>
            <JobStatus status={jobStatus} />
          </div>
        </div>

        {/* Results Table */}
        <div className="mb-6">
          <ResultsTable onRowClick={(row) => setSelectedEvidence(row)} />
          </div>

        {/* Synonyms Panel */}
        <div>
          <SynonymsPanel />
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
