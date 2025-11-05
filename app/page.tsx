'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingNavbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AuthForm } from '@/components/auth/AuthForm';
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { setupNavigationGuard } from '@/lib/navigation';
import { FileText, Zap, Shield, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cleanup = setupNavigationGuard(router);
    return cleanup;
  }, [router]);

  useEffect(() => {
    const handleSwitchToSignup = () => {
      setLoginModalOpen(false);
      setTimeout(() => setSignupModalOpen(true), 100);
    };
    
    const handleSwitchToLogin = () => {
      setSignupModalOpen(false);
      setTimeout(() => setLoginModalOpen(true), 100);
    };

    window.addEventListener('switchToSignup', handleSwitchToSignup);
    window.addEventListener('switchToLogin', handleSwitchToLogin);

    return () => {
      window.removeEventListener('switchToSignup', handleSwitchToSignup);
      window.removeEventListener('switchToLogin', handleSwitchToLogin);
    };
  }, []);

  const handleAuthSuccess = () => {
    setLoginModalOpen(false);
    setSignupModalOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nav-token', 'valid');
      sessionStorage.setItem('nav-time', Date.now().toString());
      document.cookie = `nav-token=valid; path=/; max-age=10; SameSite=Lax`;
      window.location.href = '/dashboard';
    }
  };
  
  useEffect(() => {
    if (window.location.pathname !== '/') return;
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      document.cookie = 'nav-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.history.pushState(null, '', window.location.href);
    };
    
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  return (
    <div className="min-h-screen bg-zinc-50">
      <LandingNavbar 
        onLoginClick={() => setLoginModalOpen(true)}
        onSignupClick={() => setSignupModalOpen(true)}
      />

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold text-zinc-900 mb-6 leading-tight">
            Finance Concept
            <div className="block mt-2 flex justify-center">
              <PointerHighlight
                rectangleClassName="dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600"
                pointerClassName="text-yellow-500"
              >
                <span className="relative z-10">Translator</span>
              </PointerHighlight>
            </div>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-600 max-w-2xl mx-auto mb-4 leading-relaxed">
            Extract financial data from PDF invoices and receipts using AI
          </p>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10">
            Upload PDFs, get normalized data with synonym mapping and Q&A chat
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full sm:w-auto px-8 py-6 text-base font-medium group"
              onClick={() => setLoginModalOpen(true)}
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 inline-block group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto px-8 py-6 text-base font-medium"
              onClick={() => setSignupModalOpen(true)}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Upload PDF invoices and receipts, extract data automatically with AI
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-zinc-900" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              Works with Any PDF Layout
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              Upload simple invoices or complex multi-tax documents. Uses OpenAI GPT-4o-mini to understand context, not just match keywords.
            </p>
          </div>
          <div className="p-8 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-zinc-900" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              Batch Processing
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              Upload multiple documents at once and process them simultaneously. See results appear in real-time as they're processed.
            </p>
          </div>
          <div className="p-8 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-zinc-900" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              Smart Synonym Mapping
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              Map variations like G.S.T, IGST, CGST to a single term (GST). The system learns from your corrections and applies them automatically.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-zinc-200 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 mb-4">
                Key Features
              </h2>
              <p className="text-lg text-zinc-600">
                Everything you need to extract and analyze financial data from PDFs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    Q&A Chat Interface
                  </h3>
                  <p className="text-zinc-600">
                    Ask questions about your data in natural language. "What's the total GST amount?" or "Show all taxes from invoice_001.pdf"
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    CSV Export
                  </h3>
                  <p className="text-zinc-600">
                    Download all extracted data with document names, page numbers, confidence scores, and evidence snippets.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    Evidence Tracking
                  </h3>
                  <p className="text-zinc-600">
                    See the exact text snippet from the PDF for every extracted value. Know where each piece of data came from.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    Confidence Scoring
                  </h3>
                  <p className="text-zinc-600">
                    Each extraction includes an accuracy indicator so you know which values to double-check.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 mb-6">
            Start Extracting Data from Your PDFs
          </h2>
          <p className="text-lg text-zinc-600 mb-10 max-w-xl mx-auto">
            Built with Next.js, Supabase, and OpenAI. Upload invoices, get structured data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full sm:w-auto px-10 py-6 text-base font-medium"
              onClick={() => setLoginModalOpen(true)}
            >
              Login
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto px-10 py-6 text-base font-medium"
              onClick={() => setSignupModalOpen(true)}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      <Modal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
      >
        <AuthForm 
          mode="login" 
          onSuccess={handleAuthSuccess}
        />
      </Modal>

      <Modal 
        isOpen={signupModalOpen} 
        onClose={() => setSignupModalOpen(false)}
      >
        <AuthForm 
          mode="signup" 
          onSuccess={handleAuthSuccess}
        />
      </Modal>
    </div>
  );
}
