import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radii } from '@/constants/Theme';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useRouter } from 'expo-router';
import { activateArtistMode } from '@/services/artist';

const MENU_ITEMS = [
  { id: 'account', icon: 'person-circle-outline', label: 'Account Settings' },
  { id: 'notifications', icon: 'notifications-outline', label: 'Notifications' },
  { id: 'downloads', icon: 'download-outline', label: 'Downloads' },
  { id: 'privacy', icon: 'shield-outline', label: 'Privacy & Security' },
  { id: 'help', icon: 'help-circle-outline', label: 'Help & Support' },
  { id: 'about', icon: 'information-circle-outline', label: 'About SonicStream' },
];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { profile, signOut, user, fetchProfile } = useAuthStore();
  const { themeMode, setThemeMode } = useThemeStore();
  const [signingOut, setSigningOut] = useState(false);
  const [activatingArtist, setActivatingArtist] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (err) {
              console.warn('[profile] sign out error:', err);
              router.replace('/(auth)/sign-in');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };
  const handleBecomeArtist = () => {
    Alert.alert(
      'Become an Artist 🎵',
      'Would you like to activate Creator mode? You will be able to upload, publish, and distribute original music on SonicStream.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate Creator Mode',
          onPress: async () => {
            if (!user?.id) return;
            try {
              setActivatingArtist(true);
              await activateArtistMode(user.id, profile?.username || 'Artist');
              await fetchProfile(user.id);
              router.push('/artist/studio');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not activate artist mode.');
            } finally {
              setActivatingArtist(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="headlineMedium" fontWeight="extrabold">Profile</ThemedText>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Avatar text={profile?.username ?? 'JD'} size={64} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <ThemedText variant="titleMedium" fontWeight="bold">
              {profile?.username ?? 'John Doe'}
            </ThemedText>
            <ThemedText variant="bodySmall" color={colors.secondaryText}>
              {profile?.is_artist ? '🎵 Artist' : 'Listener'}
            </ThemedText>
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { borderColor: colors.divider }]}>
          {[
            { label: 'Playlists', value: '4' },
            { label: 'Following', value: '8' },
            { label: 'Liked', value: '127' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <ThemedText variant="titleLarge" fontWeight="black">{stat.value}</ThemedText>
              <ThemedText variant="bodySmall" color={colors.secondaryText}>{stat.label}</ThemedText>
            </View>
          ))}
        </View>

        {/* Creator / Artist Studio Banner */}
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          {profile?.is_artist ? (
            <TouchableOpacity
              style={[styles.artistBanner, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }]}
              onPress={() => router.push('/artist/studio')}
              activeOpacity={0.8}
            >
              <View style={[styles.artistBannerIcon, { backgroundColor: colors.card }]}>
                <Ionicons name="musical-notes" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <ThemedText variant="titleSmall" fontWeight="extrabold" color={colors.primary}>
                  Artist Studio
                </ThemedText>
                <ThemedText variant="bodySmall" color={colors.secondaryText}>
                  Upload music & manage your published tracks
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.artistBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={handleBecomeArtist}
              disabled={activatingArtist}
              activeOpacity={0.8}
            >
              <View style={[styles.artistBannerIcon, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name="mic-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <ThemedText variant="titleSmall" fontWeight="bold">
                  Become an Artist
                </ThemedText>
                <ThemedText variant="bodySmall" color={colors.secondaryText}>
                  Publish your songs and share with listeners
                </ThemedText>
              </View>
              {activatingArtist ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.hint} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Appearance / Theme Selector */}
        <View style={[styles.appearanceCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.appearanceHeader}>
            <View style={[styles.menuIcon, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <ThemedText variant="bodyMedium" fontWeight="bold">
                Appearance
              </ThemedText>
              <ThemedText variant="labelSmall" color={colors.secondaryText}>
                {themeMode === 'system' ? 'System default' : themeMode === 'dark' ? 'Dark theme' : 'Light theme'}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceVariant }]}>
            {(
              [
                { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
                { mode: 'light', label: 'Light', icon: 'sunny-outline' },
                { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
              ] as const
            ).map((opt) => {
              const active = themeMode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.segmentBtn,
                    active && {
                      backgroundColor: colors.primary,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.18,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}
                  onPress={() => setThemeMode(opt.mode)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={opt.icon}
                    size={15}
                    color={active ? colors.onPrimary : colors.secondaryText}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: active ? colors.onPrimary : colors.secondaryText,
                        fontFamily: active ? 'DMSans_700Bold' : 'DMSans_500Medium',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuSection, { borderColor: colors.divider }]}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuRow,
                { borderBottomColor: colors.divider },
                i === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name={item.icon as any} size={18} color={colors.primary} />
              </View>
              <ThemedText variant="bodyMedium" style={{ flex: 1, marginLeft: Spacing.sm }}>
                {item.label}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color={colors.hint} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md }}>
          <Button
            label="Sign Out"
            onPress={handleSignOut}
            loading={signingOut}
            variant="outlined"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  menuSection: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  appearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: Radii.sm,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.xs,
    gap: 6,
  },
  segmentText: {
    fontSize: 13,
  },
  artistBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  artistBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
