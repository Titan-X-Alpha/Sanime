'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { WatchProgress, Profile } from '@/types';
import { History, Play, Trash2, Clock, CheckCircle } from 'lucide-react';

export default function HistoryPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [historyItems, setHistoryItems] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const [userRes, histRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/progress').then((r) => r.json()),
      ]);

      if (userRes.authenticated) setProfile(userRes.profile);
      setHistoryItems(histRes.history || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your entire watch history? This will reset all playback progress.')) return;
    try {
      await fetch('/api/progress', { method: 'DELETE' });
      setHistoryItems([]);
    } catch {}
  };

  return (
    <AppLayout currentProfile={profile}>
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Watch History</h1>
            <p className="text-sm text-text-secondary mt-1">
              Synchronized progress and finished episodes ({historyItems.length})
            </p>
          </div>

          {historyItems.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 rounded-xl border border-status-error/40 bg-status-error/10 text-xs font-semibold text-status-error hover:bg-status-error/20 transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {historyItems.length > 0 ? (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl glass-card border border-border/50 hover:border-accent/60 transition-all gap-4 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border/60 bg-surface-elevated">
                    <img
                      src={item.episode?.thumbnail_url || item.anime?.poster_url || '/images/hero-banner.jpg'}
                      alt={item.episode?.title || 'Episode'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-accent-light">
                        {item.anime?.title || 'Anime'}
                      </span>
                      {item.is_completed && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-success bg-status-success/15 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white truncate mt-0.5">
                      S{item.episode?.season_number || 1} E{item.episode?.episode_number || 1} •{' '}
                      {item.episode?.title || 'Episode'}
                    </h3>

                    {/* Progress Bar & Timestamp */}
                    <div className="flex items-center gap-3 mt-2 max-w-xs">
                      <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              ((item.position_seconds || 0) / (item.duration_seconds || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-text-muted">
                        {Math.floor(item.position_seconds / 60)}:
                        {String(Math.floor(item.position_seconds % 60)).padStart(2, '0')} /{' '}
                        {Math.floor(item.duration_seconds / 60)}:
                        {String(Math.floor(item.duration_seconds % 60)).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/watch/${item.episode_id}`}
                  className="purple-glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-auto"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{item.is_completed ? 'Replay' : 'Resume'}</span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl glass-card text-center">
            <History className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No watch history yet</h3>
            <p className="text-xs text-text-secondary mb-4">
              Episodes you stream will automatically synchronize your playback progress here.
            </p>
            <Link
              href="/anime"
              className="purple-glow-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white"
            >
              <span>Start Watching</span>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
