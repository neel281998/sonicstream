import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  Image,
  Alert,
  AlertButton,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing, Radii, FontSizes } from '@/constants/Theme';
import {
  getPlaylistWithTracks,
  deletePlaylist,
  removeTrackFromPlaylist,
  PlaylistDetail,
} from '@/services/playlists';
import { usePlayerStore } from '@/store/playerStore';
import { useLikesStore } from '@/store/likesStore';
import { useAuthStore } from '@/store/authStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function totalDuration(tracks: { duration: number }[]): string {
  const totalSeconds = tracks.reduce((acc, t) => acc + t.duration, 0);
  const m = Math.floor(totalSeconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h} hr ${remM} min`;
}

export default function PlaylistDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadAndPlay } = usePlayerStore();
  const userId = useAuthStore((s) => s.user?.id);

  const isLikedPlaylist = id === 'liked';
  const likedTracks = useLikesStore((s) => s.likedTracks);
  const unlikeTrack = useLikesStore((s) => s.unlikeTrack);

  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(!isLikedPlaylist);

  useEffect(() => {
    if (!id || isLikedPlaylist) {
      setLoading(false);
      return;
    }
    getPlaylistWithTracks(id)
      .then(setPlaylist)
      .finally(() => setLoading(false));
  }, [id, isLikedPlaylist]);

  const rawTracks = isLikedPlaylist ? likedTracks : (playlist?.tracks ?? []);
  const activeTracks = useMemo(() => {
    const seen = new Set<string>();
    return rawTracks.filter((t: any) => {
      const key = t.jamendoId ? `jamendo-${t.jamendoId}` : t.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawTracks]);
  const title = isLikedPlaylist ? 'Liked Songs' : (playlist?.title ?? 'Playlist');
  const description = isLikedPlaylist ? 'Songs you saved to your favorites' : playlist?.description;

  const isOwner = !isLikedPlaylist && !!playlist && !!userId && playlist.ownerId === userId;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Listen to "${title}" on SonicStream!`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const confirmDeletePlaylist = () => {
    if (!playlist) return;
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deletePlaylist(playlist.id);
            if (ok) {
              router.back();
            } else {
              Alert.alert('Error', 'Could not delete playlist.');
            }
          },
        },
      ]
    );
  };

  const handleMenuPress = () => {
    const options: AlertButton[] = [
      {
        text: 'Share Playlist',
        onPress: () => {
          handleShare();
        },
      },
    ];
    if (isOwner) {
      options.push({
        text: 'Delete Playlist',
        style: 'destructive',
        onPress: confirmDeletePlaylist,
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(title, undefined, options);
  };

  const handleRemoveTrack = (track: any) => {
    if (!playlist) return;
    Alert.alert(
      'Remove Song',
      `Remove "${track.title}" from this playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const ok = await removeTrackFromPlaylist(playlist.id, track.id);
            if (ok) {
              setPlaylist((prev) =>
                prev ? { ...prev, tracks: prev.tracks.filter((t) => t.id !== track.id) } : null
              );
            } else {
              Alert.alert('Error', 'Could not remove track.');
            }
          },
        },
      ]
    );
  };

  async function handlePlayAll() {
    if (activeTracks.length === 0) return;
    await loadAndPlay(activeTracks[0], activeTracks);
    router.push(`/player/${activeTracks[0].id}`);
  }

  async function handleTrackPress(index: number) {
    const track = activeTracks[index];
    if (!track) return;
    await loadAndPlay(track, activeTracks);
    router.push(`/player/${track.id}`);
  }

  async function handleUnlike(index: number) {
    const track = activeTracks[index];
    if (!track) return;
    await unlikeTrack(track, userId);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!isLikedPlaylist && !playlist) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText variant="bodyLarge" color={colors.hint}>Playlist not found</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          <ThemedText variant="labelLarge" color={colors.primary}>Go Back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <ThemedText variant="titleMedium" fontWeight="bold" style={{ flex: 1, textAlign: 'center' }}>
          {isLikedPlaylist ? 'Liked Songs' : 'Playlist'}
        </ThemedText>
        <TouchableOpacity onPress={handleMenuPress} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Playlist Art */}
        <View
          style={[
            styles.artCard,
            { backgroundColor: isLikedPlaylist ? '#FF408115' : colors.primaryContainer },
          ]}
        >
          {isLikedPlaylist ? (
            <Ionicons name="heart" size={76} color="#E91E63" />
          ) : playlist?.coverUrl ? (
            <Image source={{ uri: playlist.coverUrl }} style={styles.artImage} />
          ) : (
            <Text style={{ fontSize: 64 }}>🎵</Text>
          )}
        </View>

        {/* Info */}
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          <ThemedText variant="headlineSmall" fontWeight="black">{title}</ThemedText>
          {description ? (
            <ThemedText variant="bodySmall" color={colors.secondaryText} style={{ marginTop: 4 }}>
              {description}
            </ThemedText>
          ) : null}
          <ThemedText variant="bodySmall" color={colors.secondaryText} style={{ marginTop: 4 }}>
            {activeTracks.length} {activeTracks.length === 1 ? 'song' : 'songs'}
            {activeTracks.length > 0 ? ` • ${totalDuration(activeTracks)}` : ''}
          </ThemedText>
        </View>

        {/* Play button */}
        {activeTracks.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
            <TouchableOpacity
              style={[styles.playAllBtn, { backgroundColor: isLikedPlaylist ? '#E91E63' : colors.primary }]}
              onPress={handlePlayAll}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFFFFF', fontSize: FontSizes.labelLarge, fontFamily: 'DMSans_700Bold' }}>
                Play All
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Track List */}
        {activeTracks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={isLikedPlaylist ? 'heart-dislike-outline' : 'musical-notes-outline'}
              size={48}
              color={colors.hint}
            />
            <ThemedText variant="bodyMedium" color={colors.hint} style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
              {isLikedPlaylist
                ? 'No liked songs yet. Tap the heart on any track to add it here.'
                : 'This playlist is empty.'}
            </ThemedText>
          </View>
        ) : (
          activeTracks.map((track, i) => (
            <TouchableOpacity
              key={`${track.id}-${i}`}
              style={[styles.trackRow, { borderBottomColor: colors.divider }]}
              activeOpacity={0.7}
              onPress={() => handleTrackPress(i)}
            >
              <Text style={{ color: colors.hint, fontSize: FontSizes.labelMedium, width: 24, textAlign: 'center' }}>
                {i + 1}
              </Text>

              {track.coverUrl ? (
                <Image source={{ uri: track.coverUrl }} style={styles.trackThumb} />
              ) : (
                <View style={[styles.trackThumb, { backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 14 }}>🎵</Text>
                </View>
              )}

              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <ThemedText variant="bodyMedium" fontWeight="medium" numberOfLines={1}>{track.title}</ThemedText>
                <ThemedText variant="bodySmall" color={colors.secondaryText} numberOfLines={1}>{track.artistName}</ThemedText>
              </View>

              <ThemedText variant="bodySmall" color={colors.hint} style={{ marginRight: Spacing.sm }}>
                {formatDuration(track.duration)}
              </ThemedText>

              {isLikedPlaylist ? (
                <TouchableOpacity
                  onPress={() => handleUnlike(i)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="heart" size={20} color="#E91E63" />
                </TouchableOpacity>
              ) : isOwner ? (
                <TouchableOpacity
                  onPress={() => handleRemoveTrack(track)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.hint} />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  artCard: {
    width: 180,
    height: 180,
    borderRadius: Radii.md,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
    overflow: 'hidden',
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.xs,
    paddingVertical: 12,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  trackThumb: {
    width: 40,
    height: 40,
    borderRadius: Radii.xs,
    marginLeft: Spacing.xs,
  },
  emptyContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
});
