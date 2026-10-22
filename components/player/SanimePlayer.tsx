'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Settings,
  Subtitles,
  Check,
  Download,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';
import { Episode, PlayerPreferences } from '@/types';

interface TrackItem {
  id: string;
  kind: string;
  label: string;
  srclang: string;
  src: string;
  default?: boolean;
}

interface AudioTrackItem {
  id: string;
  label: string;
  language: string;
  default?: boolean;
}

interface SanimePlayerProps {
  episode: Episode & { anime?: { title: string } };
  streamUrl: string;
  tracks?: TrackItem[];
  audioTracks?: AudioTrackItem[];
  initialPositionSeconds?: number;
  preferences?: PlayerPreferences;
  nextEpisode?: Episode | null;
  prevEpisode?: Episode | null;
}

export function SanimePlayer({
  episode,
  streamUrl,
  tracks = [],
  audioTracks = [],
  initialPositionSeconds = 0,
  preferences,
  nextEpisode,
  prevEpisode,
}: SanimePlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>(streamUrl);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.duration_seconds || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(preferences?.playback_speed || 1);
  const [selectedQuality, setSelectedQuality] = useState(preferences?.preferred_quality || '1080p');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(
    preferences?.subtitles_enabled ? tracks[0]?.srclang || null : null
  );
  const [selectedAudio, setSelectedAudio] = useState<string>(
    preferences?.preferred_audio_language || 'Japanese'
  );

  useEffect(() => {
    setCurrentStreamUrl(streamUrl);
    setMediaError(null);
  }, [streamUrl]);

  const triggerDownload = async () => {
    setDownloading(true);
    try {
      const objectKey = episode.media_asset?.object_key || `media/download/${episode.id}/original.mp4`;
      const filename = episode.media_asset?.original_filename || `${episode.title || 'episode'}.mp4`;
      const res = await fetch('/api/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_key: objectKey,
          original_filename: filename,
        }),
      });
      const data = await res.json();
      if (data.download_url) {
        const link = document.createElement('a');
        link.href = data.download_url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      alert('Download could not be initiated.');
    } finally {
      setDownloading(false);
    }
  };


  // Settings menu modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'main' | 'speed' | 'quality' | 'audio' | 'subtitles'>('main');

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced progress saving
  const saveProgress = useCallback(
    async (pos: number, dur: number) => {
      try {
        await fetch('/api/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episode_id: episode.id,
            position_seconds: Math.floor(pos),
            duration_seconds: Math.floor(dur),
          }),
        });
      } catch (e) {
        // Silent catch for background progress sync
      }
    },
    [episode.id]
  );

  // Controls Visibility on User Activity
  const handleUserActivity = useCallback(() => {
    setControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isPlaying) {
      idleTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
        setSettingsOpen(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Initial resume position
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (initialPositionSeconds > 5 && initialPositionSeconds < (episode.duration_seconds || 1000) * 0.95) {
      video.currentTime = initialPositionSeconds;
      setCurrentTime(initialPositionSeconds);
    }
  }, [initialPositionSeconds, episode.duration_seconds]);

  // Periodic Progress Save
  useEffect(() => {
    if (isPlaying) {
      progressSaveTimerRef.current = setInterval(() => {
        if (videoRef.current) {
          saveProgress(videoRef.current.currentTime, videoRef.current.duration || duration);
        }
      }, 5000);
    }

    return () => {
      if (progressSaveTimerRef.current) clearInterval(progressSaveTimerRef.current);
    };
  }, [isPlaying, duration, saveProgress]);

  // Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => Math.min(1, Number((v + 0.1).toFixed(1))));
          video.volume = Math.min(1, video.volume + 0.1);
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => Math.max(0, Number((v - 0.1).toFixed(1))));
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
      }
      handleUserActivity();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handleUserActivity]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
      saveProgress(video.currentTime, video.duration || duration);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seekTo;
    setCurrentTime(seekTo);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setSettingsOpen(false);
  };

  const formatTime = (secs: number) => {
    const total = Math.floor(secs);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden select-none group ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'shadow-2xl border border-border/60'
      }`}
    >
      {/* HTML5 Video Surface */}
      <video
        ref={videoRef}
        src={currentStreamUrl}
        onClick={togglePlay}
        onError={() => {
          const isMkv = episode.media_asset?.media_format === 'mkv' || currentStreamUrl.includes('.mkv');
          if (isMkv) {
            setMediaError(
              'Your web browser cannot decode MKV video containers natively. Web browsers require MP4 (H.264/AAC). You can download the full original file to watch in VLC or switch to compatibility preview mode.'
            );
          } else {
            setMediaError('Unable to decode video format in current browser. Download the file to watch externally or switch to compatibility preview.');
          }
        }}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            videoRef.current.playbackRate = playbackSpeed;
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (videoRef.current) saveProgress(videoRef.current.duration, videoRef.current.duration);
          if (preferences?.autoplay_next && nextEpisode) {
            router.push(`/watch/${nextEpisode.id}`);
          }
        }}
        playsInline
        className="w-full h-full object-contain cursor-pointer"
      >
        {tracks.map((t) => (
          <track
            key={t.id}
            kind="subtitles"
            label={t.label}
            srcLang={t.srclang}
            src={t.src}
            default={selectedSubtitle === t.srclang}
          />
        ))}
      </video>

      {/* Codec / Format Compatibility Overlay */}
      {mediaError && (
        <div className="absolute inset-0 z-40 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-status-warning/20 border border-status-warning/40 flex items-center justify-center text-status-warning mb-4 shadow-lg">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Browser Playback Notice</h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-6">
            {mediaError}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={triggerDownload}
              disabled={downloading}
              className="purple-glow-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Download Original File'}</span>
            </button>
            <button
              onClick={() => {
                setCurrentStreamUrl('/public/videos/sample.mp4');
                setMediaError(null);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-surface-elevated border border-border/80 hover:border-accent flex items-center gap-2 transition-colors"
            >
              <PlayCircle className="w-4 h-4 text-accent" />
              <span>Play Compatibility Preview</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Header Overlay (Anime & Episode Title) */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 pointer-events-none ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div>
          <h2 className="text-white text-lg font-bold drop-shadow-md">
            {episode.anime?.title || 'SANIME'}
          </h2>
          <p className="text-text-secondary text-sm drop-shadow">
            S{episode.season_number} E{episode.episode_number} • {episode.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerDownload}
            disabled={downloading}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-surface-elevated/90 hover:bg-accent text-white rounded-md border border-border/60 transition-colors shadow"
            title="Download original episode file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Downloading...' : 'Download'}</span>
          </button>
          <span className="px-2.5 py-1 text-xs font-semibold bg-accent/80 text-white rounded-md backdrop-blur-sm">
            {selectedQuality}
          </span>
          <span className="px-2.5 py-1 text-xs font-medium bg-black/50 text-text-secondary rounded-md border border-border/40">
            {selectedAudio}
          </span>
        </div>
      </div>

      {/* Center Big Play/Pause Button indicator on click */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] cursor-pointer"
        >
          <div className="w-20 h-20 rounded-full bg-accent/90 hover:bg-accent text-white flex items-center justify-center shadow-glow transition-transform hover:scale-110">
            <Play className="w-9 h-9 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 md:p-6 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Timeline Bar */}
        <div className="flex items-center gap-3 mb-3 group/scrubber">
          <span className="text-xs font-mono text-text-secondary min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 hover:h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-accent transition-all duration-150"
            />
          </div>
          <span className="text-xs font-mono text-text-secondary min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="p-2 text-white hover:text-accent transition-colors"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            {/* Skip Back / Forward 10s */}
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
              }}
              className="p-2 text-text-secondary hover:text-white transition-colors"
              title="Rewind 10s (Left Arrow)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
              }}
              className="p-2 text-text-secondary hover:text-white transition-colors"
              title="Forward 10s (Right Arrow)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Previous Episode */}
            {prevEpisode && (
              <button
                onClick={() => router.push(`/watch/${prevEpisode.id}`)}
                className="p-2 text-text-secondary hover:text-white transition-colors"
                title={`Previous: E${prevEpisode.episode_number}`}
              >
                <SkipBack className="w-5 h-5" />
              </button>
            )}

            {/* Next Episode */}
            {nextEpisode && (
              <button
                onClick={() => router.push(`/watch/${nextEpisode.id}`)}
                className="p-2 text-text-secondary hover:text-white transition-colors"
                title={`Next: E${nextEpisode.episode_number}`}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}

            {/* Volume and Mute */}
            <div className="flex items-center gap-2 group/volume ml-2">
              <button
                onClick={toggleMute}
                className="p-2 text-text-secondary hover:text-white transition-colors"
                title="Mute / Unmute (M)"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>

          {/* Right Controls: Subtitles, Settings, Fullscreen */}
          <div className="flex items-center gap-3 relative">
            {/* Subtitles Button */}
            <button
              onClick={() => {
                const nextSub = selectedSubtitle ? null : 'en';
                setSelectedSubtitle(nextSub);
              }}
              className={`p-2 transition-colors ${
                selectedSubtitle ? 'text-accent' : 'text-text-secondary hover:text-white'
              }`}
              title="Toggle Subtitles"
            >
              <Subtitles className="w-5 h-5" />
            </button>

            {/* Settings Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen(!settingsOpen);
                  setActiveSettingsTab('main');
                }}
                className={`p-2 transition-colors ${
                  settingsOpen ? 'text-accent' : 'text-text-secondary hover:text-white'
                }`}
                title="Player Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Settings Dropdown Menu */}
              {settingsOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-12 right-0 w-64 bg-surface border border-border/80 rounded-xl p-3 shadow-2xl backdrop-blur-xl z-50 text-sm"
                >
                  {activeSettingsTab === 'main' && (
                    <div className="space-y-1">
                      <div className="px-2 py-1.5 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                        Settings
                      </div>
                      <button
                        onClick={() => setActiveSettingsTab('speed')}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated text-left text-white"
                      >
                        <span>Playback Speed</span>
                        <span className="text-xs text-text-secondary">{playbackSpeed}x</span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab('quality')}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated text-left text-white"
                      >
                        <span>Quality</span>
                        <span className="text-xs text-text-secondary">{selectedQuality}</span>
                      </button>
                      <button
                        onClick={() => setActiveSettingsTab('audio')}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated text-left text-white"
                      >
                        <span>Audio Language</span>
                        <span className="text-xs text-text-secondary">{selectedAudio}</span>
                      </button>
                    </div>
                  )}

                  {activeSettingsTab === 'speed' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 pb-2 mb-1 border-b border-border/50">
                        <button
                          onClick={() => setActiveSettingsTab('main')}
                          className="text-xs text-text-secondary hover:text-white"
                        >
                          ← Back
                        </button>
                        <span className="text-xs font-semibold text-white">Playback Speed</span>
                      </div>
                      {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedChange(s)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated text-white text-xs"
                        >
                          <span>{s}x</span>
                          {playbackSpeed === s && <Check className="w-4 h-4 text-accent" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeSettingsTab === 'quality' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 pb-2 mb-1 border-b border-border/50">
                        <button
                          onClick={() => setActiveSettingsTab('main')}
                          className="text-xs text-text-secondary hover:text-white"
                        >
                          ← Back
                        </button>
                        <span className="text-xs font-semibold text-white">Quality</span>
                      </div>
                      {['1080p', '720p', '480p', 'Auto'].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setSelectedQuality(q);
                            setSettingsOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated text-white text-xs"
                        >
                          <span>{q}</span>
                          {selectedQuality === q && <Check className="w-4 h-4 text-accent" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeSettingsTab === 'audio' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 pb-2 mb-1 border-b border-border/50">
                        <button
                          onClick={() => setActiveSettingsTab('main')}
                          className="text-xs text-text-secondary hover:text-white"
                        >
                          ← Back
                        </button>
                        <span className="text-xs font-semibold text-white">Audio Track</span>
                      </div>
                      {['Japanese', 'English'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setSelectedAudio(lang);
                            setSettingsOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated text-white text-xs"
                        >
                          <span>{lang}</span>
                          {selectedAudio === lang && <Check className="w-4 h-4 text-accent" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-text-secondary hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
