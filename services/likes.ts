import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { asDbTrack, ensureJamendoTrackInDb, mapDbTrack } from '@/services/tracks';
import type { Track } from '@/store/playerStore';

function getStorageKey(userId?: string): string {
  return `@sonicstream_liked_tracks_${userId || 'guest'}`;
}

export function getTrackKey(t: Track): string {
  if (t.jamendoId) return `jamendo-${t.jamendoId}`;
  if (t.id.startsWith('jamendo-')) return t.id;
  return t.id;
}

export function dedupeTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  const result: Track[] = [];
  for (const t of tracks) {
    const key = getTrackKey(t);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(t);
    }
  }
  return result;
}

async function getLocalLikedTracks(userId?: string): Promise<Track[]> {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Track[];
    return dedupeTracks(parsed);
  } catch {
    return [];
  }
}

async function setLocalLikedTracks(tracks: Track[], userId?: string): Promise<void> {
  try {
    const deduped = dedupeTracks(tracks);
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(deduped));
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

    // Map local tracks by canonical key to preserve valid metadata (like artistName)
    const localMap = new Map<string, Track>();
    for (const t of localTracks) {
      localMap.set(getTrackKey(t), t);
    }

    // Merge remote tracks with local tracks without duplicate keys
    const mergedMap = new Map<string, Track>();
    for (const remote of remoteTracks) {
      const key = getTrackKey(remote);
      const local = localMap.get(key);

      const bestArtist =
        (!remote.artistName || remote.artistName === 'Unknown Artist') &&
        local?.artistName &&
        local.artistName !== 'Unknown Artist'
          ? local.artistName
          : remote.artistName;

      mergedMap.set(key, {
        ...remote,
        artistName: bestArtist || 'Unknown Artist',
        coverUrl: (remote.coverUrl || local?.coverUrl) ?? null,
      });
    }

    // Append any local tracks that haven't synced to remote yet
    for (const local of localTracks) {
      const key = getTrackKey(local);
      if (!mergedMap.has(key)) {
        mergedMap.set(key, local);
      }
    }

    const merged = Array.from(mergedMap.values());
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
  const targetKey = getTrackKey(track);
  const filtered = current.filter((t) => getTrackKey(t) !== targetKey);
  await setLocalLikedTracks([track, ...filtered], userId);

  if (!userId) return;

  try {
    let dbTrackId = track.id;
    if (track.source === 'jamendo' && track.jamendoId) {
      const cachedId = await ensureJamendoTrackInDb(track);
      if (cachedId) {
        dbTrackId = cachedId;
      } else {
        return;
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
  const targetKey = getTrackKey(track);
  const filtered = current.filter((t) => getTrackKey(t) !== targetKey);
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
