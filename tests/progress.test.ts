import { describe, it, expect } from 'vitest';
import { db } from '@/lib/database/client';

describe('Watch Progress & Profile Isolation', () => {
  const profileA = 'c0a80101-0000-0000-0000-000000000001';
  const profileB = 'c0a80101-0000-0000-0000-000000000002';
  const episodeId = 'ep-test-solo';

  it('calculates completion status accurately at 90% threshold', async () => {
    // 50% watched -> not completed
    const prog1 = await db.upsertWatchProgress({
      profile_id: profileA,
      episode_id: episodeId,
      position_seconds: 500,
      duration_seconds: 1000,
    });
    expect(prog1.is_completed).toBe(false);

    // 92% watched -> marked completed
    const prog2 = await db.upsertWatchProgress({
      profile_id: profileA,
      episode_id: episodeId,
      position_seconds: 920,
      duration_seconds: 1000,
    });
    expect(prog2.is_completed).toBe(true);
  });

  it('keeps watch progress strictly isolated between profiles', async () => {
    // Profile A progress
    await db.upsertWatchProgress({
      profile_id: profileA,
      episode_id: 'ep-isolated-1',
      position_seconds: 600,
      duration_seconds: 1200,
    });

    // Profile B progress
    await db.upsertWatchProgress({
      profile_id: profileB,
      episode_id: 'ep-isolated-1',
      position_seconds: 100,
      duration_seconds: 1200,
    });

    const progA = await db.getWatchProgress(profileA, 'ep-isolated-1');
    const progB = await db.getWatchProgress(profileB, 'ep-isolated-1');

    expect(progA?.position_seconds).toBe(600);
    expect(progB?.position_seconds).toBe(100);
  });

  it('allows adding and removing anime from watchlist independently', async () => {
    const animeId = '11111111-1111-1111-1111-111111111111';

    await db.addToWatchlist(profileA, animeId);
    expect(await db.isInWatchlist(profileA, animeId)).toBe(true);

    await db.removeFromWatchlist(profileA, animeId);
    expect(await db.isInWatchlist(profileA, animeId)).toBe(false);
  });
});
