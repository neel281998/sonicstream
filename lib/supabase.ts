import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Validate Supabase project URL and anon key
const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_URL = (rawUrl && rawUrl.startsWith('http'))
  ? rawUrl
  : 'https://placeholder.supabase.co';

const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_ANON_KEY = (rawKey && rawKey.trim().length > 0)
  ? rawKey
  : 'placeholder-anon-key';

// Crash-proof SecureStore adapter with AsyncStorage fallback
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('[SecureStore] getItem error, trying AsyncStorage fallback:', e);
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('[SecureStore] setItem failed (e.g. 2KB limit), falling back to AsyncStorage:', e);
      try {
        await AsyncStorage.setItem(key, value);
      } catch {}
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('[SecureStore] deleteItem error:', e);
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
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
