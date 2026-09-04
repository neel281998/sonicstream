import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing, Radii, FontSizes } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import {
  ensureArtistForUser,
  getArtistTracks,
  deleteArtistTrack,
  ArtistProfile,
} from '@/services/artist';
import { usePlayerStore, Track } from '@/store/playerStore';

function formatDurationSec(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ArtistStudioScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { loadAndPlay } = usePlayerStore();

  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArtistData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const artistProfile = await ensureArtistForUser(userId);
      setArtist(artistProfile);
      if (artistProfile) {
        const artistTracks = await getArtistTracks(artistProfile.id);
        setTracks(artistTracks);
      }
    } catch (e) {
      console.warn('Artist data fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchArtistData();
  }, [fetchArtistData]);

  useFocusEffect(
    useCallback(() => {
      fetchArtistData();
    }, [fetchArtistData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchArtistData();
  }, [fetchArtistData]);

  const handlePlayTrack = async (track: Track) => {
    await loadAndPlay(track, tracks);
    router.push(`/player/${track.id}`);
  };

  const handleDeleteTrack = (track: Track) => {
    Alert.alert(
      'Delete Track',
      `Are you sure you want to delete "${track.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteArtistTrack(track.id);
            if (ok) {
              setTracks((prev) => prev.filter((t) => t.id !== track.id));
            } else {
              Alert.alert('Error', 'Failed to delete track.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <ThemedText variant="titleMedium" fontWeight="extrabold" style={{ flex: 1, textAlign: 'center' }}>
          Artist Studio
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/artist/upload')}
          style={[styles.headerAddBtn, { backgroundColor: colors.primaryContainer }]}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Artist Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.avatarBox, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="musical-note" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ThemedText variant="titleMedium" fontWeight="bold" numberOfLines={1}>
                {artist?.name || 'Artist'}
              </ThemedText>
              <Ionicons name="checkmark-circle" size={18} color="#2196F3" />
            </View>
            <ThemedText variant="bodySmall" color={colors.secondaryText}>
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} published
            </ThemedText>
          </View>
        </View>

        {/* Action Banner */}
        <TouchableOpacity
          style={[styles.uploadBanner, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/artist/upload')}
          activeOpacity={0.85}
        >
          <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.bannerTitle}>Upload New Music</Text>
            <Text style={styles.bannerSubtitle}>Distribute your music to SonicStream listeners</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Tracks List */}
        <View style={{ marginTop: Spacing.xl }}>
          <ThemedText variant="titleMedium" fontWeight="bold" style={{ marginBottom: Spacing.md }}>
            Your Tracks ({tracks.length})
          </ThemedText>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : tracks.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="musical-notes-outline" size={40} color={colors.hint} />
              <ThemedText variant="bodyMedium" fontWeight="bold" style={{ marginTop: Spacing.sm }}>
                No uploaded tracks yet
              </ThemedText>
              <ThemedText variant="bodySmall" color={colors.secondaryText} style={{ textAlign: 'center', marginTop: 4 }}>
                Upload your first audio track to start streaming to your audience.
              </ThemedText>
              <TouchableOpacity
                style={[styles.emptyUploadBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/artist/upload')}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Upload Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            tracks.map((t, idx) => (
              <View
                key={t.id}
                style={[styles.trackRow, { borderBottomColor: colors.divider }]}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  onPress={() => handlePlayTrack(t)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.trackThumb, { backgroundColor: colors.surfaceVariant }]}>
                    {t.coverUrl ? (
                      <Image source={{ uri: t.coverUrl }} style={{ width: '100%', height: '100%', borderRadius: Radii.xs }} />
                    ) : (
                      <Text style={{ fontSize: 18 }}>🎵</Text>
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <ThemedText variant="bodyMedium" fontWeight="bold" numberOfLines={1}>
                      {t.title}
                    </ThemedText>
                    <ThemedText variant="bodySmall" color={colors.secondaryText}>
                      {formatDurationSec(t.duration)}
                    </ThemedText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handlePlayTrack(t)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginRight: Spacing.md }}
                >
                  <Ionicons name="play-circle" size={32} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteTrack(t)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.hint} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 140,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: FontSizes.bodyMedium,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#FFFFFFCC',
    fontSize: FontSizes.bodySmall,
    marginTop: 2,
  },
  emptyBox: {
    padding: Spacing.xl,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyUploadBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radii.full,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  trackThumb: {
    width: 46,
    height: 46,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
