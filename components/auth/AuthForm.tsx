'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthFormData, SignUpFormData } from '@/types';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSuccess?: () => void;
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData | SignUpFormData>({
    email: '',
    password: '',
    ...(mode === 'signup' && { confirmPassword: '' }),
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const signupData = formData as SignUpFormData;
      if (signupData.password !== signupData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      }
      
      // If onSuccess callback is provided, use it (for modal context)
      // Otherwise, redirect normally
      if (onSuccess) {
        onSuccess();
      } else {
        const redirect = searchParams.get('redirect') || '/dashboard';
        // Set navigation token before redirecting
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nav-token', 'valid');
          sessionStorage.setItem('nav-time', Date.now().toString());
          document.cookie = `nav-token=valid; path=/; max-age=5; SameSite=Lax`;
        }
        router.push(redirect);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold mb-2 text-black">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-black/60">
          {mode === 'login' ? 'Sign in to continue' : 'Start your journey today'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-lg border-2 border-black/20 bg-white text-black placeholder:text-black/40 focus:outline-none focus:border-black transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border-2 border-black/20 bg-white text-black placeholder:text-black/40 focus:outline-none focus:border-black transition-colors"
          />
        </div>
        
        {mode === 'signup' && (
          <div>
            <label className="block text-sm font-medium mb-2 text-black">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={(formData as SignUpFormData).confirmPassword || ''}
              onChange={handleChange}
              required
              placeholder="••••••••"
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border-2 border-black/20 bg-white text-black placeholder:text-black/40 focus:outline-none focus:border-black transition-colors"
            />
          </div>
        )}
        
        {error && (
          <div className="p-3 rounded-lg bg-black/5 border-2 border-black/20">
            <p className="text-sm text-black">{error}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-black/60">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  // This will be handled by the parent component
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('switchToSignup'));
                  }
                }}
                className="text-black hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('switchToLogin'));
                  }
                }}
                className="text-black hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
