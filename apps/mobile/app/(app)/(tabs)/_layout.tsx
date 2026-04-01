import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '@/lib/haptics';
import { colors, component, typography, shadows } from '@/theme';

const TAB_ICONS: Record<string, { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }> = {
  map: { outline: 'map-outline', filled: 'map' },
  people: { outline: 'people-outline', filled: 'people' },
  chats: { outline: 'chatbubbles-outline', filled: 'chatbubbles' },
  activities: { outline: 'flash-outline', filled: 'flash' },
  profile: { outline: 'person-outline', filled: 'person' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons = TAB_ICONS[name] || TAB_ICONS.map;
  const iconName = focused ? icons.filled : icons.outline;
  const iconColor = focused ? colors.accent.primary : colors.text.tertiary;

  return (
    <View style={styles.iconContainer}>
      <Ionicons name={iconName} size={focused ? 26 : 24} color={iconColor} />
      {focused && (
        <View style={[styles.glowDot, shadows.glowPrimary]} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.primary,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.04)',
          height: component.tabBar.height,
          paddingTop: 8,
          paddingBottom: 34,
        },
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: typography.size.micro,
          fontWeight: typography.weight.semibold,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        listeners={{ tabPress: () => haptic.selection() }}
        options={{
          title: t('tabs.map'),
          tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        listeners={{ tabPress: () => haptic.selection() }}
        options={{
          title: t('tabs.chats'),
          tabBarIcon: ({ focused }) => <TabIcon name="chats" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: () => haptic.selection() }}
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  glowDot: {
    width: component.tabBar.dotSize,
    height: component.tabBar.dotSize,
    borderRadius: component.tabBar.dotSize / 2,
    backgroundColor: colors.accent.primary,
    marginTop: 4,
  },
});
