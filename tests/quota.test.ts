import { describe, it, expect } from 'vitest';
import { getStorageLedger, formatBytes, DEFAULT_QUOTA_BYTES } from '@/lib/quota/ledger';
import { db } from '@/lib/database/client';

describe('Cloud Storage Ledger & Quota Warnings', () => {
  it('formats byte representations correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 10)).toBe('10 GB');
  });

  it('calculates stored bytes, reservations, and capacity accurately', async () => {
    const summary = await getStorageLedger();
    expect(summary.quota_bytes).toBe(DEFAULT_QUOTA_BYTES);
    expect(summary.used_bytes).toBeGreaterThanOrEqual(0);
    expect(summary.available_bytes).toBeLessThanOrEqual(DEFAULT_QUOTA_BYTES);
    expect(summary.usage_percentage).toBeGreaterThanOrEqual(0);
    expect(summary.usage_percentage).toBeLessThanOrEqual(100);
    expect(['normal', 'warning', 'critical', 'exceeded']).toContain(summary.warning_level);
  });

  it('correctly tracks upload reservation buffer', async () => {
    const profileId = 'c0a80101-0000-0000-0000-000000000001';
    const reserveSize = 500 * 1024 * 1024; // 500 MB

    const initialReservations = await db.getActiveReservationsBytes();

    const job = await db.createUploadJob({
      profile_id: profileId,
      object_key: `media/${profileId}/test-job/original.mp4`,
      expected_size_bytes: reserveSize,
      reserved_size_bytes: reserveSize,
      status: 'reserved',
    });

    const activeAfter = await db.getActiveReservationsBytes();
    expect(activeAfter).toBe(initialReservations + reserveSize);

    // After completion, reservation should be released
    await db.updateUploadJobStatus(job.id, 'completed');
    const finalReservations = await db.getActiveReservationsBytes();
    expect(finalReservations).toBe(initialReservations);
  });
});
