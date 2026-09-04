import React from 'react';
import { View, ViewProps } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ThemedViewProps extends ViewProps {
  surface?: 'background' | 'surface' | 'secondaryBackground' | 'surfaceVariant' | 'card';
}

export function ThemedView({ surface = 'background', style, ...props }: ThemedViewProps) {
  const colors = useThemeColors();

  const bgMap = {
    background: colors.background,
    surface: colors.surface,
    secondaryBackground: colors.secondaryBackground,
    surfaceVariant: colors.surfaceVariant,
    card: colors.card,
  };

  return (
    <View style={[{ backgroundColor: bgMap[surface] }, style]} {...props} />
  );
}
