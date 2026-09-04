import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Spacing, Radii, FontSizes } from '@/constants/Theme';

export default function SignUpScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isArtist, setIsArtist] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!username || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          is_artist: isArtist,
        },
      },
    });

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
      setLoading(false);
      return;
    }

    // If session is immediately available, update profile directly
    if (data.user && data.session) {
      try {
        await supabase
          .from('profiles')
          .update({ username: username.trim(), is_artist: isArtist })
          .eq('id', data.user.id);

        if (isArtist) {
          const { ensureArtistForUser } = await import('@/services/artist');
          await ensureArtistForUser(data.user.id, username.trim());
        }
      } catch (profileError: any) {
        console.warn('[sign-up] profile update notice:', profileError?.message);
      }
    }

    setLoading(false);
    if (data.session) {
      router.replace('/(tabs)');
    } else {
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account, then sign in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
      );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.lg, alignSelf: 'flex-start' }}>
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </TouchableOpacity>

          {/* Title */}
          <ThemedText variant="headlineMedium" fontWeight="black" style={{ marginBottom: 4 }}>
            Create Account
          </ThemedText>
          <ThemedText variant="bodyMedium" color={colors.secondaryText} style={{ marginBottom: Spacing.lg }}>
            Join SonicStream today
          </ThemedText>

          {/* Fields */}
          <InputField
            icon="person-outline"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            colors={colors}
          />
          <InputField
            icon="mail-outline"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            colors={colors}
          />
          <InputField
            icon="lock-closed-outline"
            placeholder="Password (min 6 chars)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            trailingIcon={
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            }
            colors={colors}
          />

          {/* Artist Toggle */}
          <TouchableOpacity
            style={[
              styles.artistToggle,
              {
                backgroundColor: isArtist ? colors.primaryContainer : colors.surfaceVariant,
                borderColor: isArtist ? colors.primary : colors.outline,
              },
            ]}
            onPress={() => setIsArtist(!isArtist)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isArtist ? 'checkbox' : 'square-outline'}
              size={22}
              color={isArtist ? colors.primary : colors.secondaryText}
            />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <ThemedText variant="bodyMedium" fontWeight="medium">I'm an Artist</ThemedText>
              <ThemedText variant="bodySmall" color={colors.secondaryText}>
                Upload and share your own music
              </ThemedText>
            </View>
          </TouchableOpacity>

          <Button
            label="Create Account"
            onPress={handleSignUp}
            variant="filled"
            fullWidth
            loading={loading}
            style={{ marginTop: Spacing.md }}
          />

          <View style={styles.signInRow}>
            <ThemedText variant="bodyMedium" color={colors.secondaryText}>Already have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={{ color: colors.primary, fontSize: FontSizes.bodyMedium, fontFamily: 'DMSans_700Bold' }}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  trailingIcon,
  colors,
}: any) {
  return (
    <View
      style={[
        styles.inputWrapper,
        {
          backgroundColor: colors.surfaceVariant,
          borderColor: colors.outline,
          marginBottom: Spacing.sm,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.secondaryText} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.hint}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        secureTextEntry={secureTextEntry}
        style={{ flex: 1, marginLeft: 8, color: colors.primaryText, fontSize: FontSizes.bodyMedium, fontFamily: 'DMSans_400Regular' }}
      />
      {trailingIcon}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 14,
  },
  artistToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.sm,
    borderWidth: 1.5,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
});
