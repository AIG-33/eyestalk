import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '@/lib/haptics';
import { useTheme, component, typography, shadows } from '@/theme';
import { ChatsTabIcon } from '@/components/navigation/chats-tab-icon';

const TAB_ICONS: Record<string, { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }> = {
  map: { outline: 'map-outline', filled: 'map' },
  people: { outline: 'people-outline', filled: 'people' },
  chats: { outline: 'chatbubbles-outline', filled: 'chatbubbles' },
  activities: { outline: 'flash-outline', filled: 'flash' },
  profile: { outline: 'person-outline', filled: 'person' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { c } = useTheme();
  const icons = TAB_ICONS[name] || TAB_ICONS.map;
  const iconName = focused ? icons.filled : icons.outline;
  const iconColor = focused ? c.accent.primary : c.text.tertiary;

  return (
    <View style={styles.iconContainer}>
      <Ionicons name={iconName} size={focused ? 26 : 24} color={iconColor} />
      {focused && (
        <View style={[styles.glowDot, shadows.glowPrimary, { backgroundColor: c.accent.primary }]} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.bg.secondary,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(124,111,247,0.12)' : 'rgba(0,0,0,0.06)',
          height: 60 + bottomPadding,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: c.accent.primary,
        tabBarInactiveTintColor: c.text.tertiary,
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
          tabBarIcon: ({ focused }) => <ChatsTabIcon focused={focused} />,
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
    marginTop: 4,
  },
});
