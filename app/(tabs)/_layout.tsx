import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { MiniPlayer } from '@/components/music/MiniPlayer';
import { usePlayerStore } from '@/store/playerStore';
import { FontSizes, Spacing } from '@/constants/Theme';

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: ColorValue;
  focused: boolean;
}) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={23} color={color as string} />
    </View>
  );
}

export default function TabLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const bottomPadding = Math.max(insets.bottom, 6);
  const tabBarHeight = 58 + bottomPadding;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: bottomPadding,
            paddingTop: 6,
            elevation: 8,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
          },
          tabBarActiveTintColor: colors.tabBarActive as string,
          tabBarInactiveTintColor: colors.tabBarInactive as string,
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'DMSans_500Medium',
            fontWeight: '600',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'compass' : 'compass-outline'} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'library' : 'library-outline'} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'person-circle' : 'person-circle-outline'} color={color} focused={focused} />
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
