import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';

interface GradientBackgroundProps {
  children: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  /** Gradient direction: start point [x, y] where 0-1 */
  start?: { x: number; y: number };
  /** Gradient direction: end point [x, y] where 0-1 */
  end?: { x: number; y: number };
}

export function GradientBackground({
  children,
  colors,
  style,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
}: GradientBackgroundProps) {
  const themeColors = useThemeColors();

  const gradientColors: readonly [string, string, ...string[]] = colors ?? [
    themeColors.gradientStart,
    themeColors.gradientMid,
    themeColors.gradientEnd,
  ];

  return (
    <LinearGradient
      colors={gradientColors}
      start={start}
      end={end}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
