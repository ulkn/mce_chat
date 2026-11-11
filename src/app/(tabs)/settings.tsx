import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { confirm, showError } from '@/lib/actionSheet';
import { openDirectChat } from '@/lib/chats';
import { useSession, useUid } from '@/lib/session';
import { useTheme } from '@/lib/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const me = useUid();
  const { me: profile, email, signOut } = useSession();

  if (!me) return null;

  const openSaved = async () => {
    try {
      const id = await openDirectChat(me, me);
      router.push(`/chat/${id}`);
    } catch (e) {
      showError(e);
    }
  };

  const askSignOut = () =>
    confirm('Çıkış yap', 'Hesabından çıkmak istediğine emin misin?', 'Çıkış yap', () => {
      signOut().catch(showError);
    });

  return (
    <ScrollView style={{ backgroundColor: theme.surface }} contentContainerStyle={styles.content}>
      <Pressable
        onPress={() => router.push('/profile')}
        style={({ pressed }) => [styles.card, styles.profile, { backgroundColor: theme.background, opacity: pressed ? 0.8 : 1 }]}>
        <Avatar name={profile?.displayName ?? '?'} uri={profile?.photoURL} size={64} />
        <View style={styles.profileBody}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {profile?.displayName ?? 'Profil'}
          </Text>
          <Text style={[styles.about, { color: theme.textSecondary }]} numberOfLines={1}>
            {profile?.about || email || ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </Pressable>

      <View style={[styles.card, { backgroundColor: theme.background }]}>
        <Row icon="bookmark" label="Kayıtlı Mesajlar" onPress={openSaved} />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Row icon="people" label="Yeni Grup" onPress={() => router.push('/select-members')} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.background }]}>
        <Row icon="log-out-outline" label="Çıkış yap" danger onPress={askSignOut} />
      </View>

      <Text style={[styles.footer, { color: theme.textSecondary }]}>
        {email ? `${email}\n` : ''}Yaren {Constants.expoConfig?.version ?? ''}
      </Text>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  danger = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = danger ? theme.danger : theme.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={22} color={danger ? theme.danger : theme.primary} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {!danger ? <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  card: { borderRadius: 14, overflow: 'hidden' },
  profile: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  profileBody: { flex: 1, gap: 3 },
  name: { fontSize: 20, fontWeight: '600' },
  about: { fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, height: 52 },
  rowLabel: { flex: 1, fontSize: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  footer: { textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 8 },
});
