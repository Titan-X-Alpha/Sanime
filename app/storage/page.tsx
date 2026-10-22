'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { UploadEpisodeModal } from '@/components/anime/UploadEpisodeModal';
import { StorageSummary, Profile, MediaAsset, Anime } from '@/types';
import { formatBytes } from '@/lib/utils/format';
import {
  HardDrive,
  AlertTriangle,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export default function StoragePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchStorage = async () => {
    try {
      const [userRes, storageRes, animeRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/storage').then((r) => r.json()),
        fetch('/api/anime').then((r) => r.json()),
      ]);

      if (userRes.authenticated) setProfile(userRes.profile);
      setSummary(storageRes);
      setAnimeList(animeRes.anime || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStorage();
  };

  const handleDownload = async (asset: MediaAsset) => {
    try {
      const res = await fetch('/api/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_key: asset.object_key,
          original_filename: asset.original_filename,
        }),
      });
      const data = await res.json();
      if (data.download_url) {
        const link = document.createElement('a');
        link.href = data.download_url;
        link.download = asset.original_filename || 'episode.mp4';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert('Could not start download. Please verify your session.');
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm(`Delete "${asset.original_filename}"? This will permanently remove the video from Cloudflare R2.`)) return;

    setDeleteLoadingId(asset.id);
    try {
      const res = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset.id,
          object_key: asset.object_key,
        }),
      });
      if (res.ok) {
        fetchStorage();
      }
    } catch {} finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <AppLayout currentProfile={profile}>
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Cloud Storage Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">
              Cloudflare R2 private bucket capacity, reservations, and media assets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-border/80 bg-surface-elevated/60 text-text-secondary hover:text-white transition-colors"
              title="Reconcile Storage with Provider"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-accent' : ''}`} />
            </button>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="purple-glow-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
          </div>
        </div>

        {/* Quota Warning Banners */}
        {summary && summary.warning_level === 'exceeded' && (
          <div className="p-4 rounded-2xl bg-status-error/15 border border-status-error/40 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-status-error">Storage Quota Exceeded</h4>
              <p className="text-xs text-text-secondary mt-0.5">
                You have exceeded the configured application target of {formatBytes(summary.quota_bytes)}. Further uploads require explicit confirmation and may incur Cloudflare R2 overage fees.
              </p>
            </div>
          </div>
        )}

        {summary && summary.warning_level === 'critical' && (
          <div className="p-4 rounded-2xl bg-status-error/15 border border-status-error/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-status-error">Critical Storage Warning (≥95%)</h4>
              <p className="text-xs text-text-secondary mt-0.5">
                You have reached {summary.usage_percentage}% of your free tier target. Only {formatBytes(summary.available_bytes)} remaining before quota limit.
              </p>
            </div>
          </div>
        )}

        {summary && summary.warning_level === 'warning' && (
          <div className="p-4 rounded-2xl bg-status-warning/15 border border-status-warning/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-status-warning">Storage Quota Warning (≥80%)</h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Your media library has consumed {summary.usage_percentage}% of your configured quota.
              </p>
            </div>
          </div>
        )}

        {/* Overview Stats Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl glass-card border border-border/70 space-y-2">
              <span className="text-xs font-semibold text-text-secondary">Committed Stored Data</span>
              <p className="text-2xl font-black text-white font-mono">{formatBytes(summary.used_bytes)}</p>
              <p className="text-[11px] text-text-muted">Verified objects in Cloudflare R2</p>
            </div>

            <div className="p-6 rounded-3xl glass-card border border-border/70 space-y-2">
              <span className="text-xs font-semibold text-text-secondary">Pending Reservations</span>
              <p className="text-2xl font-black text-accent font-mono">{formatBytes(summary.reserved_bytes)}</p>
              <p className="text-[11px] text-text-muted">In-flight active upload buffer</p>
            </div>

            <div className="p-6 rounded-3xl glass-card border border-border/70 space-y-2">
              <span className="text-xs font-semibold text-text-secondary">Remaining Capacity</span>
              <p className="text-2xl font-black text-status-success font-mono">{formatBytes(summary.available_bytes)}</p>
              <p className="text-[11px] text-text-muted">Safe margin under quota target</p>
            </div>

            <div className="p-6 rounded-3xl glass-card border border-border/70 space-y-2">
              <span className="text-xs font-semibold text-text-secondary">Application Quota</span>
              <p className="text-2xl font-black text-text-primary font-mono">{formatBytes(summary.quota_bytes)}</p>
              <p className="text-[11px] text-text-muted">Based on R2 Standard 10 GB tier</p>
            </div>
          </div>
        )}

        {/* Progress Bar Breakdown Card */}
        {summary && (
          <div className="p-6 rounded-3xl glass-card border border-border/70 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-accent" />
                <span className="font-semibold text-white">Storage Capacity Consumption</span>
              </div>
              <span className="font-mono text-xs font-bold text-accent-light">
                {summary.usage_percentage}% Used
              </span>
            </div>

            <div className="w-full h-3 bg-surface-elevated rounded-full overflow-hidden flex">
              <div
                className="bg-accent h-full transition-all duration-500"
                style={{ width: `${(summary.used_bytes / summary.quota_bytes) * 100}%` }}
                title={`Used: ${formatBytes(summary.used_bytes)}`}
              />
              <div
                className="bg-[#6E26E5]/60 h-full transition-all duration-500"
                style={{ width: `${(summary.reserved_bytes / summary.quota_bytes) * 100}%` }}
                title={`Reserved: ${formatBytes(summary.reserved_bytes)}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-text-secondary pt-1">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                <span>Used ({formatBytes(summary.used_bytes)})</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6E26E5]" />
                <span>Reserved ({formatBytes(summary.reserved_bytes)})</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-elevated border border-border/80" />
                <span>Free ({formatBytes(summary.available_bytes)})</span>
              </span>
            </div>
          </div>
        )}

        {/* File Assets Ledger Table */}
        <div className="p-6 rounded-3xl glass-card border border-border/70 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-wide">
              Stored Media Objects ({summary?.assets.length || 0})
            </h3>
            <span className="text-xs text-text-muted font-mono">Cloudflare R2 Bucket</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-secondary">
              <thead className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Object Key</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {summary?.assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-medium text-white max-w-xs truncate">
                      {asset.original_filename}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted text-[11px] max-w-xs truncate">
                      {asset.object_key}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-semibold text-accent-light">
                      {asset.media_format}
                    </td>
                    <td className="py-3.5 px-4 text-white">
                      {formatBytes(asset.actual_size_bytes)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-status-success font-sans">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(asset)}
                          className="p-1.5 text-text-secondary hover:text-white rounded-lg hover:bg-surface-elevated transition-colors"
                          title="Generate Signed Download URL"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset)}
                          disabled={deleteLoadingId === asset.id}
                          className="p-1.5 text-text-secondary hover:text-status-error rounded-lg hover:bg-surface-elevated transition-colors"
                          title="Delete File from R2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {(!summary || summary.assets.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted font-sans text-xs">
                      No media files stored in Cloudflare R2 yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Modal */}
        <UploadEpisodeModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUploadComplete={fetchStorage}
          animeList={animeList}
        />
      </div>
    </AppLayout>
  );
}
