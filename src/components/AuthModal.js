'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signIn, signUp } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setEmail('');
    setPassword('');
    setSubmitting(false);
    setError('');
    setSignupSuccess(false);
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setSubmitting(true);
      setError('');

      if (mode === 'login') {
        await signIn({ email, password });
        onClose();
      } else {
        await signUp({ email, password });
        setSignupSuccess(true);
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-md bg-bg-secondary rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {signupSuccess ? 'Check your email' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-white/60">
              {signupSuccess 
                ? `We've sent a confirmation link to ${email}`
                : mode === 'login' 
                  ? 'Sign in to access your favorites' 
                  : 'Join us to start saving your favorite movies'}
            </p>
          </div>

          {signupSuccess ? (
            <div className="space-y-6">
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-white text-sm leading-relaxed">
                  Please click the link in the email to confirm your account. After confirming, you can sign in.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="name@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}
                
                <button 
                  type="submit"
                  disabled={submitting || !email || !password}
                  className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg mt-6 transition-all transform active:scale-95 shadow-lg shadow-accent/20"
                >
                  {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-white/60 text-sm">
                  {mode === 'login' 
                    ? "Don't have an account?" 
                    : "Already have an account?"}
                  <button 
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-accent hover:text-accent-hover font-bold ml-1 transition-colors"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </div>
            </>
          )}

          {/* Decorative footer */}
          <div className="bg-white/5 p-4 text-center border-t border-white/5">
            <p className="text-white/30 text-[10px] uppercase tracking-widest">UI Preview Only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
