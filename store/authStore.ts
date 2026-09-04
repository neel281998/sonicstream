import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_artist: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,

  setSession: (session) => {
    set({ session, user: session?.user ?? null, isLoading: false });
    if (session?.user) {
      get().fetchProfile(session.user.id);
    } else {
      set({ profile: null });
    }
  },

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      const profileData: Profile = { ...(data as Profile) };
      const user = get().user;
      const metaArtist =
        user?.user_metadata?.is_artist === true ||
        user?.user_metadata?.is_artist === 'true';

      // If user registered with artist mode in user_metadata but profile table has false, sync it
      if (metaArtist && !profileData.is_artist) {
        profileData.is_artist = true;
        try {
          await supabase
            .from('profiles')
            .update({ is_artist: true })
            .eq('id', userId);

          const { ensureArtistForUser } = await import('@/services/artist');
          await ensureArtistForUser(userId, profileData.username || undefined);
        } catch (err: any) {
          console.warn('[authStore] is_artist sync notice:', err?.message);
        }
      } else if (profileData.is_artist) {
        import('@/services/artist').then(({ ensureArtistForUser }) => {
          ensureArtistForUser(userId, profileData.username || undefined).catch(() => {});
        }).catch(() => {});
      }

      set({ profile: profileData });
    }
  },

  signOut: async () => {
    try {
      // 1. Unload playback and clear player queue
      const { usePlayerStore } = await import('@/store/playerStore');
      await usePlayerStore.getState().clearQueue();
    } catch (e) {
      console.warn('[authStore] Error clearing player on signOut:', e);
    }

    try {
      // 2. Clear likes store
      const { useLikesStore } = await import('@/store/likesStore');
      useLikesStore.setState({ likedTracks: [], isLoading: false });
    } catch (e) {
      console.warn('[authStore] Error clearing likes on signOut:', e);
    }

    try {
      // 3. Inform Supabase to invalidate session
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('[authStore] Supabase signOut error:', error.message);
      }
    } catch (e) {
      console.warn('[authStore] Supabase signOut threw error:', e);
    } finally {
      // 4. Always wipe local session, user, and profile state
      set({ session: null, user: null, profile: null, isLoading: false });
    }
  },
}));
