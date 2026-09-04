# SonicStream — Expo Music App Implementation Plan

## Overview

Build **SonicStream**, a YouTube Music-style mobile app using **Expo (React Native)** with **Supabase** as the backend. The design system is based on an earth-tone palette (sage green primary, dusty rose secondary, warm cream background) using **DM Sans** and **Nunito** fonts, supporting both light and dark themes.

Music is sourced from two places: **artist-uploaded tracks** stored in Supabase Storage, and the **Jamendo API** (free licensed music catalog). Radio stations are genre-tagged queues that blend both sources.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 51+ (Expo Router v3) |
| Language | TypeScript |
| Navigation | Expo Router (file-based, tab + stack) |
| UI Components | Custom + `@expo/vector-icons` (MaterialIcons) |
| Audio Playback | `expo-av` |
| Backend | Supabase (Auth, Database, Storage) |
| External Music | Jamendo API (free music catalog) |
| State Management | Zustand |
| Fonts | `expo-google-fonts` (DM Sans, Nunito, JetBrains Mono) |
| Animations | `react-native-reanimated` + `react-native-gesture-handler` |
| Image | `expo-image` (fast caching) |
| Forms | `react-hook-form` |

---

## Confirmed Decisions

| Topic | Decision |
|-------|----------|
| **Auth** | Email/Password + Google OAuth (no Apple) |
| **Music source** | Hybrid — artist uploads to Supabase Storage + Jamendo API |
| **Radio feature** | Genre-tagged queues blending Supabase uploads + Jamendo tracks (see below) |

---

## Radio Feature Design

Each "Radio" card (e.g. "Chill Lofi Beats", "Rock Classics") is a **genre-tagged infinite queue** that:
1. Fetches matching tracks from our Supabase DB (artist uploads tagged with that genre)
2. Fetches matching tracks from Jamendo API (`/tracks?tags=lofi&order=popularity_total`)
3. Merges and shuffles both lists into an auto-advancing queue

This mimics YouTube Music's "radio" experience without any AI complexity.

```
Radio Station "Chill Lofi Beats"
  └── genre_tag: "lofi"
       ├── Supabase tracks WHERE genre @> ['lofi']
       └── Jamendo GET /tracks?tags=lofi&limit=20
           → merged → shuffled → queued
```

Radio station metadata (title, subtitle, cover, genre_tag) is stored in a `radio_stations` table in Supabase.

---

## Screens (11 Pages from Design)

Based on the design file, the app has these screens:

| # | Screen | Description |
|---|--------|-------------|
| 1 | **Home Feed** | Personalized feed — "Listen Again", "New Releases", "Recommended Radios" |
| 2 | **Explore** | Discovery page — mood categories, top charts, search bar |
| 3 | **Search Results** | Full search results with filters |
| 4 | **Library** | User's saved music, playlists, albums |
| 5 | **Now Playing** | Full-screen player with artwork, controls, progress |
| 6 | **Playlist Detail** | Playlist view with track list |
| 7 | **Artist Profile** | Artist page with albums and popular tracks |
| 8 | **Album Detail** | Album view |
| 9 | **Profile / Settings** | User profile, preferences, theme toggle |
| 10 | **Sign In / Sign Up** | Auth screens |
| 11 | **Onboarding** | Genre preference selection |

---

## Proposed Project Structure

```
d:\Music app\
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab navigator
│   │   ├── index.tsx             # Home Feed
│   │   ├── explore.tsx           # Explore
│   │   ├── library.tsx           # Library
│   │   └── profile.tsx           # Profile
│   ├── player/
│   │   └── [id].tsx              # Now Playing (full screen)
│   ├── playlist/
│   │   └── [id].tsx              # Playlist Detail
│   ├── album/
│   │   └── [id].tsx              # Album Detail
│   ├── artist/
│   │   └── [id].tsx              # Artist Profile
│   ├── onboarding.tsx
│   └── _layout.tsx               # Root layout (theme, auth guard)
├── components/
│   ├── ui/                       # Design system atoms
│   │   ├── ThemedText.tsx
│   │   ├── ThemedView.tsx
│   │   ├── Button.tsx
│   │   ├── Chip.tsx
│   │   ├── Avatar.tsx
│   │   └── Card.tsx
│   ├── music/                    # Domain components
│   │   ├── TrackItem.tsx         # Horizontal scroll track card
│   │   ├── RadioCard.tsx         # Radio station card
│   │   ├── MiniPlayer.tsx        # Persistent mini player
│   │   ├── FullPlayer.tsx        # Now Playing screen
│   │   ├── PlaylistCard.tsx
│   │   └── ArtistCard.tsx
│   └── layout/
│       ├── SearchBar.tsx
│       └── SectionHeader.tsx
├── lib/
│   ├── supabase.ts               # Supabase client init
│   ├── theme.ts                  # Color tokens, typography, spacing
│   └── fonts.ts                  # Font config
├── hooks/
│   ├── useAuth.ts                # Auth state
│   ├── usePlayer.ts              # Audio playback
│   └── useTheme.ts               # Dark/light mode
├── store/
│   ├── playerStore.ts            # Zustand: current track, queue, playback state
│   └── authStore.ts              # Zustand: user session
├── services/
│   ├── tracks.ts                 # Supabase queries for tracks
│   ├── playlists.ts
│   ├── artists.ts
│   └── auth.ts
├── constants/
│   └── Colors.ts                 # Full light/dark token map from design
└── assets/
    └── fonts/
```

