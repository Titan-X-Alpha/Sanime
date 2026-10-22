'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { UploadEpisodeModal } from '@/components/anime/UploadEpisodeModal';
import { Anime, Episode, Profile } from '@/types';
import { Play, Bookmark, BookmarkCheck, Upload, Trash2, ArrowLeft, Clock } from 'lucide-react';

export default function AnimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const animeId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, animeRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch(`/api/anime/${animeId}`).then((r) => r.json()),
      ]);

      if (userRes.authenticated) setProfile(userRes.profile);
      if (animeRes.anime) {
        setAnime(animeRes.anime);
        setEpisodes(animeRes.episodes || []);
        setInWatchlist(animeRes.inWatchlist || false);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (animeId) fetchData();
  }, [animeId]);

  const toggleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await fetch('/api/watchlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anime_id: animeId }),
        });
        setInWatchlist(false);
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anime_id: animeId }),
        });
        setInWatchlist(true);
      }
    } catch {}
  };

  const handleDeleteAnime = async () => {
    if (!confirm(`Are you sure you want to delete "${anime?.title}" and its associated media?`)) return;
    try {
      const res = await fetch(`/api/anime/${animeId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/anime');
      }
    } catch {}
  };

  const handleDeleteEpisode = async (episodeId: string, title: string) => {
    if (!confirm(`Delete episode "${title}"? This will permanently remove its media asset and watch history.`)) return;
    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episode_id: episodeId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {}
  };

  if (loading) {
    return (
      <AppLayout currentProfile={profile}>
        <div className="py-20 text-center text-text-secondary">Loading anime details...</div>
      </AppLayout>
    );
  }

  if (!anime) {
    return (
      <AppLayout currentProfile={profile}>
        <div className="py-20 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Anime not found</h2>
          <Link href="/anime" className="text-sm text-accent hover:underline">
            Return to library
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentProfile={profile}>
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Back Link */}
        <Link
          href="/anime"
          className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Library</span>
        </Link>

        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden glass-card border border-border/70 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-56 aspect-[3/4] rounded-2xl overflow-hidden shrink-0 border border-border/80 shadow-2xl">
            <img
              src={anime.poster_url || '/images/hero-banner.jpg'}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {anime.genre?.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-lg bg-surface-elevated text-xs font-semibold text-accent-light border border-border/40"
                >
                  {g}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {anime.title}
            </h1>

            <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
              {anime.description || 'No description provided.'}
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
              <span className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border/50 text-white font-mono">
                {episodes.length} {episodes.length === 1 ? 'Episode' : 'Episodes'} Available
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={toggleWatchlist}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  inWatchlist
                    ? 'bg-surface-elevated border border-accent text-accent-light'
                    : 'bg-surface-elevated/70 border border-border text-white hover:border-accent'
                }`}
              >
                {inWatchlist ? <BookmarkCheck className="w-4 h-4 text-accent" /> : <Bookmark className="w-4 h-4" />}
                <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <button
                onClick={() => setUploadModalOpen(true)}
                className="purple-glow-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Episode</span>
              </button>

              <button
                onClick={handleDeleteAnime}
                className="p-2.5 text-text-secondary hover:text-status-error rounded-xl hover:bg-surface-elevated transition-colors ml-auto"
                title="Delete Anime"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Episodes Section */}
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide mb-4">
            Episodes ({episodes.length})
          </h2>

          <div className="space-y-3">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center justify-between p-4 rounded-2xl glass-card border border-border/50 hover:border-accent/60 transition-all hover:bg-surface-elevated/50 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center font-mono font-bold text-sm text-white shrink-0">
                    E{ep.episode_number}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-accent-light transition-colors">
                      {ep.title}
                    </h4>
                    <p className="text-xs text-text-secondary flex items-center gap-2 mt-0.5">
                      <span>Season {ep.season_number}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {Math.floor((ep.duration_seconds || 1420) / 60)}m
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/watch/${ep.id}`}
                    className="purple-glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch</span>
                  </Link>

                  <button
                    onClick={() => handleDeleteEpisode(ep.id, ep.title)}
                    className="p-2 text-text-secondary hover:text-status-error rounded-xl hover:bg-surface-elevated transition-colors"
                    title="Delete Episode"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {episodes.length === 0 && (
              <div className="p-8 rounded-2xl glass-card text-center text-xs text-text-secondary">
                No episodes uploaded yet. Click "Upload Episode" to add one!
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        <UploadEpisodeModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUploadComplete={fetchData}
          preselectedAnimeId={anime.id}
          animeList={[anime]}
        />
      </div>
    </AppLayout>
  );
}
