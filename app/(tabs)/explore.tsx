import React, { useState } from 'react';
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
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { TrackItem } from '@/components/music/TrackItem';
import { Avatar } from '@/components/ui/Avatar';
import { usePlayerStore, Track } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { searchTracks, getTracksByTag, mapJamendoTrack } from '@/lib/jamendo';
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
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    try {
      const tracks = await searchTracks(text, 20);
      setResults(tracks.map(mapJamendoTrack));
      setHasSearched(true);
    } catch (e) {
      console.warn('Search error:', e);
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
    await loadAndPlay(track, results);
    router.push(`/player/${track.id}`);
  }

  const userInitials = profile?.username ?? 'JD';

  return (
    <GradientBackground>
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
          <ThemedText variant="headlineMedium" fontWeight="extrabold">Explore</ThemedText>
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
            placeholder="Artists, songs, or lyrics"
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
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
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
            </View>
          ) : results.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="search" size={48} color={colors.hint} />
              <ThemedText variant="bodyLarge" color={colors.hint} style={{ marginTop: Spacing.sm }}>
                No results for "{query}"
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(t) => t.id}
              contentContainerStyle={{ paddingBottom: 140 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.listTrack, { borderBottomColor: colors.divider }]}
                  onPress={() => handleTrackPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.listArt, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={{ fontSize: 20 }}>🎵</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="bodyMedium" fontWeight="medium" numberOfLines={1}>
                      {item.title}
                    </ThemedText>
                    <ThemedText variant="bodySmall" color={colors.secondaryText} numberOfLines={1}>
                      {item.artistName}
                    </ThemedText>
                  </View>
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.hint} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 140 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
            <ThemedText variant="titleMedium" fontWeight="bold">Browse Genres</ThemedText>
            <Text style={{ color: colors.primary, fontSize: FontSizes.labelLarge, fontFamily: 'DMSans_500Medium' }}>See all</Text>
          </View>
          <View style={styles.genreGrid}>
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre.tag}
                style={[styles.genreCard, { backgroundColor: genre.color }]}
                onPress={() => handleGenrePress(genre.tag)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: FontSizes.titleSmall, fontWeight: FontWeights.bold, color: '#1C1B18', fontFamily: 'DMSans_700Bold' }}>
                  {genre.label}
                </Text>
              </TouchableOpacity>
            ))}
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
  listTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  listArt: {
    width: 44,
    height: 44,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
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
