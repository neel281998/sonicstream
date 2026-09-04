import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  DMSans_900Black,
} from '@expo-google-fonts/dm-sans';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { useActiveColorScheme } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useLikesStore } from '@/store/likesStore';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { CustomDialog } from '@/components/ui/CustomDialog';

import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const activeScheme = useActiveColorScheme();
  const setSession = useAuthStore((s) => s.setSession);

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSans_900Black,
    Nunito_400Regular,
    Nunito_700Bold,
  });

  // Listen to Supabase auth state changes
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        useLikesStore.getState().loadLikes(session?.user?.id);
      })
      .catch((e) => {
        console.warn('[RootLayout] getSession error:', e);
        setSession(null);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        useLikesStore.getState().loadLikes(session?.user?.id);
      }
    );

    return () => subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthGuard>
        <StatusBar style={activeScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="player/[id]"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="playlist/[id]" />
          <Stack.Screen name="album/[id]" />
          <Stack.Screen name="artist/[id]" />
          <Stack.Screen name="onboarding" />
        </Stack>
        <CustomDialog />
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
