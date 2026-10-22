'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, AlertTriangle, CheckCircle, FileVideo, HardDrive } from 'lucide-react';
import { Anime, StorageSummary } from '@/types';
import { formatBytes } from '@/lib/utils/format';

interface UploadEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
  preselectedAnimeId?: string;
  animeList?: Anime[];
}

export function UploadEpisodeModal({
  isOpen,
  onClose,
  onUploadComplete,
  preselectedAnimeId,
  animeList = [],
}: UploadEpisodeModalProps) {
  const [selectedAnimeId, setSelectedAnimeId] = useState(preselectedAnimeId || '');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [file, setFile] = useState<File | null>(null);

  // Storage and upload status
  const [storageSummary, setStorageSummary] = useState<StorageSummary | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'reserving' | 'uploading' | 'verifying' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  const [allowOverage, setAllowOverage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/storage')
        .then((res) => res.json())
        .then((data) => setStorageSummary(data))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedAnimeId) {
      setSelectedAnimeId(preselectedAnimeId);
    } else if (animeList.length > 0 && !selectedAnimeId) {
      setSelectedAnimeId(animeList[0].id);
    }
  }, [preselectedAnimeId, animeList, selectedAnimeId]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMessage('');
    setQuotaWarning(null);

    // Default title from filename if empty
    if (!episodeTitle) {
      const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setEpisodeTitle(cleanName);
    }

    // Check storage limits
    if (storageSummary) {
      const remainingBytes = storageSummary.available_bytes;
      const totalAfter = storageSummary.used_bytes + storageSummary.reserved_bytes + selected.size;
      const percentageAfter = (totalAfter / storageSummary.quota_bytes) * 100;

      if (totalAfter > storageSummary.quota_bytes) {
        setQuotaWarning(`This file (${formatBytes(selected.size)}) exceeds your remaining application quota (${formatBytes(remainingBytes)}). Cloudflare R2 overage may apply.`);
      } else if (percentageAfter >= 95) {
        setQuotaWarning(`Critical Quota Alert: After uploading, your storage will reach ${percentageAfter.toFixed(0)}% capacity.`);
      } else if (percentageAfter >= 80) {
        setQuotaWarning(`Quota Warning: Storage will reach ${percentageAfter.toFixed(0)}% capacity.`);
      }
    }
  };

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedAnimeId || !episodeTitle) {
      setErrorMessage('Please fill in all required fields and choose a video file.');
      return;
    }

    setUploading(true);
    setUploadStatus('reserving');
    setErrorMessage('');
    setProgressPercent(5);

    try {
      // Step 1: Call /api/uploads/init
      const initRes = await fetch('/api/uploads/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anime_id: selectedAnimeId,
          episode_title: episodeTitle,
          season_number: Number(seasonNumber),
          episode_number: Number(episodeNumber),
          filename: file.name,
          filesize: file.size,
          content_type: file.type || 'video/mp4',
          allow_overage: allowOverage,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) {
        if (initData.requires_confirmation) {
          setQuotaWarning(initData.message);
          setUploading(false);
          setUploadStatus('idle');
          return;
        }
        throw new Error(initData.error || initData.message || 'Failed to initialize upload');
      }

      const { job_id, upload_url, object_key } = initData;

      // Step 2: Direct browser PUT upload to R2 / signed URL
      setUploadStatus('uploading');
      setProgressPercent(20);

      // Perform direct PUT request to presigned URL
      const putRes = await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'video/mp4',
        },
        body: file,
      });

      if (!putRes.ok && putRes.status !== 200) {
        // If abort needed
        await fetch('/api/uploads/abort', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id }),
        });
        throw new Error('Direct upload to Cloudflare R2 failed.');
      }

      setProgressPercent(85);
      setUploadStatus('verifying');

      // Step 3: Complete upload and verify
      const completeRes = await fetch('/api/uploads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id,
          object_key,
          actual_size_bytes: file.size,
          anime_id: selectedAnimeId,
          episode_title: episodeTitle,
          season_number: Number(seasonNumber),
          episode_number: Number(episodeNumber),
          original_filename: file.name,
          mime_type: file.type || 'video/mp4',
        }),
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        throw new Error(completeData.error || 'Failed to verify uploaded object');
      }

      setProgressPercent(100);
      setUploadStatus('completed');

      setTimeout(() => {
        onUploadComplete?.();
        onClose();
      }, 1200);
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'An error occurred during upload');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl">
        <button
          onClick={onClose}
          disabled={uploading && uploadStatus === 'uploading'}
          className="absolute top-5 right-5 p-2 text-text-secondary hover:text-white rounded-lg hover:bg-surface-elevated transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Upload Anime Episode</h3>
            <p className="text-xs text-text-secondary">Direct browser-to-Cloudflare R2 streaming upload</p>
          </div>
        </div>

        {/* Quota warning banner if applicable */}
        {quotaWarning && (
          <div className="mb-5 p-3.5 rounded-xl bg-status-warning/10 border border-status-warning/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-status-warning">Storage Quota Notice</p>
              <p className="text-text-secondary mt-0.5">{quotaWarning}</p>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverage}
                  onChange={(e) => setAllowOverage(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-white font-medium">I understand and confirm this upload</span>
              </label>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-status-error/10 border border-status-error/40 text-xs text-status-error">
            {errorMessage}
          </div>
        )}

        {uploadStatus === 'completed' ? (
          <div className="py-8 text-center flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-status-success mb-3 animate-bounce" />
            <h4 className="text-lg font-bold text-white">Episode Uploaded & Verified!</h4>
            <p className="text-xs text-text-secondary mt-1">Ready for private streaming.</p>
          </div>
        ) : (
          <form onSubmit={handleStartUpload} className="space-y-4">
            {/* Anime selector */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Anime Series
              </label>
              <select
                value={selectedAnimeId}
                onChange={(e) => setSelectedAnimeId(e.target.value)}
                disabled={uploading}
                className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                required
              >
                {animeList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Season and Episode number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Season
                </label>
                <input
                  type="number"
                  min={1}
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(Number(e.target.value))}
                  disabled={uploading}
                  className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Episode Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                  disabled={uploading}
                  className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  required
                />
              </div>
            </div>

            {/* Episode Title */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Episode Title
              </label>
              <input
                type="text"
                placeholder="e.g. It's Like a Game"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                disabled={uploading}
                className="w-full bg-[#161726] border border-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                required
              />
            </div>

            {/* Video File Picker */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Video File (.mp4, .mkv, .webm)
              </label>
              <div className="relative border-2 border-dashed border-border hover:border-accent/80 rounded-xl p-5 text-center transition-colors bg-surface-elevated/30">
                <input
                  type="file"
                  accept="video/mp4,video/mkv,video/webm"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileVideo className="w-8 h-8 text-accent" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-text-secondary">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-text-muted mb-2" />
                    <p className="text-xs text-text-secondary">Drag & drop or click to choose episode video</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar when uploading */}
            {uploading && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-secondary capitalize">{uploadStatus}...</span>
                  <span className="font-mono text-accent font-semibold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-[#6E26E5] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !file}
                className="purple-glow-btn px-6 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Start Upload'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
