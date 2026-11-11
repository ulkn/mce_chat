import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { showError } from '@/lib/actionSheet';
import { auth } from '@/lib/firebase';
import { avatarPath, pickImage, uploadFile } from '@/lib/media';
import { useSession, useUid } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import { updateUserProfile } from '@/lib/users';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const me = useUid();
  const { me: profile } = useSession();
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [filled, setFilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profil yüklendiğinde alanları bir kez doldur.
  if (profile && !filled) {
    setFilled(true);
    setName(profile.displayName);
    setAbout(profile.about);
  }

  if (!me) return null;

  const changePhoto = async () => {
    if (uploading) return;
    try {
      const file = await pickImage({ square: true });
      if (!file) return;
      setUploading(true);
      const uploaded = await uploadFile(avatarPath(me), file.uri, file.mimeType);
      await updateUserProfile(me, { photoURL: uploaded.url });
    } catch (e) {
      showError(e, 'Fotoğraf yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  const dirty = profile !== null && (name.trim() !== profile.displayName || about.trim() !== profile.about);
  const valid = name.trim().length >= 2;

  const save = async () => {
    if (!dirty || !valid || saving) return;
    setSaving(true);
    try {
      await updateUserProfile(me, { displayName: name.trim(), about: about.trim() });
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name.trim() });
      router.back();
    } catch (e) {
      showError(e, 'Profil kaydedilemedi.');
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.surface }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Pressable onPress={changePhoto} style={styles.avatarWrap} accessibilityLabel="Profil fotoğrafını değiştir">
        <Avatar name={profile?.displayName ?? '?'} uri={profile?.photoURL} size={120} />
        <View style={[styles.camera, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          )}
        </View>
      </Pressable>

      <View style={[styles.card, { backgroundColor: theme.background }]}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Ad Soyad</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={40}
          placeholder="Adın"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Text style={[styles.label, { color: theme.textSecondary }]}>Hakkında</Text>
        <TextInput
          value={about}
          onChangeText={setAbout}
          maxLength={120}
          placeholder="Kendinden kısaca bahset"
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[styles.input, styles.multiline, { color: theme.text }]}
        />
      </View>

      <Pressable
        onPress={save}
        disabled={!dirty || !valid || saving}
        style={[styles.button, { backgroundColor: theme.primary, opacity: dirty && valid && !saving ? 1 : 0.4 }]}>
        {saving ? (
          <ActivityIndicator color={theme.primaryText} />
        ) : (
          <Text style={[styles.buttonText, { color: theme.primaryText }]}>Kaydet</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18 },
  avatarWrap: { alignSelf: 'center', marginVertical: 12 },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: 14, paddingVertical: 6 },
  label: { fontSize: 13, paddingHorizontal: 16, paddingTop: 10 },
  input: { fontSize: 17, paddingHorizontal: 16, paddingVertical: 8 },
  multiline: { minHeight: 44, textAlignVertical: 'top' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16, marginTop: 4 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 17, fontWeight: '600' },
});
