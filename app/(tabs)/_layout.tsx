import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { MiniPlayer } from '@/components/music/MiniPlayer';
import { usePlayerStore } from '@/store/playerStore';
import { FontSizes, Spacing } from '@/constants/Theme';

function TabBarIcon({ name, color }: { name: React.ComponentProps<typeof Ionicons>['name']; color: ColorValue }) {
  return <Ionicons name={name} size={26} color={color as string} />;
}

export default function TabLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const bottomPadding = Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 0,
            height: tabBarHeight,
            paddingBottom: bottomPadding,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: colors.tabBarActive as string,
          tabBarInactiveTintColor: colors.tabBarInactive as string,
          tabBarLabelStyle: {
            fontSize: FontSizes.labelSmall,
            fontFamily: 'DMSans_500Medium',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'compass' : 'compass-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'library' : 'library-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Mini Player sits directly above the tab bar */}
      {currentTrack && (
        <View
          style={[
            styles.miniPlayerWrapper,
            { bottom: tabBarHeight + Spacing.xs },
          ]}
        >
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  miniPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
