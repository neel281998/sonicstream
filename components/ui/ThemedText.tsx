import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FontSizes, FontWeights, LineHeights } from '@/constants/Theme';

type TextVariant =
  | 'displayLarge' | 'displayMedium' | 'displaySmall'
  | 'headlineLarge' | 'headlineMedium' | 'headlineSmall'
  | 'titleLarge' | 'titleMedium' | 'titleSmall'
  | 'bodyLarge' | 'bodyMedium' | 'bodySmall'
  | 'labelLarge' | 'labelMedium' | 'labelSmall';

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  fontWeight?: keyof typeof FontWeights;
  numberOfLines?: number;
}

export function ThemedText({
  variant = 'bodyMedium',
  color,
  fontWeight,
  style,
  ...props
}: ThemedTextProps) {
  const colors = useThemeColors();

  const fontSize = FontSizes[variant];
  const lineHeight = fontSize * LineHeights[variant];
  const defaultWeight =
    variant.startsWith('label') || variant.startsWith('title')
      ? FontWeights.medium
      : FontWeights.regular;
  const weight = fontWeight ? FontWeights[fontWeight] : defaultWeight;

  return (
    <Text
      style={[
        {
          fontSize,
          lineHeight,
          fontWeight: weight,
          color: color ?? colors.primaryText,
          fontFamily: 'DMSans_400Regular',
        },
        style,
      ]}
      {...props}
    />
  );
}
