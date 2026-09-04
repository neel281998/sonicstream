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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from '@/components/ui/ThemedText';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Spacing, Radii, FontSizes } from '@/constants/Theme';

export default function SignInScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
  }

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) Alert.alert('Google Sign In Failed', error.message);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="musical-notes" size={32} color={colors.onPrimary} />
            </View>
            <ThemedText variant="displaySmall" fontWeight="black" style={{ marginTop: Spacing.sm }}>
              SonicStream
            </ThemedText>
            <ThemedText variant="bodyMedium" color={colors.secondaryText} style={{ marginTop: 4 }}>
              Sign in to continue listening
            </ThemedText>
          </View>

          {/* Fields */}
          <View style={styles.form}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant, borderColor: colors.outline }]}>
              <Ionicons name="mail-outline" size={18} color={colors.secondaryText} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={colors.hint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: colors.primaryText }]}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant, borderColor: colors.outline, marginTop: Spacing.sm }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.secondaryText} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.hint}
                secureTextEntry={!showPass}
                style={[styles.input, { color: colors.primaryText }]}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: Spacing.xs }}>
              <Text style={{ color: colors.primary, fontSize: FontSizes.labelLarge, fontFamily: 'DMSans_500Medium' }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <Button
            label="Sign In"
            onPress={handleSignIn}
            variant="filled"
            fullWidth
            loading={loading}
            style={{ marginTop: Spacing.md }}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
            <ThemedText variant="labelMedium" color={colors.hint} style={{ marginHorizontal: Spacing.sm }}>or</ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.outline, backgroundColor: colors.card }]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>G</Text>
            <Text style={{ marginLeft: Spacing.sm, color: colors.primaryText, fontSize: FontSizes.bodyMedium, fontFamily: 'DMSans_500Medium' }}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <ThemedText variant="bodyMedium" color={colors.secondaryText}>Don't have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={{ color: colors.primary, fontSize: FontSizes.bodyMedium, fontFamily: 'DMSans_700Bold' }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    paddingBottom: Spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {},
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 14,
    gap: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.bodyMedium,
    fontFamily: 'DMSans_400Regular',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radii.xs,
    paddingVertical: 14,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
});