---

## Supabase Schema

### Tables

```sql
-- Users (extends auth.users)
profiles (
  id uuid references auth.users PRIMARY KEY,
  username text,
  avatar_url text,
  is_artist bool DEFAULT false,   -- artists can upload tracks
  created_at timestamptz
)

-- Tracks (covers both uploaded and Jamendo)
tracks (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  artist_id uuid references artists,
  album_id uuid references albums,
  duration_seconds int,
  source text NOT NULL CHECK (source IN ('upload', 'jamendo')),
  audio_url text,         -- Supabase Storage URL (for 'upload') OR Jamendo stream URL
  jamendo_id text,        -- Jamendo track ID (for 'jamendo' source)
  cover_url text,
  genre text[],
  play_count int DEFAULT 0,
  released_at date,
  created_at timestamptz
)

-- Radio Stations
radio_stations (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  cover_url text,
  genre_tag text NOT NULL    -- used to query both Supabase & Jamendo
)

-- Artists
artists (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  bio text,
  avatar_url text,
  verified bool DEFAULT false
)

-- Albums
albums (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  artist_id uuid references artists,
  cover_url text,
  released_at date
)

-- Playlists
playlists (
  id uuid PRIMARY KEY,
  owner_id uuid references profiles,
  title text,
  description text,
  cover_url text,
  is_public bool DEFAULT false,
  created_at timestamptz
)

-- Playlist Tracks (junction)
playlist_tracks (
  playlist_id uuid references playlists,
  track_id uuid references tracks,
  position int,
  PRIMARY KEY (playlist_id, track_id)
)

-- Listen History (for "Listen Again")
listen_history (
  user_id uuid references profiles,
  track_id uuid references tracks,
  listened_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
)

-- Liked Tracks
liked_tracks (
  user_id uuid references profiles,
  track_id uuid references tracks,
  liked_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
)
```

### Supabase Storage Buckets
- `tracks` — audio files (mp3/m4a)
- `covers` — album/playlist artwork
- `avatars` — user profile photos

### Row Level Security (RLS)
- `profiles`: users can only read/update their own profile
- `tracks`: only `is_artist = true` profiles can INSERT; all authenticated users can SELECT
- `playlists`: public playlists readable by all; private only by owner
- `listen_history` / `liked_tracks`: only accessible by owning user

### Supabase Auth Providers
- Email/Password (native Supabase)
- Google OAuth (via Supabase Social Auth)

---

## Design System (from Design File)

### Color Tokens (Light/Dark)
| Token | Light | Dark |
|-------|-------|------|
| primary | `#A8B5A0` | `#C8D5C0` |
| secondary | `#D4A5A5` | `#E8C4C4` |
| accent | `#E8DCC4` | `#E8DCC4` |
| background | `#FAF7F2` | `#1C1B18` |
| surface | `#FAF7F2` | `#1C1B18` |
| primary_text | `#1C1B18` | `#E8E4DC` |

### Typography
- **Primary font**: DM Sans (display, headlines, body, labels)
- **Secondary font**: Nunito
- **Mono**: JetBrains Mono

### Key Components (from DSL)
- `TrackItem` — 120×140px card with album art, title, artist (horizontal scroll)
- `RadioCard` — wider card with background image overlay
- `MiniPlayer` — bottom sticky bar (above tab bar) with artwork, title, play/pause, next
- `CategoryChip` — pill-shaped filter chip (selected = primary bg)

---

## Proposed Changes

### Phase 1 — Project Setup
#### [NEW] `d:\Music app\` — Expo project scaffold
- `npx create-expo-app@latest ./ --template tabs` (TypeScript)
- Install all dependencies
- Configure Expo Router, Supabase client, Zustand, fonts

### Phase 2 — Design System
#### [NEW] `constants/Colors.ts`
#### [NEW] `lib/theme.ts`
#### [NEW] `components/ui/` — Button, Chip, Avatar, Card, ThemedText, ThemedView

### Phase 3 — Supabase Integration
#### [NEW] `lib/supabase.ts` — Supabase client (email/pass + Google OAuth)
#### [NEW] `lib/jamendo.ts` — Jamendo API client (base URL, auth token, typed helpers)
#### [NEW] `services/tracks.ts` — query Supabase tracks + fetch from Jamendo
#### [NEW] `services/radio.ts` — merge Supabase + Jamendo tracks by genre tag
#### [NEW] `services/playlists.ts`, `artists.ts`, `auth.ts`
#### [NEW] `store/playerStore.ts` — queue, current track, position, source
#### [NEW] `store/authStore.ts`
#### [NEW] `hooks/useAuth.ts`, `usePlayer.ts`, `useRadio.ts`

### Phase 4 — Screens (all 11 from design)
#### [NEW] All screen files under `app/`

### Phase 5 — Audio Player
- `expo-av` integration
- Background audio with lock screen controls (`expo-audio` or `react-native-track-player`)
- Mini player persistent across all tab screens

---

## Verification Plan

### Automated
```bash
npx expo lint          # ESLint checks
npx tsc --noEmit       # TypeScript type checks
```

### Manual
- Run on iOS Simulator and Android Emulator via `npx expo start`
- Verify all 11 screens render correctly
- Test Supabase auth flow (sign up → sign in → session persistence)
- Test audio playback with mini player persistence across tabs
- Verify dark/light theme toggle
- Test horizontal scroll sections (Listen Again, New Releases, Radios)
