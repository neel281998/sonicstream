import { supabase } from '@/lib/supabase';
import { getPopularTracks, mapJamendoTrack } from '@/lib/jamendo';
import { ensureJamendoTrackInDb, mapDbTrack, asDbTrack } from '@/services/tracks';
import type { Track } from '@/store/playerStore';

export async function getListenAgainTracks(userId: string, limit = 8): Promise<Track[]> {
  const { data, error } = await supabase
    .from('listen_history')
    .select(`
      listened_at,
      tracks (
        id, title, duration_seconds, source, audio_url, jamendo_id, cover_url,
        artists ( name )
      )
    `)
    .eq('user_id', userId)
    .order('listened_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[listenHistory] getListenAgainTracks error:', error.message);
    return getListenAgainFallback(limit);
  }

  const tracks = (data ?? [])
    .map((row) => asDbTrack(row.tracks))
    .filter((t): t is NonNullable<typeof t> => t != null)
    .map(mapDbTrack);

  if (tracks.length === 0) {
    return getListenAgainFallback(Math.min(limit, 4));
  }

  return tracks;
}

async function getListenAgainFallback(limit: number): Promise<Track[]> {
  try {
    const popular = await getPopularTracks(limit);
    return popular.map(mapJamendoTrack);
  } catch {
    return [];
  }
}

export async function recordListen(userId: string, track: Track): Promise<void> {
  let trackId = track.id;

  if (track.source === 'jamendo' && track.jamendoId) {
    const cachedId = await ensureJamendoTrackInDb(track);
    if (!cachedId) return;
    trackId = cachedId;
  }

  if (trackId.startsWith('jamendo-')) return;

  const { error } = await supabase.from('listen_history').upsert(
    {
      user_id: userId,
      track_id: trackId,
      listened_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,track_id' }
  );

  if (error) {
    console.warn('[listenHistory] recordListen error:', error.message);
  }
}
