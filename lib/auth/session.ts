import { cookies } from 'next/headers';
import { db } from '@/lib/database/client';
import { Profile } from '@/types';

const SESSION_COOKIE_NAME = 'sanime_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export interface SessionData {
  profileId: string;
  username: string;
  createdAt: number;
}

export function serializeSession(session: SessionData): string {
  const json = JSON.stringify(session);
  return Buffer.from(json).toString('base64url');
}

export function parseSession(token: string): SessionData | null {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    const data = JSON.parse(json);
    if (data?.profileId && data?.username) {
      return data as SessionData;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(profile: Profile): Promise<void> {
  const cookieStore = cookies();
  const sessionData: SessionData = {
    profileId: profile.id,
    username: profile.username,
    createdAt: Date.now(),
  };
  const token = serializeSession(sessionData);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession(): Promise<Profile | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    const sessionData = parseSession(token);
    if (!sessionData) {
      return null;
    }

    const profile = await db.getProfileById(sessionData.profileId);
    return profile;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentSession();
  if (!profile) {
    throw new Error('UNAUTHORIZED');
  }
  return profile;
}
