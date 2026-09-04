import { supabase } from '@/lib/supabase';
import type { Track } from '@/store/playerStore';

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
  return {
    id: row.id,
    title: row.title,
    artistName: artist?.name ?? 'Unknown Artist',
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
