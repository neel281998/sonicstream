// Jamendo API Client
// Get a free API key at: https://developer.jamendo.com/v3.0
// Set EXPO_PUBLIC_JAMENDO_CLIENT_ID in your .env file

const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0';
const CLIENT_ID = process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID ?? 'your-client-id';

export interface JamendoTrack {
  id: string;
  name: string;           // track title
  artist_name: string;
  album_name: string;
  duration: number;       // seconds
  audio: string;          // stream URL
  image: string;          // cover art URL
  shareurl: string;
  tags: string;
}

export interface JamendoArtist {
  id: string;
  name: string;
  image: string;
  shareurl: string;
}

export interface JamendoAlbum {
  id: string;
  name: string;
  artist_name: string;
  image: string;
  releasedate: string;
}

async function jamendoGet<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T[]> {
  const query = new URLSearchParams({
    client_id: CLIENT_ID,
    format: 'json',
    limit: '20',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(`${JAMENDO_BASE_URL}/${endpoint}?${query}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Jamendo API error: ${res.status}`);
    const json = await res.json();
    return (json.results ?? []) as T[];
  } finally {
    clearTimeout(timeoutId);
  }
}

// Search tracks by text query
export async function searchTracks(query: string, limit = 20): Promise<JamendoTrack[]> {
  return jamendoGet<JamendoTrack>('tracks', {
    namesearch: query,
    limit,
    audioformat: 'mp32',
    include: 'musicinfo',
  });
}

// Fetch tracks by genre tag (for Radio stations)
export async function getTracksByTag(tag: string, limit = 20): Promise<JamendoTrack[]> {
  return jamendoGet<JamendoTrack>('tracks', {
    tags: tag,
    order: 'popularity_total',
    limit,
    audioformat: 'mp32',
  });
}

// Get popular tracks (for Quick Picks / Fallback)
export async function getPopularTracks(limit = 20): Promise<JamendoTrack[]> {
  return jamendoGet<JamendoTrack>('tracks', {
    order: 'popularity_week',
    limit,
    audioformat: 'mp32',
  });
}

// Get latest new releases
export async function getNewReleases(limit = 20): Promise<JamendoTrack[]> {
  try {
    const tracks = await jamendoGet<JamendoTrack>('tracks', {
      order: 'releasedate_desc',
      limit,
      audioformat: 'mp32',
    });
    if (tracks && tracks.length > 0) return tracks;
  } catch (e) {
    console.warn('[jamendo] getNewReleases fallback to popular:', e);
  }
  return getPopularTracks(limit);
}

// Search artists
export async function searchArtists(query: string, limit = 20): Promise<JamendoArtist[]> {
  return jamendoGet<JamendoArtist>('artists', {
    namesearch: query,
    limit,
  });
}

// Map a JamendoTrack to our internal Track model
export function mapJamendoTrack(t: JamendoTrack) {
  return {
    id: `jamendo-${t.id}`,
    title: t.name,
    artistName: t.artist_name,
    albumName: t.album_name,
    duration: t.duration,
    audioUrl: t.audio,
    coverUrl: t.image,
    source: 'jamendo' as const,
    jamendoId: t.id,
  };
}
