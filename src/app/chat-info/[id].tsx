import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { UserRow } from '@/components/UserRow';
import { confirm, showActionSheet, showError } from '@/lib/actionSheet';
import { describeChat } from '@/lib/chatDisplay';
import { leaveGroup, removeGroupMember, renameGroup, setGroupPhoto } from '@/lib/chats';
import { formatLastSeen, isOnline } from '@/lib/format';
import { chatMediaPath, pickImage, uploadFile } from '@/lib/media';
import { useSession, useUid } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import type { UserProfile } from '@/lib/types';
import { useNow } from '@/lib/useNow';

export default function ChatInfoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const me = useUid();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { chats, userById } = useSession();
  const now = useNow(30000);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const chat = chats.find((c) => c.id === id) ?? null;
  if (!me || !chat) return null;

  const display = describeChat(chat, me, userById);
  const isAdmin = chat.admins.includes(me);

  if (!display.isGroup) {
    const peer = display.peer;
    return (
      <ScrollView style={{ backgroundColor: theme.surface }} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Avatar name={display.title} uri={display.photoURL} size={110} />
          <Text style={[styles.title, { color: theme.text }]}>{display.title}</Text>
          {peer ? (
            <Text
              style={[
                styles.subtitle,
                { color: isOnline(peer.online, peer.lastSeen, now) ? theme.primary : theme.textSecondary },
              ]}>
              {formatLastSeen(peer.online, peer.lastSeen, now)}
            </Text>
          ) : null}
        </View>
        {peer ? (
          <View style={[styles.card, { backgroundColor: theme.background }]}>
            <InfoLine label="Hakkında" value={peer.about || '—'} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <InfoLine label="E-posta" value={peer.email} />
          </View>
        ) : null}
      </ScrollView>
    );
  }

  const members = chat.members
    .map((uid) => userById(uid))
    .filter((u): u is UserProfile => u !== undefined)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'tr'));

  const changePhoto = async () => {
    if (!isAdmin || busy) return;
    try {
      const file = await pickImage({ square: true });
      if (!file) return;
      setBusy(true);
      const uploaded = await uploadFile(chatMediaPath(chat.id, me, 'grup.jpg', 'jpg'), file.uri, file.mimeType);
      await setGroupPhoto(chat.id, uploaded.url);
    } catch (e) {
      showError(e, 'Fotoğraf değiştirilemedi.');
    } finally {
      setBusy(false);
    }
  };

  const saveName = async () => {
    const value = name.trim();
    setRenaming(false);
    if (!value || value === chat.name) return;
    try {
      await renameGroup(chat.id, value);
    } catch (e) {
      showError(e, 'Grup adı değiştirilemedi.');
    }
  };

  const memberActions = (user: UserProfile) => {
    if (!isAdmin || user.uid === me) return;
    showActionSheet(
      [
        {
          label: 'Gruptan çıkar',
          destructive: true,
          onPress: () => {
            removeGroupMember(chat.id, user.uid).catch((e) => showError(e, 'Üye çıkarılamadı.'));
          },
        },
      ],
      user.displayName
    );
  };

  const leave = () =>
    confirm('Gruptan ayrıl', `"${display.title}" grubundan ayrılmak istediğine emin misin?`, 'Ayrıl', () => {
      leaveGroup(chat, me)
        .then(() => router.dismissTo('/'))
        .catch((e) => showError(e, 'Gruptan ayrılınamadı.'));
    });

  return (
    <ScrollView
      style={{ backgroundColor: theme.surface }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Pressable onPress={changePhoto} disabled={!isAdmin} accessibilityLabel="Grup fotoğrafını değiştir">
          <Avatar
            name={display.title}
            uri={display.photoURL}
            size={110}
            icon={display.photoURL ? undefined : 'people'}
          />
          {busy ? (
            <View style={[styles.avatarBusy, { backgroundColor: theme.overlay }]}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </Pressable>
        {renaming ? (
          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={50}
            onSubmitEditing={saveName}
            onBlur={saveName}
            returnKeyType="done"
            style={[styles.nameInput, { color: theme.text, borderBottomColor: theme.primary }]}
          />
        ) : (
          <Pressable
            disabled={!isAdmin}
            onPress={() => {
              setName(chat.name ?? '');
              setRenaming(true);
            }}
            style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>{display.title}</Text>
            {isAdmin ? <Ionicons name="pencil" size={16} color={theme.textSecondary} /> : null}
          </Pressable>
        )}
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Grup · {chat.members.length} üye</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.background }]}>
        {isAdmin ? (
          <Pressable
            onPress={() => router.push({ pathname: '/select-members', params: { chatId: chat.id } })}
            style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}>
            <View style={[styles.actionIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionLabel, { color: theme.primary }]}>Üye ekle</Text>
          </Pressable>
        ) : null}
        {members.map((u) => (
          <UserRow
            key={u.uid}
            user={u}
            subtitle={u.uid === me ? 'sen' : undefined}
            badge={chat.admins.includes(u.uid) ? 'yönetici' : undefined}
            onLongPress={isAdmin && u.uid !== me ? () => memberActions(u) : undefined}
            onPress={isAdmin && u.uid !== me ? () => memberActions(u) : undefined}
          />
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: theme.background }]}>
        <Pressable onPress={leave} style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="exit-outline" size={24} color={theme.danger} />
          <Text style={[styles.actionLabel, { color: theme.danger }]}>Gruptan ayrıl</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoLine}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  hero: { alignItems: 'center', paddingVertical: 12, gap: 6 },
  avatarBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  nameInput: { fontSize: 24, fontWeight: '700', textAlign: 'center', minWidth: 200, borderBottomWidth: 2, marginTop: 8, paddingVertical: 4 },
  subtitle: { fontSize: 15 },
  card: { borderRadius: 14, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  infoLine: { paddingHorizontal: 16, paddingVertical: 12, gap: 3 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 56 },
  actionIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginLeft: 0 },
  actionLabel: { fontSize: 17, fontWeight: '500' },
});
