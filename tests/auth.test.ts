import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/database/client';
import { normalizeUsername, serializeSession, parseSession } from '@/lib/auth/session';
import { usernameSchema } from '@/lib/validation/schemas';

describe('Authentication & Profile Logic', () => {
  it('normalizes usernames consistently', () => {
    expect(normalizeUsername('  Kirito_99 ')).toBe('kirito_99');
    expect(normalizeUsername('USER')).toBe('user');
  });

  it('validates username formatting rules via Zod', () => {
    // Valid cases
    expect(usernameSchema.safeParse('valid_user1').success).toBe(true);
    expect(usernameSchema.safeParse('abc').success).toBe(true);
    expect(usernameSchema.safeParse('twenty_characters_xx').success).toBe(true);

    // Invalid: too short
    expect(usernameSchema.safeParse('ab').success).toBe(false);
    // Invalid: too long
    expect(usernameSchema.safeParse('more_than_twenty_characters_long').success).toBe(false);
    // Invalid: special characters
    expect(usernameSchema.safeParse('user@email.com').success).toBe(false);
    expect(usernameSchema.safeParse('user-hyphen').success).toBe(false);
    expect(usernameSchema.safeParse('user space').success).toBe(false);
  });

  it('creates profile and prevents duplicate registrations', async () => {
    const testUsername = `test_${Date.now()}`;
    const profile = await db.createProfile(testUsername);
    expect(profile).toBeDefined();
    expect(profile.username).toBe(testUsername);
    expect(profile.normalized_username).toBe(testUsername.toLowerCase());

    // Duplicate check
    await expect(db.createProfile(testUsername)).rejects.toThrow('Username is already taken');
    await expect(db.createProfile(testUsername.toUpperCase())).rejects.toThrow('Username is already taken');
  });

  it('serializes and parses session tokens securely', () => {
    const mockSession = {
      profileId: '123e4567-e89b-12d3-a456-426614174000',
      username: 'ShadowMonarch',
      createdAt: Date.now(),
    };

    const token = serializeSession(mockSession);
    expect(typeof token).toBe('string');

    const parsed = parseSession(token);
    expect(parsed?.profileId).toBe(mockSession.profileId);
    expect(parsed?.username).toBe(mockSession.username);
  });
});
