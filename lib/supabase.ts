import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your Supabase project URL and anon key
// Get them from: https://app.supabase.com -> Settings -> API
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'your-anon-key';

// SecureStore adapter for auth tokens (more secure than AsyncStorage)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Type helpers
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          is_artist: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          is_artist?: boolean;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
          is_artist?: boolean;
        };
      };
      tracks: {
        Row: {
          id: string;
          title: string;
          artist_id: string | null;
          album_id: string | null;
          duration_seconds: number | null;
          source: 'upload' | 'jamendo';
          audio_url: string | null;
          jamendo_id: string | null;
          cover_url: string | null;
          genre: string[];
          play_count: number;
          released_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['tracks']['Row']> & {
          title: string;
          source: 'upload' | 'jamendo';
        };
        Update: Partial<Database['public']['Tables']['tracks']['Row']>;
      };
      artists: {
        Row: {
          id: string;
          name: string;
          bio: string | null;
          avatar_url: string | null;
          verified: boolean;
        };
      };
      albums: {
        Row: {
          id: string;
          title: string;
          artist_id: string | null;
          cover_url: string | null;
          released_at: string | null;
        };
      };
      playlists: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          is_public: boolean;
          created_at: string;
        };
      };
      playlist_tracks: {
        Row: {
          playlist_id: string;
          track_id: string;
          position: number;
        };
      };
      listen_history: {
        Row: {
          user_id: string;
          track_id: string;
          listened_at: string;
        };
      };
      liked_tracks: {
        Row: {
          user_id: string;
          track_id: string;
          liked_at: string;
        };
      };
      radio_stations: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          cover_url: string | null;
          genre_tag: string;
        };
      };
    };
  };
};
