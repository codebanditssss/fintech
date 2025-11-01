'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingNavbar } from '@/components/Navbar';
import { Button, Modal } from '@/components/ui';
import { AuthForm } from '@/components/auth/AuthForm';
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { navigateWithToken, setupNavigationGuard } from '@/lib/navigation';
import { FileText, Zap, Shield, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const router = useRouter();

  // Setup navigation guard to prevent browser navigation
  useEffect(() => {
    const cleanup = setupNavigationGuard(router);
    return cleanup;
  }, [router]);

  // Listen for switch events between login/signup
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
    // Set navigation token before redirecting
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nav-token', 'valid');
      sessionStorage.setItem('nav-time', Date.now().toString());
      document.cookie = `nav-token=valid; path=/; max-age=10; SameSite=Lax`;
      // Force navigation to dashboard
      window.location.href = '/dashboard';
    }
  };
  
  // Block browser back/forward buttons only if on landing page
  useEffect(() => {
    // Only block navigation if we're actually on the landing page
    if (window.location.pathname !== '/') return;
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Clear nav tokens
      document.cookie = 'nav-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      // Stay on current page
      window.history.pushState(null, '', window.location.href);
    };
    
    // Push initial state
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
      
      {/* Hero Section */}
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
            Transform complex financial documents into normalized, actionable data
          </p>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10">
            Advanced AI-powered concept extraction and normalization in real-time
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

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 mb-4">
            Enterprise-Grade Solutions
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Built for finance teams who need accuracy, speed, and reliability
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-zinc-900" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              Lightning Fast Processing
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              Upload and process complex financial documents in seconds. Advanced algorithms ensure rapid extraction without compromising accuracy.
            </p>
          </div>
          <div className="p-8 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-zinc-900" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              Secure & Reliable
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              Enterprise-level security with end-to-end encryption. Your sensitive financial data is protected with industry-standard safeguards.
            </p>
          </div>
          <div className="p-8 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6 text-zinc-900" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              Intelligent Normalization
            </h3>
            <p className="text-zinc-600 leading-relaxed">
              AI-powered concept extraction transforms varied terminology into standardized formats, enabling seamless data integration.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white border-t border-zinc-200 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 mb-4">
                Why Choose Finance Concept Translator
              </h2>
              <p className="text-lg text-zinc-600">
                Streamline your workflow with powerful features designed for modern finance teams
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    Real-Time Processing
                  </h3>
                  <p className="text-zinc-600">
                    Process documents instantly as they're uploaded. No waiting, no delays.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    Comprehensive Export Options
                  </h3>
                  <p className="text-zinc-600">
                    Export normalized data in multiple formats including CSV, JSON, and Excel.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    Advanced Synonym Management
                  </h3>
                  <p className="text-zinc-600">
                    Intelligent synonym detection and mapping ensures consistent data normalization.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-zinc-900 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    Detailed Evidence Tracking
                  </h3>
                  <p className="text-zinc-600">
                    Track every concept back to its source with page-level evidence references.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 mb-6">
            Ready to Transform Your Financial Data?
          </h2>
          <p className="text-lg text-zinc-600 mb-10 max-w-xl mx-auto">
            Join finance teams worldwide who trust Finance Concept Translator for accurate, fast document processing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full sm:w-auto px-10 py-6 text-base font-medium"
              onClick={() => setLoginModalOpen(true)}
            >
              Start Processing Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto px-10 py-6 text-base font-medium"
              onClick={() => setSignupModalOpen(true)}
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      <Modal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
      >
        <AuthForm 
          mode="login" 
          onSuccess={handleAuthSuccess}
        />
      </Modal>

      {/* Signup Modal */}
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
