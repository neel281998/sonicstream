import { supabase } from '@/lib/supabase';
import type { Track } from '@/store/playerStore';
import { searchTracks as searchJamendoTracks, mapJamendoTrack } from '@/lib/jamendo';

type DbTrackRow = {
  id: string;
  title: string;
  duration_seconds: number | null;
  source: 'upload' | 'jamendo';
  audio_url: string | null;
  jamendo_id: string | null;
  cover_url: string | null;
  artists?: { name: string } | { name: string }[] | null;
};

export type { DbTrackRow };

export function asDbTrack(value: unknown): DbTrackRow | null {
  if (!value || Array.isArray(value)) return null;
  return value as DbTrackRow;
}

export function mapDbTrack(row: DbTrackRow): Track {
  const artist = Array.isArray(row.artists) ? row.artists[0] : row.artists;
  let artistName = artist?.name;
  let trackTitle = row.title;

  // Fallback: if artist name is missing and title has "Artist - Song", extract both
  if (!artistName && row.title && row.title.includes(' - ')) {
    const parts = row.title.split(' - ');
    if (parts.length >= 2 && parts[0].trim().length > 0) {
      artistName = parts[0].trim();
      trackTitle = parts.slice(1).join(' - ').trim() || row.title;
    }
  }

  return {
    id: row.id,
    title: trackTitle,
    artistName: artistName ?? 'Unknown Artist',
    duration: row.duration_seconds ?? 0,
    audioUrl: row.audio_url ?? '',
    coverUrl: row.cover_url,
    source: row.source,
    jamendoId: row.jamendo_id ?? undefined,
  };
}

