import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Spacing, Radii, FontSizes, FontWeights } from '@/constants/Theme';

const GENRE_OPTIONS = [
  { id: 'pop',        label: '🎵 Pop',         color: '#D4A5A5' },
  { id: 'rock',       label: '🎸 Rock',         color: '#C4A882' },
  { id: 'hiphop',     label: '🎤 Hip-Hop',      color: '#C8A0A0' },
  { id: 'electronic', label: '🎛️ Electronic',   color: '#A0B5C8' },
  { id: 'lofi',       label: '😌 Lofi / Chill', color: '#A8B5A0' },
  { id: 'jazz',       label: '🎹 Jazz',          color: '#B5A0C8' },
  { id: 'classical',  label: '🎻 Classical',     color: '#C8B5A0' },
  { id: 'house',      label: '🏠 House',         color: '#A0C8B5' },
  { id: 'rnb',        label: '🎙️ R&B / Soul',   color: '#C8A0B5' },
  { id: 'acoustic',   label: '🪕 Acoustic',      color: '#B5C8A0' },
  { id: 'metal',      label: '🤘 Metal',         color: '#A0A8C8' },
  { id: 'reggae',     label: '🌴 Reggae',        color: '#A0C8A8' },
];

const MOODS = [
  { id: 'focus',    label: '🧠 Focus' },
  { id: 'workout',  label: '💪 Workout' },
  { id: 'relax',    label: '🌙 Relax' },
  { id: 'party',    label: '🎉 Party' },
  { id: 'commute',  label: '🚇 Commute' },
  { id: 'sleep',    label: '😴 Sleep' },
];

const ONBOARDING_STEPS = ['Welcome', 'Genres', 'Moods'];

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [selectedMoods, setSelectedMoods] = useState<Set<string>>(new Set());

  function toggleGenre(id: string) {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleMood(id: string) {
    setSelectedMoods((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleNext() {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Done — navigate to home
      router.replace('/(tabs)');
    }
  }

  function handleSkip() {
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {ONBOARDING_STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i <= step ? colors.primary : colors.surfaceVariant,
                width: i === step ? 24 : 8,
              },
            ]}
          />
        ))}
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={{ color: colors.secondaryText, fontSize: FontSizes.labelLarge, fontFamily: 'DMSans_500Medium' }}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Step 0: Welcome ── */}
      {step === 0 && (
        <View style={styles.centerContent}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="musical-notes" size={48} color={colors.onPrimary} />
          </View>
          <ThemedText variant="displaySmall" fontWeight="black" style={styles.centeredText}>
            SonicStream
          </ThemedText>
          <ThemedText
            variant="headlineSmall"
            fontWeight="bold"
            style={[styles.centeredText, { marginTop: Spacing.xs }]}
          >
            Your music, your world.
          </ThemedText>
          <ThemedText
            variant="bodyLarge"
            color={colors.secondaryText}
            style={[styles.centeredText, { marginTop: Spacing.sm, maxWidth: 300 }]}
          >
            Discover millions of tracks from artists worldwide — plus upload your own.
          </ThemedText>

          {/* Feature pills */}
          <View style={styles.featureList}>
            {[
              { icon: 'infinite', text: 'Unlimited streaming' },
              { icon: 'cloud-upload-outline', text: 'Upload your own music' },
              { icon: 'radio', text: 'Smart genre radio' },
              { icon: 'heart', text: 'Build your library' },
            ].map((f) => (
              <View key={f.text} style={[styles.featurePill, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name={f.icon as any} size={16} color={colors.primary} />
                <Text
                  style={{
                    color: colors.primaryText,
                    fontSize: FontSizes.bodySmall,
                    fontFamily: 'DMSans_500Medium',
                    marginLeft: 8,
                  }}
                >
                  {f.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Step 1: Pick Genres ── */}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText variant="headlineSmall" fontWeight="black" style={{ marginBottom: Spacing.xs }}>
            What do you love?
          </ThemedText>
          <ThemedText variant="bodyMedium" color={colors.secondaryText} style={{ marginBottom: Spacing.lg }}>
            Pick at least 3 genres to personalize your feed.
          </ThemedText>

          <View style={styles.genreGrid}>
            {GENRE_OPTIONS.map((genre) => {
              const selected = selectedGenres.has(genre.id);
              return (
                <TouchableOpacity
                  key={genre.id}
                  style={[
                    styles.genreCard,
                    {
                      backgroundColor: selected ? genre.color : colors.surfaceVariant,
                      borderColor: selected ? genre.color : colors.divider,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() => toggleGenre(genre.id)}
                  activeOpacity={0.8}
                >
                  {selected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: FontSizes.bodyMedium,
                      fontWeight: FontWeights.bold,
                      color: selected ? '#1C1B18' : colors.primaryText,
                      fontFamily: 'DMSans_700Bold',
                      textAlign: 'center',
                    }}
                  >
                    {genre.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedGenres.size > 0 && selectedGenres.size < 3 && (
            <ThemedText variant="bodySmall" color={colors.secondary} style={{ textAlign: 'center', marginTop: Spacing.sm }}>
              Pick {3 - selectedGenres.size} more to continue
            </ThemedText>
          )}
        </ScrollView>
      )}

      {/* ── Step 2: Pick Moods ── */}
      {step === 2 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText variant="headlineSmall" fontWeight="black" style={{ marginBottom: Spacing.xs }}>
            When do you listen?
          </ThemedText>
          <ThemedText variant="bodyMedium" color={colors.secondaryText} style={{ marginBottom: Spacing.lg }}>
            We'll build radio stations around your listening moments.
          </ThemedText>

          <View style={styles.moodGrid}>
            {MOODS.map((mood) => {
              const selected = selectedMoods.has(mood.id);
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodCard,
                    {
                      backgroundColor: selected ? colors.primary : colors.surfaceVariant,
                      borderColor: selected ? colors.primary : colors.divider,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                  onPress={() => toggleMood(mood.id)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>{mood.label.split(' ')[0]}</Text>
                  <Text
                    style={{
                      fontSize: FontSizes.bodySmall,
                      fontWeight: FontWeights.bold,
                      color: selected ? colors.onPrimary : colors.primaryText,
                      fontFamily: 'DMSans_700Bold',
                    }}
                  >
                    {mood.label.split(' ').slice(1).join(' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { borderTopColor: colors.divider }]}>
        <Button
          label={step === ONBOARDING_STEPS.length - 1 ? "Let's Go! 🎵" : 'Continue'}
          onPress={handleNext}
          variant="filled"
          fullWidth
          disabled={step === 1 && selectedGenres.size < 3}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: Radii.full,
  },
  skipBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  logoIcon: {
    width: 96,
    height: 96,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  centeredText: {
    textAlign: 'center',
  },
  featureList: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    width: '100%',
    maxWidth: 320,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genreCard: {
    width: '47%',
    height: 72,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  moodCard: {
    width: '30%',
    height: 90,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
});
