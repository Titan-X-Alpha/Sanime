'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent, customUser?: string) => {
    if (e) e.preventDefault();
    const targetUser = customUser || username;

    if (!targetUser.trim()) {
      setError('Please enter your username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-wider text-white">
            SA<span className="text-accent">NIME</span>
          </span>
          <span className="text-[11px] text-text-secondary tracking-wide">
            Your Anime. Your World.
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-text-muted">v1.0</span>
          <div className="text-[11px] text-text-secondary">Private • Ad-free • Yours</div>
        </div>
      </header>

      {/* Centered Login Glassmorphic Card (Panel 1) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-3xl glass-panel p-8 md:p-10 shadow-card border border-border/80">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
              Welcome to <span className="text-white">SA</span>
              <span className="text-accent">NIME</span>
            </h1>
            <p className="text-xs text-text-secondary">Your Anime, Your World.</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-status-error/15 border border-status-error/40 text-xs text-status-error text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-5">
            <div className="space-y-1.5">
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-text-secondary absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-[#161726]/80 border border-border/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full purple-glow-btn py-3.5 px-4 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Entering...' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => handleLogin(undefined, 'User')}
              className="text-xs text-accent-light hover:underline font-medium"
            >
              Demo: Quick enter as "User"
            </button>
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <div className="text-center">
            <span className="text-xs text-text-secondary">New user? </span>
            <Link
              href="/register"
              className="text-xs text-accent font-semibold hover:text-accent-light transition-colors underline-offset-4 hover:underline"
            >
              Register here
            </Link>
          </div>
        </div>
      </main>

      {/* Atmospheric Footer Quotes */}
      <footer className="relative z-10 px-8 py-6 flex items-center justify-between text-xs text-text-muted">
        <div>"Same stories. A quieter place."</div>
        <div>Watch. Track. Remember. Anywhere.</div>
      </footer>
    </div>
  );
}
