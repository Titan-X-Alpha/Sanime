'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { Profile } from '@/types';

interface TopNavProps {
  currentProfile?: Profile | null;
}

export function TopNav({ currentProfile }: TopNavProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/anime?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="h-20 border-b border-border/80 px-8 flex items-center justify-between gap-6 bg-surface/50 backdrop-blur-md sticky top-0 z-20">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-text-secondary absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, episodes..."
            className="w-full bg-[#161726] border border-border/70 rounded-full pl-11 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
        </div>
      </form>

      {/* Header Right Actions */}
      <div className="flex items-center gap-4">
        <button
          className="relative p-2.5 text-text-secondary hover:text-white hover:bg-surface-elevated rounded-full transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full ring-2 ring-surface"></span>
        </button>

        <div className="w-9 h-9 rounded-full overflow-hidden border border-accent/50 cursor-pointer hover:border-accent transition-colors">
          <img
            src={currentProfile?.avatar_url || '/images/avatar.jpg'}
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
