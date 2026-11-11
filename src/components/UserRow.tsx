import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatLastSeen, isOnline } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import type { UserProfile } from '@/lib/types';

import { Avatar } from './Avatar';

type Props = {
  user: UserProfile;
  subtitle?: string;
  badge?: string; // örn. "yönetici"
  selected?: boolean; // tanımlıysa seçim kutusu gösterilir
  onPress?: () => void;
  onLongPress?: () => void;
};

export function UserRow({ user, subtitle, badge, selected, onPress, onLongPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? theme.surface : theme.background }]}>
      <Avatar name={user.displayName} uri={user.photoURL} size={46} online={isOnline(user.online, user.lastSeen)} />
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {subtitle ?? formatLastSeen(user.online, user.lastSeen)}
        </Text>
      </View>
      {badge ? <Text style={[styles.badge, { color: theme.primary }]}>{badge}</Text> : null}
      {selected !== undefined ? (
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={selected ? theme.primary : theme.border}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 9, gap: 12 },
  body: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '500' },
  subtitle: { fontSize: 13 },
  badge: { fontSize: 13, fontWeight: '600' },
});
