import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { asDbTrack, ensureJamendoTrackInDb, mapDbTrack } from '@/services/tracks';
import type { Track } from '@/store/playerStore';

function getStorageKey(userId?: string): string {
  return `@sonicstream_liked_tracks_${userId || 'guest'}`;
}

async function getLocalLikedTracks(userId?: string): Promise<Track[]> {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as Track[];
  } catch {
    return [];
  }
}

async function setLocalLikedTracks(tracks: Track[], userId?: string): Promise<void> {
  try {
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(tracks));
  } catch (e) {
    console.warn('[likes] setLocalLikedTracks error:', e);
  }
}

export async function fetchLikedTracks(userId?: string): Promise<Track[]> {
  const localTracks = await getLocalLikedTracks(userId);

  if (!userId) {
    return localTracks;
  }

  try {
    const { data, error } = await supabase
      .from('liked_tracks')
      .select(`
        liked_at,
        tracks (
          id, title, duration_seconds, source, audio_url, jamendo_id, cover_url,
          artists ( name )
        )
      `)
      .eq('user_id', userId)
      .order('liked_at', { ascending: false });

    if (error) {
      console.warn('[likes] fetchLikedTracks error:', error.message);
      return localTracks;
    }

    const remoteTracks = (data ?? [])
      .map((row) => asDbTrack(row.tracks))
      .filter((t): t is NonNullable<typeof t> => t != null)
      .map(mapDbTrack);

    // Merge remote tracks with any locally saved tracks (avoiding duplicates)
    const map = new Map<string, Track>();
    for (const t of remoteTracks) {
      map.set(t.id, t);
      if (t.jamendoId) map.set(`jamendo-${t.jamendoId}`, t);
    }
    for (const t of localTracks) {
      const key = t.jamendoId ? `jamendo-${t.jamendoId}` : t.id;
      if (!map.has(key)) {
        map.set(key, t);
      }
    }

    const merged = Array.from(map.values());
    await setLocalLikedTracks(merged, userId);
    return merged;
  } catch (e) {
    console.warn('[likes] fetchLikedTracks unexpected error:', e);
    return localTracks;
  }
}

export async function saveLikedTrack(track: Track, userId?: string): Promise<void> {
  // Update local storage first
  const current = await getLocalLikedTracks(userId);
  const exists = current.some(
    (t) => t.id === track.id || (t.jamendoId && track.jamendoId && t.jamendoId === track.jamendoId)
  );
  if (!exists) {
    await setLocalLikedTracks([track, ...current], userId);
  }

  if (!userId) return;

  try {
    let dbTrackId = track.id;
    if (track.source === 'jamendo' && track.jamendoId) {
      const cachedId = await ensureJamendoTrackInDb(track);
      if (cachedId) {
        dbTrackId = cachedId;
      } else {
        return; // local cached is kept
      }
    }

    if (dbTrackId.startsWith('jamendo-')) return;

    await supabase.from('liked_tracks').upsert(
      {
        user_id: userId,
        track_id: dbTrackId,
        liked_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,track_id' }
    );
  } catch (e) {
    console.warn('[likes] saveLikedTrack error:', e);
  }
}

export async function removeLikedTrack(track: Track, userId?: string): Promise<void> {
  // Update local storage first
  const current = await getLocalLikedTracks(userId);
  const filtered = current.filter(
    (t) => t.id !== track.id && !(t.jamendoId && track.jamendoId && t.jamendoId === track.jamendoId)
  );
  await setLocalLikedTracks(filtered, userId);

  if (!userId) return;

  try {
    let dbTrackId = track.id;
    if (track.source === 'jamendo' && track.jamendoId) {
      const { data } = await supabase
        .from('tracks')
        .select('id')
        .eq('jamendo_id', track.jamendoId)
        .maybeSingle();
      if (data?.id) {
        dbTrackId = data.id;
      } else {
        return;
      }
    }

    if (dbTrackId.startsWith('jamendo-')) return;

    await supabase
      .from('liked_tracks')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', dbTrackId);
  } catch (e) {
    console.warn('[likes] removeLikedTrack error:', e);
  }
}
