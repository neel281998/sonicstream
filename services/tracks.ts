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

  const { data: existing } = await supabase
    .from('tracks')
    .select('id')
    .eq('jamendo_id', track.jamendoId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('tracks')
    .insert({
      title: track.title,
      duration_seconds: track.duration,
      source: 'jamendo',
      audio_url: track.audioUrl,
      jamendo_id: track.jamendoId,
      cover_url: track.coverUrl,
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[tracks] ensureJamendoTrackInDb error:', error.message);
    return null;
  }

  return data.id;
}
