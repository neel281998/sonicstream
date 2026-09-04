import { create } from 'zustand';
import { safeAudioPlayer } from '@/lib/audioPlayer';
import { recordListen } from '@/services/listenHistory';
import { useAuthStore } from '@/store/authStore';

export type TrackSource = 'upload' | 'jamendo';

export interface Track {
  id: string;
  title: string;
  artistName: string;
  albumName?: string;
  duration: number; // seconds
  audioUrl: string;
  coverUrl: string | null;
  source: TrackSource;
  jamendoId?: string;
}

interface PlayerState {
  // Queue
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;

  // Playback
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;

  // Actions
  loadAndPlay: (track: Track, queue?: Track[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  removeFromQueue: (index: number) => void;
  playQueueItem: (index: number) => Promise<void>;
  clearQueue: () => Promise<void>;
}

let currentLoadRequestId = 0;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  positionMs: 0,
  durationMs: 0,

  loadAndPlay: async (track, queue) => {
    const requestId = ++currentLoadRequestId;
    const newQueue = queue ?? get().queue;
    const idx = newQueue.findIndex((t) => t.id === track.id);

    set({
      isLoading: true,
      currentTrack: track,
      queue: newQueue,
      currentIndex: idx === -1 ? 0 : idx,
      durationMs: track.duration > 0 ? track.duration * 1000 : 180000,
      positionMs: 0,
      isPlaying: true,
    });

    await safeAudioPlayer.load(
      track.audioUrl,
      track.duration,
      ({ positionMs, durationMs, isPlaying, didJustFinish }) => {
        // Ignore status updates from a superseded track request
        if (currentLoadRequestId !== requestId) return;

        set({
          positionMs,
          durationMs: durationMs > 0 ? durationMs : (track.duration > 0 ? track.duration * 1000 : 180000),
          isPlaying,
          isLoading: false,
        });

        if (didJustFinish) {
          get().playNext();
        }
      }
    );

    if (currentLoadRequestId === requestId) {
      set({ isPlaying: true, isLoading: false });
    }

    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      recordListen(userId, track).catch(() => {});
    }
  },

  togglePlayPause: async () => {
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;

    // Optimistically update UI so play/pause button reacts immediately
    const nextState = !isPlaying;
    set({ isPlaying: nextState });

    try {
      if (!nextState) {
        await safeAudioPlayer.pause();
      } else {
        await safeAudioPlayer.play();
      }
    } catch {
      // Revert on error
      set({ isPlaying });
    }
  },

  seekTo: async (positionMs) => {
    set({ positionMs });
    await safeAudioPlayer.seek(positionMs);
  },

  playNext: async () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    const nextTrack = queue[nextIndex];
    await get().loadAndPlay(nextTrack, queue);
  },

  playPrevious: async () => {
    const { queue, currentIndex, positionMs } = get();
    // If more than 3s in, restart current track
    if (positionMs > 3000) {
      await get().seekTo(0);
      return;
    }
    if (queue.length === 0) return;
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevTrack = queue[prevIndex];
    await get().loadAndPlay(prevTrack, queue);
  },

  setQueue: (tracks, startIndex = 0) => {
    set({ queue: tracks, currentIndex: startIndex });
  },

  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    if (index < 0 || index >= queue.length) return;
    const newQueue = queue.filter((_, i) => i !== index);
    let newIndex = currentIndex;
    if (index < currentIndex) {
      newIndex = currentIndex - 1;
    } else if (index === currentIndex) {
      if (newQueue.length > 0) {
        const nextTrack = newQueue[Math.min(currentIndex, newQueue.length - 1)];
        get().loadAndPlay(nextTrack, newQueue);
        return;
      } else {
        get().clearQueue();
        return;
      }
    }
    set({ queue: newQueue, currentIndex: newIndex });
  },

  playQueueItem: async (index) => {
    const { queue } = get();
    if (index >= 0 && index < queue.length) {
      await get().loadAndPlay(queue[index], queue);
    }
  },

  clearQueue: async () => {
    await safeAudioPlayer.unload();
    set({
      queue: [],
      currentIndex: -1,
      currentTrack: null,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
    });
  },
}));
