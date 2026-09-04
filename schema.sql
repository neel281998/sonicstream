-- ══════════════════════════════════════════════════════════════════
-- SonicStream — Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────
-- 1. PROFILES  (extends auth.users — auto-created on signup)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  avatar_url  TEXT,
  is_artist   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- 2. ARTISTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.artists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- 3. ALBUMS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.albums (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  artist_id    UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  cover_url    TEXT,
  released_at  DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- 4. TRACKS  (supports both uploaded and Jamendo tracks)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tracks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  artist_id        UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  album_id         UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  duration_seconds INTEGER,
  source           TEXT NOT NULL CHECK (source IN ('upload', 'jamendo')),
  audio_url        TEXT,
  jamendo_id       TEXT UNIQUE,
  cover_url        TEXT,
  genre            TEXT[] DEFAULT '{}',
  play_count       INTEGER NOT NULL DEFAULT 0,
  released_at      DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT track_source_check CHECK (
    (source = 'upload' AND audio_url IS NOT NULL) OR
    (source = 'jamendo' AND jamendo_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_tracks_genre ON public.tracks USING GIN (genre);
CREATE INDEX IF NOT EXISTS idx_tracks_source ON public.tracks (source);

-- Helper: increment play count atomically
CREATE OR REPLACE FUNCTION public.increment_play_count(track_id UUID)
RETURNS VOID AS $$
  UPDATE public.tracks SET play_count = play_count + 1 WHERE id = track_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- 5. PLAYLISTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.playlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  cover_url   TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- 6. PLAYLIST_TRACKS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id    UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position
  ON public.playlist_tracks (playlist_id, position);

-- ─────────────────────────────────────────────────────────────────
-- 7. LISTEN_HISTORY  (powers "Listen Again")
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.listen_history (
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id    UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  listened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_listen_history_user_time
  ON public.listen_history (user_id, listened_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- 8. LIKED_TRACKS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.liked_tracks (
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id  UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  liked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, track_id)
);

-- ─────────────────────────────────────────────────────────────────
-- 9. RADIO_STATIONS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.radio_stations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT NOT NULL,
  subtitle   TEXT,
  cover_url  TEXT,
  genre_tag  TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────
-- SEED — Radio Stations
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.radio_stations (title, subtitle, genre_tag, sort_order) VALUES
  ('Chill Lofi Beats',  'Relax and study',     'lofi',        1),
  ('Top Hits 2024',     'The biggest songs',   'pop',         2),
  ('Rock Classics',     'Legendary riffs',     'rock',        3),
  ('Deep House',        'Smooth vibrations',   'house',       4),
  ('Jazz and Soul',     'Timeless grooves',    'jazz',        5),
  ('Hip-Hop Vibes',     'Fresh beats daily',   'hiphop',      6),
  ('Electronic Pulse',  'Synths and beats',    'electronic',  7),
  ('Acoustic Sessions', 'Stripped back music', 'acoustic',    8)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listen_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_tracks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_stations   ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles: public read"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: own insert"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: own update"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ARTISTS
CREATE POLICY "Artists: public read"
  ON public.artists FOR SELECT USING (true);
CREATE POLICY "Artists: artist can create"
  ON public.artists FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_artist = TRUE)
  );
CREATE POLICY "Artists: own update"
  ON public.artists FOR UPDATE USING (profile_id = auth.uid());

-- ALBUMS
CREATE POLICY "Albums: public read"
  ON public.albums FOR SELECT USING (true);
CREATE POLICY "Albums: artist can create"
  ON public.albums FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND profile_id = auth.uid())
  );

-- TRACKS
CREATE POLICY "Tracks: authenticated read"
  ON public.tracks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Tracks: artist can upload"
  ON public.tracks FOR INSERT WITH CHECK (
    source = 'upload' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_artist = TRUE)
  );
CREATE POLICY "Tracks: artist can update own"
  ON public.tracks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.artists WHERE id = tracks.artist_id AND profile_id = auth.uid())
  );

-- PLAYLISTS
CREATE POLICY "Playlists: public or own read"
  ON public.playlists FOR SELECT USING (is_public = TRUE OR owner_id = auth.uid());
CREATE POLICY "Playlists: owner insert"
  ON public.playlists FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Playlists: owner update"
  ON public.playlists FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Playlists: owner delete"
  ON public.playlists FOR DELETE USING (owner_id = auth.uid());

-- PLAYLIST_TRACKS
CREATE POLICY "PlaylistTracks: readable if playlist readable"
  ON public.playlist_tracks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.playlists
      WHERE id = playlist_id AND (is_public = TRUE OR owner_id = auth.uid()))
  );
CREATE POLICY "PlaylistTracks: owner insert"
  ON public.playlist_tracks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND owner_id = auth.uid())
  );
CREATE POLICY "PlaylistTracks: owner delete"
  ON public.playlist_tracks FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND owner_id = auth.uid())
  );

-- LISTEN_HISTORY
CREATE POLICY "ListenHistory: own only"
  ON public.listen_history FOR ALL USING (user_id = auth.uid());

-- LIKED_TRACKS
CREATE POLICY "LikedTracks: own only"
  ON public.liked_tracks FOR ALL USING (user_id = auth.uid());

-- RADIO_STATIONS
CREATE POLICY "RadioStations: public read"
  ON public.radio_stations FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ══════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks', 'tracks', FALSE, 52428800,
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/wav']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers', 'covers', TRUE, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', TRUE, 2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Tracks storage: artist upload"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'tracks' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_artist = TRUE)
  );

CREATE POLICY "Tracks storage: authenticated download"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'tracks' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Covers storage: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Covers storage: authenticated upload"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'covers' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Avatars storage: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatars storage: own upload"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ══════════════════════════════════════════════════════════════════
-- DONE
-- ══════════════════════════════════════════════════════════════════
