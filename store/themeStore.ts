import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = '@sonicstream_theme_mode';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'system',

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist theme mode:', e);
    }
  },

  initTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        set({ themeMode: savedMode });
      }
    } catch (e) {
      console.warn('Failed to load theme mode:', e);
    }
  },
}));

// Initialize from storage on module load
useThemeStore.getState().initTheme();
