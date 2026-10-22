export interface Profile {
  id: string;
  username: string;
  normalized_username: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Anime {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  banner_url: string;
  genre?: string[];
  total_episodes?: number;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  anime_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  duration_seconds: number;
  thumbnail_url?: string;
  created_at: string;
  media_asset?: MediaAsset;
}

export interface MediaAsset {
  id: string;
  episode_id: string;
  object_key: string;
  original_filename: string;
  mime_type: string;
  actual_size_bytes: number;
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed';
  media_format: string;
  created_at: string;
  verified_at?: string;
  video_url?: string;
}

export interface WatchProgress {
  id: string;
  profile_id: string;
  episode_id: string;
  position_seconds: number;
  duration_seconds: number;
  is_completed: boolean;
  last_watched_at: string;
  episode?: Episode;
  anime?: Anime;
}

export interface WatchlistItem {
  profile_id: string;
  anime_id: string;
  created_at: string;
  anime?: Anime;
}

export interface PlayerPreferences {
  profile_id: string;
  preferred_audio_language: string;
  preferred_subtitle_language: string;
  subtitles_enabled: boolean;
  playback_speed: number;
  preferred_quality: string;
  autoplay_next: boolean;
  storage_quota_bytes?: number;
}

export interface UploadJob {
  id: string;
  profile_id: string;
  object_key: string;
  expected_size_bytes: number;
  reserved_size_bytes: number;
  status: 'reserved' | 'uploading' | 'completed' | 'aborted' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface StorageSummary {
  used_bytes: number;
  quota_bytes: number;
  reserved_bytes: number;
  available_bytes: number;
  usage_percentage: number;
  total_episodes: number;
  total_series: number;
  warning_level: 'normal' | 'warning' | 'critical' | 'exceeded';
  assets: MediaAsset[];
  recent_activity: Array<{
    id: string;
    type: 'upload' | 'delete' | 'reserve';
    description: string;
    timestamp: string;
    size_bytes?: number;
  }>;
}
