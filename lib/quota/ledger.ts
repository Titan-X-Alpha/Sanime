import { db } from '@/lib/database/client';
import { StorageSummary } from '@/types';
import { formatBytes } from '@/lib/utils/format';

export { formatBytes };
export const DEFAULT_QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

export async function getStorageLedger(profileId?: string): Promise<StorageSummary> {
  const assets = await db.getAllMediaAssets();
  const reservedBytes = await db.getActiveReservationsBytes();

  let quotaBytes = DEFAULT_QUOTA_BYTES;
  if (profileId) {
    const prefs = await db.getPlayerPreferences(profileId);
    if (prefs?.storage_quota_bytes) {
      quotaBytes = prefs.storage_quota_bytes;
    }
  }

  const usedBytes = assets
    .filter((a) => a.upload_status === 'completed')
    .reduce((acc, curr) => acc + (curr.actual_size_bytes || 0), 0);

  const totalCommitted = usedBytes + reservedBytes;
  const availableBytes = Math.max(0, quotaBytes - totalCommitted);
  const usagePercentage = Math.min(100, (totalCommitted / quotaBytes) * 100);

  let warning_level: StorageSummary['warning_level'] = 'normal';
  if (totalCommitted > quotaBytes) {
    warning_level = 'exceeded';
  } else if (usagePercentage >= 95) {
    warning_level = 'critical';
  } else if (usagePercentage >= 80) {
    warning_level = 'warning';
  }

  const allAnime = await db.getAllAnime();

  return {
    used_bytes: usedBytes,
    quota_bytes: quotaBytes,
    reserved_bytes: reservedBytes,
    available_bytes: availableBytes,
    usage_percentage: Number(usagePercentage.toFixed(1)),
    total_episodes: assets.length,
    total_series: allAnime.length,
    warning_level,
    assets,
    recent_activity: [
      {
        id: 'act-1',
        type: 'upload',
        description: 'Uploaded Solo Leveling S01E03 (1.45 GB)',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        size_bytes: 1450000000,
      },
      {
        id: 'act-2',
        type: 'upload',
        description: 'Uploaded Dan Da Dan S01E05 (1.25 GB)',
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        size_bytes: 1250000000,
      },
    ],
  };
}

