import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Composer, type ComposerBanner } from '@/components/Composer';
import { type DeliveryState, MessageBubble } from '@/components/MessageBubble';
import { confirm, showActionSheet, showError } from '@/lib/actionSheet';
import { chatSubtitle, describeChat, isReadByOthers } from '@/lib/chatDisplay';
import {
  deleteMessage,
  editMessage,
  markRead,
  previewText,
  sendMessage,
  setTyping,
  subscribeMessages,
} from '@/lib/chats';
import { formatDayLabel, isOnline, isSameDay } from '@/lib/format';
import { type PickedFile, chatMediaPath, pickDocument, pickImage, takePhoto, uploadFile } from '@/lib/media';
import { useSession, useUid } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import type { Message } from '@/lib/types';
import { useNow } from '@/lib/useNow';

const PAGE_SIZE = 40;

export default function ChatScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const me = useUid();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { chats, chatsLoaded, userById } = useSession();
  const now = useNow(3000);

  const chat = chats.find((c) => c.id === id) ?? null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<{ token: number; message: Message } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const typingSent = useRef(false);
  const markedKey = useRef('');

  const chatExists = chat !== null;

  // Mesajları canlı dinle.
  useEffect(() => {
    if (!id || !me || !chatExists) return;
    return subscribeMessages(
      id,
      limit,
      (list) => {
        setMessages(list);
        setLoaded(true);
      },
      (e) => {
        console.warn('Mesajlar okunamadı', e);
        setLoaded(true);
      }
    );
  }, [id, me, limit, chatExists]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardOpen(false));
    const showAndroid = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideAndroid = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    const app = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => {
      show.remove();
      hide.remove();
      showAndroid.remove();
      hideAndroid.remove();
      app.remove();
    };
  }, []);

  // Sohbet ekrandayken gelen mesajları okundu olarak işaretle.
  const newestIncoming = messages.find((m) => m.senderId !== me) ?? null;
  const unreadCount = chat?.unread[me] ?? 0;
  const myLastRead = chat?.lastRead[me] ?? 0;
  const newestIncomingId = newestIncoming?.id ?? '';
  const newestIncomingAt = newestIncoming?.createdAt ?? 0;
  useEffect(() => {
    if (!id || !me || !chatExists || !focused || !appActive) return;
    const needs = unreadCount > 0 || newestIncomingAt > myLastRead;
    const key = `${newestIncomingId}:${unreadCount > 0}`;
    if (!needs || markedKey.current === key) return;
    markedKey.current = key;
    markRead(id, me).catch(() => {});
  }, [id, me, chatExists, focused, appActive, unreadCount, myLastRead, newestIncomingId, newestIncomingAt]);

  // Ekrandan çıkarken "yazıyor…" bilgisini temizle.
  useEffect(() => {
    return () => {
      if (typingSent.current && id && me) setTyping(id, me, false).catch(() => {});
    };
  }, [id, me]);

  const onTyping = useCallback(
    (typing: boolean) => {
      if (!id || !me) return;
      if (!typing && !typingSent.current) return;
      typingSent.current = typing;
      setTyping(id, me, typing).catch(() => {});
    },
    [id, me]
  );

  const clearBanner = useCallback(() => {
    setReplyTo(null);
    setEditing(null);
  }, []);

  const replyRef = (m: Message | null) =>
    m ? { id: m.id, senderId: m.senderId, preview: previewText(m).slice(0, 120) } : null;

  const submitText = async (text: string) => {
    if (!chat) return;
    typingSent.current = false;
    try {
      if (editing) {
        const target = editing.message;
        setEditing(null);
        if (text !== target.text) {
          await editMessage(chat.id, target.id, text, messages[0]?.id === target.id);
        }
        return;
      }
      const reply = replyRef(replyTo);
      setReplyTo(null);
      await sendMessage(chat, me, { type: 'text', text, replyTo: reply });
    } catch (e) {
      showError(e, 'Mesaj gönderilemedi.');
    }
  };

  const sendFile = async (kind: 'image' | 'file' | 'audio', file: PickedFile, duration: number | null) => {
    if (!chat) return;
    const reply = replyRef(replyTo);
    setReplyTo(null);
    setUploadProgress(0);
    try {
      const fallbackExt = kind === 'image' ? 'jpg' : kind === 'audio' ? 'm4a' : 'bin';
      const uploaded = await uploadFile(
        chatMediaPath(chat.id, me, file.name, fallbackExt),
        file.uri,
        file.mimeType,
        setUploadProgress
      );
      await sendMessage(chat, me, {
        type: kind,
        mediaUrl: uploaded.url,
        mediaPath: uploaded.path,
        fileName: kind === 'file' ? file.name : null,
        fileSize: uploaded.size,
        mimeType: file.mimeType,
        width: file.width,
        height: file.height,
        duration,
        replyTo: reply,
      });
    } catch (e) {
      showError(e, 'Dosya gönderilemedi.');
    } finally {
      setUploadProgress(null);
    }
  };

  const attach = () => {
    const run = (pick: () => Promise<PickedFile | null>, kind: 'image' | 'file') => async () => {
      try {
        const file = await pick();
        if (file) await sendFile(kind, file, null);
      } catch (e) {
        showError(e);
      }
    };
    Keyboard.dismiss();
    showActionSheet([
      { label: 'Fotoğraf seç', onPress: run(() => pickImage(), 'image') },
      { label: 'Fotoğraf çek', onPress: run(takePhoto, 'image') },
      { label: 'Dosya gönder', onPress: run(pickDocument, 'file') },
    ]);
  };

  const sendVoice = (uri: string, seconds: number) => {
    sendFile(
      'audio',
      { uri, name: 'ses.m4a', mimeType: 'audio/mp4', size: null, width: null, height: null },
      Math.round(seconds)
    );
  };

  const onLongPress = useCallback(
    (m: Message) => {
      if (m.deleted || !chat) return;
      const mine = m.senderId === me;
      const isLast = messages[0]?.id === m.id;
      showActionSheet([
        {
          label: 'Yanıtla',
          onPress: () => {
            setEditing(null);
            setReplyTo(m);
          },
        },
        ...(m.text ? [{ label: 'Kopyala', onPress: () => void Clipboard.setStringAsync(m.text) }] : []),
        ...(mine && m.type === 'text' && !m.pending
          ? [
              {
                label: 'Düzenle',
                onPress: () => {
                  setReplyTo(null);
                  setEditing({ token: Date.now(), message: m });
                },
              },
            ]
          : []),
        ...(mine && !m.pending
          ? [
              {
                label: 'Herkes için sil',
                destructive: true,
                onPress: () =>
                  confirm('Mesajı sil', 'Bu mesaj sohbetteki herkes için silinecek.', 'Sil', () => {
                    deleteMessage(chat.id, m, isLast).catch((e) => showError(e, 'Mesaj silinemedi.'));
                  }),
              },
            ]
          : []),
      ]);
    },
    [chat, me, messages]
  );

  const onPressImage = useCallback(
    (m: Message) => {
      if (m.mediaUrl) router.push({ pathname: '/image', params: { url: m.mediaUrl } });
    },
    [router]
  );

  const onPressFile = useCallback(async (m: Message) => {
    if (!m.mediaUrl) return;
    try {
      const safeName = (m.fileName ?? 'dosya').replace(/[\\/:*?"<>|]/g, '_');
      const target = new File(Paths.cache, `${m.id}-${safeName}`);
      const local = target.exists
        ? target
        : await File.downloadFileAsync(m.mediaUrl, target, { idempotent: true });
      await Sharing.shareAsync(local.uri, { mimeType: m.mimeType ?? undefined });
    } catch (e) {
      showError(e, 'Dosya açılamadı.');
    }
  }, []);

  if (!me) return null;

  if (!chat) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        {chatsLoaded ? (
          <>
            <Text style={[styles.missing, { color: theme.textSecondary }]}>Bu sohbet artık kullanılamıyor.</Text>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Text style={[styles.missingAction, { color: theme.primary }]}>Geri dön</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={theme.primary} />
        )}
      </View>
    );
  }

  const display = describeChat(chat, me, userById);
  const subtitle = chatSubtitle(chat, display, me, userById, now);
  const subtitleActive = subtitle.endsWith('…') || subtitle === 'çevrimiçi';

  const banner: ComposerBanner | null = editing
    ? { kind: 'edit', title: 'Mesajı düzenle', preview: editing.message.text }
    : replyTo
      ? {
          kind: 'reply',
          title: replyTo.senderId === me ? 'Kendine yanıt' : userById(replyTo.senderId)?.displayName ?? 'Yanıt',
          preview: previewText(replyTo),
        }
      : null;

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const older = messages[index + 1];
    const mine = item.senderId === me;
    const showDay = !older || !isSameDay(older.createdAt, item.createdAt);
    const grouped = Boolean(older) && older.senderId === item.senderId && !showDay;
    const delivery: DeliveryState = item.pending
      ? 'pending'
      : isReadByOthers(chat, me, item.createdAt)
        ? 'read'
        : 'sent';
    const replyAuthor = item.replyTo
      ? item.replyTo.senderId === me
        ? 'Sen'
        : userById(item.replyTo.senderId)?.displayName ?? 'Kullanıcı'
      : null;
    return (
      <View>
        {showDay ? (
          <View style={styles.dayWrap}>
            <Text style={[styles.day, { backgroundColor: theme.surface, color: theme.textSecondary }]}>
              {formatDayLabel(item.createdAt, now)}
            </Text>
          </View>
        ) : null}
        <MessageBubble
          message={item}
          mine={mine}
          senderName={display.isGroup && !mine && !grouped ? userById(item.senderId)?.displayName ?? 'Kullanıcı' : null}
          replyAuthor={replyAuthor}
          delivery={delivery}
          grouped={grouped}
          onLongPress={onLongPress}
          onPressImage={onPressImage}
          onPressFile={onPressFile}
        />
      </View>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </Pressable>
        <Pressable
          style={styles.headerMain}
          disabled={display.isSaved}
          onPress={() => router.push(`/chat-info/${chat.id}`)}>
          <Avatar
            name={display.title}
            uri={display.photoURL}
            size={38}
            icon={display.isSaved ? 'bookmark' : display.isGroup && !display.photoURL ? 'people' : undefined}
            online={display.peer ? isOnline(display.peer.online, display.peer.lastSeen, now) : false}
          />
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {display.title}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.headerSubtitle, { color: subtitleActive ? theme.primary : theme.textSecondary }]}
                numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.flex, { backgroundColor: theme.chatBackground }]}>
          {!loaded ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.emptyChat, { backgroundColor: theme.surface, color: theme.textSecondary }]}>
                {display.isSaved ? 'Kendine notlar, bağlantılar ve dosyalar gönder.' : 'İlk mesajı sen gönder.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              inverted
              keyExtractor={(m) => m.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (messages.length >= limit) setLimit((l) => l + PAGE_SIZE);
              }}
            />
          )}
        </View>
        <Composer
          banner={banner}
          editing={editing ? { token: editing.token, text: editing.message.text } : null}
          uploadProgress={uploadProgress}
          bottomInset={keyboardOpen ? 0 : insets.bottom}
          onCancelBanner={clearBanner}
          onSubmitText={submitText}
          onAttach={attach}
          onSendVoice={sendVoice}
          onTyping={onTyping}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { paddingHorizontal: 6, height: 44, justifyContent: 'center' },
  headerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerSubtitle: { fontSize: 13, marginTop: 1 },
  listContent: { paddingVertical: 8 },
  dayWrap: { alignItems: 'center', marginTop: 12, marginBottom: 4 },
  day: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  emptyChat: { fontSize: 14, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, overflow: 'hidden', textAlign: 'center' },
  missing: { fontSize: 16, textAlign: 'center' },
  missingAction: { fontSize: 16, fontWeight: '600' },
});
