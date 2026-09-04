import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { usePlayerStore, Track } from '@/store/playerStore';
import { Spacing, Radii, FontSizes, FontWeights, Shadows } from '@/constants/Theme';

// Mock data — replace with Supabase query by album id
const MOCK_ALBUM = {
  id: '1',
  title: 'After Hours',
  artistName: 'The Weeknd',
  year: '2020',
  genre: 'R&B / Pop',
  trackCount: 14,
  duration: '56 min',
  coverUrl: null as string | null,
};

const MOCK_TRACKS: Track[] = [
  { id: '1', title: 'Alone Again', artistName: 'The Weeknd', duration: 261, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '2', title: 'Too Late', artistName: 'The Weeknd', duration: 232, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '3', title: 'Hardest to Love', artistName: 'The Weeknd', duration: 213, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '4', title: 'Scared to Live', artistName: 'The Weeknd', duration: 193, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '5', title: 'Snowchild', artistName: 'The Weeknd', duration: 274, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '6', title: 'Escape from LA', artistName: 'The Weeknd', duration: 366, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '7', title: 'Blinding Lights', artistName: 'The Weeknd', duration: 200, audioUrl: '', coverUrl: null, source: 'jamendo' },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AlbumDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { loadAndPlay } = usePlayerStore();
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  async function handlePlayAll() {
    if (MOCK_TRACKS.length > 0) {
      await loadAndPlay(MOCK_TRACKS[0], MOCK_TRACKS);
      router.push(`/player/${MOCK_TRACKS[0].id}`);
    }
  }

  async function handleTrackPress(track: Track) {
    await loadAndPlay(track, MOCK_TRACKS);
    router.push(`/player/${track.id}`);
  }

  function toggleLike(trackId: string) {
    setLikedTracks((prev) => {
      const next = new Set(prev);
      next.has(trackId) ? next.delete(trackId) : next.add(trackId);
      return next;
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* Album Art + Info */}
        <View style={styles.heroSection}>
          <View style={[styles.albumArt, { backgroundColor: colors.primaryContainer }]}>
            {MOCK_ALBUM.coverUrl ? (
              <Image source={{ uri: MOCK_ALBUM.coverUrl }} style={StyleSheet.absoluteFill} />
            ) : (
              <Text style={{ fontSize: 72 }}>💿</Text>
            )}
          </View>

          <View style={styles.albumMeta}>
            <ThemedText variant="headlineSmall" fontWeight="black" style={{ textAlign: 'center' }}>
              {MOCK_ALBUM.title}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push({ pathname: '/artist/[id]', params: { id: '1' } })}>
              <ThemedText
                variant="bodyMedium"
                color={colors.primary}
                fontWeight="medium"
                style={{ textAlign: 'center', marginTop: 4 }}
              >
                {MOCK_ALBUM.artistName}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText
              variant="bodySmall"
              color={colors.secondaryText}
              style={{ textAlign: 'center', marginTop: 4 }}
            >
              {MOCK_ALBUM.year} · {MOCK_ALBUM.genre} · {MOCK_ALBUM.trackCount} songs · {MOCK_ALBUM.duration}
            </ThemedText>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.playAllBtn, { backgroundColor: colors.primary }]}
              onPress={handlePlayAll}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={20} color={colors.onPrimary} />
              <Text
                style={{
                  color: colors.onPrimary,
                  fontSize: FontSizes.labelLarge,
                  fontWeight: FontWeights.bold,
                  fontFamily: 'DMSans_700Bold',
                  marginLeft: 6,
                }}
              >
                Play All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shuffleBtn, { borderColor: colors.primary, backgroundColor: colors.primaryContainer }]}
              activeOpacity={0.85}
            >
              <Ionicons name="shuffle" size={20} color={colors.primary} />
              <Text
                style={{
                  color: colors.primary,
                  fontSize: FontSizes.labelLarge,
                  fontWeight: FontWeights.medium,
                  fontFamily: 'DMSans_500Medium',
                  marginLeft: 6,
                }}
              >
                Shuffle
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Track List */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <ThemedText variant="titleSmall" fontWeight="bold" color={colors.secondaryText} style={{ marginBottom: Spacing.sm, letterSpacing: 1 }}>
            TRACKS
          </ThemedText>

          {MOCK_TRACKS.map((track, index) => (
            <TouchableOpacity
              key={track.id}
              style={[styles.trackRow, { borderBottomColor: colors.divider }]}
              onPress={() => handleTrackPress(track)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: colors.hint,
                  fontSize: FontSizes.labelMedium,
                  width: 24,
                  textAlign: 'center',
                  fontFamily: 'DMSans_400Regular',
                }}
              >
                {index + 1}
              </Text>

              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <ThemedText variant="bodyMedium" fontWeight="medium" numberOfLines={1}>
                  {track.title}
                </ThemedText>
                <ThemedText variant="bodySmall" color={colors.secondaryText}>
                  {formatDuration(track.duration)}
                </ThemedText>
              </View>

              <TouchableOpacity
                onPress={() => toggleLike(track.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginRight: Spacing.xs }}
              >
                <Ionicons
                  name={likedTracks.has(track.id) ? 'heart' : 'heart-outline'}
                  size={18}
                  color={likedTracks.has(track.id) ? colors.secondary : colors.hint}
                />
              </TouchableOpacity>

              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-vertical" size={18} color={colors.hint} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  albumMeta: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.xs,
    paddingVertical: 12,
  },
  shuffleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.xs,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
});
