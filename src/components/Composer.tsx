import { Ionicons } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { showError } from '@/lib/actionSheet';
import { formatDuration } from '@/lib/format';
import { useTheme } from '@/lib/theme';

export type ComposerBanner = {
  kind: 'reply' | 'edit';
  title: string;
  preview: string;
};

type Props = {
  banner: ComposerBanner | null;
  editing: { token: number; text: string } | null; // düzenleme başlayınca metin kutusuna konur
  uploadProgress: number | null; // 0..1; yükleme yoksa null
  bottomInset: number;
  onCancelBanner: () => void;
  onSubmitText: (text: string) => void;
  onAttach: () => void;
  onSendVoice: (uri: string, durationSeconds: number) => void;
  onTyping: (typing: boolean) => void;
};

const TYPING_REFRESH_MS = 4000;

export function Composer({
  banner,
  editing,
  uploadProgress,
  bottomInset,
  onCancelBanner,
  onSubmitText,
  onAttach,
  onSendVoice,
  onTyping,
}: Props) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const lastTypingAt = useRef(0);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  // Yeni bir düzenleme başladığında mesajın metnini kutuya koy.
  const editToken = editing?.token ?? null;
  const [seenEditToken, setSeenEditToken] = useState<number | null>(null);
  if (editToken !== seenEditToken) {
    setSeenEditToken(editToken);
    if (editing) setText(editing.text);
  }
  useEffect(() => {
    if (editToken !== null) inputRef.current?.focus();
  }, [editToken]);

  const changeText = (value: string) => {
    setText(value);
    const now = Date.now();
    if (value.length === 0) {
      lastTypingAt.current = 0;
      onTyping(false);
    } else if (now - lastTypingAt.current > TYPING_REFRESH_MS) {
      lastTypingAt.current = now;
      onTyping(true);
    }
  };

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    lastTypingAt.current = 0;
    onSubmitText(value);
  };

  const cancelBanner = () => {
    if (banner?.kind === 'edit') setText('');
    onCancelBanner();
  };

  const startRecording = async () => {
    if (starting || recording) return;
    setStarting(true);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Mikrofon izni verilmedi. Ayarlar > Yaren bölümünden izin verebilirsin.');
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (e) {
      showError(e, 'Kayıt başlatılamadı.');
    } finally {
      setStarting(false);
    }
  };

  const finishRecording = async (send: boolean) => {
    const seconds = recorderState.durationMillis / 1000;
    setRecording(false);
    try {
      await recorder.stop();
      // Kayıt modunu kapat; yoksa sesler ahizeden çalar.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (send && uri && seconds >= 1) onSendVoice(uri, seconds);
    } catch (e) {
      if (send) showError(e, 'Kayıt tamamlanamadı.');
    }
  };

  const busy = uploadProgress !== null;
  const hasText = text.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Math.max(bottomInset, 8) }]}>
      {banner ? (
        <View style={[styles.banner, { borderLeftColor: theme.primary }]}>
          <Ionicons name={banner.kind === 'edit' ? 'pencil' : 'arrow-undo'} size={18} color={theme.primary} />
          <View style={styles.bannerBody}>
            <Text style={[styles.bannerTitle, { color: theme.primary }]} numberOfLines={1}>
              {banner.title}
            </Text>
            <Text style={[styles.bannerPreview, { color: theme.textSecondary }]} numberOfLines={1}>
              {banner.preview}
            </Text>
          </View>
          <Pressable onPress={cancelBanner} hitSlop={10} accessibilityLabel="Vazgeç">
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      {busy ? (
        <View style={styles.uploadRow}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.uploadText, { color: theme.textSecondary }]}>
            Gönderiliyor… %{Math.round((uploadProgress ?? 0) * 100)}
          </Text>
        </View>
      ) : null}

      {recording ? (
        <View style={styles.row}>
          <Pressable onPress={() => finishRecording(false)} hitSlop={8} style={styles.iconButton} accessibilityLabel="Kaydı sil">
            <Ionicons name="trash-outline" size={24} color={theme.danger} />
          </Pressable>
          <View style={styles.recordingBody}>
            <View style={[styles.recordingDot, { backgroundColor: theme.danger }]} />
            <Text style={[styles.recordingTime, { color: theme.text }]}>
              {formatDuration(recorderState.durationMillis / 1000)}
            </Text>
            <Text style={[styles.recordingHint, { color: theme.textSecondary }]}>Kaydediliyor</Text>
          </View>
          <Pressable
            onPress={() => finishRecording(true)}
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            accessibilityLabel="Sesli mesajı gönder">
            <Ionicons name="arrow-up" size={22} color={theme.primaryText} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable
            onPress={onAttach}
            disabled={busy || banner?.kind === 'edit'}
            hitSlop={8}
            style={[styles.iconButton, busy || banner?.kind === 'edit' ? styles.disabled : null]}
            accessibilityLabel="Fotoğraf ya da dosya ekle">
            <Ionicons name="add" size={28} color={theme.primary} />
          </Pressable>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={changeText}
            placeholder="Mesaj"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
          />
          {hasText ? (
            <Pressable onPress={submit} style={[styles.sendButton, { backgroundColor: theme.primary }]} accessibilityLabel="Gönder">
              <Ionicons name={banner?.kind === 'edit' ? 'checkmark' : 'arrow-up'} size={22} color={theme.primaryText} />
            </Pressable>
          ) : (
            <Pressable
              onPress={startRecording}
              disabled={busy || starting || banner?.kind === 'edit'}
              hitSlop={8}
              style={[styles.iconButton, busy || banner?.kind === 'edit' ? styles.disabled : null]}
              accessibilityLabel="Sesli mesaj kaydet">
              <Ionicons name="mic-outline" size={26} color={theme.primary} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 130,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: 16,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  bannerBody: { flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: '700' },
  bannerPreview: { fontSize: 13 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingBottom: 8 },
  uploadText: { fontSize: 13 },
  recordingBody: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 },
  recordingDot: { width: 10, height: 10, borderRadius: 5 },
  recordingTime: { fontSize: 17, fontVariant: ['tabular-nums'] },
  recordingHint: { fontSize: 14 },
});
