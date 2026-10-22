'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { SanimePlayer } from '@/components/player/SanimePlayer';
import { Profile, Episode, PlayerPreferences } from '@/types';
import { ArrowLeft, Play, SkipForward, Clock } from 'lucide-react';

export default function WatchEpisodePage() {
  const params = useParams();
  const router = useRouter();
  const episodeId = params.episodeId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [playbackData, setPlaybackData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setProfile(data.profile);
      })
      .catch(() => {});

    fetch(`/api/playback/${episodeId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load video stream');
        setPlaybackData(data);
      })
      .catch((err) => {
        setError(err.message || 'Error loading playback');
      })
      .finally(() => setLoading(false));
  }, [episodeId]);

  if (loading) {
    return (
      <AppLayout currentProfile={profile}>
        <div className="py-24 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-text-secondary">Authorizing video stream...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !playbackData) {
    return (
      <AppLayout currentProfile={profile}>
        <div className="py-20 max-w-lg mx-auto text-center glass-card p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-2">Playback Unavailable</h2>
          <p className="text-sm text-status-error mb-6">{error || 'Episode could not be loaded.'}</p>
          <Link
            href="/anime"
            className="purple-glow-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Anime Library</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const { episode, stream_url, tracks, audio_tracks, initial_position_seconds, preferences, next_episode, prev_episode } = playbackData;

  return (
    <AppLayout currentProfile={profile}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={`/anime/${episode.anime_id}`}
            className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {episode.anime?.title || 'Anime Series'}</span>
          </Link>

          {next_episode && (
            <Link
              href={`/watch/${next_episode.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-accent-light hover:underline font-semibold"
            >
              <span>Next Episode (E{next_episode.episode_number})</span>
              <SkipForward className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Video Player Surface */}
        <SanimePlayer
          episode={episode}
          streamUrl={stream_url}
          tracks={tracks}
          audioTracks={audio_tracks}
          initialPositionSeconds={initial_position_seconds}
          preferences={preferences}
          nextEpisode={next_episode}
          prevEpisode={prev_episode}
        />

        {/* Episode Info & Controls Bar */}
        <div className="p-6 rounded-3xl glass-card border border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-md bg-accent/20 border border-accent/40 text-xs font-mono font-bold text-accent-light">
                S{episode.season_number} E{episode.episode_number}
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {episode.title}
              </h1>
            </div>
            <p className="text-sm text-text-secondary">
              Series: <span className="text-white font-medium">{episode.anime?.title}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              <span>{Math.floor((episode.duration_seconds || 1420) / 60)} minutes</span>
            </span>
            <span>•</span>
            <span className="text-status-success font-medium">Synced Watch Progress</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
