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
    recent_activity: assets.slice(0, 5).map((a) => ({
      id: a.id,
      type: 'upload',
      description: `Uploaded ${a.original_filename} (${formatBytes(a.actual_size_bytes)})`,
      timestamp: a.created_at,
      size_bytes: a.actual_size_bytes,
    })),
  };
}

