import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChatListItem } from '@/components/ChatListItem';
import { describeChat } from '@/lib/chatDisplay';
import { useSession, useUid } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import { useNow } from '@/lib/useNow';

export default function ChatsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const me = useUid();
  const { chats, chatsLoaded, userById } = useSession();
  const [search, setSearch] = useState('');
  useNow(5000);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.push('/new-chat')}
          hitSlop={10}
          style={styles.headerButton}
          accessibilityLabel="Yeni sohbet">
          <Ionicons name="create-outline" size={26} color={theme.primary} />
        </Pressable>
      ),
    });
  }, [navigation, router, theme.primary]);

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return chats
      // Açılıp hiç mesaj yazılmamış birebir sohbetler listeyi kalabalıklaştırmasın.
      .filter((c) => c.type === 'group' || c.lastMessage !== null)
      .filter((c) => !q || describeChat(c, me, userById).title.toLocaleLowerCase('tr-TR').includes(q));
  }, [chats, search, me, userById]);

  if (!me) return null;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.searchBox, { backgroundColor: theme.surface }]}>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Sohbetlerde ara"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {!chatsLoaded ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(c) => c.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ChatListItem chat={item} me={me} userById={userById} onPress={() => router.push(`/chat/${item.id}`)} />
          )}
          contentContainerStyle={visible.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={56} color={theme.border} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {search ? 'Eşleşen sohbet yok' : 'Henüz sohbetin yok'}
              </Text>
              {!search ? (
                <>
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Bir arkadaşını seç ve ilk mesajını gönder.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/new-chat')}
                    style={[styles.emptyButton, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.emptyButtonText, { color: theme.primaryText }]}>Sohbet başlat</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerButton: { marginRight: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  emptyContainer: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 19, fontWeight: '600', marginTop: 8 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  emptyButton: { marginTop: 14, paddingHorizontal: 22, height: 46, borderRadius: 23, justifyContent: 'center' },
  emptyButtonText: { fontSize: 16, fontWeight: '600' },
});
