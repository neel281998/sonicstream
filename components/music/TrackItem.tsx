import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Radii, Spacing, FontSizes, FontWeights, Shadows } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import type { Track } from '@/store/playerStore';

interface TrackItemProps {
  track: Track;
  onPress: (track: Track) => void;
}

export function TrackItem({ track, onPress }: TrackItemProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, ...Shadows.sm }]}
      onPress={() => onPress(track)}
      activeOpacity={0.8}
    >
      {/* Album Art */}
      <View style={[styles.imageContainer, { backgroundColor: colors.surfaceVariant }]}>
        {track.coverUrl ? (
          <Image
            source={{ uri: track.coverUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.primaryContainer }]}>
            <Text style={{ fontSize: 28 }}>🎵</Text>
          </View>
        )}
        {/* Gradient overlay at bottom for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.imageGradient}
        />
        {/* Play icon overlay */}
        <View style={styles.playOverlay}>
          <View style={[styles.playIcon, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginLeft: 1 }} />
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          numberOfLines={2}
          style={{
            color: colors.primaryText,
            fontSize: FontSizes.bodySmall,
            fontWeight: FontWeights.medium,
            fontFamily: 'DMSans_500Medium',
            lineHeight: FontSizes.bodySmall * 1.3,
          }}
        >
          {track.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: colors.secondaryText,
            fontSize: FontSizes.labelSmall,
            fontFamily: 'DMSans_400Regular',
            marginTop: 2,
          }}
        >
          {track.artistName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  imageContainer: {
    width: 150,
    height: 150,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  playOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  playIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: Spacing.xs + 2,
  },
});
