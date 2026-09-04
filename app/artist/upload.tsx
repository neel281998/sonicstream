import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing, Radii, FontSizes, FontWeights } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { uploadAndPublishTrack } from '@/services/artist';
import { usePlayerStore } from '@/store/playerStore';

const AVAILABLE_GENRES = [
  'Pop',
  'Electronic',
  'Hip-Hop',
  'Rock',
  'Lo-Fi',
  'R&B',
  'Ambient',
  'Jazz',
  'Classical',
  'Indie',
];

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function ArtistUploadScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const profile = useAuthStore((s) => s.profile);
  const { loadAndPlay } = usePlayerStore();

  const [title, setTitle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['pop']);
  const [durationInput, setDurationInput] = useState('180');

  // Selected Assets
  const [audioAsset, setAudioAsset] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  } | null>(null);

  const [coverUri, setCoverUri] = useState<string | null>(null);

  // Status
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const toggleGenre = (genre: string) => {
    const lower = genre.toLowerCase();
    setSelectedGenres((prev) =>
      prev.includes(lower) ? prev.filter((g) => g !== lower) : [...prev, lower]
    );
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAudioAsset({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType || 'audio/mpeg',
        });

        // Auto-fill title from filename if title is empty
        if (!title.trim()) {
          const autoTitle = asset.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
          setTitle(autoTitle);
        }
      }
    } catch (err: any) {
      Alert.alert('Audio Selection Error', err?.message || 'Failed to select audio file.');
    }
  };

  const pickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Cover Selection Error', err?.message || 'Failed to select image.');
    }
  };

  const handlePublish = async () => {
    if (!audioAsset) {
      Alert.alert('Missing Audio', 'Please select an audio file to upload.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your track.');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'You must be signed in to upload tracks.');
      return;
    }

    const durationSec = parseInt(durationInput, 10) || 180;

    try {
      setIsUploading(true);
      setUploadStatus('Preparing upload...');

      const publishedTrack = await uploadAndPublishTrack({
        userId,
        title: title.trim(),
        audioUri: audioAsset.uri,
        audioName: audioAsset.name,
        audioMimeType: audioAsset.mimeType,
        coverUri: coverUri,
        durationSeconds: durationSec,
        genre: selectedGenres.length > 0 ? selectedGenres : ['pop'],
        onProgress: (status) => setUploadStatus(status),
      });

      setUploadStatus('Published successfully!');

      Alert.alert(
        'Track Published! 🎉',
        `"${publishedTrack.title}" is now live and available on SonicStream.`,
        [
          {
            text: 'Play Now',
            onPress: async () => {
              await loadAndPlay(publishedTrack, [publishedTrack]);
              router.replace(`/player/${publishedTrack.id}`);
            },
          },
          {
            text: 'Go to Library',
            onPress: () => router.replace('/(tabs)/library'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isUploading}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color={colors.primaryText} />
          </TouchableOpacity>
          <ThemedText variant="titleMedium" fontWeight="extrabold" style={{ flex: 1, textAlign: 'center' }}>
            Upload Track
          </ThemedText>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Audio Picker Box */}
          <ThemedText variant="labelLarge" fontWeight="bold" style={{ marginBottom: Spacing.xs }}>
            Audio File *
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.pickerBox,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: audioAsset ? colors.primary : colors.divider,
                borderStyle: audioAsset ? 'solid' : 'dashed',
              },
            ]}
            onPress={pickAudio}
            disabled={isUploading}
            activeOpacity={0.7}
          >
            <View style={[styles.pickerIcon, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons
                name={audioAsset ? 'checkmark-circle' : 'cloud-upload-outline'}
                size={28}
                color={audioAsset ? '#4CAF50' : colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="bodyMedium" fontWeight="bold" numberOfLines={1}>
                {audioAsset ? audioAsset.name : 'Select Audio File'}
              </ThemedText>
              <ThemedText variant="bodySmall" color={colors.secondaryText}>
                {audioAsset
                  ? `${formatBytes(audioAsset.size)} • Tap to change`
                  : 'MP3, WAV, M4A, AAC or OGG'}
              </ThemedText>
            </View>
          </TouchableOpacity>

          {/* Cover Artwork Picker */}
          <ThemedText variant="labelLarge" fontWeight="bold" style={{ marginTop: Spacing.lg, marginBottom: Spacing.xs }}>
            Cover Artwork (Optional)
          </ThemedText>
          <TouchableOpacity
            style={[styles.coverPicker, { backgroundColor: colors.surfaceVariant, borderColor: colors.divider }]}
            onPress={pickCover}
            disabled={isUploading}
            activeOpacity={0.7}
          >
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverPreview} contentFit="cover" />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={36} color={colors.hint} />
                <ThemedText variant="bodySmall" color={colors.secondaryText} style={{ marginTop: 4 }}>
                  Tap to add album cover
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>

          {/* Title Input */}
          <View style={{ marginTop: Spacing.lg }}>
            <ThemedText variant="labelLarge" fontWeight="bold">
              Track Title *
            </ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Midnight City"
              placeholderTextColor={colors.hint}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.primaryText,
                  borderColor: colors.divider,
                },
              ]}
              editable={!isUploading}
              maxLength={100}
            />
          </View>

          {/* Duration Input */}
          <View style={{ marginTop: Spacing.md }}>
            <ThemedText variant="labelLarge" fontWeight="bold">
              Duration (seconds)
            </ThemedText>
            <TextInput
              value={durationInput}
              onChangeText={setDurationInput}
              placeholder="180"
              placeholderTextColor={colors.hint}
              keyboardType="numeric"
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.primaryText,
                  borderColor: colors.divider,
                },
              ]}
              editable={!isUploading}
              maxLength={5}
            />
          </View>

          {/* Genre Chips */}
          <View style={{ marginTop: Spacing.lg }}>
            <ThemedText variant="labelLarge" fontWeight="bold" style={{ marginBottom: Spacing.xs }}>
              Genres
            </ThemedText>
            <View style={styles.genreWrap}>
              {AVAILABLE_GENRES.map((g) => {
                const lower = g.toLowerCase();
                const isSelected = selectedGenres.includes(lower);
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => toggleGenre(g)}
                    style={[
                      styles.genreChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                        borderColor: isSelected ? colors.primary : colors.divider,
                      },
                    ]}
                    disabled={isUploading}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#FFFFFF' : colors.primaryText,
                        fontSize: FontSizes.labelMedium,
                        fontFamily: 'DMSans_500Medium',
                      }}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Upload Status */}
          {isUploading && (
            <View style={[styles.progressCard, { backgroundColor: colors.primaryContainer }]}>
              <ActivityIndicator color={colors.primary} style={{ marginRight: Spacing.sm }} />
              <ThemedText variant="bodySmall" fontWeight="bold" color={colors.primary}>
                {uploadStatus}
              </ThemedText>
            </View>
          )}

          {/* Publish Button */}
          <TouchableOpacity
            style={[
              styles.publishBtn,
              {
                backgroundColor: colors.primary,
                opacity: !audioAsset || !title.trim() || isUploading ? 0.6 : 1,
              },
            ]}
            onPress={handlePublish}
            disabled={!audioAsset || !title.trim() || isUploading}
            activeOpacity={0.85}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.publishBtnText}>Publish Track</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 140,
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pickerIcon: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPicker: {
    width: 140,
    height: 140,
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
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
  genreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 6,
  },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.sm,
    marginTop: Spacing.lg,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radii.full,
    marginTop: Spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: FontSizes.titleSmall,
    fontFamily: 'DMSans_700Bold',
  },
});
