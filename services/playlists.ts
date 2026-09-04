import { supabase } from '@/lib/supabase';
import { mapDbTrack, asDbTrack } from '@/services/tracks';
import type { Track } from '@/store/playerStore';

export interface PlaylistSummary {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  trackCount: number;
  createdAt: string;
}

export interface LibraryCounts {
  playlists: number;
  liked: number;
}

export async function getUserPlaylists(userId: string): Promise<PlaylistSummary[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      id, title, description, cover_url, created_at,
      playlist_tracks ( track_id )
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[playlists] getUserPlaylists error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    coverUrl: row.cover_url,
    trackCount: Array.isArray(row.playlist_tracks) ? row.playlist_tracks.length : 0,
    createdAt: row.created_at,
  }));
}

export async function getLibraryCounts(userId: string): Promise<LibraryCounts> {
  const [playlistsRes, likedRes] = await Promise.all([
    supabase.from('playlists').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
    supabase.from('liked_tracks').select('track_id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  return {
    playlists: playlistsRes.count ?? 0,
    liked: likedRes.count ?? 0,
  };
}

export interface PlaylistDetail {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  tracks: Track[];
}

export async function getPlaylistWithTracks(playlistId: string): Promise<PlaylistDetail | null> {
  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('id, title, description, cover_url')
    .eq('id', playlistId)
    .single();

  if (playlistError || !playlist) {
    console.warn('[playlists] getPlaylistWithTracks error:', playlistError?.message);
    return null;
  }

  const { data: rows, error: tracksError } = await supabase
    .from('playlist_tracks')
    .select(`
      position,
      tracks (
        id, title, duration_seconds, source, audio_url, jamendo_id, cover_url,
        artists ( name )
      )
    `)
    .eq('playlist_id', playlistId)
    .order('position');

  if (tracksError) {
    console.warn('[playlists] getPlaylistWithTracks tracks error:', tracksError.message);
  }

  const tracks = (rows ?? [])
    .map((row) => asDbTrack(row.tracks))
    .filter((t): t is NonNullable<typeof t> => t != null)
    .map(mapDbTrack);

  return {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    coverUrl: playlist.cover_url,
    tracks,
  };
}
