# SonicStream — Setup Walkthrough

## ✅ What's Done

### Project Scaffold
- **Expo SDK 57** with TypeScript, Expo Router v3 (file-based routing)
- Located at [`d:\Music app\sonicstream\`](file:///d:/Music%20app/sonicstream/)
- Entry point: `expo-router/entry` via [`index.ts`](file:///d:/Music%20app/sonicstream/index.ts)

### Dependencies Installed
| Package | Purpose |
|---------|---------|
| `expo-router` | File-based navigation |
| `expo-av` | Audio playback |
| `expo-image` | Fast image caching |
| `expo-secure-store` | Secure auth token storage |
| `@supabase/supabase-js` | Backend client |
| `zustand` | Player & auth state |
| `react-native-reanimated` | Animations |
| `@expo-google-fonts/dm-sans` | Primary font |
| `@expo-google-fonts/nunito` | Secondary font |
| `@expo/vector-icons` | Ionicons |

### Files Created

#### Design System
- [`constants/Colors.ts`](file:///d:/Music%20app/sonicstream/constants/Colors.ts) — 40-token light/dark color map
- [`constants/Theme.ts`](file:///d:/Music%20app/sonicstream/constants/Theme.ts) — spacing, radii, typography, shadows

#### Backend & State
- [`lib/supabase.ts`](file:///d:/Music%20app/sonicstream/lib/supabase.ts) — Supabase client + full TypeScript DB types
- [`lib/jamendo.ts`](file:///d:/Music%20app/sonicstream/lib/jamendo.ts) — Jamendo API client (search, genre radio, popular)
- [`store/playerStore.ts`](file:///d:/Music%20app/sonicstream/store/playerStore.ts) — Zustand audio player (queue, play/pause/seek/skip)
- [`store/authStore.ts`](file:///d:/Music%20app/sonicstream/store/authStore.ts) — Zustand auth state

#### UI Components
- [`components/ui/ThemedText.tsx`](file:///d:/Music%20app/sonicstream/components/ui/ThemedText.tsx)
- [`components/ui/ThemedView.tsx`](file:///d:/Music%20app/sonicstream/components/ui/ThemedView.tsx)
- [`components/ui/Button.tsx`](file:///d:/Music%20app/sonicstream/components/ui/Button.tsx)
- [`components/ui/Chip.tsx`](file:///d:/Music%20app/sonicstream/components/ui/Chip.tsx)
- [`components/ui/Avatar.tsx`](file:///d:/Music%20app/sonicstream/components/ui/Avatar.tsx)
- [`components/music/TrackItem.tsx`](file:///d:/Music%20app/sonicstream/components/music/TrackItem.tsx) — 120×120 card
- [`components/music/RadioCard.tsx`](file:///d:/Music%20app/sonicstream/components/music/RadioCard.tsx) — 160×100 card with overlay
- [`components/music/MiniPlayer.tsx`](file:///d:/Music%20app/sonicstream/components/music/MiniPlayer.tsx) — sticky bottom bar

#### Screens (11 of 11 complete 🎉)
| Screen | File |
|--------|------|
| Root Layout | [`app/_layout.tsx`](file:///d:/Music%20app/sonicstream/app/_layout.tsx) |
| Tab Bar | [`app/(tabs)/_layout.tsx`](file:///d:/Music%20app/sonicstream/app/(tabs)/_layout.tsx) |
| **Home Feed** | [`app/(tabs)/index.tsx`](file:///d:/Music%20app/sonicstream/app/(tabs)/index.tsx) |
| **Explore** | [`app/(tabs)/explore.tsx`](file:///d:/Music%20app/sonicstream/app/(tabs)/explore.tsx) |
| **Library** | [`app/(tabs)/library.tsx`](file:///d:/Music%20app/sonicstream/app/(tabs)/library.tsx) |
| **Profile** | [`app/(tabs)/profile.tsx`](file:///d:/Music%20app/sonicstream/app/(tabs)/profile.tsx) |
| **Now Playing** | [`app/player/[id].tsx`](file:///d:/Music%20app/sonicstream/app/player/[id].tsx) |
| **Playlist Detail** | [`app/playlist/[id].tsx`](file:///d:/Music%20app/sonicstream/app/playlist/[id].tsx) |
| **Album Detail** | [`app/album/[id].tsx`](file:///d:/Music%20app/sonicstream/app/album/[id].tsx) |
| **Artist Profile** | [`app/artist/[id].tsx`](file:///d:/Music%20app/sonicstream/app/artist/[id].tsx) |
| **Onboarding** | [`app/onboarding.tsx`](file:///d:/Music%20app/sonicstream/app/onboarding.tsx) |
| **Sign In** | [`app/(auth)/sign-in.tsx`](file:///d:/Music%20app/sonicstream/app/(auth)/sign-in.tsx) |
| **Sign Up** | [`app/(auth)/sign-up.tsx`](file:///d:/Music%20app/sonicstream/app/(auth)/sign-up.tsx) |

### TypeScript
✅ `npx tsc --noEmit` passes with **0 errors**

---

## 🚀 How to Run

```bash
cd "d:\Music app\sonicstream"
npx expo start
```
Then press **`a`** for Android or **`i`** for iOS simulator, or scan the QR code with the **Expo Go** app.

---

## ⚙️ Before First Run — Set Up Environment

1. Copy [`d:\Music app\sonicstream\.env.example`](file:///d:/Music%20app/sonicstream/.env.example) → `.env`
2. Fill in your credentials:
   - **Supabase**: `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` → from [app.supabase.com](https://app.supabase.com) → Settings → API
   - **Jamendo**: `EXPO_PUBLIC_JAMENDO_CLIENT_ID` → register free at [developer.jamendo.com](https://developer.jamendo.com)

3. **Run the Supabase SQL** (in Supabase SQL editor):

```sql
-- Run the schema from the implementation plan
-- Tables: profiles, tracks, artists, albums, playlists, 
--         playlist_tracks, listen_history, liked_tracks, radio_stations
```

---

## 📋 Remaining Work

| Item | Priority |
|------|---------|
| Album Detail screen (`app/album/[id].tsx`) | Medium |
| Artist Profile screen (`app/artist/[id].tsx`) | Medium |
| Onboarding screen (`app/onboarding.tsx`) | Low |
| Supabase SQL schema setup | **Required** |
| `.env` file with real keys | **Required** |
| Auth guard (redirect unauthenticated users) | High |
| Artist upload flow (Supabase Storage) | Medium |
