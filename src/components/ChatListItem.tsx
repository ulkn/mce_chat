import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { chatSubtitle, describeChat, isReadByOthers, typingUserIds } from '@/lib/chatDisplay';
import { formatListTime, isOnline } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import type { Chat, UserProfile } from '@/lib/types';

import { Avatar } from './Avatar';

type Props = {
  chat: Chat;
  me: string;
  userById: (uid: string) => UserProfile | undefined;
  onPress: () => void;
};

export function ChatListItem({ chat, me, userById, onPress }: Props) {
  const theme = useTheme();
  const display = describeChat(chat, me, userById);
  const unread = chat.unread[me] ?? 0;
  const last = chat.lastMessage;
  const typing = typingUserIds(chat, me).length > 0;
  const mine = last?.senderId === me;

  let preview = 'Henüz mesaj yok';
  if (typing) {
    preview = chatSubtitle(chat, display, me, userById);
  } else if (last) {
    const sender = display.isGroup && !mine ? userById(last.senderId)?.displayName.split(' ')[0] : null;
    preview = sender ? `${sender}: ${last.text}` : last.text;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? theme.surface : theme.background }]}>
      <Avatar
        name={display.title}
        uri={display.photoURL}
        size={54}
        icon={display.isSaved ? 'bookmark' : display.isGroup && !display.photoURL ? 'people' : undefined}
        online={display.peer ? isOnline(display.peer.online, display.peer.lastSeen) : false}
      />
      <View style={[styles.body, { borderBottomColor: theme.border }]}>
        <View style={styles.line}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {display.title}
          </Text>
          {last ? (
            <Text style={[styles.time, { color: unread > 0 ? theme.primary : theme.textSecondary }]}>
              {formatListTime(last.createdAt)}
            </Text>
          ) : null}
        </View>
        <View style={styles.line}>
          {mine && !typing && last ? (
            <Ionicons
              name={isReadByOthers(chat, me, last.createdAt) ? 'checkmark-done' : 'checkmark'}
              size={16}
              color={isReadByOthers(chat, me, last.createdAt) ? theme.tickRead : theme.tick}
              style={styles.tick}
            />
          ) : null}
          <Text
            style={[styles.preview, { color: typing ? theme.primary : theme.textSecondary }]}
            numberOfLines={1}>
            {preview}
          </Text>
          {unread > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.badgeText, { color: theme.primaryText }]}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
  body: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  line: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '600' },
  time: { fontSize: 13, marginLeft: 8 },
  tick: { marginRight: 3 },
  preview: { flex: 1, fontSize: 15 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
