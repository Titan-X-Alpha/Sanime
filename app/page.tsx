import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/database/client';
import { getStorageLedger, formatBytes } from '@/lib/quota/ledger';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Play,
  ChevronRight,
  BookMarked,
  Film,
  HardDrive,
  ListVideo,
  Clock,
} from 'lucide-react';

export default async function HomePage() {
  const profile = await getCurrentSession();

  // If no session, redirect to login
  if (!profile) {
    redirect('/login');
  }

  // Fetch real data
  const continueItems = await db.getContinueWatching(profile.id, 5);
  const animeList = await db.getAllAnime();
  const watchlist = await db.getWatchlist(profile.id);
  const ledger = await getStorageLedger(profile.id);

  // Top continue hero item
  const heroItem = continueItems[0];
  const secondContinueItem = continueItems[1];

  return (
    <AppLayout currentProfile={profile}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
        {/* Main Content Column (Left/Center 8 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-8 min-w-0">
          {/* Large Continue Watching Hero Banner */}
          {heroItem ? (
            <div className="relative rounded-3xl overflow-hidden glass-card border border-border/70 group shadow-2xl">
              {/* Hero Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.02]"
                style={{
                  backgroundImage: `url(${heroItem.anime?.banner_url || '/images/hero-banner.jpg'})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#080910] via-[#080910]/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080910] via-transparent to-black/20" />
              </div>

              {/* Hero Content */}
              <div className="relative z-10 p-8 md:p-12 min-h-[320px] flex flex-col justify-end">
                <span className="text-xs font-semibold text-accent-light uppercase tracking-wider mb-2 block">
                  Continue Watching
                </span>

                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2 drop-shadow-lg">
                  {heroItem.anime?.title || 'Solo Leveling'}
                </h1>

                <p className="text-sm md:text-base text-text-secondary font-medium mb-6">
                  S{heroItem.episode?.season_number || 1} E{heroItem.episode?.episode_number || 3} •{' '}
                  {heroItem.episode?.title || "It's Like a Game"}
                </p>

                {/* Resume Play Button and Progress Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <Link
                    href={`/watch/${heroItem.episode_id}`}
                    className="purple-glow-btn inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl font-bold text-sm text-white shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume</span>
                  </Link>

                  {/* Progress Bar & Timestamp */}
                  <div className="flex items-center gap-4 flex-1 max-w-md">
                    <div className="flex-1 h-2 bg-surface-elevated/80 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-[#9E5CFF] rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((heroItem.position_seconds || 754) / (heroItem.duration_seconds || 1420)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-text-secondary shrink-0">
                      {Math.floor((heroItem.position_seconds || 754) / 60)}:
                      {String(Math.floor((heroItem.position_seconds || 754) % 60)).padStart(2, '0')} /{' '}
                      {Math.floor((heroItem.duration_seconds || 1420) / 60)}:
                      {String(Math.floor((heroItem.duration_seconds || 1420) % 60)).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Arrow Carousel Button */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block">
                <Link
                  href="/anime"
                  className="w-11 h-11 rounded-full bg-surface/80 hover:bg-accent border border-border/80 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-lg hover:scale-105"
                  title="Browse Catalog"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl glass-card text-center py-12">
              <h2 className="text-xl font-bold text-white mb-2">Welcome to SANIME</h2>
              <p className="text-sm text-text-secondary mb-4">You have no in-progress episodes yet.</p>
              <Link
                href="/anime"
                className="purple-glow-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              >
                <span>Browse Anime</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Recently Added Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white tracking-wide">Recently Added</h2>
              <Link
                href="/anime"
                className="text-xs font-medium text-text-secondary hover:text-accent-light transition-colors flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Poster Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {animeList.slice(0, 5).map((anime) => (
                <Link
                  key={anime.id}
                  href={`/anime/${anime.id}`}
                  className="group relative rounded-2xl overflow-hidden glass-card aspect-square border border-border/60 hover:border-accent transition-all duration-300 hover:shadow-glow hover:-translate-y-1"
                >
                  <img
                    src={anime.poster_url || '/images/posters-grid.jpg'}
                    alt={anime.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-bold text-white truncate drop-shadow">
                      {anime.title}
                    </p>
                    <p className="text-[11px] text-text-secondary">
                      {anime.total_episodes || 12} Episodes
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info Column (4 cols) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          {/* My Library Summary Card */}
          <div className="glass-panel rounded-3xl p-6 border border-border/70 space-y-5">
            <h3 className="text-base font-bold text-white tracking-wide">My Library</h3>

            <div className="space-y-4">
              <Link
                href="/anime"
                className="flex items-center justify-between p-3 rounded-2xl bg-surface-elevated/40 border border-border/40 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent/20 text-accent">
                    <Film className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white">Anime</span>
                </div>
                <span className="text-xs font-semibold text-text-secondary">
                  {animeList.length} series
                </span>
              </Link>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-elevated/40 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent/20 text-accent">
                    <ListVideo className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white">Episodes</span>
                </div>
                <span className="text-xs font-semibold text-text-secondary">
                  {ledger.total_episodes || 245} episodes
                </span>
              </div>

              <Link
                href="/watchlist"
                className="flex items-center justify-between p-3 rounded-2xl bg-surface-elevated/40 border border-border/40 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent/20 text-accent">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white">Watchlist</span>
                </div>
                <span className="text-xs font-semibold text-text-secondary">
                  {watchlist.length} titles
                </span>
              </Link>

              {/* Storage Used Card Component */}
              <Link
                href="/storage"
                className="block p-4 rounded-2xl bg-surface-elevated/50 border border-border/60 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <HardDrive className="w-4 h-4 text-accent" />
                    <span>Storage Used</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-text-secondary">
                    {formatBytes(ledger.used_bytes + ledger.reserved_bytes)} / {formatBytes(ledger.quota_bytes)}
                  </span>
                </div>

                <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ledger.warning_level === 'critical' || ledger.warning_level === 'exceeded'
                        ? 'bg-status-error'
                        : ledger.warning_level === 'warning'
                        ? 'bg-status-warning'
                        : 'bg-gradient-to-r from-accent to-[#6E26E5]'
                    }`}
                    style={{ width: `${Math.min(100, ledger.usage_percentage)}%` }}
                  />
                </div>
              </Link>
            </div>
          </div>

          {/* Continue Watching Sidebar Card (Dan Da Dan in Screenshot) */}
          {secondContinueItem && (
            <div className="glass-panel rounded-3xl p-6 border border-border/70 space-y-4">
              <h3 className="text-base font-bold text-white tracking-wide">Continue Watching</h3>

              <Link
                href={`/watch/${secondContinueItem.episode_id}`}
                className="group block p-3 rounded-2xl bg-surface-elevated/40 border border-border/40 hover:border-accent/60 transition-all hover:bg-surface-elevated/60"
              >
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border/60">
                    <img
                      src={secondContinueItem.anime?.poster_url || '/images/dandadan.jpg'}
                      alt={secondContinueItem.anime?.title || 'Dan Da Dan'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-accent-light transition-colors">
                      {secondContinueItem.anime?.title || 'Dan Da Dan'}
                    </h4>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      S{secondContinueItem.episode?.season_number || 1} E{secondContinueItem.episode?.episode_number || 5} •{' '}
                      {secondContinueItem.episode?.title || 'Like, This is Love?!'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Timestamp */}
                <div className="flex items-center justify-between text-[11px] font-mono text-text-muted mb-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>In Progress</span>
                  </span>
                  <span>
                    {Math.floor((secondContinueItem.position_seconds || 1100) / 60)}:
                    {String(Math.floor((secondContinueItem.position_seconds || 1100) % 60)).padStart(2, '0')} /{' '}
                    {Math.floor((secondContinueItem.duration_seconds || 1450) / 60)}:
                    {String(Math.floor((secondContinueItem.duration_seconds || 1450) % 60)).padStart(2, '0')}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        ((secondContinueItem.position_seconds || 1100) / (secondContinueItem.duration_seconds || 1450)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
