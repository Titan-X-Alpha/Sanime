'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Profile } from '@/types';
import { Home, LayoutGrid, Bookmark, History, Cloud, Settings, Menu, X } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  currentProfile?: Profile | null;
}

export function AppLayout({ children, currentProfile }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'My Anime', href: '/anime', icon: LayoutGrid },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
    { name: 'History', href: '/history', icon: History },
    { name: 'Storage', href: '/storage', icon: Cloud },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar currentProfile={currentProfile} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-border sticky top-0 z-40">
          <Link href="/" className="text-xl font-black tracking-wider text-white">
            SA<span className="text-accent">NIME</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-text-secondary hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-background/95 backdrop-blur-lg pt-20 px-6 flex flex-col justify-between pb-10">
            <nav className="space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-base ${
                      isActive ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
              <img
                src={currentProfile?.avatar_url || '/images/avatar.jpg'}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-white">{currentProfile?.username || 'User'}</p>
                <p className="text-xs text-text-secondary">Logged in</p>
              </div>
            </div>
          </div>
        )}

        <TopNav currentProfile={currentProfile} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
