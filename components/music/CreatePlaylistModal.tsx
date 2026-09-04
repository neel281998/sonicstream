import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing, Radii, FontSizes } from '@/constants/Theme';
import { createPlaylist, PlaylistSummary } from '@/services/playlists';
import { useAuthStore } from '@/store/authStore';

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (newPlaylist: PlaylistSummary) => void;
}

export function CreatePlaylistModal({
  visible,
  onClose,
  onCreated,
}: CreatePlaylistModalProps) {
  const colors = useThemeColors();
  const userId = useAuthStore((s) => s.user?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIsPublic(false);
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Validation Error', 'Please enter a playlist name.');
      return;
    }
    if (!userId) {
      Alert.alert('Authentication Required', 'Please sign in to create a playlist.');
      return;
    }

    try {
      setLoading(true);
      const newPlaylist = await createPlaylist(userId, trimmedTitle, description, isPublic);
      if (newPlaylist) {
        resetForm();
        onCreated?.(newPlaylist);
        onClose();
      } else {
        Alert.alert('Error', 'Unable to create playlist. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create playlist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.divider,
                  shadowColor: '#000000',
                },
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBubble, { backgroundColor: colors.primaryContainer }]}>
                    <Ionicons name="musical-notes" size={20} color={colors.primary} />
                  </View>
                  <ThemedText variant="titleMedium" fontWeight="extrabold">
                    New Playlist
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={loading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color={colors.hint} />
                </TouchableOpacity>
              </View>

              {/* Title Input */}
              <View style={styles.inputGroup}>
                <ThemedText variant="labelMedium" fontWeight="bold" color={colors.secondaryText}>
                  Playlist Name *
                </ThemedText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Chill Vibes, Night Drive"
                  placeholderTextColor={colors.hint}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surfaceVariant,
                      color: colors.primaryText,
                      borderColor: colors.divider,
                    },
                  ]}
                  maxLength={60}
                  autoFocus
                  returnKeyType="next"
                />
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <ThemedText variant="labelMedium" fontWeight="bold" color={colors.secondaryText}>
                  Description (Optional)
                </ThemedText>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Give your playlist a mood or description..."
                  placeholderTextColor={colors.hint}
                  style={[
                    styles.textInput,
                    styles.textArea,
                    {
                      backgroundColor: colors.surfaceVariant,
                      color: colors.primaryText,
                      borderColor: colors.divider,
                    },
                  ]}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              {/* Public Toggle */}
              <View style={[styles.toggleRow, { borderTopColor: colors.divider }]}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <ThemedText variant="bodyMedium" fontWeight="medium">
                    Make Public
                  </ThemedText>
                  <ThemedText variant="bodySmall" color={colors.hint}>
                    Allow other listeners to discover this playlist
                  </ThemedText>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn, { borderColor: colors.divider }]}
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.createBtn,
                    { backgroundColor: colors.primary, opacity: title.trim().length === 0 || loading ? 0.6 : 1 },
                  ]}
                  onPress={handleCreate}
                  disabled={title.trim().length === 0 || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createBtnText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  textInput: {
    height: 48,
    borderRadius: Radii.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.bodyMedium,
    fontFamily: 'DMSans_400Regular',
    marginTop: 6,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: FontSizes.labelMedium,
    fontFamily: 'DMSans_700Bold',
  },
  createBtn: {},
  createBtnText: {
    color: '#FFFFFF',
    fontSize: FontSizes.labelMedium,
    fontFamily: 'DMSans_700Bold',
  },
});
