import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Profile,
  Anime,
  Episode,
  MediaAsset,
  WatchProgress,
  PlayerPreferences,
  UploadJob,
} from '@/types';

// Detect Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

interface LocalStoreData {
  profiles: Profile[];
  anime: Anime[];
  episodes: Episode[];
  media_assets: MediaAsset[];
  watch_progress: WatchProgress[];
  watchlist: Array<{ profile_id: string; anime_id: string; created_at: string }>;
  player_preferences: PlayerPreferences[];
  upload_jobs: UploadJob[];
}

// In-memory / persistent file-backed store for standalone local dev & test fallback
class LocalStore {
  private filePath: string;
  private data: LocalStoreData;

  constructor() {
    this.filePath = path.join(process.cwd(), '.data', 'sanime_store.json');
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): LocalStoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // fallback to seed
    }

    const defaultProfileId = 'c0a80101-0000-0000-0000-000000000001';
    const soloId = '11111111-1111-1111-1111-111111111111';
    const dandadanId = '22222222-2222-2222-2222-222222222222';
    const demonSlayerId = '33333333-3333-3333-3333-333333333333';
    const jjkId = '44444444-4444-4444-4444-444444444444';
    const onePieceId = '55555555-5555-5555-5555-555555555555';

    const seeded: LocalStoreData = {
      profiles: [
        {
          id: defaultProfileId,
          username: 'User',
          normalized_username: 'user',
          avatar_url: '/images/avatar.jpg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      anime: [
        {
          id: soloId,
          title: 'Solo Leveling',
          description: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jinwoo, notoriously known as the weakest hunter of all mankind, finds himself in an endless struggle for survival.',
          poster_url: '/images/hero-banner.jpg',
          banner_url: '/images/hero-banner.jpg',
          genre: ['Action', 'Fantasy', 'Supernatural'],
          total_episodes: 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: dandadanId,
          title: 'Dan Da Dan',
          description: 'Momo Ayase strikes up an unusual friendship with her schoolmate Ken Takakura, nicknamed Okarun, an occult fanatic. Together they encounter aliens and ghosts in high-octane battles.',
          poster_url: '/images/dandadan.jpg',
          banner_url: '/images/dandadan.jpg',
          genre: ['Action', 'Comedy', 'Supernatural'],
          total_episodes: 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: demonSlayerId,
          title: 'Demon Slayer: Kimetsu no Yaiba',
          description: 'A young man sets out on a quest to avenge his slaughtered family and cure his demon-cursed sister.',
          poster_url: '/images/tanjiro.jpg',
          banner_url: '/images/hero-banner.jpg',
          genre: ['Action', 'Historical', 'Supernatural'],
          total_episodes: 26,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: jjkId,
          title: 'Jujutsu Kaisen',
          description: 'A boy swallows a cursed talisman and becomes cursed himself. He enters a shaman school to locate the demon\'s other body parts and exorcise himself.',
          poster_url: '/images/gojo.jpg',
          banner_url: '/images/hero-banner.jpg',
          genre: ['Action', 'Dark Fantasy', 'Supernatural'],
          total_episodes: 24,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: onePieceId,
          title: 'One Piece',
          description: 'Monkey D. Luffy sails with his crew of Straw Hat Pirates through the Grand Line to find the legendary treasure One Piece and become the Pirate King.',
          poster_url: '/images/posters-grid.jpg',
          banner_url: '/images/hero-banner.jpg',
          genre: ['Action', 'Adventure', 'Fantasy'],
          total_episodes: 1080,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '66666666-6666-6666-6666-666666666666',
          title: 'Naruto',
          description: 'Moments prior to Naruto Uzumaki\'s birth, a huge demon known as the Kyuubi, the Nine-Tailed Fox, attacked Konohagakure. Naruto grows up as an outcast orphan who dreams of becoming the village leader, the Hokage.',
          poster_url: '/images/naruto.jpg',
          banner_url: '/images/naruto.jpg',
          genre: ['Action', 'Adventure', 'Martial Arts', 'Shounen'],
          total_episodes: 220,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '77777777-7777-7777-7777-777777777777',
          title: 'Naruto Shippuden',
          description: 'After two and a half years of training with Jiraiya, Naruto Uzumaki returns to Konohagakure with newfound strength. Now older and more determined, he faces the impending threat of the Akatsuki organization.',
          poster_url: '/images/naruto-shippuden.jpg',
          banner_url: '/images/naruto-shippuden.jpg',
          genre: ['Action', 'Adventure', 'Fantasy', 'Martial Arts'],
          total_episodes: 500,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      episodes: [
        {
          id: 'ep-solo-1',
          anime_id: soloId,
          season_number: 1,
          episode_number: 1,
          title: "I'm Used to It",
          duration_seconds: 1420,
          thumbnail_url: '/images/hero-banner.jpg',
          created_at: new Date().toISOString(),
        },
        {
          id: 'ep-solo-2',
          anime_id: soloId,
          season_number: 1,
          episode_number: 2,
          title: "If I Had One More Chance",
          duration_seconds: 1420,
          thumbnail_url: '/images/hero-banner.jpg',
          created_at: new Date().toISOString(),
        },
        {
          id: 'ep-solo-3',
          anime_id: soloId,
          season_number: 1,
          episode_number: 3,
          title: "It's Like a Game",
          duration_seconds: 1420, // 23:40
          thumbnail_url: '/images/hero-banner.jpg',
          created_at: new Date().toISOString(),
        },
        {
          id: 'ep-dan-5',
          anime_id: dandadanId,
          season_number: 1,
          episode_number: 5,
          title: "Like, This is Love?!",
          duration_seconds: 1450, // 24:10
          thumbnail_url: '/images/dandadan.jpg',
          created_at: new Date().toISOString(),
        },
      ],
      media_assets: [
        {
          id: 'asset-solo-3',
          episode_id: 'ep-solo-3',
          object_key: `media/${defaultProfileId}/solo-ep3/original.mp4`,
          original_filename: 'Solo_Leveling_S01E03_1080p.mp4',
          mime_type: 'video/mp4',
          actual_size_bytes: 1450000000, // ~1.45 GB
          upload_status: 'completed',
          media_format: 'mp4',
          created_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // sample working video for instant playback test
        },
        {
          id: 'asset-dan-5',
          episode_id: 'ep-dan-5',
          object_key: `media/${defaultProfileId}/dan-ep5/original.mp4`,
          original_filename: 'DanDaDan_S01E05_1080p.mp4',
          mime_type: 'video/mp4',
          actual_size_bytes: 1250000000, // ~1.25 GB
          upload_status: 'completed',
          media_format: 'mp4',
          created_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        },
        {
          id: 'asset-dummy-1',
          episode_id: 'ep-solo-1',
          object_key: `media/${defaultProfileId}/solo-ep1/original.mp4`,
          original_filename: 'Solo_Leveling_S01E01.mp4',
          mime_type: 'video/mp4',
          actual_size_bytes: 1850000000,
          upload_status: 'completed',
          media_format: 'mp4',
          created_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
        },
        {
          id: 'asset-dummy-2',
          episode_id: 'ep-solo-2',
          object_key: `media/${defaultProfileId}/solo-ep2/original.mp4`,
          original_filename: 'Solo_Leveling_S01E02.mp4',
          mime_type: 'video/mp4',
          actual_size_bytes: 1850000000,
          upload_status: 'completed',
          media_format: 'mp4',
          created_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
        },
      ],
      watch_progress: [
        {
          id: 'prog-solo-3',
          profile_id: defaultProfileId,
          episode_id: 'ep-solo-3',
          position_seconds: 754, // 12:34
          duration_seconds: 1420, // 23:40
          is_completed: false,
          last_watched_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          id: 'prog-dan-5',
          profile_id: defaultProfileId,
          episode_id: 'ep-dan-5',
          position_seconds: 1100, // 18:20
          duration_seconds: 1450, // 24:10
          is_completed: false,
          last_watched_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
      ],
      watchlist: [
        { profile_id: defaultProfileId, anime_id: soloId, created_at: new Date().toISOString() },
        { profile_id: defaultProfileId, anime_id: dandadanId, created_at: new Date().toISOString() },
        { profile_id: defaultProfileId, anime_id: demonSlayerId, created_at: new Date().toISOString() },
        { profile_id: defaultProfileId, anime_id: jjkId, created_at: new Date().toISOString() },
      ],
      player_preferences: [
        {
          profile_id: defaultProfileId,
          preferred_audio_language: 'Japanese',
          preferred_subtitle_language: 'English',
          subtitles_enabled: true,
          playback_speed: 1.0,
          preferred_quality: '1080p',
          autoplay_next: true,
          storage_quota_bytes: 10 * 1024 * 1024 * 1024, // 10 GB
        },
      ],
      upload_jobs: [],
    };

    this.saveData(seeded);
    return seeded;
  }

  private saveData(data: LocalStoreData): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // In-memory mode if write fails
    }
  }

  public getRaw(): LocalStoreData {
    return this.data;
  }

  public save(): void {
    this.saveData(this.data);
  }
}

