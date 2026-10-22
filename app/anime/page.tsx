'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { UploadEpisodeModal } from '@/components/anime/UploadEpisodeModal';
import { Anime, Profile } from '@/types';
import { Search, Plus, Upload, Film, ChevronRight } from 'lucide-react';

export default function AnimeCatalogPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [addAnimeModalOpen, setAddAnimeModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newGenre, setNewGenre] = useState('Action, Supernatural');

  const fetchAnime = async () => {
    try {
      const res = await fetch(`/api/anime${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      const data = await res.json();
      setAnimeList(data.anime || []);
    } catch {}
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setProfile(data.profile);
      })
      .catch(() => {});

    fetchAnime();
  }, [search]);

  const handleCreateAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          genre: newGenre.split(',').map((g) => g.trim()).filter(Boolean),
          poster_url: '/images/hero-banner.jpg',
          banner_url: '/images/hero-banner.jpg',
        }),
      });

      if (res.ok) {
        setAddAnimeModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchAnime();
      }
    } catch {}
  };

  const allGenres = ['All', 'Action', 'Fantasy', 'Supernatural', 'Comedy', 'Adventure'];
  const filteredList = animeList.filter((a) => {
    if (selectedGenre === 'All') return true;
    return a.genre?.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()));
  });

  return (
    <AppLayout currentProfile={profile}>
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header with Title and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Anime Library</h1>
            <p className="text-sm text-text-secondary mt-1">
              Your private collection of personal anime streams ({animeList.length} series)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddAnimeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-border/80 bg-surface-elevated/60 text-sm font-semibold text-white hover:border-accent transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-accent" />
              <span>Add Series</span>
            </button>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="purple-glow-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Episode</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-accent text-white shadow-glow'
                    : 'bg-surface border border-border/60 text-text-secondary hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title..."
              className="w-full bg-[#161726] border border-border/70 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Anime Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredList.map((anime) => (
            <Link
              key={anime.id}
              href={`/anime/${anime.id}`}
              className="group relative rounded-2xl overflow-hidden glass-card border border-border/60 hover:border-accent transition-all duration-300 hover:shadow-glow hover:-translate-y-1 flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-surface-elevated relative">
                <img
                  src={anime.poster_url || '/images/hero-banner.jpg'}
                  alt={anime.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-transparent" />
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-accent-light border border-border/40">
                  {anime.total_episodes || 12} EPS
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-accent-light transition-colors line-clamp-1">
                    {anime.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {anime.description || 'No synopsis available.'}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border/40">
                  <span>{anime.genre?.slice(0, 2).join(' • ') || 'Anime'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredList.length === 0 && (
          <div className="p-12 rounded-3xl glass-card text-center">
            <Film className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No anime found</h3>
            <p className="text-xs text-text-secondary">Try a different search term or add a new series.</p>
          </div>
        )}

        {/* Upload Modal */}
        <UploadEpisodeModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUploadComplete={fetchAnime}
          animeList={animeList}
        />

        {/* Add Anime Modal */}
        {addAnimeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Add Anime Series</h3>
              <form onSubmit={handleCreateAnime} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Frieren: Beyond Journey's End"
                    className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    placeholder="Synopsis..."
                    className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddAnimeModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="purple-glow-btn px-5 py-2 text-xs font-bold text-white rounded-xl"
                  >
                    Create Series
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
