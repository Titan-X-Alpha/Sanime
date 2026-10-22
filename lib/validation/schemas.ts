import { z } from 'zod';

export const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(usernameRegex, 'Username can only contain letters, numbers, and underscores');

export const registerSchema = z.object({
  username: usernameSchema,
});

export const loginSchema = z.object({
  username: usernameSchema,
});

export const animeCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(1000).default(''),
  poster_url: z.string().url().or(z.string().startsWith('/')).default('/posters/default.jpg'),
  banner_url: z.string().url().or(z.string().startsWith('/')).default('/banners/default.jpg'),
  genre: z.array(z.string()).default([]),
});

export const episodeCreateSchema = z.object({
  anime_id: z.string().uuid().or(z.string().min(1)),
  season_number: z.number().int().min(1).default(1),
  episode_number: z.number().int().min(1),
  title: z.string().min(1, 'Episode title is required'),
  duration_seconds: z.number().int().nonnegative().default(0),
});

export const uploadInitSchema = z.object({
  anime_id: z.string().min(1),
  episode_title: z.string().min(1),
  season_number: z.number().int().min(1).default(1),
  episode_number: z.number().int().min(1),
  filename: z.string().min(1),
  filesize: z.number().positive(),
  content_type: z.string().min(1),
});

export const uploadCompleteSchema = z.object({
  job_id: z.string().min(1),
  object_key: z.string().min(1),
  actual_size_bytes: z.number().positive(),
  duration_seconds: z.number().int().nonnegative().optional().default(0),
});

export const watchProgressSchema = z.object({
  episode_id: z.string().min(1),
  position_seconds: z.number().nonnegative(),
  duration_seconds: z.number().nonnegative(),
  is_completed: z.boolean().optional(),
});

export const playerPreferencesSchema = z.object({
  preferred_audio_language: z.string().default('Japanese'),
  preferred_subtitle_language: z.string().default('English'),
  subtitles_enabled: z.boolean().default(true),
  playback_speed: z.number().min(0.25).max(3.0).default(1),
  preferred_quality: z.string().default('1080p'),
  autoplay_next: z.boolean().default(true),
  storage_quota_bytes: z.number().positive().optional(),
});
