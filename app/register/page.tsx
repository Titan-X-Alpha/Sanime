'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ArrowLeft, ArrowRight, Check, CheckCircle2, Flower2 } from 'lucide-react';
import { usernameRegex } from '@/lib/validation/schemas';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const router = useRouter();

  // Real-time checks
  const isLenValid = username.length >= 3 && username.length <= 20;
  const isCharValid = /^[a-zA-Z0-9_]*$/.test(username) && username.length > 0;
  const noSpecialValid = !/[^a-zA-Z0-9_]/.test(username);
  const isFormValid = isLenValid && isCharValid && noSpecialValid;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please meet all username requirements');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setRegisteredSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-background">
      {/* Anime Shrine Background Art */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{
          backgroundImage: "url('/images/auth-bg.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40 backdrop-blur-[1px]" />
      </div>

      {/* Floating Cherry Blossom Petals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="sakura-petal"
            style={{
              width: `${8 + (i % 4) * 3}px`,
              height: `${12 + (i % 3) * 4}px`,
              left: `${(i * 9) % 100}%`,
              animationDuration: `${7 + (i % 5) * 2}s`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex flex-col group">
          <span className="text-2xl font-black tracking-wider text-white">
            SA<span className="text-accent group-hover:text-accent-light transition-colors">NIME</span>
          </span>
          <span className="text-[11px] text-text-secondary tracking-wide">
            Your Anime. Your World.
          </span>
        </Link>
      </header>

      {/* Centered Registration / Success Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {registeredSuccess ? (
          /* Panel 3: Registration Success */
          <div className="w-full max-w-[420px] rounded-3xl glass-panel p-8 md:p-10 shadow-card border border-border/80 text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-tr from-accent to-[#6E26E5] flex items-center justify-center shadow-glow">
              <Check className="w-10 h-10 text-white stroke-[3]" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-xs text-text-secondary mb-8">
              Your username <span className="text-white font-semibold">"{username}"</span> has been registered.
            </p>

            <Link
              href="/login"
              className="w-full purple-glow-btn py-3.5 px-4 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Panel 2: Register Screen */
          <div className="w-full max-w-[420px] rounded-3xl glass-panel p-8 md:p-10 shadow-card border border-border/80">
            {/* Back to Login link */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>

            {/* Sakura Icon Header */}
            <div className="text-center mb-6">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                <Flower2 className="w-5 h-5 fill-current" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
                Create Your Account
              </h1>
              <p className="text-xs text-text-secondary">
                Join Sanime with just a username.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-status-error/15 border border-status-error/40 text-xs text-status-error text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-text-secondary absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={20}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter a username"
                    className="w-full bg-[#161726]/80 border border-border/80 rounded-2xl pl-11 pr-14 py-3 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    autoFocus
                  />
                  <span className="absolute right-4 text-xs font-mono text-text-muted">
                    {username.length}/20
                  </span>
                </div>
              </div>

              {/* Requirement Checklist */}
              <div className="space-y-2 py-1 text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      isLenValid ? 'bg-accent text-white' : 'bg-surface-elevated text-text-muted'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className={isLenValid ? 'text-white' : 'text-text-secondary'}>
                    3–20 characters
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      isCharValid ? 'bg-accent text-white' : 'bg-surface-elevated text-text-muted'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className={isCharValid ? 'text-white' : 'text-text-secondary'}>
                    Use letters, numbers or underscores
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      isFormValid ? 'bg-accent text-white' : 'bg-surface-elevated text-text-muted'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className={isFormValid ? 'text-white' : 'text-text-secondary'}>
                    Must be unique
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      noSpecialValid && username.length > 0 ? 'bg-accent text-white' : 'bg-surface-elevated text-text-muted'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className={noSpecialValid && username.length > 0 ? 'text-white' : 'text-text-secondary'}>
                    No special characters (except _)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full purple-glow-btn py-3.5 px-4 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span>{loading ? 'Creating...' : 'Create Account'}</span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-xs text-text-secondary">Already have an account? </span>
              <Link
                href="/login"
                className="text-xs text-accent font-semibold hover:text-accent-light transition-colors underline-offset-4 hover:underline"
              >
                Login here
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Atmospheric Footer Quotes */}
      <footer className="relative z-10 px-8 py-6 flex items-center justify-between text-xs text-text-muted">
        <div>"Same stories. A quieter place."</div>
        <div>Watch. Track. Remember. Anywhere.</div>
      </footer>
    </div>
  );
}
