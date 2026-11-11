import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme';

export default function TabsLayout() {
  const theme = useTheme();
  const { chats, uid } = useSession();
  const unreadChats = uid ? chats.filter((c) => (c.unread[uid] ?? 0) > 0).length : 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: { color: theme.text, fontSize: 20, fontWeight: '700' },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sohbetler',
          tabBarBadge: unreadChats > 0 ? unreadChats : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.primary, color: theme.primaryText },
          tabBarIcon: ({ size, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={focused ? theme.primary : theme.textSecondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={focused ? theme.primary : theme.textSecondary} />
          ),
        }}
      />
    </Tabs>
  );
}
