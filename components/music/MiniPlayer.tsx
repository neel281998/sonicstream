import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePlayerStore } from '@/store/playerStore';
import { Spacing, FontSizes, FontWeights, Shadows, Radii } from '@/constants/Theme';

export function MiniPlayer() {
  const colors = useThemeColors();
  const router = useRouter();
  const { currentTrack, isPlaying, positionMs, durationMs, togglePlayPause, playNext } = usePlayerStore();

  if (!currentTrack) return null;

  const progress = durationMs > 0 ? Math.max(0, Math.min(1, positionMs / durationMs)) : 0;

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.miniPlayer,
          ...Shadows.md,
        },
      ]}
      onPress={() => router.push(`/player/${currentTrack.id}`)}
    >
      {/* Top progress line */}
      <View style={[styles.progressLineBg, { backgroundColor: colors.surfaceVariant }]}>
        <View style={[styles.progressLineFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      {/* Album Art */}
      <View style={[styles.artwork, { backgroundColor: colors.surfaceVariant }]}>
        {currentTrack.coverUrl ? (
          <Image
            source={{ uri: currentTrack.coverUrl }}
            style={styles.artworkImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Text style={{ fontSize: 22 }}>🎵</Text>
        )}
      </View>

      {/* Track Info */}
      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={{
            color: colors.primaryText,
            fontSize: FontSizes.bodySmall,
            fontWeight: FontWeights.medium,
            fontFamily: 'DMSans_500Medium',
          }}
        >
          {currentTrack.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: colors.secondaryText,
            fontSize: FontSizes.labelSmall,
            fontFamily: 'DMSans_400Regular',
          }}
        >
          {currentTrack.artistName}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          style={styles.controlBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color={colors.primaryText}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            playNext();
          }}
          style={styles.controlBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="play-skip-forward" size={22} color={colors.primaryText} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 68,
    marginHorizontal: Spacing.sm,
    borderRadius: Radii.md,
    position: 'relative',
    overflow: 'hidden',
  },
  progressLineBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: Radii.md,
    borderTopRightRadius: Radii.md,
  },
  progressLineFill: {
    height: '100%',
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  controlBtn: {
    padding: 4,
  },
});
