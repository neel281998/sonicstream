import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { TrackItem } from '@/components/music/TrackItem';
import { RadioCard } from '@/components/music/RadioCard';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { usePlayerStore, Track } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { getPopularTracks, getNewReleases, mapJamendoTrack } from '@/lib/jamendo';
import { getListenAgainTracks } from '@/services/listenHistory';
import { buildRadioQueue, getRadioStations, RadioStation } from '@/services/radio';
import { Spacing, Radii, FontSizes } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

const CATEGORIES = ['All', 'Music', 'Podcasts', 'Live', 'Gaming'];
const HOME_CACHE_KEY = '@sonicstream_home_cache';

export default function HomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { loadAndPlay } = usePlayerStore();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.user?.id);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listenAgainTracks, setListenAgainTracks] = useState<Track[]>([]);
  const [newReleaseTracks, setNewReleaseTracks] = useState<Track[]>([]);
  const [radioStations, setRadioStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCachedHome = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(HOME_CACHE_KEY);
      if (cached) {
        const { quick, releases, stations } = JSON.parse(cached);
        if (quick?.length) setListenAgainTracks(quick);
        if (releases?.length) setNewReleaseTracks(releases);
        if (stations?.length) setRadioStations(stations);
        setLoading(false);
      }
    } catch {}
  }, []);

  const fetchHomeData = useCallback(async () => {
    try {
      const [listenAgainResult, popularResult, newReleasesResult, stationsResult] =
        await Promise.allSettled([
          userId ? getListenAgainTracks(userId, 8) : Promise.resolve([]),
          getPopularTracks(12),
          getNewReleases(12),
          getRadioStations(),
        ]);

      const listenAgain = listenAgainResult.status === 'fulfilled' ? listenAgainResult.value : [];
      const popular = popularResult.status === 'fulfilled' ? popularResult.value : [];
      const newReleases = newReleasesResult.status === 'fulfilled' ? newReleasesResult.value : [];
      const stations = stationsResult.status === 'fulfilled' ? stationsResult.value : [];

      // Quick picks: use listen history if available; otherwise use top popular
      const quickPicks =
        listenAgain.length > 0
          ? listenAgain.slice(0, 4)
          : popular.slice(0, 4).map(mapJamendoTrack);

      // New Releases: use new releases; fallback to popular slice(4)
      const mappedNewReleases =
        newReleases.length > 0
          ? newReleases.map(mapJamendoTrack)
          : popular.slice(4).map(mapJamendoTrack);

      if (quickPicks.length > 0) setListenAgainTracks(quickPicks);
      if (mappedNewReleases.length > 0) setNewReleaseTracks(mappedNewReleases);
      if (stations.length > 0) setRadioStations(stations);

      // Cache for instant next load
      AsyncStorage.setItem(
        HOME_CACHE_KEY,
        JSON.stringify({
          quick: quickPicks,
          releases: mappedNewReleases,
          stations,
        })
      ).catch(() => {});
    } catch (e) {
      console.warn('Home fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCachedHome();
    fetchHomeData();
  }, [loadCachedHome, fetchHomeData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData();
  }, [fetchHomeData]);

  async function handleTrackPress(track: Track, queue: Track[]) {
    await loadAndPlay(track, queue);
    router.push(`/player/${track.id}`);
  }

  async function handleRadioPress(station: RadioStation) {
    try {
      const queue = await buildRadioQueue(station.genreTag);
      if (queue.length > 0) {
        await loadAndPlay(queue[0], queue);
        router.push(`/player/${queue[0].id}`);
      }
    } catch (e) {
      console.warn('Radio load error:', e);
    }
  }

  const userInitials = profile?.username ?? 'JD';

  return (
    <GradientBackground>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: Spacing.md }]}>
            <View style={styles.logoRow}>
              <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="musical-notes" size={18} color={colors.onPrimary} />
              </View>
              <ThemedText variant="titleLarge" fontWeight="black">
                SonicStream
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={24} color={colors.primaryText} />
              </TouchableOpacity>
              <Avatar text={userInitials} size={36} />
            </View>
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, paddingTop: Spacing.xs, gap: Spacing.xs }}
          >
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
              />
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <>
              {/* Quick Picks — Grid style */}
              {listenAgainTracks.length > 0 && (
                <SectionBlock title="Quick Picks" onSeeAll={() => {}}>
                  <View style={styles.quickPicksGrid}>
                    {listenAgainTracks.map((track) => (
                      <TouchableOpacity
                        key={track.id}
                        style={[styles.quickPickItem, { backgroundColor: colors.card }]}
                        onPress={() => handleTrackPress(track, listenAgainTracks)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.quickPickArt, { backgroundColor: colors.surfaceVariant }]}>
                          {track.coverUrl ? (
                            <Image
                              source={{ uri: track.coverUrl }}
                              style={{ width: '100%', height: '100%' }}
                              contentFit="cover"
                              transition={200}
                            />
                          ) : (
                            <Text style={{ fontSize: 18 }}>🎵</Text>
                          )}
                        </View>
                        <View style={styles.quickPickInfo}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: colors.primaryText,
                              fontSize: FontSizes.bodySmall,
                              fontWeight: '500',
                              fontFamily: 'DMSans_500Medium',
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
                            }}
                          >
                            {track.artistName}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </SectionBlock>
              )}

              {/* Listen Again */}
              {listenAgainTracks.length > 0 && (
                <SectionBlock title="Listen Again" onSeeAll={() => {}}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.xs }}>
                    {listenAgainTracks.map((track) => (
                      <TrackItem key={track.id} track={track} onPress={(t) => handleTrackPress(t, listenAgainTracks)} />
                    ))}
                  </ScrollView>
                </SectionBlock>
              )}

              {/* New Releases */}
              {newReleaseTracks.length > 0 && (
                <SectionBlock title="New Releases" onSeeAll={() => {}}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.xs }}>
                    {newReleaseTracks.map((track) => (
                      <TrackItem key={track.id} track={track} onPress={(t) => handleTrackPress(t, newReleaseTracks)} />
                    ))}
                  </ScrollView>
                </SectionBlock>
              )}

              {/* Recommended Radios */}
              <SectionBlock title="Recommended Radios" onSeeAll={() => {}}>
                {radioStations.length === 0 ? (
                  <ThemedText variant="bodyMedium" color={colors.hint} style={{ paddingHorizontal: Spacing.lg }}>
                    No radio stations found. Check your Supabase connection.
                  </ThemedText>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.xs }}>
                    {radioStations.map((station) => (
                      <RadioCard
                        key={station.id}
                        title={station.title}
                        subtitle={station.subtitle ?? ''}
                        coverUrl={station.coverUrl}
                        genreTag={station.genreTag}
                        onPress={() => handleRadioPress(station)}
                      />
                    ))}
                  </ScrollView>
                )}
              </SectionBlock>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function SectionBlock({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll: () => void;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <View style={[styles.sectionHeader, { paddingHorizontal: Spacing.lg }]}>
        <ThemedText variant="titleMedium" fontWeight="extrabold">
          {title}
        </ThemedText>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ color: colors.primary, fontSize: FontSizes.labelLarge, fontFamily: 'DMSans_500Medium' }}>
            See All
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: Spacing.sm }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loading: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  quickPicksGrid: {
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  quickPickItem: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.xs,
    overflow: 'hidden',
    height: 56,
  },
  quickPickArt: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  quickPickInfo: {
    flex: 1,
    paddingHorizontal: Spacing.xs + 2,
  },
});
