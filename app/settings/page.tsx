'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Profile, PlayerPreferences } from '@/types';
import {
  Settings,
  ShieldAlert,
  Volume2,
  Subtitles,
  Gauge,
  Monitor,
  HardDrive,
  LogOut,
  Check,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<PlayerPreferences>({
    profile_id: '',
    preferred_audio_language: 'Japanese',
    preferred_subtitle_language: 'English',
    subtitles_enabled: true,
    playback_speed: 1.0,
    preferred_quality: '1080p',
    autoplay_next: true,
    storage_quota_bytes: 10 * 1024 * 1024 * 1024,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/preferences').then((r) => r.json()),
    ])
      .then(([userData, prefData]) => {
        if (userData.authenticated) setProfile(userData.profile);
        if (prefData) {
          setPreferences((prev) => ({ ...prev, ...prefData }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <AppLayout currentProfile={profile}>
      <div className="max-w-[1000px] mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Settings & Preferences</h1>
          <p className="text-sm text-text-secondary mt-1">
            Personalize playback behavior, audio preferences, and application storage targets
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-status-success/15 border border-status-success/40 text-status-success text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Preferences saved and synchronized successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Playback Preferences */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-border/70 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/20 text-accent">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Playback Configuration</h3>
                <p className="text-xs text-text-secondary">Default settings applied when launching video player</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-accent" />
                  <span>Default Audio Track</span>
                </label>
                <select
                  value={preferences.preferred_audio_language}
                  onChange={(e) =>
                    setPreferences({ ...preferences, preferred_audio_language: e.target.value })
                  }
                  className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                >
                  <option value="Japanese">Japanese (Original)</option>
                  <option value="English">English (Dub)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 flex items-center gap-2">
                  <Subtitles className="w-3.5 h-3.5 text-accent" />
                  <span>Default Subtitle Language</span>
                </label>
                <select
                  value={preferences.preferred_subtitle_language}
                  onChange={(e) =>
                    setPreferences({ ...preferences, preferred_subtitle_language: e.target.value })
                  }
                  className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                >
                  <option value="English">English Subtitles</option>
                  <option value="Japanese">Japanese Subtitles</option>
                  <option value="Off">Subtitles Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-accent" />
                  <span>Playback Speed</span>
                </label>
                <select
                  value={preferences.playback_speed}
                  onChange={(e) =>
                    setPreferences({ ...preferences, playback_speed: parseFloat(e.target.value) })
                  }
                  className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                >
                  <option value={0.75}>0.75x</option>
                  <option value={1.0}>1.0x (Normal)</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2.0}>2.0x</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-accent" />
                  <span>Preferred Quality</span>
                </label>
                <select
                  value={preferences.preferred_quality}
                  onChange={(e) =>
                    setPreferences({ ...preferences, preferred_quality: e.target.value })
                  }
                  className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                >
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p SD</option>
                  <option value="Auto">Auto</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoplay_next}
                  onChange={(e) =>
                    setPreferences({ ...preferences, autoplay_next: e.target.checked })
                  }
                  className="rounded border-border text-accent focus:ring-accent w-4 h-4"
                />
                <span className="text-sm font-medium text-white">
                  Autoplay next episode automatically upon completion
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.subtitles_enabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, subtitles_enabled: e.target.checked })
                  }
                  className="rounded border-border text-accent focus:ring-accent w-4 h-4"
                />
                <span className="text-sm font-medium text-white">
                  Enable subtitles by default
                </span>
              </label>
            </div>
          </div>

          {/* Storage Quota Target Configuration */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-border/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/20 text-accent">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Storage Target Quota</h3>
                <p className="text-xs text-text-secondary">
                  Local application safety threshold before triggering warnings (R2 Standard free allowance)
                </p>
              </div>
            </div>

            <div>
              <select
                value={preferences.storage_quota_bytes || 10 * 1024 * 1024 * 1024}
                onChange={(e) =>
                  setPreferences({ ...preferences, storage_quota_bytes: parseInt(e.target.value) })
                }
                className="w-full max-w-xs bg-[#161726] border border-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              >
                <option value={5 * 1024 * 1024 * 1024}>5 GB Target</option>
                <option value={10 * 1024 * 1024 * 1024}>10 GB Target (Default Free Allowance)</option>
                <option value={15 * 1024 * 1024 * 1024}>15 GB Target</option>
                <option value={20 * 1024 * 1024 * 1024}>20 GB Target</option>
              </select>
            </div>
          </div>

          {/* Account & Security Limitations Card */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-border/70 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-status-warning/20 text-status-warning">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Account Security & Prototype Model</h3>
                <p className="text-xs text-text-secondary">Understanding SANIME's username-only access model</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-elevated/40 border border-border/60 text-xs text-text-secondary leading-relaxed space-y-2">
              <p>
                <span className="font-semibold text-white">Logged in profile:</span>{' '}
                <span className="font-mono text-accent-light">{profile?.username || 'User'}</span>
              </p>
              <p>
                <span className="font-semibold text-status-warning">Security Disclosure:</span> Username-only
                authentication does not verify cryptographic ownership. Anyone who knows or guesses a username
                can access this profile's watch history and preferences. This design prioritizes effortless private
                viewing over multi-factor identity verification.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl border border-status-error/40 text-status-error hover:bg-status-error/10 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Profile</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="purple-glow-btn px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