// Global local store singleton
const localStore = new LocalStore();

export class DatabaseClient {
  private supabase: SupabaseClient | null = null;

  constructor() {
    if (isSupabaseConfigured && supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  // --- Profiles ---
  async getProfileById(id: string): Promise<Profile | null> {
    if (this.supabase) {
      const { data } = await this.supabase.from('profiles').select('*').eq('id', id).single();
      return data || null;
    }
    const profile = localStore.getRaw().profiles.find((p) => p.id === id);
    return profile || null;
  }

  async getProfileByNormalizedUsername(normalizedUsername: string): Promise<Profile | null> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('normalized_username', normalizedUsername)
        .single();
      return data || null;
    }
    const profile = localStore.getRaw().profiles.find((p) => p.normalized_username === normalizedUsername);
    return profile || null;
  }

  async createProfile(username: string): Promise<Profile> {
    const normalized = username.trim().toLowerCase();
    const existing = await this.getProfileByNormalizedUsername(normalized);
    if (existing) {
      throw new Error('Username is already taken');
    }

    const newProfile: Profile = {
      id: crypto.randomUUID(),
      username: username.trim(),
      normalized_username: normalized,
      avatar_url: '/images/avatar.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.supabase) {
      const { data, error } = await this.supabase.from('profiles').insert(newProfile).select().single();
      if (error) throw error;
      return data;
    }

    localStore.getRaw().profiles.push(newProfile);
    // Initialize default preferences
    localStore.getRaw().player_preferences.push({
      profile_id: newProfile.id,
      preferred_audio_language: 'Japanese',
      preferred_subtitle_language: 'English',
      subtitles_enabled: true,
      playback_speed: 1.0,
      preferred_quality: '1080p',
      autoplay_next: true,
      storage_quota_bytes: 10 * 1024 * 1024 * 1024,
    });
    localStore.save();
    return newProfile;
  }

