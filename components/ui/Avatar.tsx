import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FontWeights, FontSizes } from '@/constants/Theme';

interface AvatarProps {
  text?: string;
  imageUrl?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ text, size = 36, style }: AvatarProps) {
  const colors = useThemeColors();
  const initials = text
    ? text
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.onAccent,
          fontSize: size * 0.38,
          fontWeight: FontWeights.bold,
          fontFamily: 'DMSans_700Bold',
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
