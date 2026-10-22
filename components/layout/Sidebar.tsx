'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  LayoutGrid,
  Bookmark,
  History,
  Cloud,
  Settings,
  LogOut,
} from 'lucide-react';
import { Profile } from '@/types';

interface SidebarProps {
  currentProfile?: Profile | null;
}

export function Sidebar({ currentProfile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'My Anime', href: '/anime', icon: LayoutGrid },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
    { name: 'History', href: '/history', icon: History },
    { name: 'Storage', href: '/storage', icon: Cloud },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-6 pb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-black tracking-wider text-white">
              SA<span className="text-accent group-hover:text-accent-light transition-colors">NIME</span>
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-accent to-[#6E26E5] text-white shadow-glow'
                    : 'text-text-secondary hover:text-white hover:bg-surface-elevated/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-white'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card Footer */}
      <div className="p-4 border-t border-border/80">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated/40 border border-border/40">
          <Link href="/settings" className="flex items-center gap-3 min-w-0 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent/60 shrink-0 bg-surface-elevated">
              <img
                src={currentProfile?.avatar_url || '/images/avatar.jpg'}
                alt="Avatar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate group-hover:text-accent-light transition-colors">
                {currentProfile?.username || 'User'}
              </p>
              <p className="text-xs text-text-secondary truncate">View Profile</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-text-secondary hover:text-status-error hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
