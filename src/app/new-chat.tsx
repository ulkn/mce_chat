import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { UserRow } from '@/components/UserRow';
import { showError } from '@/lib/actionSheet';
import { openDirectChat } from '@/lib/chats';
import { useSession, useUid } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import { useNow } from '@/lib/useNow';

export default function NewChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const me = useUid();
  const { users } = useSession();
  const [search, setSearch] = useState('');
  const [opening, setOpening] = useState(false);
  useNow(30000);

  const people = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return users
      .filter((u) => u.uid !== me)
      .filter((u) => !q || u.displayName.toLocaleLowerCase('tr-TR').includes(q) || u.emailLower.includes(q))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'tr'));
  }, [users, me, search]);

  const open = async (other: string) => {
    if (opening) return;
    setOpening(true);
    try {
      const id = await openDirectChat(me, other);
      router.replace(`/chat/${id}`);
    } catch (e) {
      showError(e, 'Sohbet açılamadı.');
      setOpening(false);
    }
  };

  if (!me) return null;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.searchBox, { backgroundColor: theme.surface }]}>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="İsim ya da e-posta ara"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={people}
        keyExtractor={(u) => u.uid}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          search ? undefined : (
            <View>
              <Shortcut icon="people" label="Yeni Grup" onPress={() => router.replace('/select-members')} />
              <Shortcut icon="bookmark" label="Kayıtlı Mesajlar" onPress={() => open(me)} />
              <Text style={[styles.section, { color: theme.textSecondary, backgroundColor: theme.surface }]}>
                KİŞİLER
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <UserRow user={item} onPress={() => open(item.uid)} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            {search
              ? 'Bu isimde biri bulunamadı.'
              : 'Henüz başka kullanıcı yok. Arkadaşların uygulamaya kayıt olunca burada görünür.'}
          </Text>
        }
      />
    </View>
  );
}

function Shortcut({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.shortcut, { backgroundColor: pressed ? theme.surface : theme.background }]}>
      <View style={[styles.shortcutIcon, { backgroundColor: theme.primary }]}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={[styles.shortcutLabel, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 9 },
  shortcutIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  shortcutLabel: { fontSize: 17, fontWeight: '500' },
  section: { fontSize: 12, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 6, marginTop: 6 },
  empty: { textAlign: 'center', fontSize: 15, lineHeight: 21, padding: 32 },
});
