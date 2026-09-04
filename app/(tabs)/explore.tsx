import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { TrackItem } from '@/components/music/TrackItem';
import { Avatar } from '@/components/ui/Avatar';
import { usePlayerStore, Track } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { getTracksByTag, mapJamendoTrack } from '@/lib/jamendo';
import {
  searchUnifiedMusic,
  getRecentCommunityTracks,
  SearchArtistItem,
} from '@/services/tracks';
import { Spacing, Radii, FontSizes, FontWeights } from '@/constants/Theme';

const GENRES = [
  { label: '😌 Chill', tag: 'lofi', color: '#A8B5A0' },
  { label: '🎸 Rock', tag: 'rock', color: '#C4A882' },
  { label: '💃 Pop', tag: 'pop', color: '#D4A5A5' },
  { label: '🎹 Jazz', tag: 'jazz', color: '#B5A0C8' },
  { label: '🎛️ Electronic', tag: 'electronic', color: '#A0B5C8' },
  { label: '🎻 Classical', tag: 'classical', color: '#C8B5A0' },
  { label: '🏠 House', tag: 'house', color: '#A0C8B5' },
  { label: '🎤 Hip-Hop', tag: 'hiphop', color: '#C8A0A0' },
];

export default function ExploreScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { loadAndPlay } = usePlayerStore();
  const profile = useAuthStore((s) => s.profile);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [artistResults, setArtistResults] = useState<SearchArtistItem[]>([]);
  const [recentUploads, setRecentUploads] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load recently uploaded songs on mount
  useEffect(() => {
    let mounted = true;
    getRecentCommunityTracks(10)
      .then((tracks) => {
        if (mounted && tracks.length > 0) {
          setRecentUploads(tracks);
        }
      })
      .catch((e) => console.warn('[explore] recent uploads load error:', e));

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setArtistResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const { tracks, artists } = await searchUnifiedMusic(text);
      setResults(tracks);
      setArtistResults(artists);
      setHasSearched(true);
    } catch (e) {
      console.warn('Unified search error:', e);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleGenrePress(tag: string) {
    const tracks = await getTracksByTag(tag, 20);
    const queue = tracks.map(mapJamendoTrack);
    if (queue.length > 0) {
      await loadAndPlay(queue[0], queue);
      router.push(`/player/${queue[0].id}`);
    }
  }

  async function handleTrackPress(track: Track) {
    await loadAndPlay(track, results.length > 0 ? results : [track]);
    router.push(`/player/${track.id}`);
  }

  function handleArtistPress(artist: SearchArtistItem) {
    router.push(`/artist/${artist.id}`);
  }

  const userInitials = profile?.username ?? 'JD';

  return (
    <GradientBackground>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.lg,
            }}
          >
            <ThemedText variant="headlineMedium" fontWeight="extrabold">
              Explore
            </ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <TouchableOpacity>
                <Ionicons name="notifications-outline" size={24} color={colors.primaryText} />
              </TouchableOpacity>
              <Avatar text={userInitials} size={36} />
            </View>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: colors.secondaryBackground }]}>
            <Ionicons name="search" size={18} color={colors.secondaryText} />
            <TextInput
              value={query}
              onChangeText={handleSearch}
              placeholder="Search songs, artists, or genres"
              placeholderTextColor={colors.hint}
              style={{
                flex: 1,
                marginLeft: 8,
                color: colors.primaryText,
                fontSize: FontSizes.bodyMedium,
                fontFamily: 'DMSans_400Regular',
              }}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setResults([]);
                  setArtistResults([]);
                  setHasSearched(false);
                }}
              >
                <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        {hasSearched || query.length > 1 ? (
          <View style={{ flex: 1 }}>
            {isSearching ? (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.primary} size="large" />
                <ThemedText
                  variant="bodySmall"
                  color={colors.secondaryText}
                  style={{ marginTop: Spacing.sm }}
                >
                  Searching songs and artists...
                </ThemedText>
              </View>
            ) : results.length === 0 && artistResults.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons name="search" size={48} color={colors.hint} />
                <ThemedText variant="bodyLarge" color={colors.hint} style={{ marginTop: Spacing.sm }}>
                  No results found for "{query}"
                </ThemedText>
                <ThemedText
                  variant="bodySmall"
                  color={colors.secondaryText}
                  style={{ marginTop: Spacing.xs, textAlign: 'center', paddingHorizontal: Spacing.xl }}
                >
                  Try searching by artist name, track title, or check spelling.
                </ThemedText>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={{ paddingBottom: 140 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Matching Artists Section */}
                {artistResults.length > 0 && (
                  <View style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
                    <ThemedText
                      variant="titleSmall"
                      fontWeight="bold"
                      style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm }}
                    >
                      Artists
                    </ThemedText>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.md }}
                    >
                      {artistResults.map((artist) => (
                        <TouchableOpacity
                          key={artist.id}
                          style={[
                            styles.artistCard,
                            {
                              backgroundColor: colors.surfaceVariant,
                              borderColor: colors.divider,
                            },
                          ]}
                          onPress={() => handleArtistPress(artist)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.artistAvatar}>
                            {artist.avatarUrl ? (
                              <Image
                                source={{ uri: artist.avatarUrl }}
                                style={StyleSheet.absoluteFill}
                                contentFit="cover"
                              />
                            ) : (
                              <Text style={{ fontSize: 24 }}>🎤</Text>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <ThemedText variant="labelMedium" fontWeight="bold" numberOfLines={1}>
                              {artist.name}
                            </ThemedText>
                            {artist.verified && (
                              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                            )}
                          </View>
                          <ThemedText variant="labelSmall" color={colors.secondaryText}>
                            Artist
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Tracks Section */}
                {results.length > 0 && (
                  <View style={{ marginTop: Spacing.sm }}>
                    <ThemedText
                      variant="titleSmall"
                      fontWeight="bold"
                      style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.xs }}
                    >
                      Songs ({results.length})
                    </ThemedText>
                    {results.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.listTrack, { borderBottomColor: colors.divider }]}
                        onPress={() => handleTrackPress(item)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.listArt, { backgroundColor: colors.surfaceVariant }]}>
                          {item.coverUrl ? (
                            <Image
                              source={{ uri: item.coverUrl }}
                              style={StyleSheet.absoluteFill}
                              contentFit="cover"
                              transition={150}
                            />
                          ) : (
                            <Text style={{ fontSize: 20 }}>🎵</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText variant="bodyMedium" fontWeight="medium" numberOfLines={1}>
                            {item.title}
                          </ThemedText>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <ThemedText
                              variant="bodySmall"
                              color={colors.secondaryText}
                              numberOfLines={1}
                              style={{ flexShrink: 1 }}
                            >
                              {item.artistName}
                            </ThemedText>
                            {item.source === 'upload' && (
                              <View
                                style={[
                                  styles.uploadBadge,
                                  { backgroundColor: colors.primaryContainer },
                                ]}
                              >
                                <ThemedText
                                  variant="labelSmall"
                                  color={colors.primary}
                                  fontWeight="bold"
                                  style={{ fontSize: 10 }}
                                >
                                  Uploaded
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons name="play-circle" size={24} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            {/* Recently Uploaded / Community Tracks */}
            {recentUploads.length > 0 && (
              <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: Spacing.lg,
                    marginBottom: Spacing.sm,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="sparkles" size={18} color={colors.primary} />
                    <ThemedText variant="titleMedium" fontWeight="bold">
                      Recently Uploaded
                    </ThemedText>
                  </View>
                  <ThemedText variant="labelMedium" color={colors.primary} fontWeight="bold">
                    Community
                  </ThemedText>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}
                >
                  {recentUploads.map((track) => (
                    <TrackItem key={track.id} track={track} onPress={handleTrackPress} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Browse Genres */}
            <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: Spacing.md,
                }}
              >
                <ThemedText variant="titleMedium" fontWeight="bold">
                  Browse Genres
                </ThemedText>
              </View>
              <View style={styles.genreGrid}>
                {GENRES.map((genre) => (
                  <TouchableOpacity
                    key={genre.tag}
                    style={[styles.genreCard, { backgroundColor: genre.color }]}
                    onPress={() => handleGenrePress(genre.tag)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: FontSizes.titleSmall,
                        fontWeight: FontWeights.bold,
                        color: '#1C1B18',
                        fontFamily: 'DMSans_700Bold',
                      }}
                    >
                      {genre.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 12,
    gap: 6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  artistCard: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    width: 100,
  },
  artistAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
  },
  listTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  listArt: {
    width: 48,
    height: 48,
    borderRadius: Radii.xs,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genreCard: {
    width: '47%',
    height: 80,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
