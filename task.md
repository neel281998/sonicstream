# SonicStream — Task List

## Phase 1 — Project Setup
- [x] Scaffold Expo project with TypeScript template
- [x] Install all dependencies (Supabase, Zustand, expo-av, reanimated, fonts, etc.)
- [x] Configure `app.json` / `app.config.ts`
- [x] Configure Expo Router root layout with theme provider

## Phase 2 — Design System
- [x] `constants/Colors.ts` — full light/dark token map
- [x] `lib/theme.ts` — spacing, radii, typography
- [x] `components/ui/ThemedText.tsx`
- [x] `components/ui/ThemedView.tsx`
- [x] `components/ui/Button.tsx`
- [x] `components/ui/Chip.tsx`
- [x] `components/ui/Avatar.tsx`
- [ ] `components/ui/Card.tsx`

## Phase 3 — Supabase + Jamendo Integration
- [x] `lib/supabase.ts` — Supabase client (email/pass + Google OAuth)
- [x] `lib/jamendo.ts` — Jamendo API client
- [x] `services/auth.ts`
- [ ] `services/tracks.ts`
- [x] `services/radio.ts` (inline in screens)
- [ ] `services/playlists.ts`
- [ ] `services/artists.ts`
- [x] `store/authStore.ts`
- [x] `store/playerStore.ts`
- [x] `hooks/useAuth.ts` (via authStore)
- [x] `hooks/usePlayer.ts` (via playerStore)
- [ ] `hooks/useRadio.ts`

## Phase 4 — Music Components
- [x] `components/music/TrackItem.tsx`
- [x] `components/music/RadioCard.tsx`
- [x] `components/music/MiniPlayer.tsx`
- [ ] `components/music/PlaylistCard.tsx`
- [ ] `components/music/ArtistCard.tsx`
- [ ] `components/layout/SearchBar.tsx`
- [ ] `components/layout/SectionHeader.tsx`

## Phase 5 — Screens
- [x] Auth screens (sign-in, sign-up)
- [x] Onboarding screen
- [x] Tab layout with bottom nav
- [x] Home Feed screen
- [x] Explore screen
- [x] Library screen
- [x] Profile screen
- [x] Now Playing screen
- [x] Playlist Detail screen
- [x] Album Detail screen
- [x] Artist Profile screen

## Phase 6 — Audio Player
- [x] expo-av audio setup
- [x] Background audio / lock screen controls
- [x] MiniPlayer persistence across tabs

## Phase 7 — Verification
- [x] TypeScript type checks (passes with 0 errors)
- [ ] Test all screens on simulator / Expo Go
- [ ] Test auth flow
- [ ] Test audio playback
