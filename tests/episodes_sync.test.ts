import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/database/client';
import { getStorageLedger } from '../lib/quota/ledger';

describe('Episode Sync & Deletion Cascade', () => {
  it('all anime have 0 episodes when no episodes are in the database', async () => {
    const animeList = await db.getAllAnime();
    expect(animeList.length).toBeGreaterThan(0);
    for (const anime of animeList) {
      expect(anime.total_episodes).toBe(0);
    }
  });

  it('storage ledger reports 0 episodes when storage is empty', async () => {
    const ledger = await getStorageLedger();
    expect(ledger.total_episodes).toBe(0);
    expect(ledger.used_bytes).toBe(0);
  });

  it('creates an episode and increments that anime count without affecting others', async () => {
    const allAnime = await db.getAllAnime();
    const targetAnime = allAnime[0];

    const episode = await db.createEpisode({
      anime_id: targetAnime.id,
      season_number: 1,
      episode_number: 1,
      title: 'Test Episode 1',
      duration_seconds: 1420,
      thumbnail_url: '/images/hero-banner.jpg',
    });

    const media = await db.createMediaAsset({
      episode_id: episode.id,
      object_key: `media/test/${episode.id}/video.mp4`,
      original_filename: 'naruto_ep1.mp4',
      mime_type: 'video/mp4',
      actual_size_bytes: 50000000,
      upload_status: 'completed',
      media_format: 'mp4',
      verified_at: new Date().toISOString(),
    });

    // Check anime total_episodes
    const updatedTarget = await db.getAnimeById(targetAnime.id);
    expect(updatedTarget?.total_episodes).toBe(1);

    const otherAnime = (await db.getAllAnime()).filter((a) => a.id !== targetAnime.id);
    for (const other of otherAnime) {
      expect(other.total_episodes).toBe(0);
    }

    // Now delete the media asset and verify cascade removes episode
    await db.deleteMediaAsset(media.id);

    const afterDelete = await db.getAnimeById(targetAnime.id);
    expect(afterDelete?.total_episodes).toBe(0);

    const episodes = await db.getEpisodesByAnimeId(targetAnime.id);
    expect(episodes.length).toBe(0);
  });

  it('deleteEpisode removes episode, media asset, and watch progress', async () => {
    const allAnime = await db.getAllAnime();
    const targetAnime = allAnime[1];

    const episode = await db.createEpisode({
      anime_id: targetAnime.id,
      season_number: 1,
      episode_number: 1,
      title: 'Episode To Delete',
      duration_seconds: 1400,
      thumbnail_url: '/images/hero-banner.jpg',
    });

    const media = await db.createMediaAsset({
      episode_id: episode.id,
      object_key: `media/test/${episode.id}/video2.mp4`,
      original_filename: 'test_delete.mp4',
      mime_type: 'video/mp4',
      actual_size_bytes: 30000000,
      upload_status: 'completed',
      media_format: 'mp4',
      verified_at: new Date().toISOString(),
    });

    await db.upsertWatchProgress({
      profile_id: 'c0a80101-0000-0000-0000-000000000001',
      episode_id: episode.id,
      position_seconds: 120,
      duration_seconds: 1400,
    });

    // Call deleteEpisode
    await db.deleteEpisode(episode.id);

    // Verify episode is gone
    const epCheck = await db.getEpisodeById(episode.id);
    expect(epCheck).toBeNull();

    // Verify media asset is gone
    const mediaCheck = await db.getMediaAssetByEpisodeId(episode.id);
    expect(mediaCheck).toBeNull();

    // Verify anime count is 0
    const animeCheck = await db.getAnimeById(targetAnime.id);
    expect(animeCheck?.total_episodes).toBe(0);
  });
});
