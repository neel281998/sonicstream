import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useThemeStore } from '@/store/themeStore';

export type ThemeColors = typeof Colors.light | typeof Colors.dark;

export function useActiveColorScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const themeMode = useThemeStore((s) => s.themeMode);

  if (themeMode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return themeMode;
}

export function useThemeColors(): ThemeColors {
  const activeScheme = useActiveColorScheme();
  return Colors[activeScheme];
}

export function useColorSchemeMode(): 'light' | 'dark' {
  return useActiveColorScheme();
}
