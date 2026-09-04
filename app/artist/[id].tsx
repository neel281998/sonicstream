import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { TrackItem } from '@/components/music/TrackItem';
import { usePlayerStore, Track } from '@/store/playerStore';
import { Spacing, Radii, FontSizes, FontWeights } from '@/constants/Theme';

// Mock data — replace with Supabase query by artist id
const MOCK_ARTIST = {
  id: '1',
  name: 'The Weeknd',
  bio: 'Abel Makkonen Tesfaye, known professionally as the Weeknd, is a Canadian singer, songwriter, and record producer. He is noted for his sonic versatility and dark lyricism.',
  avatarUrl: null as string | null,
  verified: true,
  followers: '45.2M',
  monthlyListeners: '87.4M',
};

const MOCK_POPULAR_TRACKS: Track[] = [
  { id: '1', title: 'Blinding Lights', artistName: 'The Weeknd', duration: 200, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '2', title: 'Starboy', artistName: 'The Weeknd', duration: 230, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '3', title: 'Save Your Tears', artistName: 'The Weeknd', duration: 215, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '4', title: 'Die For You', artistName: 'The Weeknd', duration: 261, audioUrl: '', coverUrl: null, source: 'jamendo' },
  { id: '5', title: 'The Hills', artistName: 'The Weeknd', duration: 242, audioUrl: '', coverUrl: null, source: 'jamendo' },
];

const MOCK_ALBUMS = [
  { id: '1', title: 'After Hours', year: '2020', coverUrl: null },
  { id: '2', title: 'Starboy', year: '2016', coverUrl: null },
  { id: '3', title: 'Beauty Behind the Madness', year: '2015', coverUrl: null },
];

export default function ArtistProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { loadAndPlay } = usePlayerStore();
  const [isFollowing, setIsFollowing] = useState(false);

  async function handleTrackPress(track: Track) {
    await loadAndPlay(track, MOCK_POPULAR_TRACKS);
    router.push(`/player/${track.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>

        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: colors.primaryContainer }]}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </TouchableOpacity>

          {/* Artist Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {MOCK_ARTIST.avatarUrl ? (
              <Image source={{ uri: MOCK_ARTIST.avatarUrl }} style={StyleSheet.absoluteFill} />
            ) : (
              <Text style={{ fontSize: 56 }}>🎤</Text>
            )}
          </View>
        </View>

        {/* Artist Info */}
        <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <ThemedText variant="headlineMedium" fontWeight="black">
              {MOCK_ARTIST.name}
            </ThemedText>
            {MOCK_ARTIST.verified && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </View>

          <ThemedText variant="bodySmall" color={colors.secondaryText} style={{ marginTop: 4 }}>
            {MOCK_ARTIST.monthlyListeners} monthly listeners
          </ThemedText>

          {/* Stats */}
          <View style={[styles.statsRow, { borderColor: colors.divider }]}>
            <View style={styles.statItem}>
              <ThemedText variant="titleMedium" fontWeight="black">{MOCK_ARTIST.followers}</ThemedText>
              <ThemedText variant="bodySmall" color={colors.secondaryText}>Followers</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <ThemedText variant="titleMedium" fontWeight="black">{MOCK_ARTIST.monthlyListeners}</ThemedText>
              <ThemedText variant="bodySmall" color={colors.secondaryText}>Monthly Listeners</ThemedText>
            </View>
          </View>

          {/* Follow / Play buttons */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            <TouchableOpacity
              style={[
                styles.followBtn,
                {
                  backgroundColor: isFollowing ? colors.primaryContainer : colors.primary,
                  borderColor: colors.primary,
                  borderWidth: isFollowing ? 1.5 : 0,
                },
              ]}
              onPress={() => setIsFollowing(!isFollowing)}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  color: isFollowing ? colors.primary : colors.onPrimary,
                  fontSize: FontSizes.labelLarge,
                  fontWeight: FontWeights.bold,
                  fontFamily: 'DMSans_700Bold',
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconActionBtn, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => handleTrackPress(MOCK_POPULAR_TRACKS[0])}
            >
              <Ionicons name="shuffle" size={20} color={colors.primaryText} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconActionBtn, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.primaryText} />
            </TouchableOpacity>
          </View>

          {/* Bio */}
          <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <ThemedText variant="bodySmall" color={colors.secondaryText} style={{ lineHeight: 20 }}>
              {MOCK_ARTIST.bio}
            </ThemedText>
          </View>
        </View>

        {/* Popular Tracks */}
        <View style={{ marginTop: Spacing.lg }}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="titleMedium" fontWeight="bold">Popular</ThemedText>
            <TouchableOpacity>
              <Text style={{ color: colors.primary, fontSize: FontSizes.labelLarge, fontFamily: 'DMSans_500Medium' }}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {MOCK_POPULAR_TRACKS.map((track, index) => (
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
                  width: 20,
                  textAlign: 'center',
                  fontFamily: 'DMSans_400Regular',
                }}
              >
                {index + 1}
              </Text>
              <View style={[styles.trackArt, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={{ fontSize: 18 }}>🎵</Text>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText variant="bodyMedium" fontWeight="medium" numberOfLines={1}>
                  {track.title}
                </ThemedText>
              </View>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-vertical" size={18} color={colors.hint} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Albums */}
        <View style={{ marginTop: Spacing.lg }}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="titleMedium" fontWeight="bold">Albums</ThemedText>
            <TouchableOpacity>
              <Text style={{ color: colors.primary, fontSize: FontSizes.labelLarge, fontFamily: 'DMSans_500Medium' }}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md }}
          >
            {MOCK_ALBUMS.map((album) => (
              <TouchableOpacity
                key={album.id}
                style={styles.albumCard}
                onPress={() => router.push({ pathname: '/album/[id]', params: { id: album.id } })}
                activeOpacity={0.8}
              >
                <View style={[styles.albumArt, { backgroundColor: colors.primaryContainer }]}>
                  {album.coverUrl ? (
                    <Image source={{ uri: album.coverUrl }} style={StyleSheet.absoluteFill} />
                  ) : (
                    <Text style={{ fontSize: 36 }}>💿</Text>
                  )}
                </View>
                <ThemedText variant="bodySmall" fontWeight="medium" numberOfLines={1} style={{ marginTop: 6 }}>
                  {album.title}
                </ThemedText>
                <ThemedText variant="labelSmall" color={colors.secondaryText}>
                  {album.year}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  backBtn: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: -60,
  },
  statsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radii.sm,
    marginVertical: Spacing.md,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statDivider: {
    width: 1,
  },
  followBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.xs,
    paddingVertical: 12,
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioCard: {
    borderRadius: Radii.sm,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  trackArt: {
    width: 40,
    height: 40,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumCard: {
    width: 130,
  },
  albumArt: {
    width: 130,
    height: 130,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
