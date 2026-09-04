import { supabase } from '@/lib/supabase';
import { mapDbTrack, asDbTrack, ensureJamendoTrackInDb } from '@/services/tracks';
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
  ownerId?: string;
  tracks: Track[];
}

export async function getPlaylistWithTracks(playlistId: string): Promise<PlaylistDetail | null> {
  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('id, title, description, cover_url, owner_id')
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
    ownerId: playlist.owner_id,
    tracks,
  };
}

export async function createPlaylist(
  userId: string,
  title: string,
  description?: string,
  isPublic = false
): Promise<PlaylistSummary | null> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return null;

  const { data, error } = await supabase
    .from('playlists')
    .insert({
      owner_id: userId,
      title: trimmedTitle,
      description: description?.trim() || null,
      is_public: isPublic,
    })
    .select('id, title, description, cover_url, created_at')
    .single();

  if (error || !data) {
    console.error('[playlists] createPlaylist error:', error?.message);
    throw new Error(error?.message || 'Failed to create playlist');
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    coverUrl: data.cover_url,
    trackCount: 0,
    createdAt: data.created_at,
  };
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId);

  if (error) {
    console.error('[playlists] deletePlaylist error:', error.message);
    return false;
  }
  return true;
}

export async function addTrackToPlaylist(
  playlistId: string,
  track: Track
): Promise<{ success: boolean; message?: string }> {
  try {
    // 1. Resolve or ensure track in DB
    let trackId: string | null = null;
    if (track.source === 'jamendo' || track.jamendoId) {
      trackId = await ensureJamendoTrackInDb(track);
    } else {
      trackId = track.id;
    }

    if (!trackId) {
      return { success: false, message: 'Could not resolve track in database.' };
    }

    // 2. Check if track is already in playlist
    const { data: existing } = await supabase
      .from('playlist_tracks')
      .select('track_id')
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId)
      .maybeSingle();

    if (existing) {
      return { success: false, message: 'Track is already in this playlist.' };
    }

    // 3. Find next position
    const { data: posRows } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = (posRows?.[0]?.position ?? -1) + 1;

    // 4. Insert
    const { error: insertError } = await supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: playlistId,
        track_id: trackId,
        position: nextPosition,
      });

    if (insertError) {
      console.error('[playlists] addTrackToPlaylist error:', insertError.message);
      return { success: false, message: insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[playlists] addTrackToPlaylist exception:', err);
    return { success: false, message: err?.message || 'Failed to add track.' };
  }
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);

  if (error) {
    console.error('[playlists] removeTrackFromPlaylist error:', error.message);
    return false;
  }
  return true;
}

