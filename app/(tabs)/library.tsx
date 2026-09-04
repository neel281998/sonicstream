import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radii, FontSizes } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useFocusEffect } from 'expo-router';
import { getLibraryCounts, getUserPlaylists, PlaylistSummary } from '@/services/playlists';
import { useLikesStore } from '@/store/likesStore';
import { CreatePlaylistModal } from '@/components/music/CreatePlaylistModal';

export default function LibraryScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.user?.id);

  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [counts, setCounts] = useState({ playlists: 0, liked: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchLibrary = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const [userPlaylists, libraryCounts] = await Promise.all([
        getUserPlaylists(userId),
        getLibraryCounts(userId),
      ]);
      setPlaylists(userPlaylists);
      setCounts(libraryCounts);
    } catch (e) {
      console.warn('Library fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  useFocusEffect(
    useCallback(() => {
      fetchLibrary();
    }, [fetchLibrary])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLibrary();
  }, [fetchLibrary]);

  const likedTracks = useLikesStore((s) => s.likedTracks);
  const likedCount = Math.max(counts.liked, likedTracks.length);

  const librarySections = [
    { id: 'playlists', icon: 'list', label: 'Playlists', count: counts.playlists },
    { id: 'liked', icon: 'heart', label: 'Liked Songs', count: likedCount },
    { id: 'albums', icon: 'disc', label: 'Albums', count: 0 },
    { id: 'artists', icon: 'people', label: 'Following', count: 0 },
  ];

  const handleSectionPress = (sectionId: string) => {
    if (sectionId === 'liked') {
      router.push('/playlist/liked');
    }
  };

  const handlePlaylistCreated = (newPlaylist: PlaylistSummary) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
    setCounts((prev) => ({ ...prev, playlists: prev.playlists + 1 }));
    router.push(`/playlist/${newPlaylist.id}`);
  };

  return (
    <GradientBackground>
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={[styles.header]}>
          <ThemedText variant="headlineMedium" fontWeight="extrabold">Your Library</ThemedText>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primaryContainer }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.7}
            accessibilityLabel="Create new playlist"
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Access */}
        <View style={[styles.section, { borderBottomColor: colors.divider }]}>
          {librarySections.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.quickRow}
              activeOpacity={0.7}
              onPress={() => handleSectionPress(s.id)}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name={s.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText variant="bodyMedium" fontWeight="medium">{s.label}</ThemedText>
                <ThemedText variant="bodySmall" color={colors.secondaryText}>{s.count} items</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.hint} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Playlists */}
        <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="titleMedium" fontWeight="bold">Your Playlists</ThemedText>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.lg }} />
          ) : playlists.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="musical-notes-outline" size={32} color={colors.hint} />
              <ThemedText variant="bodyMedium" color={colors.secondaryText} style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
                No playlists yet. Create one to start collecting tracks.
              </ThemedText>
            </View>
          ) : (
            playlists.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.playlistRow, { borderBottomColor: colors.divider }]}
                onPress={() => router.push(`/playlist/${p.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.playlistArt, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 24 }}>🎵</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="bodyMedium" fontWeight="medium" numberOfLines={1}>
                    {p.title}
                  </ThemedText>
                  <ThemedText variant="bodySmall" color={colors.secondaryText}>
                    {p.trackCount} {p.trackCount === 1 ? 'song' : 'songs'}
                  </ThemedText>
                </View>
                <TouchableOpacity>
                  <Ionicons name="play-circle" size={36} color={colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upload (for artists) */}
        {profile?.is_artist && (
          <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
            <TouchableOpacity
              style={[styles.uploadCard, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }]}
              onPress={() => router.push('/artist/studio')}
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
              <ThemedText variant="titleSmall" fontWeight="bold" color={colors.primary} style={{ marginTop: 6 }}>
                Artist Studio & Upload
              </ThemedText>
              <ThemedText variant="bodySmall" color={colors.secondaryText} style={{ marginTop: 2, textAlign: 'center' }}>
                Upload new music and manage your tracks
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>

    <CreatePlaylistModal
      visible={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      onCreated={handlePlaylistCreated}
    />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyState: {
    borderRadius: Radii.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  playlistArt: {
    width: 52,
    height: 52,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCard: {
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
