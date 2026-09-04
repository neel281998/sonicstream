import { supabase } from '@/lib/supabase';
import { Track } from '@/store/playerStore';
import { mapDbTrack, DbTrackRow } from '@/services/tracks';

export interface ArtistProfile {
  id: string;
  profileId: string | null;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  verified: boolean;
  createdAt: string;
  followersCount?: number;
  trackCount?: number;
}

export interface UploadTrackParams {
  userId: string;
  title: string;
  audioUri: string;
  audioName: string;
  audioMimeType?: string;
  coverUri?: string | null;
  durationSeconds?: number;
  genre?: string[];
  onProgress?: (step: string) => void;
}

/**
 * Fetch artist profile by artist UUID
 */
export async function getArtistById(artistId: string): Promise<ArtistProfile | null> {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', artistId)
    .maybeSingle();

  if (error || !data) {
    console.warn('[artist] getArtistById error:', error?.message);
    return null;
  }

  return {
    id: data.id,
    profileId: data.profile_id,
    name: data.name,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    verified: data.verified,
    createdAt: data.created_at,
  };
}

/**
 * Get or automatically create an artist record linked to the user's profile
 */
export async function ensureArtistForUser(
  userId: string,
  artistName?: string
): Promise<ArtistProfile | null> {
  // 1. Check for existing artist record
  const { data: existing, error: fetchErr } = await supabase
    .from('artists')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      profileId: existing.profile_id,
      name: existing.name,
      bio: existing.bio,
      avatarUrl: existing.avatar_url,
      verified: existing.verified,
      createdAt: existing.created_at,
    };
  }

  // 2. Fetch profile username as fallback name
  let nameToUse = artistName?.trim();
  if (!nameToUse) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();
    nameToUse = profile?.username || 'Artist';
  }

  // 3. Ensure profile has is_artist = true
  await supabase
    .from('profiles')
    .update({ is_artist: true })
    .eq('id', userId);

  // 4. Create new artist record
  const { data: created, error: insertErr } = await supabase
    .from('artists')
    .insert({
      profile_id: userId,
      name: nameToUse,
    })
    .select('*')
    .single();

  if (insertErr || !created) {
    console.error('[artist] ensureArtistForUser error:', insertErr?.message);
    return null;
  }

  return {
    id: created.id,
    profileId: created.profile_id,
    name: created.name,
    bio: created.bio,
    avatarUrl: created.avatar_url,
    verified: created.verified,
    createdAt: created.created_at,
  };
}

/**
 * Convert local file URI into a Blob for Supabase upload
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

/**
 * Upload an audio file to Supabase Storage 'tracks' bucket
 */
export async function uploadAudioToStorage(
  userId: string,
  uri: string,
  fileName: string,
  mimeType = 'audio/mpeg'
): Promise<string> {
  const ext = fileName.split('.').pop() || 'mp3';
  const cleanBaseName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const storagePath = `${userId}/${Date.now()}_${cleanBaseName}.${ext}`;

  const blob = await uriToBlob(uri);

  const { error: uploadErr } = await supabase.storage
    .from('tracks')
    .upload(storagePath, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadErr) {
    console.error('[artist] uploadAudioToStorage error:', uploadErr.message);
    throw new Error(`Failed to upload audio: ${uploadErr.message}`);
  }

  // Try creating a signed URL (good for 1 year) or fallback to public URL
  const { data: signedData } = await supabase.storage
    .from('tracks')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const { data: publicData } = supabase.storage
    .from('tracks')
    .getPublicUrl(storagePath);

  return publicData.publicUrl;
}

/**
 * Upload cover artwork to Supabase Storage 'covers' bucket
 */
export async function uploadCoverToStorage(
  userId: string,
  uri: string,
  mimeType = 'image/jpeg'
): Promise<string> {
  const storagePath = `${userId}/${Date.now()}_cover.jpg`;
  const blob = await uriToBlob(uri);

  const { error: uploadErr } = await supabase.storage
    .from('covers')
    .upload(storagePath, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadErr) {
    console.error('[artist] uploadCoverToStorage error:', uploadErr.message);
    throw new Error(`Failed to upload cover art: ${uploadErr.message}`);
  }

  const { data } = supabase.storage
    .from('covers')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Complete workflow to upload an audio track and register it in the tracks table
 */
export async function uploadAndPublishTrack(
  params: UploadTrackParams
): Promise<Track> {
  const {
    userId,
    title,
    audioUri,
    audioName,
    audioMimeType = 'audio/mpeg',
    coverUri,
    durationSeconds = 180,
    genre = ['pop'],
    onProgress,
  } = params;

  onProgress?.('Verifying artist profile...');
  const artist = await ensureArtistForUser(userId);
  if (!artist) {
    throw new Error('Unable to set up artist profile.');
  }

  // Upload Cover if provided
  let coverUrl: string | null = null;
  if (coverUri) {
    onProgress?.('Uploading artwork...');
    try {
      coverUrl = await uploadCoverToStorage(userId, coverUri);
    } catch (e: any) {
      console.warn('[artist] Cover upload warning (proceeding without cover):', e?.message);
    }
  }

  // Upload Audio file
  onProgress?.('Uploading audio file...');
  const audioUrl = await uploadAudioToStorage(userId, audioUri, audioName, audioMimeType);

  // Insert into tracks table
  onProgress?.('Publishing track...');
  const { data: inserted, error: insertErr } = await supabase
    .from('tracks')
    .insert({
      title: title.trim(),
      artist_id: artist.id,
      duration_seconds: durationSeconds,
      source: 'upload',
      audio_url: audioUrl,
      cover_url: coverUrl,
      genre: genre.map((g) => g.toLowerCase().trim()),
    })
    .select(`
      id, title, duration_seconds, source, audio_url, jamendo_id, cover_url,
      artists ( name )
    `)
    .single();

  if (insertErr || !inserted) {
    console.error('[artist] track insert error:', insertErr?.message);
    throw new Error(`Failed to register track: ${insertErr?.message}`);
  }

  return mapDbTrack(inserted as DbTrackRow);
}

/**
 * Fetch tracks uploaded by a specific artist
 */
export async function getArtistTracks(artistId: string): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      id, title, duration_seconds, source, audio_url, jamendo_id, cover_url,
      artists ( name )
    `)
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[artist] getArtistTracks error:', error.message);
    return [];
  }

  return (data ?? []).map((row) => mapDbTrack(row as DbTrackRow));
}

/**
 * Delete an artist's track
 */
export async function deleteArtistTrack(trackId: string): Promise<boolean> {
  const { error } = await supabase
    .from('tracks')
    .delete()
    .eq('id', trackId);

  if (error) {
    console.error('[artist] deleteArtistTrack error:', error.message);
    return false;
  }
  return true;
}

/**
 * Enable artist mode for a user profile
 */
export async function activateArtistMode(
  userId: string,
  artistName: string
): Promise<ArtistProfile | null> {
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ is_artist: true })
    .eq('id', userId);

  if (profileErr) {
    throw new Error(profileErr.message);
  }

  return ensureArtistForUser(userId, artistName);
}
