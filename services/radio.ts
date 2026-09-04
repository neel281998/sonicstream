import { supabase } from '@/lib/supabase';
import { getTracksByTag, mapJamendoTrack } from '@/lib/jamendo';
import { getTracksByGenre } from '@/services/tracks';
import type { Track } from '@/store/playerStore';

export interface RadioStation {
  id: string;
  title: string;
  subtitle: string | null;
  coverUrl: string | null;
  genreTag: string;
}

export async function getRadioStations(): Promise<RadioStation[]> {
  const { data, error } = await supabase
    .from('radio_stations')
    .select('id, title, subtitle, cover_url, genre_tag, sort_order')
    .order('sort_order');

  if (error) {
    console.warn('[radio] getRadioStations error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    coverUrl: row.cover_url,
    genreTag: row.genre_tag,
  }));
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Merge Supabase uploads + Jamendo tracks for a genre radio queue. */
export async function buildRadioQueue(genreTag: string): Promise<Track[]> {
  const [dbTracks, jamendoRaw] = await Promise.all([
    getTracksByGenre(genreTag, 10),
    getTracksByTag(genreTag, 20),
  ]);

  const jamendoTracks = jamendoRaw.map(mapJamendoTrack);
  return shuffle([...dbTracks, ...jamendoTracks]);
}
