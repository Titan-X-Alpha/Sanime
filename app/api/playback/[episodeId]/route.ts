import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { db } from '@/lib/database/client';
import { r2Storage } from '@/lib/storage/r2';

export async function GET(
  request: Request,
  { params }: { params: { episodeId: string } }
) {
  try {
    const profile = await requireAuth();
    const episode = await db.getEpisodeById(params.episodeId);

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const mediaAsset = episode.media_asset;
    let streamUrl = '/api/storage/mock-media';

    if (mediaAsset?.video_url) {
      streamUrl = mediaAsset.video_url;
    } else if (mediaAsset?.object_key) {
      // Inline streaming without attachment disposition
      streamUrl = await r2Storage.createPresignedDownloadUrl(mediaAsset.object_key);
    }

    // Get watch progress for this profile
    const progress = await db.getWatchProgress(profile.id, params.episodeId);
    // Get user preferences
    const preferences = await db.getPlayerPreferences(profile.id);

    // Get next episode if available
    const episodes = await db.getEpisodesByAnimeId(episode.anime_id);
    const currentIndex = episodes.findIndex((e) => e.id === episode.id);
    const nextEpisode = currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;
    const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;

    // Supported subtitles & audio tracks metadata
    const tracks = [
      {
        id: 'sub-en',
        kind: 'subtitles',
        label: 'English',
        srclang: 'en',
        default: preferences.preferred_subtitle_language === 'English',
        src: '/subtitles/sample-en.vtt',
      },
      {
        id: 'sub-ja',
        kind: 'subtitles',
        label: 'Japanese',
        srclang: 'ja',
        default: preferences.preferred_subtitle_language === 'Japanese',
        src: '/subtitles/sample-ja.vtt',
      },
    ];

    const audioTracks = [
      { id: 'audio-ja', label: 'Japanese (Original)', language: 'ja', default: preferences.preferred_audio_language === 'Japanese' },
      { id: 'audio-en', label: 'English (Dub)', language: 'en', default: preferences.preferred_audio_language === 'English' },
    ];

    return NextResponse.json({
      episode,
      stream_url: streamUrl,
      media_format: mediaAsset?.media_format || 'mp4',
      tracks,
      audio_tracks: audioTracks,
      initial_position_seconds: progress ? progress.position_seconds : 0,
      duration_seconds: episode.duration_seconds || (progress ? progress.duration_seconds : 0),
      preferences,
      next_episode: nextEpisode,
      prev_episode: prevEpisode,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Playback error' }, { status: 500 });
  }
}
