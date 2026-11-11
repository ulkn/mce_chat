import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { UserRow } from '@/components/UserRow';
import { showError } from '@/lib/actionSheet';
import { addGroupMembers, createGroup } from '@/lib/chats';
import { useSession, useUid } from '@/lib/session';
import { useTheme } from '@/lib/theme';

// İki işte kullanılır: yeni grup kurma (chatId yok) ve var olan gruba üye ekleme (chatId var).
export default function SelectMembersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const me = useUid();
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();
  const { users, chats } = useSession();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const existing = chatId ? chats.find((c) => c.id === chatId) ?? null : null;
  const adding = Boolean(chatId);

  const candidates = useMemo(
    () =>
      users
        .filter((u) => u.uid !== me && !(existing?.members.includes(u.uid) ?? false))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'tr')),
    [users, me, existing]
  );

  const canSave = selected.length > 0 && (adding || name.trim().length > 0) && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (adding && chatId) {
        await addGroupMembers(chatId, selected);
        router.back();
      } else {
        const id = await createGroup(me, name, selected);
        router.replace(`/chat/${id}`);
      }
    } catch (e) {
      showError(e, 'Kaydedilemedi.');
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: adding ? 'Üye Ekle' : 'Yeni Grup',
      headerRight: () =>
        saving ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <Pressable onPress={save} disabled={!canSave} hitSlop={10}>
            <Text style={[styles.headerAction, { color: theme.primary, opacity: canSave ? 1 : 0.35 }]}>
              {adding ? 'Ekle' : 'Oluştur'}
            </Text>
          </Pressable>
        ),
    });
    // save her çizimde yenilenir; başlıktaki düğme güncel seçimi görsün diye bağımlılıklar geniş tutuldu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, adding, saving, canSave, selected, name, theme.primary]);

  const toggle = (uid: string) =>
    setSelected((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));

  if (!me) return null;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {!adding ? (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Grup adı"
          placeholderTextColor={theme.textSecondary}
          maxLength={50}
          style={[styles.nameInput, { backgroundColor: theme.surface, color: theme.text }]}
        />
      ) : null}
      <Text style={[styles.section, { color: theme.textSecondary, backgroundColor: theme.surface }]}>
        {selected.length > 0 ? `${selected.length} KİŞİ SEÇİLDİ` : 'ÜYELERİ SEÇ'}
      </Text>
      <FlatList
        data={candidates}
        keyExtractor={(u) => u.uid}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <UserRow user={item} selected={selected.includes(item.uid)} onPress={() => toggle(item.uid)} />
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            {adding ? 'Eklenebilecek başka kimse yok.' : 'Henüz başka kullanıcı yok.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerAction: { fontSize: 17, fontWeight: '600' },
  nameInput: { margin: 16, marginBottom: 12, height: 48, borderRadius: 12, paddingHorizontal: 14, fontSize: 17 },
  section: { fontSize: 12, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 6 },
  empty: { textAlign: 'center', fontSize: 15, padding: 32 },
});
