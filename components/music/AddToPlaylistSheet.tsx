import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing, Radii, FontSizes } from '@/constants/Theme';
import {
  getUserPlaylists,
  addTrackToPlaylist,
  PlaylistSummary,
} from '@/services/playlists';
import { useAuthStore } from '@/store/authStore';
import type { Track } from '@/store/playerStore';
import { CreatePlaylistModal } from './CreatePlaylistModal';

interface AddToPlaylistSheetProps {
  visible: boolean;
  track: Track | null;
  onClose: () => void;
  onAdded?: (playlistTitle: string) => void;
}

export function AddToPlaylistSheet({
  visible,
  track,
  onClose,
  onAdded,
}: AddToPlaylistSheetProps) {
  const colors = useThemeColors();
  const userId = useAuthStore((s) => s.user?.id);

  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    if (!userId || !visible) return;
    try {
      setLoading(true);
      const list = await getUserPlaylists(userId);
      setPlaylists(list);
    } catch (e) {
      console.warn('Failed to load user playlists:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, visible]);

  useEffect(() => {
    if (visible) {
      setAddedIds(new Set());
      fetchPlaylists();
    }
  }, [visible, fetchPlaylists]);

  const handleSelectPlaylist = async (playlist: PlaylistSummary) => {
    if (!track || addingToId) return;

    try {
      setAddingToId(playlist.id);
      const result = await addTrackToPlaylist(playlist.id, track);

      if (result.success) {
        setAddedIds((prev) => new Set(prev).add(playlist.id));
        onAdded?.(playlist.title);
        // Automatically close after a short delay so user sees feedback
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        Alert.alert('Playlist', result.message || 'Could not add track to playlist.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add track.');
    } finally {
      setAddingToId(null);
    }
  };

  const handlePlaylistCreated = async (newPlaylist: PlaylistSummary) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
    // Automatically add the current track to this newly created playlist!
    if (track) {
      await handleSelectPlaylist(newPlaylist);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.divider,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.divider }]}>
              <View style={{ flex: 1 }}>
                <ThemedText variant="titleMedium" fontWeight="extrabold">
                  Add to Playlist
                </ThemedText>
                {track && (
                  <ThemedText
                    variant="bodySmall"
                    color={colors.secondaryText}
                    numberOfLines={1}
                    style={{ marginTop: 2 }}
                  >
                    {track.title} • {track.artistName}
                  </ThemedText>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            {/* New Playlist Row */}
            <TouchableOpacity
              style={[styles.newPlaylistRow, { borderBottomColor: colors.divider }]}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </View>
              <ThemedText variant="bodyLarge" fontWeight="bold" color={colors.primary} style={{ flex: 1 }}>
                New Playlist
              </ThemedText>
              <Ionicons name="chevron-forward" size={18} color={colors.hint} />
            </TouchableOpacity>

            {/* Playlists List */}
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <ThemedText variant="bodySmall" color={colors.hint} style={{ marginTop: Spacing.sm }}>
                  Loading playlists...
                </ThemedText>
              </View>
            ) : playlists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText variant="bodyMedium" color={colors.hint} style={{ textAlign: 'center' }}>
                  No playlists found. Create one above to get started!
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isAdding = addingToId === item.id;
                  const isAdded = addedIds.has(item.id);

                  return (
                    <TouchableOpacity
                      style={[styles.playlistRow, { borderBottomColor: colors.divider }]}
                      onPress={() => handleSelectPlaylist(item)}
                      disabled={isAdding || isAdded}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.playlistArt, { backgroundColor: colors.surfaceVariant }]}>
                        {item.coverUrl ? (
                          <Image
                            source={{ uri: item.coverUrl }}
                            style={{ width: '100%', height: '100%', borderRadius: Radii.xs }}
                          />
                        ) : (
                          <Text style={{ fontSize: 20 }}>🎵</Text>
                        )}
                      </View>

                      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                        <ThemedText variant="bodyMedium" fontWeight="medium" numberOfLines={1}>
                          {item.title}
                        </ThemedText>
                        <ThemedText variant="bodySmall" color={colors.secondaryText}>
                          {item.trackCount} {item.trackCount === 1 ? 'track' : 'tracks'}
                        </ThemedText>
                      </View>

                      {isAdding ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : isAdded ? (
                        <View style={styles.checkCircle}>
                          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                        </View>
                      ) : (
                        <Ionicons name="add-circle-outline" size={24} color={colors.hint} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Embedded Create Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePlaylistCreated}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetContainer: {
    maxHeight: '75%',
    minHeight: 320,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radii.full,
    backgroundColor: '#88888844',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: Spacing.xs,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPlaylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  playlistArt: {
    width: 44,
    height: 44,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
