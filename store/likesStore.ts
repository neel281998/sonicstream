import { create } from 'zustand';
import type { Track } from '@/store/playerStore';
import { fetchLikedTracks, removeLikedTrack, saveLikedTrack } from '@/services/likes';

interface LikesState {
  likedTracks: Track[];
  isLoading: boolean;

  loadLikes: (userId?: string) => Promise<void>;
  isLiked: (track: Track | null) => boolean;
  toggleLike: (track: Track, userId?: string) => Promise<boolean>;
  unlikeTrack: (track: Track, userId?: string) => Promise<void>;
}

function matchesTrack(t: Track, candidate: Track): boolean {
  if (t.id === candidate.id) return true;
  if (t.jamendoId && candidate.jamendoId && t.jamendoId === candidate.jamendoId) return true;
  if (t.id === `jamendo-${candidate.jamendoId}` || candidate.id === `jamendo-${t.jamendoId}`) return true;
  return false;
}

export const useLikesStore = create<LikesState>((set, get) => ({
  likedTracks: [],
  isLoading: false,

  loadLikes: async (userId) => {
    set({ isLoading: true });
    try {
      const tracks = await fetchLikedTracks(userId);
      set({ likedTracks: tracks });
    } catch (e) {
      console.warn('[likesStore] loadLikes error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  isLiked: (track) => {
    if (!track) return false;
    const { likedTracks } = get();
    return likedTracks.some((t) => matchesTrack(t, track));
  },

  toggleLike: async (track, userId) => {
    const { likedTracks } = get();
    const currentlyLiked = likedTracks.some((t) => matchesTrack(t, track));

    if (currentlyLiked) {
      // Optimistically remove
      const updated = likedTracks.filter((t) => !matchesTrack(t, track));
      set({ likedTracks: updated });
      removeLikedTrack(track, userId).catch(() => {});
      return false;
    } else {
      // Optimistically add
      const updated = [track, ...likedTracks.filter((t) => !matchesTrack(t, track))];
      set({ likedTracks: updated });
      saveLikedTrack(track, userId).catch(() => {});
      return true;
    }
  },

  unlikeTrack: async (track, userId) => {
    const { likedTracks } = get();
    const updated = likedTracks.filter((t) => !matchesTrack(t, track));
    set({ likedTracks: updated });
    await removeLikedTrack(track, userId);
  },
}));
