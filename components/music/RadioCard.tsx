import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Radii, Spacing, FontSizes, FontWeights } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';

interface RadioCardProps {
  title: string;
  subtitle: string;
  coverUrl?: string | null;
  genreTag: string;
  onPress: () => void;
}

const GENRE_GRADIENTS: Record<string, string[]> = {
  lofi: ['#2D5A27', '#1A3B17'],
  rock: ['#8B4513', '#5A2D0C'],
  pop: ['#C2185B', '#880E4F'],
  jazz: ['#4A148C', '#311B92'],
  electronic: ['#006064', '#004D40'],
  house: ['#1B5E20', '#0D3B10'],
  hiphop: ['#BF360C', '#8B2500'],
  classical: ['#3E2723', '#1B1210'],
  default: ['#37474F', '#263238'],
};

export function RadioCard({ title, subtitle, coverUrl, genreTag, onPress }: RadioCardProps) {
  const colors = useThemeColors();
  const gradientColors = GENRE_GRADIENTS[genreTag] ?? GENRE_GRADIENTS.default;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Background image */}
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : null}

      {/* Genre gradient overlay */}
      <LinearGradient
        colors={[
          coverUrl ? 'rgba(0,0,0,0.3)' : gradientColors[0],
          coverUrl ? 'rgba(0,0,0,0.7)' : gradientColors[1],
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* No cover fallback icon */}
      {!coverUrl && (
        <View style={styles.fallbackIcon}>
          <Ionicons name="radio" size={28} color="rgba(255,255,255,0.3)" />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={{
            color: '#FFFFFF',
            fontSize: FontSizes.titleSmall + 1,
            fontWeight: FontWeights.bold,
            fontFamily: 'DMSans_700Bold',
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: FontSizes.labelSmall,
            fontFamily: 'DMSans_400Regular',
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 110,
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginRight: Spacing.sm,
    position: 'relative',
  },
  fallbackIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
});
