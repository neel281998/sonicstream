import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useActiveColorScheme } from '@/hooks/useThemeColors';
import { usePlayerStore, Track } from '@/store/playerStore';
import { useLikesStore } from '@/store/likesStore';
import { useAuthStore } from '@/store/authStore';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing, Radii, FontSizes, FontWeights } from '@/constants/Theme';
import { AddToPlaylistSheet } from '@/components/music/AddToPlaylistSheet';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(SCREEN_W - Spacing.lg * 2, SCREEN_H * 0.40);

function formatTime(ms: number) {
  const safeMs = Math.max(0, isNaN(ms) ? 0 : ms);
  const totalSec = Math.floor(safeMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDurationSec(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const colors = useThemeColors();
  const colorScheme = useActiveColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);

  const {
    currentTrack,
    isPlaying,
    positionMs,
    durationMs,
    queue,
    currentIndex,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
    playQueueItem,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();

  const isLiked = useLikesStore((s) => s.isLiked(currentTrack));
  const toggleLike = useLikesStore((s) => s.toggleLike);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPositionMs, setScrubPositionMs] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const trackLayoutRef = useRef<{ pageX: number; width: number }>({
    pageX: Spacing.lg,
    width: SCREEN_W - Spacing.lg * 2,
  });
  const trackContainerRef = useRef<View>(null);
  const artworkScale = useRef(new Animated.Value(isPlaying ? 1 : 0.85)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(artworkScale, {
      toValue: isPlaying ? 1 : 0.85,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [isPlaying]);

  const handleToggleLike = async () => {
    if (!currentTrack) return;
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    await toggleLike(currentTrack, userId);
  };

  const handleShare = () => {
    if (!currentTrack) return;
    Share.share({
      message: `Listening to "${currentTrack.title}" by ${currentTrack.artistName} on SonicStream! 🎵`,
    }).catch(() => {});
  };

  const updateTrackMeasurement = () => {
    trackContainerRef.current?.measure((_x, _y, width, _height, pageX) => {
      if (width > 0) {
        trackLayoutRef.current = { pageX, width };
      }
    });
  };

  const handleSeekTouch = (pageX: number, isFinal: boolean) => {
    const { pageX: trackX, width } = trackLayoutRef.current;
    const relX = Math.max(0, Math.min(width, pageX - trackX));
    const ratio = width > 0 ? relX / width : 0;
    const targetMs = Math.round(ratio * durationMs);

    if (isFinal) {
      setIsScrubbing(false);
      seekTo(targetMs);
    } else {
      setScrubPositionMs(targetMs);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateTrackMeasurement();
        setIsScrubbing(true);
        handleSeekTouch(evt.nativeEvent.pageX, false);
      },
      onPanResponderMove: (evt) => {
        handleSeekTouch(evt.nativeEvent.pageX, false);
      },
      onPanResponderRelease: (evt) => {
        handleSeekTouch(evt.nativeEvent.pageX, true);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      },
    })
  ).current;

  if (!currentTrack) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText variant="bodyLarge" color={colors.hint}>No track playing</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          <ThemedText variant="labelLarge" color={colors.primary}>Go Back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentDisplayPos = isScrubbing ? scrubPositionMs : positionMs;
  const progress = durationMs > 0 ? Math.max(0, Math.min(1, currentDisplayPos / durationMs)) : 0;

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={{ flex: 1 }}
    >
      {/* Blurred backdrop artwork covering entire screen */}
      {currentTrack.coverUrl && (
        <View style={styles.backdropContainer} pointerEvents="none">
          <Image
            source={{ uri: currentTrack.coverUrl }}
            style={[styles.backdropImage, { opacity: isDark ? 0.35 : 0.15 }]}
            contentFit="cover"
            blurRadius={70}
          />
          <LinearGradient
            colors={
              isDark
                ? [
                    'rgba(15, 15, 18, 0.40)',
                    'rgba(15, 15, 18, 0.70)',
                    'rgba(15, 15, 18, 0.92)',
                    colors.background,
                  ]
                : [
                    'rgba(250, 247, 242, 0.35)',
                    'rgba(250, 247, 242, 0.70)',
                    'rgba(250, 247, 242, 0.92)',
                    colors.background,
                  ]
            }
            locations={[0, 0.35, 0.7, 1]}
            style={styles.backdropOverlay}
          />
        </View>
      )}

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-down" size={28} color={colors.primaryText} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: colors.secondaryText,
                fontSize: 11,
                fontWeight: '700',
                fontFamily: 'DMSans_700Bold',
                letterSpacing: 1.2,
                opacity: 0.85,
              }}
            >
              NOW PLAYING
            </Text>
          </View>
          <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} onPress={handleShare}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* Main layout container distributing space evenly */}
        <View style={styles.mainContainer}>
          {/* Artwork Container centers artwork in available top half space */}
          <View style={styles.artworkContainer}>
            <Animated.View
              style={[
                styles.artworkWrapper,
                {
                  transform: [{ scale: artworkScale }],
                  backgroundColor: colors.surfaceVariant,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: isDark ? 0.45 : 0.15,
                  shadowRadius: 18,
                  elevation: 8,
                },
              ]}
            >
              {currentTrack.coverUrl ? (
                <Image source={{ uri: currentTrack.coverUrl }} style={styles.artwork} contentFit="cover" transition={300} />
              ) : (
                <View style={[styles.artwork, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 80 }}>🎵</Text>
                </View>
              )}
            </Animated.View>
          </View>

          {/* Bottom Section anchored at bottom with balanced layout */}
          <View style={styles.bottomSection}>
            {/* Track Info */}
            <View style={styles.trackInfo}>
              <View style={{ flex: 1 }}>
                <ThemedText variant="titleLarge" fontWeight="black" numberOfLines={1}>
                  {currentTrack.title}
                </ThemedText>
                <ThemedText variant="bodyMedium" color={colors.secondaryText} numberOfLines={1}>
                  {currentTrack.artistName && currentTrack.artistName !== 'Unknown Artist'
                    ? currentTrack.artistName
                    : currentTrack.albumName || 'Featured Artist'}
                </ThemedText>
              </View>
              <TouchableOpacity
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={handleToggleLike}
                activeOpacity={0.7}
              >
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={26}
                    color={isLiked ? '#E91E63' : colors.primary}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Progress Bar with smooth drag & tap */}
            <View style={styles.progressContainer}>
              <View
                ref={trackContainerRef}
                onLayout={updateTrackMeasurement}
                {...panResponder.panHandlers}
                style={styles.progressTouchableArea}
              >
                <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: colors.primary, width: `${progress * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.progressThumb,
                      {
                        backgroundColor: isDark ? '#FFFFFF' : colors.primary,
                        left: `${progress * 100}%`,
                        transform: [{ scale: isScrubbing ? 1.3 : 1 }],
                        elevation: 4,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 3,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.timeRow}>
                <Text style={{ color: colors.secondaryText, fontSize: FontSizes.labelSmall, fontFamily: 'DMSans_500Medium', fontWeight: '600' }}>
                  {formatTime(currentDisplayPos)}
                </Text>
                <Text style={{ color: colors.secondaryText, fontSize: FontSizes.labelSmall, fontFamily: 'DMSans_500Medium', fontWeight: '600' }}>
                  {formatTime(durationMs)}
                </Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="shuffle" size={22} color={colors.secondaryText} />
              </TouchableOpacity>

              <TouchableOpacity onPress={playPrevious} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="play-skip-back" size={32} color={colors.primaryText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.playBtn,
                  {
                    backgroundColor: isDark ? '#FFFFFF' : '#18181A',
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.35 : 0.2,
                    shadowRadius: 8,
                    elevation: 6,
                  },
                ]}
                onPress={togglePlayPause}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={34}
                  color={isDark ? '#000000' : '#FFFFFF'}
                  style={!isPlaying ? { marginLeft: 3 } : undefined}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={playNext} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="play-skip-forward" size={32} color={colors.primaryText} />
              </TouchableOpacity>

              <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="repeat" size={22} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={[styles.bottomActions, { borderTopColor: colors.divider }]}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowQueue(true)} activeOpacity={0.7}>
                <Ionicons name="list" size={22} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: FontSizes.labelSmall, fontFamily: 'DMSans_500Medium', marginTop: 4 }}>Queue</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={22} color={colors.secondaryText} />
                <Text style={{ color: colors.secondaryText, fontSize: FontSizes.labelSmall, fontFamily: 'DMSans_400Regular', marginTop: 4 }}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowAddToPlaylist(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="bookmark-outline" size={22} color={colors.secondaryText} />
                <Text style={{ color: colors.secondaryText, fontSize: FontSizes.labelSmall, fontFamily: 'DMSans_400Regular', marginTop: 4 }}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      {/* Queue Modal */}
      <Modal
        visible={showQueue}
        animationType="slide"
        transparent
        onRequestClose={() => setShowQueue(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowQueue(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={[styles.queueSheet, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            {/* Sheet Handle */}
            <View style={styles.dragHandle} />

            {/* Queue Header */}
            <View style={[styles.queueHeader, { borderBottomColor: colors.divider }]}>
              <View>
                <ThemedText variant="titleMedium" fontWeight="extrabold">
                  Playing Queue
                </ThemedText>
                <ThemedText variant="bodySmall" color={colors.secondaryText}>
                  {queue.length} {queue.length === 1 ? 'song' : 'songs'} in playlist
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                {queue.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      clearQueue();
                      setShowQueue(false);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ThemedText variant="labelSmall" color={colors.hint}>Clear</ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setShowQueue(false)}
                  style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
                >
                  <Ionicons name="close" size={20} color={colors.primaryText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Queue List */}
            <FlatList
              data={queue}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xs }}>
                  <ThemedText variant="labelMedium" color={colors.hint} fontWeight="bold">
                    NOW PLAYING
                  </ThemedText>
                  <View style={[styles.nowPlayingRow, { backgroundColor: colors.primaryContainer }]}>
                    <View style={styles.queueArtContainer}>
                      {currentTrack.coverUrl ? (
                        <Image source={{ uri: currentTrack.coverUrl }} style={styles.queueArt} />
                      ) : (
                        <View style={[styles.queueArt, { backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 16 }}>🎵</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
                      <ThemedText variant="bodyMedium" fontWeight="bold" numberOfLines={1}>
                        {currentTrack.title}
                      </ThemedText>
                      <ThemedText variant="bodySmall" color={colors.secondaryText} numberOfLines={1}>
                        {currentTrack.artistName}
                      </ThemedText>
                    </View>
                    <Ionicons name={isPlaying ? 'volume-high' : 'volume-mute'} size={20} color={colors.primary} />
                  </View>

                  <ThemedText
                    variant="labelMedium"
                    color={colors.hint}
                    fontWeight="bold"
                    style={{ marginTop: Spacing.md, marginBottom: Spacing.xs }}
                  >
                    UP NEXT
                  </ThemedText>
                </View>
              }
              renderItem={({ item, index }) => {
                const isCurrent = index === currentIndex;
                return (
                  <TouchableOpacity
                    style={[
                      styles.queueTrackRow,
                      {
                        backgroundColor: isCurrent ? colors.primaryContainer + '40' : 'transparent',
                        borderBottomColor: colors.divider,
                      },
                    ]}
                    onPress={() => playQueueItem(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.trackIndex, { color: isCurrent ? colors.primary : colors.hint }]}>
                      {isCurrent ? '▶' : index + 1}
                    </Text>

                    <View style={styles.queueArtContainer}>
                      {item.coverUrl ? (
                        <Image source={{ uri: item.coverUrl }} style={styles.queueArt} />
                      ) : (
                        <View style={[styles.queueArt, { backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 14 }}>🎵</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
                      <ThemedText
                        variant="bodyMedium"
                        fontWeight={isCurrent ? 'bold' : 'medium'}
                        color={isCurrent ? colors.primary : colors.primaryText}
                        numberOfLines={1}
                      >
                        {item.title}
                      </ThemedText>
                      <ThemedText variant="bodySmall" color={colors.secondaryText} numberOfLines={1}>
                        {item.artistName}
                      </ThemedText>
                    </View>

                    <ThemedText variant="bodySmall" color={colors.hint} style={{ marginRight: Spacing.sm }}>
                      {formatDurationSec(item.duration)}
                    </ThemedText>

                    <TouchableOpacity
                      onPress={() => removeFromQueue(index)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={colors.hint} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                  <ThemedText variant="bodyMedium" color={colors.hint}>
                    Your queue is empty
                  </ThemedText>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Add To Playlist Sheet */}
      <AddToPlaylistSheet
        visible={showAddToPlaylist}
        track={currentTrack}
        onClose={() => setShowAddToPlaylist(false)}
      />
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backdropContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  backdropImage: {
    ...StyleSheet.absoluteFill,
    transform: [{ scale: 1.15 }],
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFill,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  artworkContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  artworkWrapper: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    width: '100%',
    paddingBottom: Spacing.xs,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressTouchableArea: {
    height: 36,
    justifyContent: 'center',
  },
  progressBg: {
    height: 4,
    borderRadius: Radii.full,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  progressThumb: {
    width: 14,
    height: 14,
    borderRadius: Radii.full,
    position: 'absolute',
    top: -5,
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minWidth: 60,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  queueSheet: {
    height: SCREEN_H * 0.72,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#888888',
    borderRadius: Radii.full,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginTop: Spacing.xs,
  },
  queueArtContainer: {
    width: 44,
    height: 44,
    borderRadius: Radii.xs,
    overflow: 'hidden',
  },
  queueArt: {
    width: '100%',
    height: '100%',
  },
  queueTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trackIndex: {
    width: 24,
    fontSize: FontSizes.labelSmall,
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
  },
});
