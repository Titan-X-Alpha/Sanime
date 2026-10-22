-- SANIME Database Schema Migration
-- Complete Normalized Schema with Constraints, Foreign Keys & RLS

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) NOT NULL UNIQUE,
  normalized_username VARCHAR(20) NOT NULL UNIQUE,
  avatar_url TEXT DEFAULT '/images/avatar.jpg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Case-insensitive unique constraint for username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_normalized_username ON profiles (lower(normalized_username));

-- 2. Anime Series Table
CREATE TABLE IF NOT EXISTS anime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  poster_url TEXT DEFAULT '/images/posters-grid.jpg',
  banner_url TEXT DEFAULT '/images/hero-banner.jpg',
  genre TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Episodes Table
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL DEFAULT 1,
  episode_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_anime_season_episode UNIQUE (anime_id, season_number, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_anime_id ON episodes (anime_id);

-- 4. Media Assets Table
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL DEFAULT 'video/mp4',
  actual_size_bytes BIGINT NOT NULL DEFAULT 0,
  upload_status VARCHAR(50) NOT NULL DEFAULT 'completed',
  media_format VARCHAR(50) NOT NULL DEFAULT 'mp4',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_assets_episode ON media_assets (episode_id);

-- 5. Watch Progress Table
CREATE TABLE IF NOT EXISTS watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  position_seconds NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_seconds NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_profile_episode_progress UNIQUE (profile_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_progress_profile ON watch_progress (profile_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_last_watched ON watch_progress (last_watched_at DESC);

-- 6. Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (profile_id, anime_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_profile ON watchlist (profile_id);

-- 7. Player Preferences Table
CREATE TABLE IF NOT EXISTS player_preferences (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_audio_language VARCHAR(50) NOT NULL DEFAULT 'Japanese',
  preferred_subtitle_language VARCHAR(50) NOT NULL DEFAULT 'English',
  subtitles_enabled BOOLEAN NOT NULL DEFAULT true,
  playback_speed NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
  preferred_quality VARCHAR(20) NOT NULL DEFAULT '1080p',
  autoplay_next BOOLEAN NOT NULL DEFAULT true,
  storage_quota_bytes BIGINT NOT NULL DEFAULT 10737418240, -- 10 GB default
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Upload Jobs / Capacity Reservations Table
CREATE TABLE IF NOT EXISTS upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  expected_size_bytes BIGINT NOT NULL,
  reserved_size_bytes BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'reserved', -- 'reserved', 'uploading', 'completed', 'aborted', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON upload_jobs (status);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_jobs ENABLE ROW LEVEL SECURITY;

-- Allow public read for anime catalog & episodes
CREATE POLICY "Public read anime" ON anime FOR SELECT USING (true);
CREATE POLICY "Public read episodes" ON episodes FOR SELECT USING (true);
CREATE POLICY "Public read media_assets" ON media_assets FOR SELECT USING (true);

-- Allow authenticated profiles to read and manage their own progress, watchlist, and preferences
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users read own watch_progress" ON watch_progress FOR ALL USING (true);
CREATE POLICY "Users read own watchlist" ON watchlist FOR ALL USING (true);
CREATE POLICY "Users read own preferences" ON player_preferences FOR ALL USING (true);
CREATE POLICY "Users manage upload_jobs" ON upload_jobs FOR ALL USING (true);