export async function getTracksByGenre(genreTag: string, limit = 10): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      id, title, duration_seconds, source, audio_url, jamendo_id, cover_url,
      artists ( name )
    `)
    .contains('genre', [genreTag])
    .limit(limit);

  if (error) {
    console.warn('[tracks] getTracksByGenre error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => mapDbTrack(row as DbTrackRow));
}

/** Cache a Jamendo track in Supabase so listen_history can reference it. */
export async function ensureJamendoTrackInDb(track: Track): Promise<string | null> {
  if (!track.jamendoId || track.source !== 'jamendo') {
    return track.id.startsWith('jamendo-') ? null : track.id;
  }

  // 1. Resolve or create artist in Supabase
  let artistId: string | null = null;
  if (track.artistName && track.artistName !== 'Unknown Artist') {
    try {
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('id')
        .eq('name', track.artistName)
        .maybeSingle();

      if (existingArtist?.id) {
        artistId = existingArtist.id;
      } else {
        const { data: newArtist } = await supabase
          .from('artists')
          .insert({ name: track.artistName })
          .select('id')
          .maybeSingle();
        if (newArtist?.id) {
          artistId = newArtist.id;
        }
      }
    } catch {
      // Ignore if artist insert is restricted by RLS
    }
  }

  // 2. Check if track already exists
  const { data: existing } = await supabase
    .from('tracks')
    .select('id, artist_id')
    .eq('jamendo_id', track.jamendoId)
    .maybeSingle();

  if (existing) {
    if (artistId && !existing.artist_id) {
      try {
        await supabase
          .from('tracks')
          .update({ artist_id: artistId })
          .eq('id', existing.id);
      } catch {
        // Ignore if update fails
      }
    }
    return existing.id;
  }

  // 3. Insert track with artist_id linked
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      title: track.title,
      duration_seconds: track.duration,
      source: 'jamendo',
      audio_url: track.audioUrl,
      jamendo_id: track.jamendoId,
      cover_url: track.coverUrl,
      ...(artistId ? { artist_id: artistId } : {}),
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[tracks] ensureJamendoTrackInDb error:', error.message);
    return null;
  }

  return data.id;
}

export interface SearchArtistItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  verified: boolean;
}

export interface UnifiedSearchResult {
  tracks: Track[];
  artists: SearchArtistItem[];
}

/**
 * Searches across:
 * 1. Supabase tracks table (matches title ILIKE)
 * 2. Supabase artists table (matches name ILIKE, and fetches their tracks)
 * 3. Jamendo catalog search
 * Prioritizes uploaded community songs and artists at the top of the results!
 */
export async function searchUnifiedMusic(query: string): Promise<UnifiedSearchResult> {
  const clean = query.trim();
  if (!clean) {
    return { tracks: [], artists: [] };
  }

  try {
    const [dbTracksRes, dbArtistsRes, jamendoRes] = await Promise.allSettled([
      // 1. Supabase tracks matching title
      supabase
        .from('tracks')
        .select(`
          id, title, duration_seconds, source, audio_url, jamendo_id, cover_url,
          artists ( id, name )
        `)
        .ilike('title', `%${clean}%`)
        .order('created_at', { ascending: false })
        .limit(25),

      // 2. Supabase artists matching name
      supabase
        .from('artists')
        .select('id, name, avatar_url, verified')
        .ilike('name', `%${clean}%`)
        .limit(10),

      // 3. Jamendo online tracks
      searchJamendoTracks(clean, 15)
        .then((j) => j.map(mapJamendoTrack))
        .catch(() => [] as Track[]),
    ]);

    const dbTracks =
      dbTracksRes.status === 'fulfilled' && dbTracksRes.value.data
        ? (dbTracksRes.value.data as DbTrackRow[])
        : [];
    const dbArtists =
      dbArtistsRes.status === 'fulfilled' && dbArtistsRes.value.data
        ? dbArtistsRes.value.data
        : [];
    const jamendoTracks =
      jamendoRes.status === 'fulfilled' ? jamendoRes.value : [];

    // If matching artists were found, fetch their tracks as well
    let tracksByArtists: DbTrackRow[] = [];
    if (dbArtists.length > 0) {
      const artistIds = dbArtists.map((a: any) => a.id);
      const { data: byArtists } = await supabase
        .from('tracks')
        .select(`
          id, title, duration_seconds, source, audio_url, jamendo_id, cover_url,
          artists ( id, name )
        `)
        .in('artist_id', artistIds)
        .order('created_at', { ascending: false })
        .limit(25);

      if (byArtists) {
        tracksByArtists = byArtists as DbTrackRow[];
      }
    }

    // Combine tracks: uploads first, then database catalog, then Jamendo
    const trackMap = new Map<string, Track>();

    // Pass 1: Uploaded community tracks
    for (const row of [...dbTracks, ...tracksByArtists]) {
      const mapped = mapDbTrack(row);
      if (mapped.source === 'upload') {
        trackMap.set(mapped.id, mapped);
      }
    }

    // Pass 2: Other Supabase tracks
    for (const row of [...dbTracks, ...tracksByArtists]) {
      const mapped = mapDbTrack(row);
      if (!trackMap.has(mapped.id)) {
        trackMap.set(mapped.id, mapped);
      }
    }

    // Pass 3: Jamendo online search results
    for (const jTrack of jamendoTracks) {
      const duplicate = Array.from(trackMap.values()).some(
        (t) =>
          (t.jamendoId && t.jamendoId === jTrack.jamendoId) ||
          t.title.toLowerCase().trim() === jTrack.title.toLowerCase().trim()
      );
      if (!duplicate) {
        trackMap.set(jTrack.id, jTrack);
      }
    }

    const artists: SearchArtistItem[] = dbArtists.map((a: any) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatar_url ?? null,
      verified: Boolean(a.verified),
    }));

    return {
      tracks: Array.from(trackMap.values()),
      artists,
    };
  } catch (err) {
    console.warn('[searchUnifiedMusic] error:', err);
    return { tracks: [], artists: [] };
  }
}

/**
 * Fetch recently uploaded community tracks
 */
export async function getRecentCommunityTracks(limit = 10): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      id, title, duration_seconds, source, audio_url, jamendo_id, cover_url,
      artists ( name )
    `)
    .eq('source', 'upload')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[tracks] getRecentCommunityTracks error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => mapDbTrack(row as DbTrackRow));
}

