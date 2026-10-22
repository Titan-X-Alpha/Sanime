'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Anime, Profile } from '@/types';
import { Bookmark, Trash2, Play, ChevronRight } from 'lucide-react';

export default function WatchlistPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [watchlist, setWatchlist] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      const [userRes, listRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/watchlist').then((r) => r.json()),
      ]);

      if (userRes.authenticated) setProfile(userRes.profile);
      setWatchlist(listRes.watchlist || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (animeId: string) => {
    try {
      await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anime_id: animeId }),
      });
      setWatchlist((prev) => prev.filter((a) => a.id !== animeId));
    } catch {}
  };

  return (
    <AppLayout currentProfile={profile}>
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">My Watchlist</h1>
          <p className="text-sm text-text-secondary mt-1">
            Bookmarked anime titles saved to your profile ({watchlist.length})
          </p>
        </div>

        {watchlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {watchlist.map((anime) => (
              <div
                key={anime.id}
                className="group relative rounded-2xl overflow-hidden glass-card border border-border/60 hover:border-accent transition-all duration-300 flex flex-col justify-between"
              >
                <Link href={`/anime/${anime.id}`} className="block aspect-[4/3] w-full overflow-hidden relative">
                  <img
                    src={anime.poster_url || '/images/hero-banner.jpg'}
                    alt={anime.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-transparent" />
                </Link>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{anime.title}</h3>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {anime.description || 'Saved title'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                    <Link
                      href={`/anime/${anime.id}`}
                      className="text-xs font-semibold text-accent-light hover:underline flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleRemove(anime.id)}
                      className="p-1.5 text-text-secondary hover:text-status-error transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl glass-card text-center">
            <Bookmark className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Your watchlist is empty</h3>
            <p className="text-xs text-text-secondary mb-4">
              Explore your library and bookmark your favorite series.
            </p>
            <Link
              href="/anime"
              className="purple-glow-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white"
            >
              <span>Browse Anime</span>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