  // --- Anime ---
  async getAllAnime(search?: string): Promise<Anime[]> {
    if (this.supabase) {
      let query = this.supabase.from('anime').select('*').order('created_at', { ascending: false });
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }
      const { data } = await query;
      return data || [];
    }

    let list = [...localStore.getRaw().anime];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    return list;
  }

  async getAnimeById(id: string): Promise<Anime | null> {
    if (this.supabase) {
      const { data } = await this.supabase.from('anime').select('*').eq('id', id).single();
      return data || null;
    }
    return localStore.getRaw().anime.find((a) => a.id === id) || null;
  }

  async createAnime(anime: Omit<Anime, 'id' | 'created_at' | 'updated_at'>): Promise<Anime> {
    const entry: Anime = {
      id: crypto.randomUUID(),
      ...anime,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.supabase) {
      const { data, error } = await this.supabase.from('anime').insert(entry).select().single();
      if (error) throw error;
      return data;
    }

    localStore.getRaw().anime.unshift(entry);
    localStore.save();
    return entry;
  }

  async deleteAnime(id: string): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('anime').delete().eq('id', id);
      return;
    }
    const store = localStore.getRaw();
    store.anime = store.anime.filter((a) => a.id !== id);
    // Cascade delete episodes
    const episodeIds = store.episodes.filter((e) => e.anime_id === id).map((e) => e.id);
    store.episodes = store.episodes.filter((e) => e.anime_id !== id);
    store.media_assets = store.media_assets.filter((m) => !episodeIds.includes(m.episode_id));
    store.watch_progress = store.watch_progress.filter((p) => !episodeIds.includes(p.episode_id));
    store.watchlist = store.watchlist.filter((w) => w.anime_id !== id);
    localStore.save();
  }

  // --- Episodes ---
  async getEpisodesByAnimeId(animeId: string): Promise<Episode[]> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('episodes')
        .select('*, media_assets(*)')
        .eq('anime_id', animeId)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });
      return data || [];
    }

    const store = localStore.getRaw();
    const episodes = store.episodes.filter((e) => e.anime_id === animeId);
    return episodes.map((e) => ({
      ...e,
      media_asset: store.media_assets.find((m) => m.episode_id === e.id),
    }));
  }

  async getEpisodeById(id: string): Promise<(Episode & { anime?: Anime; media_asset?: MediaAsset }) | null> {
    if (this.supabase) {
      const { data } = await this.supabase.from('episodes').select('*, anime(*), media_assets(*)').eq('id', id).single();
      return data || null;
    }

    const store = localStore.getRaw();
    const ep = store.episodes.find((e) => e.id === id);
    if (!ep) return null;
    const anime = store.anime.find((a) => a.id === ep.anime_id);
    const media_asset = store.media_assets.find((m) => m.episode_id === ep.id);
    return { ...ep, anime, media_asset };
  }

  async createEpisode(episode: Omit<Episode, 'id' | 'created_at'>): Promise<Episode> {
    const entry: Episode = {
      id: crypto.randomUUID(),
      ...episode,
      created_at: new Date().toISOString(),
    };

    if (this.supabase) {
      const { data, error } = await this.supabase.from('episodes').insert(entry).select().single();
      if (error) throw error;
      return data;
    }

    localStore.getRaw().episodes.push(entry);
    localStore.save();
    return entry;
  }

  // --- Media Assets ---
  async createMediaAsset(asset: Omit<MediaAsset, 'id' | 'created_at'>): Promise<MediaAsset> {
    const entry: MediaAsset = {
      id: crypto.randomUUID(),
      ...asset,
      created_at: new Date().toISOString(),
    };

    if (this.supabase) {
      const { data, error } = await this.supabase.from('media_assets').insert(entry).select().single();
      if (error) throw error;
      return data;
    }

    localStore.getRaw().media_assets.push(entry);
    localStore.save();
    return entry;
  }

  async getMediaAssetByEpisodeId(episodeId: string): Promise<MediaAsset | null> {
    if (this.supabase) {
      const { data } = await this.supabase.from('media_assets').select('*').eq('episode_id', episodeId).single();
      return data || null;
    }
    return localStore.getRaw().media_assets.find((m) => m.episode_id === episodeId) || null;
  }

  async deleteMediaAsset(id: string): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('media_assets').delete().eq('id', id);
      return;
    }
    const store = localStore.getRaw();
    store.media_assets = store.media_assets.filter((m) => m.id !== id);
    localStore.save();
  }

  // --- Watch Progress ---
  async getWatchProgress(profileId: string, episodeId: string): Promise<WatchProgress | null> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('watch_progress')
        .select('*')
        .eq('profile_id', profileId)
        .eq('episode_id', episodeId)
        .single();
      return data || null;
    }
    return localStore.getRaw().watch_progress.find((p) => p.profile_id === profileId && p.episode_id === episodeId) || null;
  }

  async upsertWatchProgress(progress: {
    profile_id: string;
    episode_id: string;
    position_seconds: number;
    duration_seconds: number;
    is_completed?: boolean;
  }): Promise<WatchProgress> {
    const isCompleted = progress.is_completed ?? (progress.duration_seconds > 0 && progress.position_seconds / progress.duration_seconds >= 0.9);

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('watch_progress')
        .upsert(
          {
            profile_id: progress.profile_id,
            episode_id: progress.episode_id,
            position_seconds: progress.position_seconds,
            duration_seconds: progress.duration_seconds,
            is_completed: isCompleted,
            last_watched_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id,episode_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const store = localStore.getRaw();
    const idx = store.watch_progress.findIndex(
      (p) => p.profile_id === progress.profile_id && p.episode_id === progress.episode_id
    );

    const record: WatchProgress = {
      id: idx >= 0 ? store.watch_progress[idx].id : crypto.randomUUID(),
      profile_id: progress.profile_id,
      episode_id: progress.episode_id,
      position_seconds: progress.position_seconds,
      duration_seconds: progress.duration_seconds,
      is_completed: isCompleted,
      last_watched_at: new Date().toISOString(),
    };

    if (idx >= 0) {
      store.watch_progress[idx] = record;
    } else {
      store.watch_progress.push(record);
    }
    localStore.save();
    return record;
  }

  async getContinueWatching(profileId: string, limit = 5): Promise<WatchProgress[]> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('watch_progress')
        .select('*, episodes(*, anime(*))')
        .eq('profile_id', profileId)
        .eq('is_completed', false)
        .order('last_watched_at', { ascending: false })
        .limit(limit);
      return data || [];
    }

    const store = localStore.getRaw();
    const progressList = store.watch_progress
      .filter((p) => p.profile_id === profileId && !p.is_completed)
      .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime())
      .slice(0, limit);

    return progressList.map((p) => {
      const ep = store.episodes.find((e) => e.id === p.episode_id);
      const anime = ep ? store.anime.find((a) => a.id === ep.anime_id) : undefined;
      return { ...p, episode: ep, anime };
    });
  }

  async getWatchHistory(profileId: string): Promise<WatchProgress[]> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('watch_progress')
        .select('*, episodes(*, anime(*))')
        .eq('profile_id', profileId)
        .order('last_watched_at', { ascending: false });
      return data || [];
    }

    const store = localStore.getRaw();
    return store.watch_progress
      .filter((p) => p.profile_id === profileId)
      .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime())
      .map((p) => {
        const ep = store.episodes.find((e) => e.id === p.episode_id);
        const anime = ep ? store.anime.find((a) => a.id === ep.anime_id) : undefined;
        return { ...p, episode: ep, anime };
      });
  }

  async clearWatchHistory(profileId: string): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('watch_progress').delete().eq('profile_id', profileId);
      return;
    }
    const store = localStore.getRaw();
    store.watch_progress = store.watch_progress.filter((p) => p.profile_id !== profileId);
    localStore.save();
  }

  // --- Watchlist ---
  async getWatchlist(profileId: string): Promise<Anime[]> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('watchlist')
        .select('anime(*)')
        .eq('profile_id', profileId);
      return data?.map((d: any) => d.anime) || [];
    }

    const store = localStore.getRaw();
    const animeIds = store.watchlist.filter((w) => w.profile_id === profileId).map((w) => w.anime_id);
    return store.anime.filter((a) => animeIds.includes(a.id));
  }

  async addToWatchlist(profileId: string, animeId: string): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('watchlist').upsert({ profile_id: profileId, anime_id: animeId });
      return;
    }
    const store = localStore.getRaw();
    if (!store.watchlist.some((w) => w.profile_id === profileId && w.anime_id === animeId)) {
      store.watchlist.push({ profile_id: profileId, anime_id: animeId, created_at: new Date().toISOString() });
      localStore.save();
    }
  }

  async removeFromWatchlist(profileId: string, animeId: string): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('watchlist').delete().eq('profile_id', profileId).eq('anime_id', animeId);
      return;
    }
    const store = localStore.getRaw();
    store.watchlist = store.watchlist.filter((w) => !(w.profile_id === profileId && w.anime_id === animeId));
    localStore.save();
  }

  async isInWatchlist(profileId: string, animeId: string): Promise<boolean> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('watchlist')
        .select('anime_id')
        .eq('profile_id', profileId)
        .eq('anime_id', animeId)
        .single();
      return Boolean(data);
    }
    return localStore.getRaw().watchlist.some((w) => w.profile_id === profileId && w.anime_id === animeId);
  }

  // --- Player Preferences ---
  async getPlayerPreferences(profileId: string): Promise<PlayerPreferences> {
    if (this.supabase) {
      const { data } = await this.supabase.from('player_preferences').select('*').eq('profile_id', profileId).single();
      if (data) return data;
    }
    const found = localStore.getRaw().player_preferences.find((p) => p.profile_id === profileId);
    if (found) return found;

    return {
      profile_id: profileId,
      preferred_audio_language: 'Japanese',
      preferred_subtitle_language: 'English',
      subtitles_enabled: true,
      playback_speed: 1.0,
      preferred_quality: '1080p',
      autoplay_next: true,
      storage_quota_bytes: 10 * 1024 * 1024 * 1024,
    };
  }

  async upsertPlayerPreferences(preferences: PlayerPreferences): Promise<PlayerPreferences> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('player_preferences')
        .upsert(preferences)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const store = localStore.getRaw();
    const idx = store.player_preferences.findIndex((p) => p.profile_id === preferences.profile_id);
    if (idx >= 0) {
      store.player_preferences[idx] = preferences;
    } else {
      store.player_preferences.push(preferences);
    }
    localStore.save();
    return preferences;
  }

  // --- Upload Jobs & Reservations ---
  async createUploadJob(job: Omit<UploadJob, 'id' | 'created_at' | 'updated_at'>): Promise<UploadJob> {
    const entry: UploadJob = {
      id: crypto.randomUUID(),
      ...job,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (this.supabase) {
      const { data, error } = await this.supabase.from('upload_jobs').insert(entry).select().single();
      if (error) throw error;
      return data;
    }

    localStore.getRaw().upload_jobs.push(entry);
    localStore.save();
    return entry;
  }

  async getUploadJobById(id: string): Promise<UploadJob | null> {
    if (this.supabase) {
      const { data } = await this.supabase.from('upload_jobs').select('*').eq('id', id).single();
      return data || null;
    }
    return localStore.getRaw().upload_jobs.find((j) => j.id === id) || null;
  }

  async updateUploadJobStatus(id: string, status: UploadJob['status']): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('upload_jobs').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      return;
    }
    const store = localStore.getRaw();
    const job = store.upload_jobs.find((j) => j.id === id);
    if (job) {
      job.status = status;
      job.updated_at = new Date().toISOString();
      localStore.save();
    }
  }

  async getActiveReservationsBytes(): Promise<number> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('upload_jobs')
        .select('reserved_size_bytes')
        .in('status', ['reserved', 'uploading']);
      return data?.reduce((acc: number, curr: any) => acc + (curr.reserved_size_bytes || 0), 0) || 0;
    }
    const store = localStore.getRaw();
    return store.upload_jobs
      .filter((j) => j.status === 'reserved' || j.status === 'uploading')
      .reduce((acc, curr) => acc + curr.reserved_size_bytes, 0);
  }

  async getAllMediaAssets(): Promise<MediaAsset[]> {
    if (this.supabase) {
      const { data } = await this.supabase.from('media_assets').select('*').order('created_at', { ascending: false });
      return data || [];
    }
    return [...localStore.getRaw().media_assets];
  }
}

export const db = new DatabaseClient();
